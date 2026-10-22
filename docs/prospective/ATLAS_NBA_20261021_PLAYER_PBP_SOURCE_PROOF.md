# ATLAS NBA player / play-by-play — independent source readback (October 22, 2026)

**Research lane NBA only. No odds credits or bets.** Completed NBA game on October 21, ESPN unofficial event `401909834` (team IDs home 19, away 1).

- CI [39834900969](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39834900969): 3/3 contract tests and live data fetch PASS.
- 19 usable player box-score rows, covering minutes, points, rebounds, assists and made/attempted threes; 7 incompatible/DNP rows excluded rather than imputed.
- 538 distinct play-by-play IDs across four periods, zero duplicate IDs. Source replay completeness NOT independently verified.
- Source retrieved 2026-10-22T18:50:40.528Z. Summary response SHA-256 `2d55e52992962d705bb552f832a062e4d58adc2c6cff8b795ffaf41042e5d141`.
- Stored once in existing Supabase `evidence_snapshots`: shadow receipt ID `74af21a2-b637-4ab4-834c-6110b52a5fb8`. Raw provider body not retained; GitHub artifact ID 12451250083 expires in seven days.
- Implementation `scripts/proof/nba-player-pbp-shadow.mjs` uses a bounded ESPN summary HTTP call, explicit game/team ID checks and no player-stat imputation. Unofficial endpoint licensing and stability remain unverified.

**Do not conflate** this postgame extractability check with the distinct pregame October 22 Cavs–Sixers **unpriced 50% reference** (`docs/prospective/ATLAS_NBA_20261022_CLE_PHI_UNPRICED_FREEZE.json`). Neither is a calibrated NBA betting model.

ATLAS's previously reported Play-by-Play V3 covered **57 NBA games** (43 April + 14 October) and reduced October Q4 top-four-player field-goal-attempt prediction MAE from **7.062 to 6.456** (9/14 cases better), but its interval included no improvement. Those model artifacts have NOT been replayed or promoted in this engineering pass. That feature target is Q4 combined attempts, not a player-prop/moneyline probability. Next: obtain/replay the preserved V3 source manifest and frozen folds, validate PBP events/shot mapping, player eligibility and leakage before a prospective probability freeze.
