"""Refresh the citation snapshot only after every tracked paper is validated."""

import argparse
from datetime import datetime, timezone
import os
from pathlib import Path
import re
import tempfile
import time
from urllib.parse import parse_qs, urlparse

from bs4 import BeautifulSoup
import requests
import yaml


ROOT = Path(__file__).resolve().parents[1]


def parse_profile_page(html, profile_id):
    soup = BeautifulSoup(html, "html.parser")
    rows = soup.select("#gsc_a_t .gsc_a_tr")
    if not rows or soup.select_one('form[action*="/sorry/"]'):
        raise ValueError("Scholar did not return a publication list (possibly a CAPTCHA).")
    counts = {}
    for row in rows:
        title = row.select_one("a.gsc_a_at")
        cell = row.select_one(".gsc_a_c a.gsc_a_ac")
        if title is None or cell is None:
            raise ValueError("Unexpected Scholar publication row.")
        identifiers = parse_qs(urlparse(title.get("href", "")).query).get("citation_for_view", [])
        if len(identifiers) != 1 or not identifiers[0].startswith(profile_id + ":"):
            raise ValueError("Scholar returned a paper from an unexpected author.")
        paper_id = identifiers[0].split(":", 1)[1]
        text = cell.get_text(strip=True)
        if not paper_id or paper_id in counts or (text and not re.fullmatch(r"[0-9]+(?:,[0-9]{3})*", text)):
            raise ValueError("Duplicate paper ID or invalid citation count.")
        # Scholar represents a genuine zero-citation paper with an empty cell.
        counts[paper_id] = int(text.replace(",", "")) if text else 0
    next_button = soup.select_one("#gsc_bpf_more")
    if next_button is None:
        raise ValueError("Scholar pagination control is missing.")
    return counts, not next_button.has_attr("disabled")


def fetch_counts(profile_id, tracked_ids, session):
    found = {}
    for start in range(0, 2000, 100):
        response = session.get(
            "https://scholar.google.com/citations",
            params={"user": profile_id, "hl": "en", "pagesize": 100, "cstart": start},
            timeout=30,
        )
        response.raise_for_status()
        counts, more = parse_profile_page(response.text, profile_id)
        if found.keys() & counts.keys():
            raise ValueError("Scholar repeated a page; refusing an incomplete snapshot.")
        found.update(counts)
        if tracked_ids <= found.keys():
            return {key: found[key] for key in sorted(tracked_ids)}
        if not more:
            break
        time.sleep(3)
    raise ValueError("Tracked papers missing from Scholar: " + ", ".join(sorted(tracked_ids - found.keys())))


def update_snapshot(snapshot_path, publications_path, *, session=None, checked_on=None, dry_run=False):
    snapshot_path = Path(snapshot_path)
    snapshot = yaml.safe_load(snapshot_path.read_text(encoding="utf-8"))
    publications = yaml.safe_load(Path(publications_path).read_text(encoding="utf-8"))
    profile_id = snapshot["profile_id"]
    tracked_ids = set(snapshot["counts"]) | {paper["scholar_id"] for paper in publications if paper.get("scholar_id")}
    if not tracked_ids or not re.fullmatch(r"[A-Za-z0-9_-]+", profile_id):
        raise ValueError("A valid Scholar profile and at least one tracked paper are required.")
    if session is None:
        with requests.Session() as client:
            counts = fetch_counts(profile_id, tracked_ids, client)
    else:
        counts = fetch_counts(profile_id, tracked_ids, session)
    updated = dict(snapshot)
    updated["counts"] = counts
    updated["checked_on"] = checked_on or datetime.now(timezone.utc).date().isoformat()
    print(f"Validated {len(counts)} papers; checked {updated['checked_on']}.")
    if dry_run:
        print(yaml.safe_dump(updated, sort_keys=False), end="")
        return False
    if updated == snapshot:
        return False
    # Do not truncate the last good snapshot if validation or writing fails.
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=snapshot_path.parent,
                                         prefix=".scholar-", suffix=".tmp", delete=False) as stream:
            temporary = Path(stream.name)
            yaml.safe_dump(updated, stream, sort_keys=False, allow_unicode=False)
        os.replace(temporary, snapshot_path)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)
    return True


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--snapshot", type=Path, default=ROOT / "_data/google_scholar_citations.yml")
    parser.add_argument("--publications", type=Path, default=ROOT / "_data/publications.yml")
    parser.add_argument("--dry-run", action="store_true", help="Validate live counts without saving them.")
    args = parser.parse_args()
    try:
        update_snapshot(args.snapshot, args.publications, dry_run=args.dry_run)
    except (requests.RequestException, ValueError, KeyError, TypeError, OSError, yaml.YAMLError) as error:
        parser.exit(1, f"Citation update failed; previous snapshot kept: {error}\n")


if __name__ == "__main__":
    main()
