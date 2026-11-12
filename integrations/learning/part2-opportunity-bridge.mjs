/**
 * DROP-IN ATLAS R&D bridge for the existing PR #37 Opportunity Value Engine.
 * Place next to opportunity-value-engine.mjs. Do not modify existing engine.
 * Current execution authority, evidence gates, blocker semantics, market checks
 * and portfolio caps remain entirely in the existing rankOpportunities call.
 */
import {rankOpportunities} from './opportunity-value-engine.mjs';
import {annotateExistingOpportunityResults} from './part2-shadow-math.mjs';
export function rankOpportunitiesWithPart2(packet,part2ResearchByCase={},policy={}){
 const original=rankOpportunities(packet,policy);
 return annotateExistingOpportunityResults(original,part2ResearchByCase);
}
