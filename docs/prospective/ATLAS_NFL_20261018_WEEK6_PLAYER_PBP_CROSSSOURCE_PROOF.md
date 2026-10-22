# ATLAS NFL Week 6 player / play-by-play — corrected paired source proof (October 22, 2026)

**Research lane NFL only. No odds credits or bets.** The game on October 18, 2026, event `401872996`, is **2026 Week 6**, not Week 7. The original CI/run `39835543469` and an immutable Supabase shadow receipt used an incorrect Week 7 label; those historical records are not rewritten. This document supersedes their classification.

- Correctly labelled CI [39837577620](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39837577620): 4/4 tests and real source PASS.
- ESPN unofficial: 22 player records, passing attempts present for 2 passers, rushing attempts for 9 players, receptions and targets for 18; 186 distinct play IDs nested in `summary.drives.previous[].plays`, 20 completed drives.
- Observed 2026-10-22T19:09:12.481Z, summary SHA-256 `1c32bdbe54838821c0c0472a207f0c3049aa23a069684bcb33c26c39157c030d`. Not independently proven to contain every official snap.
- **Independent verification:** [39836988809](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39836988809) matched the exact game `401872996` on ESPN's Week 6 scoreboard and the nflverse 2026 Week 6 player-stat release: **C.J. Stroud 34 passing attempts (34/34)** and **Woody Marks 15 carries (15/15)**.
- nflverse compressed weekly data SHA-256 `ea79685be267c986d9875bf50651aca29c939bb3d1a92b2906a4afc71b8e4849`. At audit time the release contained Weeks 1–6, no Week 7 rows. Upstream field mappings are `attempts` and `carries`, not ESPN's `C/ATT` and `CAR`.
- Immutable correction receipt in Supabase `evidence_snapshots`: `e5e3f656-ffc6-4c67-9391-ad7b8e299a99`. It explicitly points to original immutable mislabeled ID `56d9f4cb-742e-45b4-99e9-17e68e899552`. Neither record is calibration eligible.
- Superseded invalid Week 7 comparison helper/workflow were removed; new source run and Week 6 paired check remain separate. **Do not call the Week 6 comparison a Week 7 corroboration**.

Next: Week 7 replay only after its data is published, verified source coverage per week; reconcile nflverse structured PBP to ESPN drive play IDs and segment passing attempts vs canceled/sack/scramble plays; then freeze independent *pregame* NFL QB/WR/RB workload forecasts in chronological holdouts. Paired hindsight metrics here do not validate betting EV or any production decision.
