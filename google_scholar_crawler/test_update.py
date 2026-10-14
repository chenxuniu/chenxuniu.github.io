import importlib
from copy import deepcopy
from datetime import datetime
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock, patch

import requests
import yaml


PROFILE = "exampleAuthor"


def page(rows, more=False):
    articles = "".join(
        '<tr class="gsc_a_tr"><td><a class="gsc_a_at" '
        f'href="/citations?view_op=view_citation&amp;citation_for_view={PROFILE}:{key}">'
        f'Paper</a></td><td class="gsc_a_c"><a class="gsc_a_ac">{count}</a></td></tr>'
        for key, count in rows
    )
    disabled = "" if more else "disabled"
    return f'<table id="gsc_a_t">{articles}</table><button id="gsc_bpf_more" {disabled}></button>'


class CitationUpdateTests(unittest.TestCase):
    def setUp(self):
        self.updater = importlib.import_module("google_scholar_crawler.update")
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.snapshot = Path(self.temp.name) / "citations.yml"
        self.publications = Path(self.temp.name) / "publications.yml"
        self.original = f'profile_id: {PROFILE}\nchecked_on: "2026-09-30"\ncounts:\n  first: 5\n  second: 2\n'
        self.snapshot.write_text(self.original)
        self.publications.write_text("- scholar_id: first\n- scholar_id: second\n")

    def update(self, session):
        return self.updater.update_snapshot(self.snapshot, self.publications,
                                            session=session, checked_on="2026-10-03")

    def session(self, *html):
        session = Mock()
        session.get.side_effect = [Mock(text=value, status_code=200) for value in html]
        return session

    def test_reads_integer_comma_and_true_zero_counts(self):
        counts, more = self.updater.parse_profile_page(page([("first", "1,234"), ("second", "")]), PROFILE)
        self.assertEqual(counts, {"first": 1234, "second": 0})
        self.assertFalse(more)

    def test_success_updates_counts_and_checked_date(self):
        self.assertTrue(self.update(self.session(page([("first", "8"), ("second", "3")]))))
        data = yaml.safe_load(self.snapshot.read_text())
        self.assertEqual(data["counts"], {"first": 8, "second": 3})
        self.assertEqual(data["checked_on"], "2026-10-03")

    def test_zero_is_valid_for_a_real_paper_row(self):
        self.snapshot.write_text(self.original.replace("second: 2", "second: 0"))
        self.update(self.session(page([("first", "5"), ("second", "")])))
        self.assertEqual(yaml.safe_load(self.snapshot.read_text())["counts"]["second"], 0)

    def test_direct_provider_accepts_papers_without_canonical_or_author_details(self):
        html = page([("first", "53"), ("second", "3")])
        session = self.session(html)
        with patch.object(self.updater.requests, "Session") as factory, \
                patch.object(self.updater, "fetch_scholarly_counts",
                             side_effect=AssertionError("Default still uses the brittle metadata parser")) as scholarly:
            factory.return_value.__enter__.return_value = session
            self.assertTrue(self.updater.update_snapshot(self.snapshot, self.publications,
                                                        provider="requests"))
        scholarly.assert_not_called()
        self.assertEqual(session.get.call_count, 1)
        self.assertEqual(yaml.safe_load(self.snapshot.read_text())["counts"],
                         {"first": 53, "second": 3})

    def test_http_200_unexpected_page_has_structural_diagnostics_and_keeps_snapshot(self):
        html = "<html><title>Unexpected response</title><body></body></html>"
        with self.assertLogs(self.updater.__name__, level="INFO") as logs:
            with self.assertRaisesRegex(ValueError, "publication list"):
                self.update(self.session(html))
        output = "\n".join(logs.output)
        self.assertIn("HTTP 200", output)
        self.assertIn("canonical=False", output)
        self.assertIn("rows=0", output)
        self.assertNotIn(html, output)
        self.assertEqual(self.snapshot.read_text(), self.original)

    def test_access_restrictions_are_reported_without_retry_or_snapshot_write(self):
        for status in [403, 429]:
            with self.subTest(status=status):
                session = Mock()
                session.get.return_value = Mock(text="<html>Blocked</html>", status_code=status)
                with self.assertRaisesRegex(ValueError, f"HTTP {status}.*access restricted"):
                    self.update(session)
                self.assertEqual(session.get.call_count, 1)
                self.assertEqual(self.snapshot.read_text(), self.original)

    def test_requests_cannot_clear_a_previously_positive_manual_count(self):
        with self.assertRaisesRegex(ValueError, "zero"):
            self.update(self.session(page([("first", ""), ("second", "3")])))
        self.assertEqual(self.snapshot.read_text(), self.original)

    def test_captcha_with_publication_rows_is_rejected(self):
        html = page([("first", "8"), ("second", "3")]) + '<form action="/sorry/index"></form>'
        with self.assertRaises(ValueError):
            self.update(self.session(html))
        self.assertEqual(self.snapshot.read_text(), self.original)

    def test_other_http_errors_keep_original_snapshot(self):
        session = Mock()
        response = Mock(text="Server error", status_code=503)
        response.raise_for_status.side_effect = requests.HTTPError("503 Server Error")
        session.get.return_value = response
        with self.assertRaises(requests.HTTPError):
            self.update(session)
        self.assertEqual(self.snapshot.read_text(), self.original)

    def test_cli_and_workflow_use_the_same_serpapi_provider(self):
        with patch("sys.argv", ["update.py", "--dry-run"]), \
                patch.object(self.updater, "update_snapshot") as update:
            self.updater.main()
        self.assertEqual(update.call_args.kwargs["provider"], "serpapi")
        path = Path(__file__).resolve().parents[1] / ".github/workflows/google_scholar_crawler.yaml"
        workflow = yaml.load(path.read_text(), Loader=yaml.BaseLoader)
        refresh = next(step for step in workflow["jobs"]["update"]["steps"]
                       if step.get("name") == "Refresh citations")
        self.assertIn("--provider serpapi --verbose", refresh["run"])
        self.assertEqual(refresh["env"]["SERPAPI_KEY"],
                         "${{ secrets.SERPAPI_KEY || secrets.SERPAPI }}")

    def test_optional_auto_provider_uses_scholarly_without_extra_requests(self):
        with patch.object(self.updater, "fetch_scholarly_counts",
                          return_value={"first": 53, "second": 3}) as scholarly, \
                patch.object(self.updater.requests, "Session",
                             side_effect=AssertionError("Primary provider is not scholarly")) as direct:
            self.updater.update_snapshot(self.snapshot, self.publications, provider="auto")
        scholarly.assert_called_once()
        direct.assert_not_called()
        self.assertEqual(yaml.safe_load(self.snapshot.read_text())["counts"],
                         {"first": 53, "second": 3})

    def test_auto_provider_falls_back_only_for_scholarly_parse_errors(self):
        error = ValueError("scholarly could not fetch the author profile")
        error.__cause__ = AttributeError("'NoneType' object has no attribute 'get'")
        session = self.session(page([("first", "53"), ("second", "3")]))
        with patch.object(self.updater, "fetch_scholarly_counts", side_effect=error), \
                patch.object(self.updater.requests, "Session") as factory:
            factory.return_value.__enter__.return_value = session
            with self.assertLogs(self.updater.__name__, level="INFO") as logs:
                self.updater.update_snapshot(self.snapshot, self.publications, provider="auto")
        self.assertTrue(any("direct publication parser" in line for line in logs.output))
        self.assertEqual(session.get.call_count, 1)
        self.assertEqual(yaml.safe_load(self.snapshot.read_text())["counts"]["first"], 53)

    def test_auto_provider_does_not_repeat_blocked_or_invalid_requests(self):
        for cause in [requests.Timeout("Timed out"), RuntimeError("Access denied"), None]:
            with self.subTest(cause=cause):
                error = ValueError("Scholar could not return validated papers")
                error.__cause__ = cause
                with patch.object(self.updater, "fetch_scholarly_counts", side_effect=error), \
                        patch.object(self.updater.requests, "Session") as direct:
                    with self.assertRaises(ValueError):
                        self.updater.update_snapshot(self.snapshot, self.publications, provider="auto")
                direct.assert_not_called()
                self.assertEqual(self.snapshot.read_text(), self.original)

    def test_auto_fallback_restriction_keeps_manual_snapshot(self):
        error = ValueError("scholarly could not parse the author profile")
        error.__cause__ = AttributeError("Missing canonical link")
        session = Mock()
        session.get.return_value = Mock(text="Blocked", status_code=429)
        with patch.object(self.updater, "fetch_scholarly_counts", side_effect=error), \
                patch.object(self.updater.requests, "Session") as factory:
            factory.return_value.__enter__.return_value = session
            with self.assertLogs(self.updater.__name__, level="WARNING"):
                with self.assertRaisesRegex(ValueError, "HTTP 429"):
                    self.updater.update_snapshot(self.snapshot, self.publications, provider="auto")
        self.assertEqual(session.get.call_count, 1)
        self.assertEqual(self.snapshot.read_text(), self.original)

    def test_identical_snapshot_is_not_rewritten(self):
        self.update(self.session(page([("first", "5"), ("second", "2")])))
        original = self.snapshot.read_bytes()
        self.assertFalse(self.update(self.session(page([("first", "5"), ("second", "2")]))))
        self.assertEqual(self.snapshot.read_bytes(), original)

    def test_pagination_collects_every_tracked_paper(self):
        session = self.session(page([("first", "8")], more=True), page([("second", "3")]))
        with patch.object(self.updater.time, "sleep"):
            self.update(session)
        self.assertEqual(session.get.call_count, 2)
        self.assertEqual(session.get.call_args.kwargs["params"]["cstart"], 100)

    def test_network_failure_keeps_original_bytes(self):
        session = Mock()
        session.get.side_effect = requests.Timeout("Timed out")
        with self.assertRaises(requests.RequestException):
            self.update(session)
        self.assertEqual(self.snapshot.read_text(), self.original)

    def test_missing_paper_aborts_the_entire_update(self):
        with self.assertRaises(ValueError):
            self.update(self.session(page([("first", "8")])))
        self.assertEqual(self.snapshot.read_text(), self.original)

    def test_captcha_or_unexpected_html_never_overwrites_data(self):
        for html in ["<html>unusual traffic captcha</html>", "<table id='gsc_a_t'></table>"]:
            with self.subTest(html=html), self.assertRaises(ValueError):
                self.update(self.session(html))
            self.assertEqual(self.snapshot.read_text(), self.original)

    def test_invalid_count_aborts_without_writing(self):
        with self.assertRaises(ValueError):
            self.update(self.session(page([("first", "N/A"), ("second", "2")])))
        self.assertEqual(self.snapshot.read_text(), self.original)

    def test_count_footnote_is_not_part_of_the_number(self):
        html = page([("first", "8"), ("second", "3")]).replace(
            "8</a>", "8</a><span>*</span>")
        self.update(self.session(html))
        self.assertEqual(yaml.safe_load(self.snapshot.read_text())["counts"]["first"], 8)

    def test_missing_citation_link_is_not_treated_as_zero(self):
        html = page([("first", "8"), ("second", "3")]).replace('<a class="gsc_a_ac">8</a>', "")
        with self.assertRaises(ValueError):
            self.update(self.session(html))
        self.assertEqual(self.snapshot.read_text(), self.original)

    def test_dry_run_validates_without_saving(self):
        self.updater.update_snapshot(self.snapshot, self.publications,
                                    session=self.session(page([("first", "8"), ("second", "3")])),
                                    dry_run=True)
        self.assertEqual(self.snapshot.read_text(), self.original)

    def test_wrong_author_and_duplicate_ids_are_rejected(self):
        for html in [page([("first", "8"), ("second", "3")]).replace(PROFILE, "someoneElse"),
                     page([("first", "8"), ("first", "9"), ("second", "3")])]:
            with self.subTest(html=html), self.assertRaises(ValueError):
                self.update(self.session(html))
            self.assertEqual(self.snapshot.read_text(), self.original)

    def test_new_publication_is_required_and_added(self):
        self.publications.write_text("- scholar_id: first\n- scholar_id: second\n- scholar_id: third\n")
        self.update(self.session(page([("first", "8"), ("second", "3"), ("third", "0")])))
        self.assertEqual(yaml.safe_load(self.snapshot.read_text())["counts"]["third"], 0)

    def test_write_failure_keeps_existing_snapshot(self):
        with patch.object(self.updater.os, "replace", side_effect=OSError("Write failed")):
            with self.assertRaises(OSError):
                self.update(self.session(page([("first", "8"), ("second", "3")])))
        self.assertEqual(self.snapshot.read_text(), self.original)
        self.assertEqual(sorted(p.name for p in self.snapshot.parent.iterdir()),
                         ["citations.yml", "publications.yml"])

    def author(self, counts):
        return {"scholar_id": PROFILE, "filled": ["publications"], "publications": [
            {"author_pub_id": f"{PROFILE}:{key}", "num_citations": count}
            for key, count in counts
        ]}

    def scholarly_client(self, author):
        client = Mock()
        client.fill.return_value = author
        return client

    def test_scholarly_matches_ids_and_keeps_only_tracked_papers(self):
        client = self.scholarly_client(self.author([("second", 0), ("extra", 99), ("first", 49)]))
        self.assertEqual(self.updater.fetch_scholarly_counts(PROFILE, {"first", "second"}, client=client),
                         {"first": 49, "second": 0})

    def test_scholarly_logs_the_stage_that_failed(self):
        client = Mock()
        client.search_author_id.side_effect = RuntimeError("Access denied")
        with self.assertLogs(self.updater.__name__, level="INFO") as logs:
            with self.assertRaisesRegex(ValueError, "Access denied"):
                self.updater.fetch_scholarly_counts(PROFILE, {"first"}, client=client)
        self.assertTrue(any("Loading Scholar author profile" in line for line in logs.output))

    def test_diagnostic_workflow_does_not_save_or_rebuild(self):
        path = Path(__file__).resolve().parents[1] / ".github/workflows/google_scholar_crawler.yaml"
        workflow = yaml.load(path.read_text(), Loader=yaml.BaseLoader)
        self.assertEqual(workflow["on"]["workflow_dispatch"]["inputs"]["diagnostic"]["default"], "false")
        steps = {step.get("name"): step for step in workflow["jobs"]["update"]["steps"]}
        for name in ["Save validated snapshot", "Rebuild GitHub Pages"]:
            self.assertEqual(steps[name]["if"], "${{ inputs.diagnostic != true }}")
        self.assertIn("--dry-run", steps["Refresh citations"]["run"])
        self.assertIn("python -u", steps["Refresh citations"]["run"])

    def test_scholarly_rejects_invalid_or_incomplete_results(self):
        complete = self.author([("first", 8), ("second", 3)])
        cases = [None, {}, {**complete, "scholar_id": "someoneElse"},
                 {**complete, "filled": []}, self.author([("first", 8)]),
                 self.author([("first", 8), ("first", 9), ("second", 3)])]
        for count in [None, "8", -1, True, 1.5]:
            cases.append(self.author([("first", count), ("second", 3)]))
        missing_count = self.author([("first", 8), ("second", 3)])
        del missing_count["publications"][0]["num_citations"]
        cases.append(missing_count)
        wrong_id = self.author([("first", 8), ("second", 3)])
        wrong_id["publications"][0]["author_pub_id"] = "someoneElse:first"
        cases.append(wrong_id)
        for author in cases:
            with self.subTest(author=author), self.assertRaises(ValueError):
                self.updater.fetch_scholarly_counts(PROFILE, {"first", "second"},
                                                  client=self.scholarly_client(author))

    def test_scholarly_failure_keeps_manual_snapshot(self):
        with patch.object(self.updater, "fetch_scholarly_counts", create=True,
                          side_effect=ValueError("Scholar blocked this request")):
            with self.assertRaises(ValueError):
                self.updater.update_snapshot(self.snapshot, self.publications, provider="scholarly")
        self.assertEqual(self.snapshot.read_text(), self.original)

    def test_optional_scholarly_provider_updates_shared_snapshot(self):
        with patch.object(self.updater, "fetch_scholarly_counts", create=True,
                          return_value={"first": 49, "second": 3}):
            self.updater.update_snapshot(self.snapshot, self.publications,
                                         checked_on="2026-10-05", provider="scholarly")
        data = yaml.safe_load(self.snapshot.read_text())
        self.assertEqual(data["counts"], {"first": 49, "second": 3})
        self.assertEqual(data["checked_on"], "2026-10-05")

    def test_scholarly_cannot_clear_a_previously_positive_manual_count(self):
        with patch.object(self.updater, "fetch_scholarly_counts", create=True,
                          return_value={"first": 0, "second": 3}):
            with self.assertRaisesRegex(ValueError, "zero"):
                self.updater.update_snapshot(self.snapshot, self.publications, provider="scholarly")
        self.assertEqual(self.snapshot.read_text(), self.original)

    def test_normal_citation_correction_can_decrease_a_count(self):
        self.update(self.session(page([("first", "4"), ("second", "2")])))
        self.assertEqual(yaml.safe_load(self.snapshot.read_text())["counts"]["first"], 4)

    def test_older_update_cannot_overwrite_newer_manual_date(self):
        with self.assertRaisesRegex(ValueError, "older"):
            self.updater.update_snapshot(self.snapshot, self.publications,
                                        session=self.session(page([("first", "8"), ("second", "3")])),
                                        checked_on="2026-09-29")
        self.assertEqual(self.snapshot.read_text(), self.original)

    def test_manual_edit_during_fetch_is_not_overwritten(self):
        manual = self.original.replace('"2026-09-30"', '"2026-10-05"').replace("first: 5", "first: 49")
        def fetch(*args):
            self.snapshot.write_text(manual)
            return {"first": 8, "second": 3}
        with patch.object(self.updater, "fetch_counts", side_effect=fetch):
            with self.assertRaisesRegex(ValueError, "changed"):
                self.update(self.session())
        self.assertEqual(self.snapshot.read_text(), manual)

    def test_date_is_chicago_local_date_in_summer_and_winter(self):
        for utc, expected in [("2026-10-05T04:30:00+00:00", "2026-10-04"),
                              ("2026-10-05T05:00:00+00:00", "2026-10-05"),
                              ("2026-12-07T05:30:00+00:00", "2026-12-06"),
                              ("2026-12-07T06:00:00+00:00", "2026-12-07")]:
            with self.subTest(utc=utc):
                self.assertEqual(self.updater.chicago_date(datetime.fromisoformat(utc)), expected)

    def test_workflow_schedules_wednesday_afternoon_and_sunday_night_chicago(self):
        path = Path(__file__).resolve().parents[1] / ".github/workflows/google_scholar_crawler.yaml"
        workflow = yaml.load(path.read_text(), Loader=yaml.BaseLoader)
        self.assertEqual(workflow["on"]["schedule"],
                         [{"cron": "0 13 * * 3", "timezone": "America/Chicago"},
                          {"cron": "0 23 * * 0", "timezone": "America/Chicago"}])
        self.assertIn("workflow_dispatch", workflow["on"])

    def test_new_schedule_local_times_follow_chicago_daylight_saving(self):
        cases = [
            ("2026-10-14T18:00:00+00:00", "2026-10-14", 2, 13),
            ("2026-12-16T19:00:00+00:00", "2026-12-16", 2, 13),
            ("2026-10-19T04:00:00+00:00", "2026-10-18", 6, 23),
            ("2026-12-21T05:00:00+00:00", "2026-12-20", 6, 23),
        ]
        for utc, expected_date, weekday, hour in cases:
            with self.subTest(utc=utc):
                now = datetime.fromisoformat(utc)
                local = now.astimezone(self.updater.ZoneInfo("America/Chicago"))
                self.assertEqual((local.weekday(), local.hour, local.minute), (weekday, hour, 0))
                self.assertEqual(self.updater.chicago_date(now), expected_date)

    def test_workflow_does_not_hide_citation_fetch_failures(self):
        path = Path(__file__).resolve().parents[1] / ".github/workflows/google_scholar_crawler.yaml"
        workflow = yaml.load(path.read_text(), Loader=yaml.BaseLoader)
        steps = {step.get("name"): step for step in workflow["jobs"]["update"]["steps"]}
        refresh = steps["Refresh citations"]
        self.assertNotIn("continue-on-error", refresh)
        self.assertNotIn("set +e", refresh["run"])
        self.assertNotIn("|| true", refresh["run"])
        self.assertIn("timeout 180s", refresh["run"])

    def serpapi_data(self, rows, more=False):
        return {
            "search_metadata": {"status": "Success"},
            "search_parameters": {"engine": "google_scholar_author", "author_id": PROFILE},
            "author": {"name": "Example Author"},
            "articles": [
                {"title": f"Paper {key}", "citation_id": f"{PROFILE}:{key}",
                 "cited_by": {"value": count}}
                for key, count in rows
            ],
            "serpapi_pagination": {"next": "https://serpapi.com/search.json?start=100"} if more else {},
        }

    def serpapi_session(self, *data):
        session = Mock()
        session.get.side_effect = [Mock(status_code=200, json=Mock(return_value=value))
                                   for value in data]
        return session

    def fetch_serpapi(self, session):
        return self.updater.fetch_serpapi_counts(PROFILE, {"first", "second"}, session,
                                                api_key="test-secret")

    def test_serpapi_matches_ids_in_one_request_and_accepts_real_zero(self):
        session = self.serpapi_session(self.serpapi_data([("second", 0), ("extra", 99), ("first", 53)]))
        self.assertEqual(self.fetch_serpapi(session), {"first": 53, "second": 0})
        session.get.assert_called_once_with(
            "https://serpapi.com/search.json",
            params={"engine": "google_scholar_author", "author_id": PROFILE,
                    "hl": "en", "num": 100, "start": 0, "api_key": "test-secret"},
            timeout=30, allow_redirects=False)

    def test_serpapi_explicit_null_value_is_zero_for_a_present_paper(self):
        session = self.serpapi_session(self.serpapi_data([("first", 53), ("second", None)]))
        self.assertEqual(self.fetch_serpapi(session), {"first": 53, "second": 0})

    def test_serpapi_follows_pagination_without_using_remote_urls(self):
        first = self.serpapi_data([("first", 53)], more=True)
        first["serpapi_pagination"]["next"] = "https://unexpected.example/"
        session = self.serpapi_session(first, self.serpapi_data([("second", 3)]))
        self.assertEqual(self.fetch_serpapi(session), {"first": 53, "second": 3})
        self.assertEqual(session.get.call_count, 2)
        self.assertEqual(session.get.call_args.args, ("https://serpapi.com/search.json",))
        self.assertEqual(session.get.call_args.kwargs["params"]["start"], 100)

    def test_serpapi_rejects_incomplete_or_invalid_results(self):
        valid = self.serpapi_data([("first", 53), ("second", 3)])
        cases = [None, [], {}, {**valid, "error": "Provider error"},
                 {**valid, "search_metadata": {"status": "Processing"}},
                 {**valid, "search_parameters": {"engine": "google_scholar_author", "author_id": "other"}},
                 {**valid, "search_parameters": {"engine": "google_scholar", "author_id": PROFILE}},
                 {**valid, "articles": []}, {**valid, "articles": None},
                 self.serpapi_data([("first", 53)]),
                 self.serpapi_data([("first", 53), ("first", 54), ("second", 3)])]
        for value in ["53", -1, True, 1.5]:
            cases.append(self.serpapi_data([("first", value), ("second", 3)]))
        for replacement in [{"citation_id": "other:first", "cited_by": {"value": 53}},
                            {"citation_id": f"{PROFILE}:first"},
                            {"citation_id": f"{PROFILE}:first", "cited_by": None},
                            {"citation_id": f"{PROFILE}:first", "cited_by": {}},
                            {"citation_id": f"{PROFILE}:", "cited_by": {"value": 53}}, None]:
            data = deepcopy(valid)
            data["articles"][0] = replacement
            cases.append(data)
        for data in cases:
            with self.subTest(data=data), self.assertRaises(ValueError):
                self.fetch_serpapi(self.serpapi_session(data))

    def test_serpapi_repeated_page_is_rejected(self):
        data = self.serpapi_data([("first", 53)], more=True)
        with self.assertRaisesRegex(ValueError, "[Rr]epeat"):
            self.fetch_serpapi(self.serpapi_session(data, data))

    def test_serpapi_invalid_count_reports_shape_without_response_contents(self):
        data = self.serpapi_data([("first", None), ("second", 3)])
        data["articles"][0]["cited_by"] = {}
        with self.assertRaises(ValueError) as raised:
            self.fetch_serpapi(self.serpapi_session(data))
        self.assertIn("count_type=NoneType", str(raised.exception))
        self.assertIn("value_present=False", str(raised.exception))
        self.assertNotIn("test-secret", str(raised.exception))

    def test_serpapi_transient_failure_retries_then_returns_counts(self):
        session = self.serpapi_session(self.serpapi_data([("first", 53), ("second", 3)]))
        success = session.get.side_effect
        session.get.side_effect = [Mock(status_code=503), *success]
        with patch.object(self.updater.time, "sleep"):
            self.assertEqual(self.fetch_serpapi(session), {"first": 53, "second": 3})
        self.assertEqual(session.get.call_count, 2)

    def test_serpapi_network_retries_are_bounded_and_do_not_leak_key(self):
        for failure in [requests.Timeout, requests.ConnectionError]:
            with self.subTest(failure=failure):
                session = Mock()
                session.get.side_effect = failure("https://serpapi.com/search.json?api_key=test-secret")
                with patch.object(self.updater.time, "sleep"), \
                        self.assertLogs(self.updater.__name__, level="WARNING") as logs:
                    with self.assertRaises(ValueError) as raised:
                        self.fetch_serpapi(session)
                self.assertEqual(session.get.call_count, 3)
                self.assertNotIn("test-secret", str(raised.exception) + "\n".join(logs.output))
                self.assertIsNone(raised.exception.__cause__)

    def test_serpapi_server_retries_are_bounded(self):
        session = Mock()
        session.get.return_value = Mock(status_code=503)
        with patch.object(self.updater.time, "sleep"):
            with self.assertRaisesRegex(ValueError, "503"):
                self.fetch_serpapi(session)
        self.assertEqual(session.get.call_count, 3)

    def test_serpapi_auth_quota_and_redirect_errors_are_not_retried(self):
        for status in [301, 302, 400, 401, 403, 429]:
            with self.subTest(status=status):
                session = Mock()
                session.get.return_value = Mock(status_code=status)
                with self.assertRaisesRegex(ValueError, str(status)):
                    self.fetch_serpapi(session)
                session.get.assert_called_once()

    def test_serpapi_invalid_json_is_rejected_without_leaking_response(self):
        session = Mock()
        session.get.return_value = Mock(status_code=200)
        session.get.return_value.json.side_effect = ValueError("unexpected test-secret")
        with self.assertRaises(ValueError) as raised:
            self.fetch_serpapi(session)
        self.assertNotIn("test-secret", str(raised.exception))

    def test_serpapi_default_updates_snapshot_using_secret_alias(self):
        session = self.serpapi_session(self.serpapi_data([("first", 53), ("second", 3)]))
        with patch.dict(self.updater.os.environ, {"SERPAPI": "test-secret"}, clear=True), \
                patch.object(self.updater.requests, "Session") as factory:
            factory.return_value.__enter__.return_value = session
            self.updater.update_snapshot(self.snapshot, self.publications, checked_on="2026-10-14")
        data = yaml.safe_load(self.snapshot.read_text())
        self.assertEqual(data["counts"], {"first": 53, "second": 3})
        self.assertEqual(data["checked_on"], "2026-10-14")

    def test_serpapi_missing_key_fails_before_any_request(self):
        session = Mock()
        with patch.dict(self.updater.os.environ, {}, clear=True):
            with self.assertRaisesRegex(ValueError, "SERPAPI_KEY"):
                self.updater.fetch_serpapi_counts(PROFILE, {"first", "second"}, session)
        session.get.assert_not_called()

    def test_serpapi_dry_run_preserves_original_snapshot(self):
        session = self.serpapi_session(self.serpapi_data([("first", 53), ("second", 3)]))
        with patch.dict(self.updater.os.environ, {"SERPAPI_KEY": "test-secret"}), \
                patch.object(self.updater.requests, "Session") as factory:
            factory.return_value.__enter__.return_value = session
            self.updater.update_snapshot(self.snapshot, self.publications, dry_run=True)
        self.assertEqual(self.snapshot.read_text(), self.original)

    def test_serpapi_failure_or_zero_does_not_overwrite_or_fall_back(self):
        for data in [self.serpapi_data([("first", 0), ("second", 3)]),
                     self.serpapi_data([("first", None), ("second", 3)]),
                     self.serpapi_data([("first", 53)]), {"error": "Provider error test-secret"}]:
            with self.subTest(data=data), \
                    patch.dict(self.updater.os.environ, {"SERPAPI_KEY": "test-secret"}), \
                    patch.object(self.updater.requests, "Session") as factory, \
                    patch.object(self.updater, "fetch_scholarly_counts") as scholarly:
                session = self.serpapi_session(data)
                factory.return_value.__enter__.return_value = session
                with self.assertRaises(ValueError) as raised:
                    self.updater.update_snapshot(self.snapshot, self.publications)
                self.assertEqual(self.snapshot.read_text(), self.original)
                self.assertNotIn("test-secret", str(raised.exception))
                scholarly.assert_not_called()


if __name__ == "__main__":
    unittest.main()
