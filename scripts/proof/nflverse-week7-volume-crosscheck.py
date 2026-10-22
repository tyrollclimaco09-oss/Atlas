#!/usr/bin/env python3
"""ATLAS NFL Week 7 official-aggregate cross-source audit (shadow/read-only).

Two observed ESPN box-score values are pinned below; inspect nflverse's public
weekly player-stats asset independently. A disagreement is a conflict, not EV.
"""
import csv
import gzip
import hashlib
import io
import json
import re
import sys
import urllib.request
from datetime import datetime, timezone

URL = "https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_2026.csv.gz"
EXPECTED = (
    {"name": "C.J. Stroud", "team": "HOU", "field": "passing_attempts", "espn_value": 34},
    {"name": "Woody Marks", "team": "HOU", "field": "rushing_attempts", "espn_value": 15},
)
ESPN_SOURCE_HASH = "aff4bac63af72af2db12fd54f010fd207f577565f0c75a3663403029c9bc87e4"

def normalize_name(x):
    return re.sub(r"[^a-z0-9]", "", str(x).lower())

def parse_value(x):
    if x in (None, "", "NA"):
        return None
    try:
        a = float(x)
    except (TypeError, ValueError):
        return None
    return int(a) if 0 <= a < 1000 and a.is_integer() else None

def evaluate(rows):
    matches = []
    for need in EXPECTED:
        candidates = [
            row for row in rows
            if str(row.get("season")) == "2026" and str(row.get("week")) == "7"
            and str(row.get("team") or row.get("recent_team") or "") == need["team"]
            and normalize_name(row.get("player_display_name") or row.get("player_name") or "")
                == normalize_name(need["name"])
        ]
        result = {
            "name": need["name"], "team": need["team"], "stat": need["field"],
            "espn_value": need["espn_value"],
            "nflverse_rows": len(candidates),
            "nflverse_value": parse_value(candidates[0].get(need["field"])) if len(candidates) == 1 else None,
        }
        result["matched"] = (
            result["nflverse_rows"] == 1
            and result["nflverse_value"] is not None
            and result["nflverse_value"] == need["espn_value"]
        )
        matches.append(result)
    return matches

def self_test():
    fixtures = [
        {"season": "2026", "week": "7", "team": "HOU", "player_display_name": "CJ Stroud", "passing_attempts": "34", "rushing_attempts": "1"},
        {"season": "2026", "week": "7", "team": "HOU", "player_display_name": "Woody Marks", "passing_attempts": "0", "rushing_attempts": "15"},
    ]
    matches = evaluate(fixtures)
    assert len(matches) == 2 and all(x["matched"] for x in matches)
    other = [dict(f) for f in fixtures]
    other[0]["passing_attempts"] = "33"
    assert evaluate(other)[0]["matched"] is False
    other = fixtures + [fixtures[0]]
    assert evaluate(other)[0]["nflverse_rows"] == 2
    other = [dict(f) for f in fixtures]
    other[1]["week"] = "6"
    assert evaluate(other)[1]["nflverse_rows"] == 0
    print("ATLAS_NFLVERSE_WEEK7_CROSSCHECK_OFFLINE=PASS")

def main():
    if "--self-test" in sys.argv:
        self_test()
        return
    request = urllib.request.Request(URL, headers={
        "Accept": "application/octet-stream",
        "User-Agent": "ATLAS-NFL-WEEK7-INDEPENDENT-READONLY/1"
    })
    with urllib.request.urlopen(request, timeout=20) as response:
        source = response.read(1_500_001)
        final_url = response.geturl()
    if len(source) == 0 or len(source) > 1_500_000:
        raise ValueError("SOURCE_GZIP_SIZE_LIMIT")
    if not final_url.startswith("https://release-assets.githubusercontent.com/") and not final_url.startswith("https://github.com/"):
        raise ValueError("UNTRUSTED_REDIRECT_HOST")
    decompressed = gzip.decompress(source)
    if len(decompressed) > 6_000_000:
        raise ValueError("SOURCE_DECOMPRESSED_LIMIT")
    rows = list(csv.DictReader(io.StringIO(decompressed.decode("utf-8-sig"))))
    if not rows:
        raise ValueError("NO_NFLVERSE_ROWS")
    match = evaluate(rows)
    coverage = {}
    for row in rows:
        if str(row.get("season")) == "2026":
            week = str(row.get("week"))
            coverage[week] = coverage.get(week, 0) + 1
    source_names = []
    for row in rows:
        name = normalize_name(row.get("player_display_name") or row.get("player_name") or "")
        if name in ("cjstroud", "woodymarks"):
            source_names.append({
                "name": row.get("player_display_name") or row.get("player_name"),
                "season": row.get("season"), "week": row.get("week"),
                "team": row.get("team") or row.get("recent_team")
            })
    if all(x["matched"] for x in match):
        source_status = "MATCH"
    elif coverage.get("7", 0) == 0:
        source_status = "WEEK7_NOT_PRESENT_IN_RELEASE"
    else:
        source_status = "CONFLICT_OR_IDENTITY_MISMATCH"
    print("ATLAS_NFLVERSE_COVERAGE "+json.dumps({
        "weekly_rows_2026": coverage,
        "relevant_player_rows": source_names[:25],
        "column_names": list(rows[0].keys())[:35]
    }, sort_keys=True))
    report = {
        "schema": "atlas.nfl.cross_provider_volumes.shadow.v1",
        "classification": "POSTGAME_INDEPENDENT_SOURCE_CORROBORATION",
        "season": 2026, "week": 7,
        "espn_game_id": "401872996",
        "espn_summary_sha256": ESPN_SOURCE_HASH,
        "nflverse_url": URL,
        "nflverse_downloaded_sha256": hashlib.sha256(source).hexdigest(),
        "observed_at_utc": datetime.now(timezone.utc).isoformat(),
        "source_publish_time_verified": False,
        "nflverse_row_count_all_season": len(rows),
        "comparisons": match,
        "cross_source_status": source_status,
        "source_week_coverage": coverage,
        "relevant_player_rows": source_names[:25],
        "canonical_event_identity_independently_matched": False,
        "pre_event_player_features_verified": False,
        "production_authority": False,
        "calibrator_eligible": False,
        "execution_authority": False,
        "odds_api_credits": 0,
    }
    with open("atlas-nflverse-week7-corroboration.json", "w", encoding="utf-8") as f:
        json.dump(report, f, sort_keys=True, indent=2)
        f.write("\n")
    print("ATLAS_NFLVERSE_WEEK7_CROSSCHECK " + json.dumps({
        "status": report["cross_source_status"], "comparison": match,
        "sha256": report["nflverse_downloaded_sha256"],
    }, sort_keys=True))
    if report["cross_source_status"] == "CONFLICT_OR_IDENTITY_MISMATCH":
        raise ValueError("INDEPENDENT_NFL_STAT_CONFLICT")

if __name__ == "__main__":
    main()
