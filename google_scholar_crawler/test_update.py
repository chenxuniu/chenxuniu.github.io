import importlib
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


if __name__ == "__main__":
    unittest.main()
