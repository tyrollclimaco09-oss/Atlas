import test from "node:test";
import assert from "node:assert/strict";
import {loadCatalog,doctor,projects,list,route,plan,brief,main,CONTRACT} from "./workspace-cli.mjs";
const catalog=loadCatalog();
test("all 40 forks and eight profiles pass manifest validation",()=>{
 const h=doctor(catalog);assert.equal(h.ok,true);assert.deepEqual(h.errors,[]);
 assert.equal(h.forks,40);assert.equal(h.profiles,8);
 assert.equal(new Set(catalog.forks.map(x=>x.name)).size,40);
 assert(!catalog.forks.some(x=>["Atlas","Atlas-0.0"].includes(x.name)));
});
test("all source forks have upstream and review status",()=>{
 assert(catalog.forks.every(x=>x.upstream.includes("/")&&x.license&&x.caveat));
});
test("none of 40 forks is automatically connected or executed",()=>{
 assert(catalog.forks.every(x=>x.provider_verified_live===false&&x.automatic_install===false&&x.automatic_execute===false));
 assert.equal(doctor(catalog).live_provider_connections_certified,0);
});
test("four actually executed source-code smokes are labeled separately",()=>{
 assert.deepEqual(catalog.forks.filter(x=>x.status==="CODE_SMOKE").map(x=>x.name).sort(),
  ["nba_api","nflreadpy","shin","sports-skills"].sort());
});
test("all eight project profiles have valid recommendations",()=>{
 assert.equal(projects(catalog).length,8);
 for(const p of projects(catalog))assert(p.recommended.length>0&&p.recommended.every(n=>catalog.forks.some(x=>x.name===n)));
});
test("GPT workspace route selects project and coding aids without autonomous agents",()=>{
 const r=route({project:"gpt-workspace",goal:"Help me continue coding my GPT project, remember context and test",catalog});
 assert.equal(r.contract,CONTRACT);assert(r.tools.length>0);
 assert(r.tools.some(x=>["graphify","superpowers","claude-mem","skills","knowledge-work-plugins"].includes(x.name)));
 assert(r.tools.every(x=>x.status!=="BLOCKED"&&x.status!=="LAB"));
 assert.equal(r.installed_packages,0);assert.equal(r.execution_authority,false);
});
test("sports route includes trustworthy reference candidates",()=>{
 const r=route({project:"atlas-sports",goal:"Run the NBA slate and price markets",catalog});
 assert(r.tools.some(x=>["nba_api","sports-skills","shin"].includes(x.name)));
 assert(r.tools.every(x=>x.authority==="DOCUMENTATION_OR_TEST_PLAN_ONLY"));
});
test("dashboard route selects web QA candidates",()=>{
 const r=route({project:"product",goal:"Test React frontend dashboard website with browser",catalog});
 assert(r.tools.some(x=>["playwright","query","msw","zod"].includes(x.name)));
});
test("data project plan includes four truthful gates",()=>{
 const p=plan({project:"data",goal:"Build a reproducible dataset",catalog});
 assert.deepEqual(p.steps.map(x=>x.name),["DISCOVER","PROVE","CONNECT","OPERATE"]);
 assert.equal(p.steps.at(-1).authority,"APPROVAL_REQUIRED");
 assert.equal(p.production_writes,0);
});
test("security profile keeps quarantined prompt corpus blocked",()=>{
 const r=route({project:"security",goal:"Test our bot against prompt injection",catalog});
 assert(!r.tools.some(x=>x.name==="jailbreaks"));
});
test("explicit lab exploration cannot make blocked forks executable",()=>{
 const r=route({project:"gpt-workspace",goal:"Experiment with model routing agents",includeLab:true,catalog,max:40});
 assert(r.tools.some(x=>x.status==="LAB"));assert(r.tools.every(x=>x.status!=="BLOCKED"));
});
test("filter by risk without installing",()=>{
 const rows=list({status:"BLOCKED",catalog});assert.equal(rows.length,3);
 assert(rows.every(x=>x.live_connected===false&&x.automatic_execute===false));
});
test("profile filtering returns only correctly scoped tools",()=>{
 const rows=list({project:"development",catalog});assert(rows.length>3);
 assert(rows.every(x=>x.projects.includes("development")));
});
test("unknown profiles, statuses and huge goals are rejected",()=>{
 assert.throws(()=>route({project:"unknown",catalog}),/UNKNOWN_PROJECT/);
 assert.throws(()=>list({status:"AUTO_EXECUTE",catalog}),/UNKNOWN_STATUS/);
 assert.throws(()=>route({max:999,catalog}),/INVALID_LIMIT/);
 assert.throws(()=>route({goal:"x".repeat(501),catalog}),/INVALID_GOAL/);
});
test("catalog doctor fails on autoexec or fake production status",()=>{
 const modified=structuredClone(catalog);modified.forks[0].automatic_execute=true;
 assert.equal(doctor(modified).ok,false);assert(doctor(modified).errors.includes("UNSAFE_DEFAULTS"));
 const altered=structuredClone(catalog);altered.forks[2].status="PRODUCTION_READY";
 assert.equal(doctor(altered).ok,false);assert(doctor(altered).errors.includes("INVALID_STATUS"));
});
test("GPT brief describes next proof without promising a connected agent",()=>{
 const content=brief({project:"gpt-workspace",goal:"Work on our app and keep memory",catalog});
 assert(content.includes("ATLAS / GPT Project Launch Brief"));
 assert(content.includes("not a call to GPT"));
 assert(content.includes("not installed")||content.includes("not activated"));
 assert(content.includes("Final Gate"));
});
test("GPT brief escapes HTML and literal backtick shell injection",()=>{
 const q=String.fromCharCode(96);
 const content=brief({project:"development",goal:"<script>override</script> "+q+"rm -rf /"+q,catalog});
 assert(!content.includes("<script>"));assert(!content.includes(q+"rm -rf /"+q));
 assert(!content.includes("sk-proj-"));assert(!content.includes("THE_ODDS_API_KEY"));
});
test("CLI doctor JSON proves no live provider connection",()=>{
 const o=[];const code=main(["doctor","--json"],s=>o.push(s));
 assert.equal(code,0);assert.equal(JSON.parse(o.join("")).ok,true);
 assert.equal(JSON.parse(o.join("")).installed_by_router,0);
});
test("CLI brief works without external tools",()=>{
 const o=[];main(["brief","--project","gpt-workspace","--goal","Resume my project"],s=>o.push(s));
 assert(o[0].includes("Resume my project"));
});
test("invalid CLI options fail rather than perform commands",()=>{
 assert.throws(()=>main(["route","--bogus"],()=>{}),/INVALID_ARGUMENT/);
 assert.throws(()=>main(["remote-run","--json"],()=>{}),/UNKNOWN_COMMAND/);
});
test("every proposed source has a status and false provider-live flag",()=>{
 const r=route({project:"atlas-sports",goal:"Run the slate",max:40,catalog});
 assert(r.tools.every(x=>x.license&&x.source_boundary&&x.status&&x.provider_live===false));
});
test("routes do not fabricate savings or betting authority",()=>{
 const r=route({project:"gpt-workspace",goal:"Make GPT faster",catalog});
 assert.equal(r.evidence_state,"PROPOSED_STACK_NOT_CONNECTED_OR_EXECUTED");
 assert.equal(r.live_provider_calls,0);assert.equal(r.execution_authority,false);
});
