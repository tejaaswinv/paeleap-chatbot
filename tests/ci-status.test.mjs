import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { getCurrentCiStatus, parseWorkflowRuns } from "../lib/safety-lab/ci-status.js";

const sha1="a".repeat(40),sha2="b".repeat(40);
const run=(id,sha,status,conclusion,created="2026-10-27T08:15:00Z")=>({
  id,head_branch:"main",event:"push",head_sha:sha,status,conclusion,created_at:created,updated_at:created,
  // Deliberately attacker-supplied redirect; the app must construct canonical URLs.
  html_url:"https://attacker.invalid/phish", token:"CANARY_TOKEN"
});
const good={workflow_runs:[
  run(101,sha1,"in_progress",null,"2026-10-27T09:15:00Z"),
  run(100,sha2,"completed","success","2026-10-27T08:15:00Z")
]};
const response=(data,code=200)=>Response.json(data,{status:code});
test("workflow parsing distinguishes latest running from last completed and sanitizes source",()=>{
  const result=parseWorkflowRuns(good,sha1);
  assert.equal(result.state,"available");
  assert.equal(result.latest.status,"in_progress");
  assert.equal(result.latest.conclusion,null);
  assert.equal(result.lastCompleted.conclusion,"success");
  assert.equal(result.matchesDeployment,true);
  assert.equal(result.includesLiveModelTest,false);
  assert.equal(result.metricsFromLatestArtifact,false);
  assert.equal(result.latest.url,"https://github.com/tejaaswinv/paeleap-chatbot/actions/runs/101");
  assert.doesNotMatch(JSON.stringify(result),/attacker|CANARY_TOKEN/);
});
test("running CI is never described as passing just because earlier run passed",()=>{
  const v=parseWorkflowRuns(good,sha2);
  assert.equal(v.latest.conclusion,null);
  assert.equal(v.matchesDeployment,false);
});
test("untrusted statuses, branches and malformed records cannot become CI evidence",()=>{
  const data={workflow_runs:[
    run(901,sha1,"completed","success","2026-10-27T12:00:00Z"),
    {...run(902,sha1,"completed","success"),head_branch:"feature"},
    {...run(903,sha1,"completed","success"),event:"pull_request"},
    {...run(904,sha1,"completed","success"),status:"evil"},
    {...run(905,sha1,"completed","success"),head_sha:"../config"},
    {...run(906,sha1,"completed","success"),id:-1}
  ]};
  assert.equal(parseWorkflowRuns(data).latest.id,901);
  assert.throws(()=>parseWorkflowRuns({workflow_runs:new Array(11).fill({})}),/Invalid workflow metadata/);
  assert.throws(()=>parseWorkflowRuns({workflow_runs:{}}),/Invalid workflow metadata/);
});
test("missing token never makes a GitHub network call",async()=>{
  let calls=0;
  const result=await getCurrentCiStatus({token:"",fetchImpl:()=>{calls++;throw Error("network");}});
  assert.equal(result.state,"not_configured");
  assert.equal(calls,0);
});
test("private GitHub read token sent server-side only to pinned official workflow URL",async()=>{
  const result=await getCurrentCiStatus({token:"fixture-token-for-ci",deploymentSha:sha2,
    fetchImpl:async(url,init)=>{
      assert.match(url,/^https:\/\/api\.github\.com\/repos\/tejaaswinv\/paeleap-chatbot\/actions\/workflows\/backend-check\.yml\/runs\?/);
      assert.equal(init.headers.Authorization,"Bearer fixture-token-for-ci");
      assert.equal(init.cache,"no-store");
      assert.equal(init.redirect,"error");
      return response(good);
    }});
  assert.equal(result.state,"available");
  assert.equal(result.deployedSha,sha2);
  assert.equal(result.latest.sha,sha1);
});
test("GitHub auth errors, HTML bodies and oversized metadata are unavailable (not success)",async()=>{
  for (const fetchImpl of [
    async()=>response({message:"Bad credentials"},401),
    async()=>new Response("<html>bad</html>",{status:200}),
    async()=>new Response("x".repeat(70000),{status:200})
  ]){
    const status=await getCurrentCiStatus({token:"fixture-token-for-ci",fetchImpl});
    assert.equal(status.state,"unavailable");
    assert.doesNotMatch(JSON.stringify(status),/Bad credentials|<html>/);
  }
});
test("smoke test needs an explicit opt-in; normal CI does not invoke paid inference",async()=>{
  const s=await readFile(new URL("../scripts/check-live-grounded.mjs",import.meta.url),"utf8");
  const flow=await readFile(new URL("../.github/workflows/backend-check.yml",import.meta.url),"utf8");
  assert.match(s,/--live/);
  assert.match(s,/generateGroundedReply/);
  assert.doesNotMatch(flow,/ai:check:grounded/);
});
