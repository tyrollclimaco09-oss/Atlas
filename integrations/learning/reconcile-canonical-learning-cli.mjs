#!/usr/bin/env node
/**
 * Offline ATLAS canonical learning reconciliation runner.
 * Expects one JSON object on STDIN containing authorized READ-ONLY extracts.
 * Does not connect to Supabase/any provider and does not write to the ledger.
 */
import { readFileSync } from 'node:fs';
import {reconcileCanonicalLearning} from './canonical-learning-adapter.mjs';
import {evaluateExperimentEvidence} from './experiment-evidence-gate.mjs';
import {diagnoseRecordedResultResearch} from './recorded-result-research.mjs';

try {
  const raw=readFileSync(0, 'utf8');
  if (raw.length > 8_000_000) throw Error('CANONICAL_EXPORT_TOO_LARGE');
  const input=JSON.parse(raw);
  const reconciled=reconcileCanonicalLearning(input);
  const evaluation=reconciled.packet
    ? evaluateExperimentEvidence(reconciled.packet,
        {minCases:input?.policy?.minCases ?? 120,minDays:input?.policy?.minDays ?? 21})
    : null;
  const summary={
    mode:'READ_ONLY_SHADOW_EVALUATION',
    adapter_disposition:reconciled.disposition,
    experiment_key:reconciled.experiment_key,
    counts:reconciled.counts,
    recorded_outcome_audit:reconciled.recorded_outcome_audit,
    recorded_result_research_diagnostics:diagnoseRecordedResultResearch(input,reconciled.recorded_outcome_audit),
    blockers:reconciled.blockers,
    case_audit:reconciled.case_audit,
    evidence_gate_disposition:evaluation?.disposition || 'NOT_EVALUATED',
    evidence_gate_blockers:evaluation?.blockers || [],
    forecast_disposition:evaluation?.forecast_disposition || 'NOT_EVALUATED',
    pricing_disposition:evaluation?.pricing_disposition || 'NOT_EVALUATED',
    forecast_blockers:evaluation?.forecast_blockers || reconciled.blockers,
    pricing_blockers:evaluation?.pricing_blockers || reconciled.pricing_blockers || [],
    forecast_metrics:evaluation?.forecast || null,
    pricing_metrics:evaluation?.pricing || null,
    production_authority:false,
    real_betting_authority:false,
    model_weights_changed:false,
    virtual_bankroll_affected:false,
    assertion:'No qualified result or profit claim exists until independently authenticated data are supplied and separately validated.'
  };
  process.stdout.write(JSON.stringify(summary,null,2)+'\n');
} catch(e){
  const code=e instanceof SyntaxError?'CANONICAL_EXPORT_JSON_INVALID':
    /^[A-Z_]+$/.test(e.message)?e.message:'CANONICAL_RECONCILE_FAILED';
  process.stderr.write('ATLAS_READ_ONLY_RECONCILE_ERROR: '+code+'\n');
  process.exitCode=2;
}
