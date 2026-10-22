> **2026-10-22 continuity correction:** This historical Pass 04 document incorrectly named New England. ESPN team ID `30` is Jacksonville. The verified Week 6 event is **Houston at Jacksonville** (`401872996` / `2026_06_HOU_JAX`). Consult [Pass 05 NFL cross-source correction](ATLAS_NFL_20261022_WEEK6_NFLVERSE_PBP_CROSSCHECK_05.md). All other original Pass 04 numeric observations are retained.

# NFL: Week 6 conditional play-team research boundary

**Authority: shadow research only.** Oct 18 game `401872996`, Week **6**, Houston/New England. Separate from NBA.

- [Field-schema audit 39852086736](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39852086736) passed **3/3** targeted tests. All 186 play records lack `play.team.id`, but have `play.start.team.id`; 185 have `play.end.team.id`. `teamParticipants` contains **both** teams and cannot identify the actor.
- **20/186** start-team vs drive-team differences: 12 kickoffs and 8 official timeouts. Unconditional inheritance is unsafe.
- [Restricted candidate run 39852360645](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39852360645) passed **6/6** tests and real-source fetch. A deliberately narrow rule includes **116** source-consistent team candidates: 41 Pass Reception, 50 Rush, 25 Pass Incompletion. **70 excluded**: 69 outside allowed types, 1 penalty/turnover.
- Candidate requires drive/start team match, a known normal-play type, valid play identity and period, and no explicit turnover or penalty. Classification: `SOURCE_CONSISTENT_NOT_INDEPENDENTLY_VERIFIED`. **Not player/target/pass-attempt attribution and not complete-play proof**.
- Source-body SHA-256 for candidate run: `de7e2a853a9bf5cc1bb6db0c6d50cef20bf45a311ae4130539f56514a5c1f476`.
- Prior Week 6 cross-provider **aggregate** match remains narrow: C.J. Stroud 34 attempts and Woody Marks 15 rushes. No independent nflverse play-level reconciliation yet.

**Gate:** do not treat 116 candidates as validated player records. Next: independent nflverse event-level map, explicit missingness for sacks/scrambles/penalties and source conflicts, then evaluate player volume coverage. No odds credits/bets.
