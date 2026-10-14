"""Refresh the citation snapshot only after every tracked paper is validated."""

import argparse
from datetime import date, datetime
import logging
import os
from pathlib import Path
import re
import tempfile
import time
from urllib.parse import parse_qs, urlparse
from zoneinfo import ZoneInfo

from bs4 import BeautifulSoup
import requests
import yaml


ROOT = Path(__file__).resolve().parents[1]


def chicago_date(now=None):
    return (now or datetime.now(ZoneInfo("America/Chicago"))).astimezone(
        ZoneInfo("America/Chicago")).date().isoformat()


def _serpapi_page(session, profile_id, start, api_key):
    logger = logging.getLogger(__name__)
    for attempt in range(3):
        try:
            response = session.get(
                "https://serpapi.com/search.json",
                params={"engine": "google_scholar_author", "author_id": profile_id,
                        "hl": "en", "num": 100, "start": start, "api_key": api_key},
                timeout=30, allow_redirects=False,
            )
        except (requests.Timeout, requests.ConnectionError):
            message = "SerpApi network timeout or connection failure"
        except requests.RequestException:
            # Requests exceptions can contain the complete URL, including the key.
            raise ValueError("SerpApi request failed; check connectivity and API settings.") from None
        else:
            status = response.status_code
            logger.info("SerpApi HTTP %s (start=%d, attempt=%d)", status, start, attempt + 1)
            if status == 200:
                try:
                    return response.json()
                except ValueError:
                    raise ValueError("SerpApi did not return valid JSON.") from None
            message = f"SerpApi HTTP {status}"
            if status not in (408, 500, 502, 503, 504):
                raise ValueError(message + ": check the API key, account quota and settings.")
        if attempt == 2:
            raise ValueError(message + "; retry limit reached.") from None
        delay = 5 * (attempt + 1)
        logger.warning("%s; retrying in %d seconds.", message, delay)
        time.sleep(delay)


def fetch_serpapi_counts(profile_id, tracked_ids, session, *, api_key=None):
    api_key = (api_key or os.environ.get("SERPAPI_KEY") or os.environ.get("SERPAPI") or "").strip()
    if not api_key:
        raise ValueError("Set SERPAPI_KEY (or SERPAPI) before using the SerpApi provider.")
    found = {}
    for start in range(0, 2000, 100):
        logging.getLogger(__name__).info("Loading SerpApi author publications (start=%d)", start)
        data = _serpapi_page(session, profile_id, start, api_key)
        if not isinstance(data, dict) or "error" in data:
            raise ValueError("SerpApi returned an error or an unexpected response; check the dashboard.")
        metadata = data.get("search_metadata")
        parameters = data.get("search_parameters")
        articles = data.get("articles")
        if (not isinstance(metadata, dict) or metadata.get("status") != "Success"
                or not isinstance(parameters, dict) or parameters.get("author_id") != profile_id
                or parameters.get("engine") != "google_scholar_author"
                or not isinstance(articles, list) or not articles):
            raise ValueError("SerpApi returned an unexpected author or incomplete publication list.")
        for article in articles:
            if not isinstance(article, dict):
                raise ValueError("SerpApi returned an invalid publication.")
            identifier = article.get("citation_id", "")
            cited_by = article.get("cited_by")
            if not isinstance(identifier, str) or not identifier.startswith(profile_id + ":"):
                raise ValueError("SerpApi returned a paper from an unexpected author.")
            paper_id = identifier.split(":", 1)[1]
            count = cited_by.get("value") if isinstance(cited_by, dict) else None
            if (not re.fullmatch(r"[A-Za-z0-9_-]+", paper_id) or paper_id in found
                    or type(count) is not int or count < 0):
                raise ValueError("Repeated paper ID or missing/invalid SerpApi citation count.")
            found[paper_id] = count
        logging.getLogger(__name__).info("SerpApi returned %d articles (total=%d)", len(articles), len(found))
        if tracked_ids <= found.keys():
            return {key: found[key] for key in sorted(tracked_ids)}
        pagination = data.get("serpapi_pagination")
        if not isinstance(pagination, dict) or not pagination.get("next"):
            break
    raise ValueError("Tracked papers missing from SerpApi: " + ", ".join(sorted(tracked_ids - found.keys())))


def parse_profile_page(html, profile_id):
    soup = BeautifulSoup(html, "html.parser")
    rows = soup.select("#gsc_a_t .gsc_a_tr")
    next_button = soup.select_one("#gsc_bpf_more")
    captcha = soup.select_one('form[action*="/sorry/"]') is not None
    # Log structure only; canonical links and author details are not required.
    logging.getLogger(__name__).info(
        "Scholar page structure: canonical=%s profile=%s rows=%d pagination=%s captcha=%s",
        soup.find("link", rel="canonical") is not None,
        soup.select_one("#gsc_prf_in") is not None, len(rows), next_button is not None, captcha)
    if not rows or captcha:
        raise ValueError("Scholar did not return a usable publication list "
                         "(possible access restriction or changed HTML).")
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
    if next_button is None:
        raise ValueError("Scholar pagination control is missing.")
    return counts, not next_button.has_attr("disabled")


