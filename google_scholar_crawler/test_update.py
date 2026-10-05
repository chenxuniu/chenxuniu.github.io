import importlib
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
        session.get.side_effect = [Mock(text=value) for value in html]
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
        self.update(self.session(page([("first", "5"), ("second", "")])))
        self.assertEqual(yaml.safe_load(self.snapshot.read_text())["counts"]["second"], 0)

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
                self.updater.update_snapshot(self.snapshot, self.publications)
        self.assertEqual(self.snapshot.read_text(), self.original)

    def test_default_provider_updates_shared_snapshot_with_scholarly(self):
        with patch.object(self.updater, "fetch_scholarly_counts", create=True,
                          return_value={"first": 49, "second": 3}):
            self.updater.update_snapshot(self.snapshot, self.publications, checked_on="2026-10-05")
        data = yaml.safe_load(self.snapshot.read_text())
        self.assertEqual(data["counts"], {"first": 49, "second": 3})
        self.assertEqual(data["checked_on"], "2026-10-05")

    def test_scholarly_cannot_clear_a_previously_positive_manual_count(self):
        with patch.object(self.updater, "fetch_scholarly_counts", create=True,
                          return_value={"first": 0, "second": 3}):
            with self.assertRaisesRegex(ValueError, "zero"):
                self.updater.update_snapshot(self.snapshot, self.publications)
        self.assertEqual(self.snapshot.read_text(), self.original)

    def test_normal_citation_correction_can_decrease_a_count(self):
        with patch.object(self.updater, "fetch_scholarly_counts", create=True,
                          return_value={"first": 4, "second": 2}):
            self.updater.update_snapshot(self.snapshot, self.publications)
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

    def test_workflow_schedules_monday_midnight_chicago_and_keeps_manual_trigger(self):
        path = Path(__file__).resolve().parents[1] / ".github/workflows/google_scholar_crawler.yaml"
        workflow = yaml.load(path.read_text(), Loader=yaml.BaseLoader)
        self.assertEqual(workflow["on"]["schedule"],
                         [{"cron": "0 0 * * 1", "timezone": "America/Chicago"}])
        self.assertIn("workflow_dispatch", workflow["on"])


if __name__ == "__main__":
    unittest.main()
