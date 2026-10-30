#!/usr/bin/env python3
"""ATLAS Fork Arsenal: read-only, dependency-free smoke test of *real fork source*.

Supply locally cloned forks pinned to reviewed SHA. This script does not import
the original app, call a network endpoint, write to DB, modify a repo, or place
bets. In particular it does not manufacture today's NBA data: all score rows
below are explicitly SYNTHETIC_FIXTURE.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import pathlib
import sys
import types
from typing import Any


def load_nba_static(source_root: pathlib.Path) -> Any:
    """Load the actual fork's static team-index implementation without deps."""
    path = source_root / "src" / "nba_api"
    if not (path / "stats" / "static" / "teams.py").is_file():
        raise ValueError("NBA_API_FORK_SOURCE_NOT_FOUND")
    # Narrow module shim bypasses *only* package __init__ metadata lookup.
    # team identity functions and data are read unmodified from the fork.
    package = types.ModuleType("nba_api")
    package.__path__ = [str(path)]
    sys.modules["nba_api"] = package
    from nba_api.stats.static import teams  # noqa: PLC0415
    return teams


def load_sports_shaping(source_root: pathlib.Path) -> Any:
    """Load the fork's actual pure-stdlib row-shaping implementation."""
    path = source_root / "src" / "sports_skills" / "_shaping.py"
    if not path.is_file():
        raise ValueError("SPORTS_SKILLS_FORK_SOURCE_NOT_FOUND")
    spec = importlib.util.spec_from_file_location("atlas_fork_sports_shaping", path)
    if spec is None or spec.loader is None:
        raise ValueError("SPORTS_SKILLS_MODULE_UNLOADABLE")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def probe(nba_root: pathlib.Path, sports_root: pathlib.Path) -> dict[str, Any]:
    teams = load_nba_static(nba_root)
    shaping = load_sports_shaping(sports_root)
    ids = {}
    for abbreviation in ("ATL", "CLE", "BOS", "LAL"):
        hit = teams.find_team_by_abbreviation(abbreviation)
        if hit is None or not isinstance(hit["id"], int):
            raise ValueError("NBA_TEAM_RESOLUTION_FAILED")
        ids[abbreviation] = {"id": hit["id"], "full_name": hit["full_name"]}
    # This tests the *forked utility*. The fixture is NOT current player data.
    synthetic = [
        {"player_id": "fixture-A", "minutes": "22", "points": 12, "team": "ATL"},
        {"player_id": "fixture-B", "minutes": "29", "points": 21, "team": "CLE"},
        {"player_id": "fixture-C", "minutes": None, "points": 30, "team": "BOS"},
    ]
    shaped, meta = shaping.shape_rows(
        synthetic,
        {"sort_by": "minutes", "limit": 2, "fields": "points"},
        identity=("player_id",),
    )
    if [x["player_id"] for x in shaped] != ["fixture-B", "fixture-A"]:
        raise ValueError("FORK_SHAPING_ORDER_CHANGED")
    if meta != {"total_rows": 3, "returned_rows": 2}:
        raise ValueError("FORK_SHAPING_METADATA_CHANGED")
    return {
        "contract": "ATLAS_FORK_ARSENAL_CODE_SMOKE_V1",
        "scope": "OFFLINE_READ_ONLY",
        "source_forks": [
            "tyrollclimaco09-oss/nba_api",
            "tyrollclimaco09-oss/sports-skills",
        ],
        "provenance": "ACTUAL_FORK_SOURCE_IMPORTED",
        "team_ids": ids,
        "teams_indexed": len(teams.get_teams()),
        "synthetic_fixture_shaping": {
            "source": "SYNTHETIC_FIXTURE_NOT_CURRENT_NBA_DATA",
            "player_ids": [x["player_id"] for x in shaped],
            "metadata": meta,
        },
        "live_nba_data_loaded": False,
        "live_nfl_data_loaded": False,
        "sportsbook_quotes_loaded": False,
        "verified_professional_injury_facts": 0,
        "execution_authority": False,
        "approved_bet": None,
        "production_writes": 0,
        "paid_api_requests": 0,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--nba-api-source", type=pathlib.Path, required=True)
    parser.add_argument("--sports-skills-source", type=pathlib.Path, required=True)
    args = parser.parse_args()
    print(json.dumps(probe(args.nba_api_source, args.sports_skills_source), indent=2, sort_keys=True))
