import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { GET } from "../app/api/admin/safety/route.js";
import { buildSafetyLabSnapshot, getSafetyLabSnapshot } from "../lib/safety-lab/snapshot.js";

const ADMIN = "550e8400-e29b-41d4-a716-446655440000";
const OTHER = "550e8400-e29b-41d4-a716-446655440001";
const ENV = ["NODE_ENV", "SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SERVICE_ROLE_KEY", "PERSONA_ADMIN_USER_IDS", "GITHUB_ACTIONS_READ_TOKEN"];
function config(t, admin = ADMIN) {
  const before = Object.fromEntries(ENV.map((key) => [key, process.env[key]]));
  Object.assign(process.env, {
    NODE_ENV: "test", SUPABASE_URL: "https://safety-lab.invalid",
    SUPABASE_PUBLISHABLE_KEY: "public-fixture", SUPABASE_SERVICE_ROLE_KEY: "server-fixture",
    PERSONA_ADMIN_USER_IDS: admin, GITHUB_ACTIONS_READ_TOKEN: ""
  });
  t.after(() => { for (const [key, value] of Object.entries(before)) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  } });
}
const req = (token = "fixture-token", origin) =>
  new Request("https://museum.example.org/api/admin/safety", {
    headers: { ...(token ? { Authorization: "Bearer " + token } : {}), ...(origin ? { Origin: origin } : {}) }
  });
function mockIdentity(t, id = ADMIN) {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    assert.equal(new URL(url).hostname, "safety-lab.invalid");
    assert.equal(new URL(url).pathname, "/auth/v1/user");
    return Response.json({ id });
  });
  return calls;
}

test("snapshot publishes aggregate historical metrics, never prompts or credentials", () => {
  const record = getSafetyLabSnapshot();
  assert.equal(record.kind, "historical_offline_regression_snapshot");
  assert.equal(record.date, "2026-10-23");
  assert.equal(record.cases, 500);
  assert.equal(record.distinctScenarios, 479);
  assert.equal(record.replayExecutions, 2500);
  assert.equal(record.runs.length, 5);
  assert.ok(record.runs.every((mode) => mode.strictPassed + mode.strictFailed === 500));
  assert.ok(record.runs.every((mode) => mode.actualModelCalls === 0));
  assert.equal(record.independentHoldout, false);
  assert.equal(record.releaseApproved, false);
  const raw = JSON.stringify(record);
  assert.doesNotMatch(raw, /prompt|history|provider_texts|password|secret_key|private_canary/i);
  assert.doesNotMatch(raw, /SYNTHETIC_REMEDIATION_VISITOR_TOKEN/);
  assert.equal(Object.hasOwn(record, "github_publication"), false);
});

test("malformed or missing report modes fail closed", () => {
  const source = { runs: [{ mode: "faq-offline", total: 500, strict_passed: 500, strict_failed: 0 }] };
  assert.throws(() => buildSafetyLabSnapshot(source), /incomplete/);
  assert.throws(() => buildSafetyLabSnapshot({ ...source, runs: [
    ...Array.from({ length: 4 }, () => ({ ...source.runs[0] })),
    { mode: "evidence-valid-id", total: 500, strict_passed: 400, strict_failed: 0 }
  ] }), /incomplete/);
});

test("unauthenticated requests cannot read Safety Lab reports", async (t) => {
  config(t); const calls = mockIdentity(t);
  const response = await GET(req(null));
  assert.equal(response.status, 401);
  assert.equal(calls.length, 0);
  assert.doesNotMatch(JSON.stringify(await response.json()), /2500|500|2026-10-23/);
});

test("only verified admin IDs can read the snapshot", async (t) => {
  config(t);
  const calls = mockIdentity(t, OTHER);
  const response = await GET(req());
  assert.equal(response.status, 403);
  assert.equal(calls.length, 1);
  assert.doesNotMatch(JSON.stringify(await response.json()), /2500|2026-10-23/);
});

test("cross-origin safety evidence access is denied before authentication", async (t) => {
  config(t);
  const calls = mockIdentity(t);
  const response = await GET(req("fixture-token", "https://attacker.invalid"));
  assert.equal(response.status, 403);
  assert.equal(calls.length, 0);
});

test("admin-read endpoint returns no-store, sanitized, historical-only summary", async (t) => {
  config(t);
  const calls = mockIdentity(t);
  const response = await GET(req());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(calls.length, 1);
  const body = await response.json();
  assert.equal(body.snapshot.cases, 500);
  assert.equal(body.ci.state, "not_configured");
  assert.equal(body.snapshot.actualModelCalls, 0);
  assert.equal(body.snapshot.liveDeploymentTested, false);
  assert.equal(body.snapshot.releaseApproved, false);
  assert.equal(Object.hasOwn(body, "executions"), false);
});

test("administrator allowlist is fail closed when unset", async (t) => {
  config(t, "");
  const calls = mockIdentity(t);
  const response = await GET(req());
  assert.equal(response.status, 503);
  assert.equal(calls.length, 0);
});

test("safety lab navigation and privacy labels are present", async () => {
  const component = await readFile(new URL("../components/SafetyLab.jsx", import.meta.url), "utf8");
  assert.match(component, /historical_offline_regression_snapshot/);
  assert.match(component, /api\/admin\/safety/);
  assert.match(component, /independent holdout/i);
  assert.doesNotMatch(component, /dangerouslySetInnerHTML/);
});

test("authenticated admin receives current CI metadata only after verifying identity",async(t)=>{
  config(t);
  process.env.GITHUB_ACTIONS_READ_TOKEN="fixture-token-for-read";
  const calls=[];
  t.mock.method(globalThis,"fetch",async(url,opts)=>{
    calls.push(url);
    if(new URL(url).hostname==="safety-lab.invalid") return Response.json({id:ADMIN});
    assert.equal(new URL(url).hostname,"api.github.com");
    assert.equal(opts.headers.Authorization,"Bearer fixture-token-for-read");
    return Response.json({workflow_runs:[{
      id:999,head_branch:"main",event:"push",head_sha:"f".repeat(40),
      status:"completed",conclusion:"success",
      created_at:"2026-10-27T12:00:00Z",updated_at:"2026-10-27T12:02:00Z"
    }]});
  });
  const response=await GET(req());
  assert.equal(response.status,200);
  const result=await response.json();
  assert.equal(result.ci.state,"available");
  assert.equal(result.ci.latest.conclusion,"success");
  assert.equal(result.ci.metricsFromLatestArtifact,false);
  assert.equal(calls.length,2);
});
test("unauthorized visitors cannot trigger GitHub Actions metadata fetch",async(t)=>{
  config(t);
  process.env.GITHUB_ACTIONS_READ_TOKEN="fixture-token-for-read";
  const calls=mockIdentity(t,OTHER);
  const response=await GET(req());
  assert.equal(response.status,403);
  assert.equal(calls.length,1);
});
