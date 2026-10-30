# ATLAS × Flaim Fantasy — SCOUT / FILTER-VERIFY shadow integration

**Status:** review-only research adapter; no production UI deployment, no automatic fantasy-provider polling, no bets.

**Connected Flaim state checked October 29, 2026:** `get_user_session` succeeded with **zero connected fantasy leagues**. No live fantasy players, rosters, transactions or projections were observed. To enable league-scoped research, the user must connect a supported league at https://flaim.app/leagues. Do not ask them to paste passwords, cookies, or tokens.

## What actually integrates

Flaim is a user-authenticated ChatGPT connector into the user's own ESPN, Yahoo or Sleeper fantasy leagues. It does **not** expose a verified server-to-server API credential for the ATLAS Supabase/Vercel backend. This adapter is therefore an **operator-reviewed handoff**, not unattended live sync. Operator-prepared packets are not cryptographically authenticated Flaim records.

| Flaim source | SCOUT interpretation | FILTER/VERIFY requirement |
| --- | --- | --- |
| `get_transactions` | Fantasy add/drop/waiver/trade lead | Fantasy move is not a professional roster trade or injury; verify independently |
| `get_roster` | Fantasy roster presence or fantasy status designation | Confirm pro playing status through official reports, never use roster as a pro lineup |
| `get_free_agents` | Available in **that fantasy league** | Not a professional free agent; check real-world roster separately |
| `get_players` | Platform-wide ownership rate / fantasy status flag | Never call a global percentage league-owned, never infer a trend without two dated observations |
| `get_matchups` | Fantasy score or fantasy-point projection | Not NBA points, minutes, expected player stats, or calibrated probability |

Pipeline:
`Connected fantasy league → Flaim read in ChatGPT → minimal operator-reviewed signal → SCOUT → FILTER/VERIFY independent professional-source check → WATCH / research context`.

**Hard boundaries:** No DraftKings prices from Flaim. DraftKings-first The Odds API remains the pricing source. No approved bets, automatic account updates, independent probability, EV, pro injury certification, or authoritative role assignments. Human Final Gate stays mandatory.

## The implementation

`integrations/flaim/scout-verify.mjs` exports `flaimIntakeStatus`, `processFlaimObservation`, `attachIndependentVerification` and `buildFlaimScoutVerifyPacket`.

The pure adapter rejects absent provenance, hypothetical input, unknown provider and tool combinations, timestamps older than 24 hours, future timestamps, unidentified players, missing real-life clubs, and raw private fields. It deduplicates leads, constructs an official-verification queue, and returns no professional facts or betting authority. Independent official source evidence is stored as a **separate claim requiring human source review**; it cannot turn a Flaim signal into certified pro status.

**Privacy:** Private league IDs, team IDs, owner names, raw league responses, cookies, tokens, credentials or unfiltered rosters must not be written to the public GitHub repository. Fixtures intentionally use a fictional `Sample Player` only. Input notes must be minimized and redacted. An operator's attestation is not equivalent to signed provider proof.

## Tests

```bash
node --test integrations/flaim/scout-verify.test.mjs
```

All tests are offline, free and read-only. Do not execute `get_league_info` or league-specific Flaim reads until a league has been connected.

## Release acceptance

1. User connects a fantasy league in Flaim; verify current session shows at least one real league.
2. Fetch `get_league_info` and relevant narrow read-only records in ChatGPT; never refresh unsolicited.
3. Check one real, non-sensitive player signal against an independent current official NBA/NFL source.
4. Freeze an operator-reviewed minimal packet with verifiable timestamps, provenance and no owner data.
5. Test integration with the original ATLAS Command Center only after its authoritative editable frontend has been recovered. No duplicate dashboard or automatic sync.
