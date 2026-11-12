# ATLAS patch notes — Part 2 native SHADOW math (2026-11-12)

## Scope
New isolated research branch stacked on draft PR #37 (branch review/learning-evidence-gate-2026-11-09).
No existing ORACLE forecasts, learning fixtures, source attestations, opportunity-engine code, database schemas, or production integrations are changed.

## Added
- integrations/learning/part2-shadow-math.mjs: settlement-aware EV and odds normalization; Beta-Binomial posterior, credible intervals, shortfall probability, one-sided EV bound, and expected deficiency; scenario sensitivity; fixed-forecast quote-shopping delta; correlation-aware doubles bounds; non-promoting annotations for existing Opportunity Value Engine results.
- integrations/learning/part2-opportunity-bridge.mjs: optional wrapper that executes PR #37's untouched rankOpportunities first and appends only research diagnostics by case key.
- Three regression test files covering mathematical boundary vectors, malformed inputs, parity with existing stages/blockers/stakes, source/quote holds, forged authority claims, portfolio caps and unknown parlay dependence.
- docs/research/2026-11-12-part2-shadow-math-integration.md: scope, data gates and next prospective steps.

## Local verification (before GitHub staging)
- Reproduced PR #37 opportunity-value-engine.mjs exactly: Git blob d85a49320d91a79247cdb4cc9e558bba33165c32.
- Node 22 local targeted suite: 30 passed, 0 failed.
- Core module and all four adjunct/test Git blobs uploaded with byte-for-byte SHA matching local sources.
- Earlier scientific crosscheck: 100 Beta reference calculations matched SciPy within numerical tolerance; this is numerical testing, not sports skill.

## Risk boundaries
LAB/SHADOW ONLY. Caller-provided source-status and quote-status fields are NOT origin authentication. Posterior math does not authorize real-money bets, source promotion or production use. All existing quote/identity/forecast/portfolio blockers and human Final Gate remain. A historical win-rate posterior is NOT a player-prop forecast.

## Excluded
No PR #37 editing or merge; no change to the original 14 November 11–12 frozen games; no Supabase writes; no deployment; no paid sports feeds; no wagers; no trained ORACLE role model; no proven executable quote source.

## Required follow-up
Obtain independent participation evidence; preregister one exact NBA 6+ assists cohort; freeze both baseline and challenger before tipoff; qualify equivalent venue prices and actual availability; validate all outcomes and selection economics; review new research decisions prospectively. Recheck GitHub Actions CI before any future promotion.
