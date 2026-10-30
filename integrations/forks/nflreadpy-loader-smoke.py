#!/usr/bin/env python3
"""Exercise real nflreadpy loader with a local synthetic NFL PBP source.

This tests the *forked library's loader and season guards*, not a downloaded
NFL season, the 2026 schedule, or real game outcomes. No network used.
"""
from __future__ import annotations

import importlib
import json
import polars as pl


def main() -> None:
    loader = importlib.import_module("nflreadpy.load_pbp")
    calls = []

    class LocalFixtureDownloader:
        def download(self, repository: str, path: str, *, season: int) -> pl.DataFrame:
            calls.append({"repo": repository, "path": path, "season": season})
            assert repository == "nflverse-data"
            assert path == f"pbp/play_by_play_{season}"
            return pl.DataFrame({
                "season": [season, season],
                "game_id": [f"fixture-{season}-A", f"fixture-{season}-A"],
                "play_id": [1, 2],
                "epa": [0.2, -0.1],
            })

    original = loader.get_downloader
    loader.get_downloader = lambda: LocalFixtureDownloader()
    try:
        pbp = loader.load_pbp([2024, 2025])
        assert pbp.height == 4
        assert pbp["season"].to_list() == [2024, 2024, 2025, 2025]
        assert len(calls) == 2
        try:
            loader.load_pbp([1998])
            raise AssertionError("Pre-1999 season was improperly accepted")
        except ValueError:
            pass
        try:
            loader.load_pbp([9999])
            raise AssertionError("Future season was improperly accepted")
        except ValueError:
            pass
    finally:
        loader.get_downloader = original

    print(json.dumps({
        "contract": "ATLAS_FORK_NFLREADPY_LOADER_SMOKE_V1",
        "source": "tyrollclimaco09-oss/nflreadpy",
        "execution": "ACTUAL_FORK_LOADER_WITH_LOCAL_FIXTURE_DOWNLOADER",
        "fixture": "SYNTHETIC_PBP_NOT_REAL_NFL_DATA",
        "selected_seasons": [2024, 2025],
        "rows": pbp.height,
        "loader_paths": calls,
        "historical_nfl_games_verified": 0,
        "actual_network_calls": 0,
        "production_writes": 0,
        "approved_bet": None,
        "execution_authority": False,
    }, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
