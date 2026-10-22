#!/usr/bin/env python3
"""ATLAS read-only, one-shot The Odds API v4 source-contract probe.

Only /sports (free) and one NFL h2h /odds request (normally 1 credit).
Never logs credentials, full request URLs, full odds, or raw provider bodies.
Does not persist sportsbook quotes or authorize any bet.
"""
import hashlib
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import HTTPRedirectHandler, Request, build_opener

API_ORIGIN = "https://api.the-odds-api.com"
SPORT = "americanfootball_nfl"
EVIDENCE = Path("atlas-odds-probe-evidence.json")
MAX_RESPONSE = 2_500_000


class ProbeError(Exception):
    pass


class RejectRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def timestamp(value):
    if not isinstance(value, str):
        raise ProbeError("INVALID_SOURCE_TIMESTAMP")
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        raise ProbeError("INVALID_SOURCE_TIMESTAMP") from None
    if dt.tzinfo is None:
        raise ProbeError("NAIVE_SOURCE_TIMESTAMP")
    return dt.astimezone(timezone.utc).isoformat()


def header_count(headers, key):
    value = headers.get(key)
    return int(value) if value is not None and re.fullmatch(r"[0-9]+", value) else None


def get_json(path, params):
    allowed = ("/v4/sports", f"/v4/sports/{SPORT}/odds")
    if path not in allowed:
        raise ProbeError("ROUTE_NOT_ALLOWLISTED")
    url = API_ORIGIN + path + "?" + urlencode(params)
    req = Request(url, method="GET", headers={"Accept": "application/json", "User-Agent": "ATLAS-shadow-odds-contract/1.0"})
    try:
        # Explicitly disable redirects: never send query-string credentials elsewhere.
        with build_opener(RejectRedirect).open(req, timeout=20) as response:
            if response.status != 200:
                raise ProbeError(f"HTTP_{response.status}")
            raw = response.read(MAX_RESPONSE + 1)
            if len(raw) > MAX_RESPONSE:
                raise ProbeError("RESPONSE_TOO_LARGE")
            stats = {name: header_count(response.headers, name) for name in
                     ("x-requests-remaining", "x-requests-used", "x-requests-last")}
    except HTTPError as exc:
        # Never stringify the exception: urllib includes the key-bearing URL.
        raise ProbeError(f"HTTP_{exc.code}") from None
    except (URLError, TimeoutError, OSError):
        raise ProbeError("PROVIDER_UNAVAILABLE") from None
    try:
        payload = json.loads(raw)
    except (ValueError, UnicodeDecodeError):
        raise ProbeError("INVALID_JSON") from None
    return payload, hashlib.sha256(raw).hexdigest(), stats


def summarize_odds(events):
    if not isinstance(events, list):
        raise ProbeError("ODDS_NOT_ARRAY")
    event_ids = set()
    bookmakers = set()
    market_quotes = 0
    dk_market_quotes = 0
    market_timestamps = []
    for event in events:
        if not isinstance(event, dict):
            raise ProbeError("BAD_EVENT")
        event_id = event.get("id")
        if not isinstance(event_id, str) or not event_id or event_id in event_ids:
            raise ProbeError("BAD_EVENT_ID")
        event_ids.add(event_id)
        for field in ("home_team", "away_team"):
            if not isinstance(event.get(field), str) or not event[field]:
                raise ProbeError("BAD_EVENT_TEAM")
        timestamp(event.get("commence_time"))
        listed = event.get("bookmakers")
        if not isinstance(listed, list):
            raise ProbeError("BAD_BOOKMAKERS")
        for book in listed:
            if not isinstance(book, dict) or not isinstance(book.get("key"), str):
                raise ProbeError("BAD_BOOK")
            key = book["key"]
            bookmakers.add(key)
            if not isinstance(book.get("markets"), list):
                raise ProbeError("BAD_MARKETS")
            for market in book["markets"]:
                if not isinstance(market, dict) or market.get("key") != "h2h":
                    continue
                outcomes = market.get("outcomes")
                if not isinstance(outcomes, list) or len(outcomes) not in (2, 3):
                    raise ProbeError("BAD_H2H_OUTCOMES")
                names = set()
                for outcome in outcomes:
                    if not isinstance(outcome, dict):
                        raise ProbeError("BAD_OUTCOME")
                    name, price = outcome.get("name"), outcome.get("price")
                    if not isinstance(name, str) or not name or name in names:
                        raise ProbeError("BAD_OUTCOME_NAME")
                    if isinstance(price, bool) or not isinstance(price, (float, int)) or not (1 < price < 10_000):
                        raise ProbeError("BAD_DECIMAL_PRICE")
                    names.add(name)
                market_quotes += 1
                if key == "draftkings":
                    dk_market_quotes += 1
                if "last_update" in market:
                    market_timestamps.append(timestamp(market["last_update"]))
    return {
        "event_count": len(event_ids),
        "distinct_bookmakers": len(bookmakers),
        "bookmaker_keys": sorted(bookmakers),
        "valid_h2h_bookmaker_quotes": market_quotes,
        "draftkings_h2h_quotes": dk_market_quotes,
        "source_market_last_update_max_utc": max(market_timestamps) if market_timestamps else None,
        "draftkings_present": dk_market_quotes > 0,
    }


