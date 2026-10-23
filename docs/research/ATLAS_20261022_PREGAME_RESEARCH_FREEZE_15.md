# ATLAS Pass 15 — first prospectively timed, price-blind NFL freeze

**Created (CI):** October 23, 2026 00:43:13 UTC (October 22 Central). **Source:** GitHub Actions [39879769087](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39879769087) on isolated `research/odds-api-probe-2026-10-22`. **Ledger:** [full time-ordered 13-game manifest](../prospective/ATLAS_NFL_W7_PREGAME_SHADOW_20261022_V2.json). **State:** SHADOW / NO wager, odds, starter or production claims.

## Real chronology
- ESPN Week 7 full schedule returned **14** games. The already-started Thursday game failed the pre-kickoff time/status guard and was **excluded**. The remaining **13** games were still more than **30 minutes** from their reported kickoffs when version 2 was created.
- Source input: nflverse 2026 PBP **Weeks 1–6 only**, source gz SHA-256 `a6ddee607edda2d530bc65fd869c0eb2f8019ea0d962b020e039dae52c840399`. ESPN Week 7 schedule SHA-256 `75df30e8d6b7bf1f6087b71979b9338b71c39d786db83515799d99630ca0f49f`.
- The packet records each game, event ID, scheduled kickoff, both team codes, 2 candidate player slots, immutable-at-commit historical-source name/ID and historical last-3 attempt mean. **26 QB proxy slots, 25 numeric estimates, 1 explicit abstention** (PHI candidate from only one prior observed game). Missing/zero-attempt future outcomes remain in the ledger for later settlement.
- No manual book quote, player injury, current starter, real roster lock, game eligibility contract, certified neutral independent signing or cryptographically witnessed data freshness was established. GitHub Actions CI and Git immutable commit provide useful chronology evidence, **not an externally signed pregame oracle**.

## Failures preserved and meaningful corrections
- Initial CI [39879298512](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39879298512): **FAIL**, Python dict expansion used incorrect JavaScript `...e`.
- Next [39879432700](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39879432700): **FAIL**, adversarial test expected a future-week row to be ignored rather than hard-rejected. Test corrected to assert rejection.
- Diagnostic v1 [39879497749](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39879497749): **PASS**, created first future-game packet but had two overconfident source choices: **ESPN `LAR` ≠ nflverse `LA`** (a Rams QB was incorrectly reported missing), and a one-game-history PHI QB proxy was given a numeric prediction.
- Corrected v2 [39879769087](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39879769087): **PASS**, maps ESPN `LAR`→nflverse `LA` preserving public team code, and **refuses a numeric estimate when fewer than 2 prior QB appearances are observed**. The PHI player stays on the schedule with `forecast:null`; the Rams proxy is recovered from actual prior game data. This is a **distinct second freeze**, never an edit to v1.
- Follow-up evidence mirrored directly from verified CI stdout into the Git versioned [V2 roster ledger](../prospective/ATLAS_NFL_W7_PREGAME_SHADOW_20261022_V2.json). The manifest's content can be checked from the ledger's pinned Git commit and linked action log. No postgame re-forecast under the same V2 ID.

## Permission boundary and arc close criteria

This earns **one pregame shadow research packet**, not a proven prediction model or wagering recommendation. Every estimate is a *last-observed workload proxy*, with starters/injuries unverified. Team-key mapping and the absence of complete QB universe validation limit forecast validity; full-lineup & roster cross-check remains open.

For this arc to close, collect **prospective** outcomes against the V2 *unchanged* candidate universe (including the null forecast), verify official outcomes/special cases and score the original records, compare against a contemporaneously frozen independent simple comparator, audit alternate starting QBs and any zero attempts, then test backend receipt and non-wagering safety gates. The NBA lane separately needs at least one **actual** before-Q4 timestamped feature packet and later Q4 settlement. These are **requirements**, not a guaranteed date or number of tries.

No Supabase writes, production modifications, paid Odds API calls, or bets occurred in this pass.
