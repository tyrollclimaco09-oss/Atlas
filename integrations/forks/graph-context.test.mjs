import test from "node:test";
import assert from "node:assert/strict";
import {fileURLToPath} from "node:url";
import {readFileSync} from "node:fs";
import {summarizeGraph,readGraphSummary,graphBriefSection,GRAPH_CONTRACT} from "./graph-context.mjs";
import {brief,main} from "./workspace-cli.mjs";
const path=fileURLToPath(new URL("./fixtures/graphify-synthetic.json",import.meta.url));
const graph=JSON.parse(readFileSync(path,"utf8"));
test("summarize a local AST graph into a compact source pointer list",()=>{
 const x=summarizeGraph(graph);
 assert.equal(x.contract,GRAPH_CONTRACT);assert.equal(x.nodes,3);assert.equal(x.edges,2);
 assert.equal(x.communities,2);assert.equal(x.ast_code_nodes,2);
 assert(x.top_symbols.some(x=>x.label==="route()"));
 assert.equal(x.source_contents_included,false);assert.equal(x.execution_authority,false);
});
test("external/non-AST nodes cannot enter the copied GPT context",()=>{
 const text=graphBriefSection(summarizeGraph(graph));
 assert(text.includes("workspace-cli.mjs"));
 assert(!text.includes("secret.txt"));
 assert(!text.includes("dummy_external"));
});
test("pre-existing Graphify commit is labeled, not treated as current",()=>{
 const x=summarizeGraph(graph);assert.equal(x.generated_from_commit,"SYNTHETIC_TEST_REVISION");
 assert(graphBriefSection(x).includes("Extracted from commit"));
});
test("local graph path parsing never calls the provider or executes graphify",()=>{
 const x=readGraphSummary(path);
 assert.equal(x.nodes,3);assert.equal(x.edges,2);
 assert.equal(x.independent_verification,false);
});
test("named GPT workspace brief can include real local graph references",()=>{
 const x=brief({project:"development",workspace:"ATLAS Fork Lab",goal:"Map function call relationships",graph:path});
 assert(x.includes("Workspace: ATLAS Fork Lab"));assert(x.includes("Local codebase map"));
 assert(x.includes("route()"));assert(x.includes("not a call to GPT"));
});
test("the CLI also accepts --graph and emits the small summary",()=>{
 const res=[];main(["brief","--project","development","--workspace","ATLAS","--goal","Explain the router","--graph",path],x=>res.push(x));
 assert(res[0].includes("3 nodes / 2 edges"));
});
test("invalid graph file structures fail rather than invent dependencies",()=>{
 assert.throws(()=>summarizeGraph({nodes:[],links:[{}]}),/GRAPH_EDGE_INVALID/);
 assert.throws(()=>summarizeGraph({nodes:[{id:"dup"},{id:"dup"}],links:[]}),/GRAPH_NODE_INVALID/);
 assert.throws(()=>summarizeGraph({nodes:[],links:[]},{limit:31}),/GRAPH_LIMIT_INVALID/);
 assert.throws(()=>readGraphSummary(""),/GRAPH_PATH_INVALID/);
});
test("graph adapter only copies safe whitelisted fields, never raw node contents",()=>{
 const x=structuredClone(graph);x.nodes[0].raw_source="PRIVATE_CODE_CONTENT";
 const text=graphBriefSection(summarizeGraph(x));
 assert(!text.includes("PRIVATE_CODE_CONTENT"));
});
test("forged or authoritative graph receipt is refused",()=>{
 const x=summarizeGraph(graph);x.execution_authority=true;
 assert.throws(()=>graphBriefSection(x),/GRAPH_RECEIPT_INVALID/);
});