def self_test():
    example = [{
        "id": "synthetic-event", "home_team": "Alpha", "away_team": "Beta",
        "commence_time": "2026-10-25T17:00:00Z",
        "bookmakers": [{"key": "draftkings", "markets": [{
            "key": "h2h", "last_update": "2026-10-22T07:00:00Z",
            "outcomes": [{"name": "Alpha", "price": 1.91}, {"name": "Beta", "price": 1.91}],
        }]}],
    }]
    result = summarize_odds(example)
    assert result["event_count"] == 1 and result["draftkings_h2h_quotes"] == 1
    assert quota_preflight({"x-requests-remaining": 499, "x-requests-used": 1, "x-requests-last": 0})
    for invalid, failure in [
        ({"x-requests-remaining": 100, "x-requests-used": 1, "x-requests-last": 0}, "RESERVE_FLOOR_100"),
        ({"x-requests-remaining": 469, "x-requests-used": 31, "x-requests-last": 0}, "RESEARCH_CEILING_31_TOTAL_USED"),
        ({"x-requests-remaining": None, "x-requests-used": 1, "x-requests-last": 0}, "QUOTA_HEADERS_MISSING"),
    ]:
        try:
            quota_preflight(invalid)
        except ProbeError as exc:
            assert str(exc) == failure
        else:
            raise AssertionError("unsafe request budget accepted")
    example[0]["bookmakers"][0]["markets"][0]["outcomes"][0]["price"] = 0.9
    try:
        summarize_odds(example)
    except ProbeError as exc:
        assert str(exc) == "BAD_DECIMAL_PRICE"
    else:
        raise AssertionError("invalid quote accepted")
    print("ATLAS_ODDS_CONTRACT_SELFTEST=PASS")


def quota_preflight(headers):
    # The sports endpoint is free; inspect its quota headers BEFORE spending.
    remaining = headers.get("x-requests-remaining")
    used = headers.get("x-requests-used")
    last = headers.get("x-requests-last")
    if any(isinstance(v, bool) or not isinstance(v, int) for v in (remaining, used, last)):
        raise ProbeError("QUOTA_HEADERS_MISSING")
    if last != 0:
        raise ProbeError("SPORTS_ENDPOINT_NOT_FREE")
    if remaining < 101:
        raise ProbeError("RESERVE_FLOOR_100")
    if used + 1 > 31:
        raise ProbeError("RESEARCH_CEILING_31_TOTAL_USED")
    return True


def write_evidence(evidence):
    EVIDENCE.write_text(json.dumps(evidence, indent=2, sort_keys=True) + "\\n", encoding="utf-8")
    print(json.dumps(evidence, sort_keys=True))


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--self-test":
        self_test()
        return 0
    evidence = {
        "protocol": "ATLAS_ODDS_SOURCE_PROOF_V1",
        "classification": "FAIL",
        "provider": "the-odds-api.com",
        "sport": SPORT,
        "scope": "SHADOW_READ_ONLY",
        "source_observed_at_utc": datetime.now(timezone.utc).isoformat(),
        "execution_authority": False,
        "raw_odds_persisted": False,
        "authorized_bet": False,
    }
    # Default: no network and zero credits. Only an explicit one-credit manual
    # approval allows the probe to read even the free provider quota endpoint.
    if os.environ.get("ATLAS_ODDS_APPROVED_CREDITS", "0") != "1":
        evidence["classification"] = "SKIPPED_NO_APPROVAL"
        evidence["reason"] = "No explicit manual one-credit approval; zero network requests."
        write_evidence(evidence)
        return 0
    try:
        key = os.environ.get("THE_ODDS_API_KEY", "")
        if not key or not re.fullmatch(r"[A-Za-z0-9_-]{12,120}", key):
            raise ProbeError("MISSING_OR_INVALID_SECRET")
        sports, sports_sha, free_quota = get_json("/v4/sports", {"apiKey": key})
        if not isinstance(sports, list) or any(not isinstance(x, dict) or not isinstance(x.get("key"), str) for x in sports):
            raise ProbeError("SPORTS_SCHEMA_INVALID")
        evidence["sports_response_sha256"] = sports_sha
        evidence["sports_total"] = len(sports)
        evidence["sports_request_quota"] = free_quota
        quota_preflight(free_quota)
        if SPORT not in {x["key"] for x in sports}:
            evidence["classification"] = "SPORT_NOT_LISTED"
        else:
            # A single region x a single market = at most one *planned* billable credit.
            odds, odds_sha, quota = get_json(
                f"/v4/sports/{SPORT}/odds",
                {"apiKey": key, "regions": "us", "markets": "h2h", "oddsFormat": "decimal"},
            )
            evidence["odds_response_sha256"] = odds_sha
            evidence["odds_request_quota"] = quota
            if quota["x-requests-last"] is None or quota["x-requests-last"] > 1:
                raise ProbeError("UNEXPECTED_QUOTA_COST")
            if quota["x-requests-remaining"] is None or quota["x-requests-remaining"] < 100:
                raise ProbeError("RESERVE_FLOOR_VIOLATION")
            evidence.update(summarize_odds(odds))
            evidence["classification"] = (
                "LIVE_QUOTE_PROOF" if evidence["draftkings_present"]
                else "LIVE_SOURCE_PARTIAL_NO_DK"
            )
            if quota["x-requests-last"] is not None and quota["x-requests-last"] > 1:
                raise ProbeError("UNEXPECTED_QUOTA_COST")
        evidence["reason"] = "Only an observed market snapshot; no EV or executable-price proof."
        code = 0
    except ProbeError as exc:
        evidence["classification"] = "FAIL"
        evidence["reason"] = str(exc)
        code = 1
    except Exception:
        # Never print exceptions: they may contain request URLs or secrets.
        evidence["classification"] = "FAIL"
        evidence["reason"] = "UNEXPECTED_ERROR"
        code = 1
    EVIDENCE.write_text(json.dumps(evidence, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(evidence, sort_keys=True))
    return code


if __name__ == "__main__":
    raise SystemExit(main())