def fetch_counts(profile_id, tracked_ids, session):
    found = {}
    for start in range(0, 2000, 100):
        logging.getLogger(__name__).info("Loading Scholar publication page (cstart=%d)", start)
        response = session.get(
            "https://scholar.google.com/citations",
            params={"user": profile_id, "hl": "en", "pagesize": 100, "cstart": start},
            timeout=30,
        )
        logging.getLogger(__name__).info("Scholar HTTP %s (cstart=%d)", response.status_code, start)
        if response.status_code in (403, 429):
            raise ValueError(f"Scholar HTTP {response.status_code}: access restricted; "
                             "no retry attempted.")
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


def fetch_scholarly_counts(profile_id, tracked_ids, *, client=None):
    if client is None:
        from scholarly import scholarly
        client = scholarly
    try:
        client.set_timeout(15)
        client.set_retries(3)
        logging.getLogger(__name__).info("Loading Scholar author profile %s", profile_id)
        author = client.search_author_id(profile_id)
        # Avoid requesting coauthors, public-access mandates, or each paper separately.
        logging.getLogger(__name__).info("Loading Scholar publication list %s", profile_id)
        author = client.fill(author, sections=["publications"])
    except Exception as error:
        raise ValueError(f"scholarly could not fetch the author profile: {error}") from error
    if (not isinstance(author, dict) or author.get("scholar_id") != profile_id
            or "publications" not in author.get("filled", [])
            or not isinstance(author.get("publications"), list)):
        raise ValueError("scholarly returned an unexpected or incomplete author profile.")
    counts = {}
    for paper in author["publications"]:
        if not isinstance(paper, dict):
            raise ValueError("scholarly returned an invalid publication.")
        identifier = paper.get("author_pub_id", "")
        if not isinstance(identifier, str) or not identifier.startswith(profile_id + ":"):
            raise ValueError("scholarly returned a paper from an unexpected author.")
        paper_id = identifier.split(":", 1)[1]
        count = paper.get("num_citations")
        if (not re.fullmatch(r"[A-Za-z0-9_-]+", paper_id) or paper_id in counts
                or type(count) is not int or count < 0):
            raise ValueError("Duplicate paper ID or missing/invalid scholarly citation count.")
        counts[paper_id] = count
    missing = tracked_ids - counts.keys()
    if missing:
        raise ValueError("Tracked papers missing from Scholar: " + ", ".join(sorted(missing)))
    return {key: counts[key] for key in sorted(tracked_ids)}


def update_snapshot(snapshot_path, publications_path, *, session=None, checked_on=None,
                    dry_run=False, provider="serpapi"):
    snapshot_path = Path(snapshot_path)
    original = snapshot_path.read_text(encoding="utf-8")
    snapshot = yaml.safe_load(original)
    publications = yaml.safe_load(Path(publications_path).read_text(encoding="utf-8"))
    profile_id = snapshot["profile_id"]
    tracked_ids = set(snapshot["counts"]) | {paper["scholar_id"] for paper in publications if paper.get("scholar_id")}
    if not tracked_ids or not re.fullmatch(r"[A-Za-z0-9_-]+", profile_id):
        raise ValueError("A valid Scholar profile and at least one tracked paper are required.")
    checked_on = checked_on or chicago_date()
    if date.fromisoformat(checked_on) < date.fromisoformat(str(snapshot["checked_on"])):
        raise ValueError("This update is older than the saved snapshot.")
    if session is not None:
        counts = fetch_counts(profile_id, tracked_ids, session)
    elif provider == "serpapi":
        with requests.Session() as client:
            counts = fetch_serpapi_counts(profile_id, tracked_ids, client)
    elif provider == "requests":
        with requests.Session() as client:
            counts = fetch_counts(profile_id, tracked_ids, client)
    else:
        try:
            counts = fetch_scholarly_counts(profile_id, tracked_ids)
        except ValueError as error:
            # Only a profile-parser failure gets one alternate parsing attempt.
            # Access restrictions, timeouts and invalid data must remain failures.
            if provider != "auto" or not isinstance(error.__cause__, AttributeError):
                raise
            logging.getLogger(__name__).warning(
                "scholarly profile parsing failed; trying the direct publication parser once: %s", error)
            with requests.Session() as client:
                counts = fetch_counts(profile_id, tracked_ids, client)
    # Never clear a positive count without manual verification.
    if any(counts[key] == 0 and old > 0 for key, old in snapshot["counts"].items()):
        raise ValueError("A previously positive count became zero; manual verification required.")
    if snapshot_path.read_text(encoding="utf-8") != original:
        raise ValueError("The snapshot changed during fetching; keeping the newer edit.")
    updated = dict(snapshot)
    updated["counts"] = counts
    updated["checked_on"] = checked_on
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
    parser.add_argument("--provider", choices=["serpapi", "auto", "scholarly", "requests"], default="serpapi",
                        help="Use SerpApi by default; direct Scholar providers remain available for diagnostics.")
    parser.add_argument("--verbose", action="store_true",
                        help="Log Scholar HTTP statuses and page structure without headers or HTML.")
    args = parser.parse_args()
    if args.verbose:
        logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s: %(message)s")
    try:
        update_snapshot(args.snapshot, args.publications, dry_run=args.dry_run, provider=args.provider)
    except (requests.RequestException, ValueError, KeyError, TypeError, OSError, yaml.YAMLError) as error:
        parser.exit(1, f"Citation update failed; previous snapshot kept: {error}\n")


if __name__ == "__main__":
    main()
