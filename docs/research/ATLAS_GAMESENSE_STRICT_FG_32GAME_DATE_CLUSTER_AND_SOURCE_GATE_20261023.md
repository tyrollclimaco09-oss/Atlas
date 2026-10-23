# ATLAS Pass 4 — 32-game timing robustness and original-provider source gate

Checkpoint 2026-10-23. Research-only. Original detailed fixed-formula strict FG events and all game rows: [`docs/research/ATLAS_32GAME_TURNOVER_STRICT_FG_CLOCK_ROBUSTNESS_20261023_V1.json`](https://github.com/tyrollclimaco09-oss/Atlas/blob/9a1970e62850694ab148e85621f05b854f5f5889/docs/research/ATLAS_32GAME_TURNOVER_STRICT_FG_CLOCK_ROBUSTNESS_20261023_V1.json), Git blob d1a3dcaf7b951bebeba1dde05c9386cee6bbccbf.

**Outcome:** 32/32 games accepted, including full Jan15 (11), Jan16 (5) 2025 and Oct20–22 2026 (16). Every cumulative quarter scoreboard checked. The first opponent MAKE **field goal** within 15 game-clock seconds (at least 1 sec actually elapsed), before original TO side scores or opponent commits TO, follows 26.85 percentage points more often after steal-marked than unmarked turnovers across all rows pooled. This is a clock/event adjacency proxy; NEVER official points off turnovers or causal defensive attribution.

| Complete date | Games | Steal-marked FG quick score | No-steal-labelled FG quick score | Difference pp |
|---|---:|---:|---:|---:|
| 2025-01-15 | 11 | 90/174 (51.7%) | 23/128 (18.0%) | 33.8 |
| 2025-01-16 | 5 | 47/86 (54.7%) | 12/60 (20.0%) | 34.7 |
| 2026-10-20 | 3 | 20/45 (44.4%) | 12/41 (29.3%) | 15.2 |
| 2026-10-21 | 11 | 93/222 (41.9%) | 34/160 (21.3%) | 20.6 |
| 2026-10-22 | 2 | 16/39 (41.0%) | 4/33 (12.1%) | 28.9 |

Games with positive gap: 29; negative 3; ties 0. Naive game-level two-sided sign-test (not valid causal/randomization inference): 0.000003. Whole-date equal-cluster enumeration with 5 dates, 3125 bootstrap ordered resamples: percentage-point 2.5–97.5 range [20.16, 33.79]. **Severe limitation:** only five non-random dates from two eras, all same provider. This range is only a sensitivity diagnostic, not a population CI or ATLAS event-level independence. No win probability, reliable player over/under or +EV follows.

## Source gate

- Direct raw NBA CDN playbyplay_0022600006.json and boxscore_0022600006.json inaccessible in this environment. Prior S3-hosted pbpstats endpoint also inaccessible. Documented NBA API `PlayByPlayV3` endpoint inaccessible. Endpoint documentation independently confirms fields, not content retrieval.
- Source maps: https://github.com/swar/nba_api/blob/master/docs/nba_api/stats/endpoints/playbyplayv3.md and https://pbpstats.readthedocs.io/en/v1.3.4/_modules/pbpstats/data_loader/live/pbp/web.html
- **PROHIBITED:** stating verified actual possession boundary, lineup IDs, guarded shooter or on-court minutes. Current BRef rendered source and score conservation are useful weaker evidence, but don't automatically promote to independent official NBA CDN parity. Account for raw PBP event-order corrections, source ownership/rights and potential cache disagreement.

## Next earned direction

SCOUT/FILTER P0 original-provider custody exact game ID+team+period score and source hashes if access reopens; any unavailable fields ABSTAIN. ORACLE and Game Sense only use PRE-cutoff H1 turnover TYPE and already occurred history to predict H2, not the later turnover outcome itself. The 2025 two-date model evaluation below [separately archived] must decide whether extra features have earned predictive use. EDGE THIEF denies 'no recorded steal' equals 'dead-ball', FT timing confounding, event-row pseudo-independent evidence and betting EV claims. All previous 15 Arc III formal signoffs remain 0.

### Machine-readable sensitivity appendix
```json
{
  "date_rates": [
    {
      "date": "2025-01-15",
      "games": 11,
      "steal_n": 174,
      "unmarked_n": 128,
      "strict_fg_after_steal": 90,
      "strict_fg_after_unmarked": 23,
      "steal_rate": 0.5172413793103449,
      "unmarked_rate": 0.1796875,
      "rate_diff": 0.33755387931034486
    },
    {
      "date": "2025-01-16",
      "games": 5,
      "steal_n": 86,
      "unmarked_n": 60,
      "strict_fg_after_steal": 47,
      "strict_fg_after_unmarked": 12,
      "steal_rate": 0.5465116279069767,
      "unmarked_rate": 0.2,
      "rate_diff": 0.3465116279069767
    },
    {
      "date": "2026-10-20",
      "games": 3,
      "steal_n": 45,
      "unmarked_n": 41,
      "strict_fg_after_steal": 20,
      "strict_fg_after_unmarked": 12,
      "steal_rate": 0.4444444444444444,
      "unmarked_rate": 0.2926829268292683,
      "rate_diff": 0.15176151761517614
    },
    {
      "date": "2026-10-21",
      "games": 11,
      "steal_n": 222,
      "unmarked_n": 160,
      "strict_fg_after_steal": 93,
      "strict_fg_after_unmarked": 34,
      "steal_rate": 0.4189189189189189,
      "unmarked_rate": 0.2125,
      "rate_diff": 0.20641891891891892
    },
    {
      "date": "2026-10-22",
      "games": 2,
      "steal_n": 39,
      "unmarked_n": 33,
      "strict_fg_after_steal": 16,
      "strict_fg_after_unmarked": 4,
      "steal_rate": 0.41025641025641024,
      "unmarked_rate": 0.12121212121212122,
      "rate_diff": 0.289044289044289
    }
  ],
  "bootstrap": {
    "dates": 5,
    "enumeration": 3125,
    "percentile_2_5": 0.2016489137630138,
    "percentile_97_5": 0.3378544466848327,
    "warning": "Only five observed nonrandom dates, two eras same provider. Bootstrap quantifies internal between-date variation not valid population/casual confidence."
  },
  "game_signs": {
    "valid_games": 32,
    "positive": 29,
    "negative": 3,
    "ties": 0,
    "naive_game_sign_test_two_sided_p": 0.0000025560148060321808,
    "warning": "Games can share source calendar/environment and turnovers not experimental; naïve sign test not causal."
  },
  "source_blocker": {
    "source": "NBA CDN official liveData PBP/box and S3 alternate source endpoints documented by pbpstats/nba_api but direct reads yielded inaccessible from this environment; BRef rendered event feeds are not independent raw NBA CDN byte custody",
    "last_access": "2026-10-23",
    "status": "BLOCKED_original_NBA_pbp_box_bytes",
    "official_source_schema_known": "actionNumber,timeActual,period,teamId,actionType,scoreHome/scoreAway, possession; boxscore starter, oncourt, player minute fields, per-team stats",
    "independent_provider_pbp_test_done": false,
    "lineup_oncourt_5_verified": false,
    "possessions_reconstructed": false
  }
}
```