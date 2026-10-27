-- ATLAS odds archive integrity audit. READ ONLY. No network or provider quota usage.
-- Run in Supabase SQL editor against the existing research database.
-- This verifies archive structure, NOT market executability, outcomes, or forecast edge.
WITH pairs AS (
 SELECT event_id, sportsbook, market_type, market_key,
        COUNT(*) AS sides,
        COUNT(DISTINCT selection) AS selections,
        COUNT(DISTINCT provider_timestamp) AS clocks,
        MIN(line) AS line_min, MAX(line) AS line_max,
        COUNT(*) FILTER (WHERE price IS NULL OR ABS(price) < 100) AS invalid_prices,
        COUNT(*) FILTER (WHERE observation_fingerprint IS NULL) AS missing_fingerprints,
        COUNT(*) FILTER (WHERE execution_grade IS TRUE) AS execution_grade_quotes
 FROM public.market_snapshots
 GROUP BY event_id, sportsbook, market_type, market_key
)
SELECT market_type,
       COUNT(*) AS market_pairs,
       COUNT(*) FILTER (WHERE sides=2 AND selections=2 AND clocks=1) AS structurally_valid,
       COUNT(*) FILTER (WHERE market_type='spread' AND line_min+line_max<>0) AS spread_line_mismatches,
       COUNT(*) FILTER (WHERE market_type='total' AND line_min<>line_max) AS total_line_mismatches,
       SUM(invalid_prices) AS invalid_prices,
       SUM(missing_fingerprints) AS missing_fingerprints,
       SUM(execution_grade_quotes) AS execution_grade_quotes
FROM pairs GROUP BY market_type ORDER BY market_type;
