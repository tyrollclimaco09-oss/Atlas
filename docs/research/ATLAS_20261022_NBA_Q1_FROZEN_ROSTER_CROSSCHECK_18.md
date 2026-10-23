# ATLAS NBA / Checkpoint 18 — corroborate the frozen selected players without rewriting the forecast

**Time:** 2026-10-22 local Central · **Research lane:** NBA only · **Authority:** SHADOW

The original [Q1-only → Q4 prediction](../prospective/ATLAS_NBA_DENOKC_Q1_Q4_SHADOW_FREEZE_20261022_V1.json) was recorded during the **second quarter** at 9:42:35 PM Central, predicted **23 combined Q4 FGA** for the same four frozen NBA IDs, and remains unchanged. [Full Pass 17 audit](ATLAS_20261022_NBA_FIRST_PREQ4_PROSPECTIVE_SHADOW_17.md).

## Later same-provider player-identity check

[GitHub Actions run 39892113527](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39892113527) queried the live **NBA CDN box-score** for exact game `0022600007`, asserted DEN/OKC game/team identity, and matched each frozen player ID to exactly one rostered identity in the *same NBA data provider*. All four matched:

| Original frozen NBA player ID | NBA name | Team | Immutable frozen Q1 FGA | Live box FGA at later read |
| --- | --- | --- | ---: | ---: |
| `203999` | Nikola Jokić | Denver | 8 | 12 |
| `1627750` | Jamal Murray | Denver | 6 | 9 |
| `1631114` | Jalen Williams | Oklahoma City | 5 | 7 |
| `1628392` | Isaiah Hartenstein | Oklahoma City | 4 | 5 |

Source observation `2026-10-23T02:54:29.678Z`, live NBA box raw response SHA-256 `c2898cc305173460f6ef4710728873befb131b9d935f474678bdac696882fe50`. Frozen original archive SHA-256 `17b0e41790953c386669316b13956681c2c64cac3d8da747541a0114bab4702c` was rechecked.

**Meaning:** all four fixed IDs map to the correct player and team in NBA's own box-score feed and cumulative attempts are not below their earlier Q1 source counts. **Limitations:** NBA PBP and NBA box share a provider and therefore this is *not* an independent second-provider cross-validation. The read was after the original forecast, so it cannot retroactively make NBA roster identities known or verified at the freeze time. Neither minutes played, Q4 results, official final settlement, model accuracy, price nor EV is established.

## Remaining gates

- Official game final `gameStatus=3` must be observed before attempting to score the unchanged 23-attempt reference. The prepared and offline-tested final-only settlement rejects later Q1 source revisions, missing final markers and incorrect player/teams.
- The separate *complete Q3* live freeze remains **unachieved**. Q1-only actual pre-outcome forecast cannot be presented as the original 57-game V3 model, a validated live Q3 player prop, or market value.
- Main, live Supabase schema, betting execution, paid odds source, and autonomous workflow control remain unchanged.
