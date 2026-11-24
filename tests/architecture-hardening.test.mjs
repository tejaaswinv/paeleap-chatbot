import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { readBoundedJson, isAuthenticationRejection } from "../lib/infra/bounded-json.js";
import { authenticate } from "../lib/db/supabase.js";
import { authorizePersonaAdmin } from "../lib/personas/index.js";
import { createTrip, mergeRemoteTrips, fetchRemoteMessages } from "../lib/client/trips.js";

test("shared network reader enforces real UTF-8 byte budgets, not content-length alone", async () => {
  assert.deepEqual(await readBoundedJson(Response.json({ zh: "杭州" })), { zh: "杭州" });
  await assert.rejects(readBoundedJson(new Response('{"x":"abcdef"}'), { maxBytes: 5 }), /exceeded/);
  await assert.rejects(readBoundedJson(new Response("{}", { headers: { "content-length": "999" } }), { maxBytes: 100 }), /exceeded/);
  await assert.rejects(readBoundedJson(new Response(new Uint8Array([0xff]))), /Invalid upstream JSON/);
  await assert.rejects(readBoundedJson(new Response("not-json")), /Invalid upstream JSON/);
  assert.equal(await readBoundedJson(new Response(null, { status: 204 }), { allowEmpty: true }), null);
  await assert.rejects(readBoundedJson(new Response(null)), /Missing/);
});

test("authentication distinguishes session rejection from temporary outages", async t => {
  const old = { ...process.env };
  t.after(() => {
    for (const key of ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SERVICE_ROLE_KEY"]) {
      if (old[key] === undefined) delete process.env[key]; else process.env[key] = old[key];
    }
  });
  Object.assign(process.env, {
    SUPABASE_URL: "https://auth-test.example.com",
    SUPABASE_PUBLISHABLE_KEY: "test-publishable",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role"
  });
  let code = 503;
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    assert.equal(options.redirect, "error");
    return Response.json({}, { status: code });
  });
  assert.equal(isAuthenticationRejection(401), true);
  assert.equal(isAuthenticationRejection(429), false);
  assert.equal(isAuthenticationRejection(503), false);
  await assert.rejects(authenticate("test-session"), /service unavailable/);
  const adminId = "550e8400-e29b-41d4-a716-446655440000";
  const request = new Request("https://tourmate.example.com/api/admin/personas", { headers: { Authorization: "Bearer test-session" } });
  await assert.rejects(authorizePersonaAdmin(request, { ...process.env, PERSONA_ADMIN_USER_IDS: adminId }),
    error => error.status === 503);
  code = 401;
  assert.equal(await authenticate("test-session"), null);
  await assert.rejects(authorizePersonaAdmin(request, { ...process.env, PERSONA_ADMIN_USER_IDS: adminId }),
    error => error.status === 401);
});

test("cloud trip discovery never invalidates a loaded or pending conversation", () => {
  const conversationId = "550e8400-e29b-41d4-a716-446655440000";
  const active = { ...createTrip(), conversationId, pending: true, loaded: true, draft: "next", messages: [{ role: "user", content: "test" }] };
  const [merged] = mergeRemoteTrips([active], [{ id: conversationId, created_at: active.createdAt }]);
  assert.strictEqual(merged, active);
  assert.equal(merged.loaded, true);
  assert.equal(merged.pending, true);
  const unloaded = { ...active, loaded: false, pending: false };
  assert.equal(mergeRemoteTrips([unloaded], [{ id: conversationId }])[0].loaded, false);
});

test("history pagination fails explicitly for duplicate pages or cancellation", async () => {
  let calls = 0;
  const rows = Array.from({ length: 500 }, (_, i) => ({ id: String(i), role: "user", content: "row" }));
  const query = {
    select(){return this}, eq(){return this}, order(){return this}, range(){return this},
    async abortSignal(){calls++; return {data: rows, error: null};}
  };
  const client = { from(){return query;} };
  await assert.rejects(fetchRemoteMessages(client, "test", new AbortController().signal), /repeated history row/);
  assert.equal(calls, 2);
  const aborted = new AbortController(); aborted.abort();
  await assert.rejects(fetchRemoteMessages(client, "test", aborted.signal), error => error.name === "AbortError");
  assert.equal(calls, 2);
});

test("history hook has scoped cancellation, single-flight reads and explicit timeouts", async () => {
  const src = await readFile(new URL("../components/useTripHistory.js", import.meta.url), "utf8");
  assert.match(src, /messageLoads\.current\.has\(trip\.id\)/);
  assert.match(src, /messageLoads\.current\.get\(trip\.id\) !== controller/);
  assert.match(src, /messageLoads\.current\.clear\(\)/);
  assert.match(src, /\}, \[owner, client\]\)/);
  assert.match(src, /controller\.abort\(\), 30000/);
});

test("obsolete attraction-only prototype files and removed explorer styles stay retired", async () => {
  for (const path of ["data/attractions.js", "lib/tourism/retrieval.js", "lib/tourism/itinerary.js"]) {
    await assert.rejects(access(new URL("../" + path, import.meta.url)), { code: "ENOENT" });
  }
  const css = await readFile(new URL("../app/imperial-tourmate.css", import.meta.url), "utf8");
  assert.doesNotMatch(css, /\.china-3d-enter-(?:control|spark)/);
});
