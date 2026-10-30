/** ATLAS FORGE Graphify adapter: summarize locally generated CODE-ONLY graph.
 * No fork code execution, network calls, graph generation or source upload.
 */
import {readFileSync,statSync} from "node:fs";
export const GRAPH_CONTRACT="ATLAS_FORGE_CODE_GRAPH_BRIEF_V1";
const safe=s=>typeof s==="string"?s.replace(/[\u0000-\u001f<>]/g," ").slice(0,160).trim():"";
export function summarizeGraph(graph,{limit=12}={}){
 if(!Number.isInteger(limit)||limit<1||limit>30)throw Error("GRAPH_LIMIT_INVALID");
 if(!graph||typeof graph!=="object"||Array.isArray(graph)||
   !Array.isArray(graph.nodes)||!Array.isArray(graph.links)||
   graph.nodes.length>50000||graph.links.length>200000)throw Error("GRAPH_FORMAT_INVALID");
 const nodes=graph.nodes, links=graph.links;
 const counts=new Map(),seen=new Set(),labels=new Map(),communities=new Set();
 for(const n of nodes){
  if(!n||typeof n.id!=="string"||seen.has(n.id)||n.id.length>220)throw Error("GRAPH_NODE_INVALID");
  seen.add(n.id);counts.set(n.id,0);
  if(Number.isInteger(n.community))communities.add(n.community);
  if(n._origin==="ast"&&n.file_type==="code"&&safe(n.label)&&safe(n.source_file))
   labels.set(n.id,{label:safe(n.label),source_file:safe(n.source_file),
    source_location:safe(n.source_location),provenance:"LOCAL_CODE_AST",community:n.community??null});
 }
 for(const e of links){
  if(!e||typeof e.source!=="string"||typeof e.target!=="string")throw Error("GRAPH_EDGE_INVALID");
  if(counts.has(e.source))counts.set(e.source,counts.get(e.source)+1);
  if(counts.has(e.target))counts.set(e.target,counts.get(e.target)+1);
 }
 const ranked=[...labels].map(([id,item])=>({...item,connections:counts.get(id)||0}))
  .sort((a,b)=>b.connections-a.connections||a.label.localeCompare(b.label)).slice(0,limit);
 return {contract:GRAPH_CONTRACT,
  evidence_level:"LOCAL_AST_REFERENCE_ONLY",
  generated_from_commit:safe(graph.built_at_commit)||null,
  nodes:nodes.length,edges:links.length,communities:communities.size,
  ast_code_nodes:labels.size,top_symbols:ranked,
  source_contents_included:false,
  live_project_read_claimed:false,
  independent_verification:false,
  execution_authority:false};
}
export function readGraphSummary(graphPath,{limit=12}={}){
 if(typeof graphPath!=="string"||graphPath.length===0||graphPath.length>500)throw Error("GRAPH_PATH_INVALID");
 const size=statSync(graphPath).size;
 if(size>6*1024*1024||size<1)throw Error("GRAPH_FILE_SIZE_INVALID");
 return summarizeGraph(JSON.parse(readFileSync(graphPath,"utf8")),{limit});
}
export function graphBriefSection(receipt){
 if(receipt?.contract!==GRAPH_CONTRACT||receipt.execution_authority!==false)throw Error("GRAPH_RECEIPT_INVALID");
 const symbols=receipt.top_symbols.map(n=>"- "+n.label+" ["+n.source_file+(n.source_location?":"+n.source_location:"")+"] ("+n.connections+" links)").join("\n");
 return ["## Local codebase map (Graphify AST only)",
  "Graph receipt: "+receipt.nodes+" nodes / "+receipt.edges+" edges / "+receipt.communities+" communities.",
  "Extracted from commit: "+(receipt.generated_from_commit||"UNKNOWN — check against current branch")+".",
  "No raw source code, private file content, or LLM extraction included.",
  symbols||"No AST symbols available.",
  "This is a local structural map, not proof of test coverage, current deployment, security or model accuracy.",
  "Confirm repository revision and inspect exact source before making a change."].join("\n");
}
