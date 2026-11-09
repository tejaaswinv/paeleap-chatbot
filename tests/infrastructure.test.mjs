import test from "node:test";
import assert from "node:assert/strict";
import { createSingleFlightCache } from "../lib/infra/single-flight-cache.js";
import { createChatTrace } from "../lib/infra/chat-telemetry.js";
import { getFaqBank } from "../lib/db/faq.js";
import { CHINA_TOURISM_FAQS } from "../data/china-tourism-faq.js";
import { POST } from "../app/api/chat/route.js";

test("coalesces simultaneous reads, hits fresh cache, expires and reloads", async () => {
  let now = 1000;
  let calls = 0;
  const cache = createSingleFlightCache({ ttlMs: 100, now: () => now });
  const load = async () => { calls++; await Promise.resolve(); return ["reviewed", calls]; };
  const [a,b,c] = await Promise.all([
    cache.get("public-faq", load),cache.get("public-faq", load),cache.get("public-faq", load)
  ]);
  assert.equal(calls, 1);
  assert.strictEqual(a,b);
  assert.strictEqual(b,c);
  assert.strictEqual(await cache.get("public-faq", load), a);
  now+=101;
  assert.deepEqual(await cache.get("public-faq", load), ["reviewed", 2]);
  assert.equal(calls,2);
});

test("never caches database failures, never serves stale values after expiry", async () => {
  let now=100;
  const cache=createSingleFlightCache({ttlMs:10,now:()=>now});
  assert.equal(await cache.get("a",async()=>3),3);
  now=111;
  await assert.rejects(cache.get("a",async()=>{throw new Error("unavailable")}),/unavailable/);
  assert.equal(await cache.get("a",async()=>5),5);
  cache.clear();
  assert.equal(await cache.get("a",async()=>8),8);
});

test("old in-flight loads cannot repopulate a cache after it is cleared", async () => {
  let release;
  const cache=createSingleFlightCache({ttlMs:100});
  const old=cache.get("faq",()=>new Promise(resolve=>{release=resolve}));
  await Promise.resolve();
  cache.clear();
  assert.equal(await cache.get("faq",async()=>9),9);
  release(2);
  assert.equal(await old,2);
  assert.equal(await cache.get("faq",async()=>7),9);
});

test("rejects invalid TTL and keys to keep cache memory usage bounded", async () => {
  assert.throws(()=>createSingleFlightCache({ttlMs:Infinity}),/Invalid cache TTL/);
  assert.throws(()=>createSingleFlightCache({ttlMs:1000000}),/Invalid cache TTL/);
  const cache=createSingleFlightCache();
  await assert.rejects(cache.get("",async()=>1),/Invalid cache request/);
  await assert.rejects(cache.get("key",null),/Invalid cache request/);
});

test("production Supabase FAQ reads are coalesced and reused, preserving all 100 records", async t => {
  const original = Object.fromEntries(["NODE_ENV","FAQ_BANK_SOURCE","SUPABASE_URL","SUPABASE_SERVICE_ROLE_KEY"]
    .map(key=>[key,process.env[key]]));
  t.after(()=>{
    for(const [key,value] of Object.entries(original)){
      if(value===undefined)delete process.env[key];else process.env[key]=value;
    }
  });
  process.env.NODE_ENV="production";
  process.env.FAQ_BANK_SOURCE="supabase";
  process.env.SUPABASE_URL="https://faq-cache-test.example.test";
  process.env.SUPABASE_SERVICE_ROLE_KEY="fake-test-secret";
  let calls=0;
  t.mock.method(globalThis,"fetch",async (address,options)=>{
    calls++;
    assert.equal(new URL(address).pathname,"/rest/v1/tourism_faq");
    assert.equal(new Headers(options.headers).get("apikey"),"fake-test-secret");
    return Response.json(CHINA_TOURISM_FAQS);
  });
  const [one,two]=await Promise.all([getFaqBank(),getFaqBank()]);
  assert.equal(calls,1);
  assert.strictEqual(one,two);
  assert.equal(one.length,100);
  assert.equal((await getFaqBank())[0].id,"CN001");
  assert.equal(calls,1);
});

test("trace IDs are server-generated, carry request duration, and never log arbitrary input", () => {
  let time=150;
  const events=[];
  const logger={
    warn:(message,attributes)=>events.push({message,attributes}),
    error:(message,attributes)=>events.push({message,attributes})
  };
  const trace=createChatTrace({now:()=>time,uuid:()=> "00000000-0000-4000-8000-000000000001",logger});
  time=184;
  assert.deepEqual(trace.headers(),{
    "X-Request-ID":"00000000-0000-4000-8000-000000000001",
    "Server-Timing":"chat;dur=34"
  });
  trace.degraded("tourism_generation","UPSTREAM_HTTP_503");
  trace.degraded("secret user message", "bearer token sk-secret-value");
  trace.failed("query with password");
  const output=JSON.stringify(events);
  assert.equal(events.length,3);
  assert.match(output,/UPSTREAM_HTTP_503/);
  assert.match(output,/UPSTREAM_UNKNOWN/);
  assert.doesNotMatch(output,/sk-secret-value|bearer token|secret user message|password/);
  assert.deepEqual(events[2].attributes.kind,"internal");
});

test("chat API returns trace header on both valid and invalid requests, without leaking credentials", async () => {
  const invalid=await POST(new Request("http://localhost:3000/api/chat",{
    method:"POST",headers:{"Content-Type":"application/json","X-Request-ID":"attacker-controlled"},
    body:JSON.stringify({message:"",language:"en"})
  }));
  assert.equal(invalid.status,400);
  assert.match(invalid.headers.get("X-Request-ID"),/^[a-f0-9-]{36}$/i);
  assert.notEqual(invalid.headers.get("X-Request-ID"),"attacker-controlled");
  assert.match(invalid.headers.get("Server-Timing"),/^chat;dur=\d+$/);
  assert.equal(invalid.headers.get("Cache-Control"),"no-store");
  assert.equal(invalid.headers.get("X-Content-Type-Options"),"nosniff");

  const missingAuth=await POST(new Request("http://localhost:3000/api/chat",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({message:"Tell me about West Lake",language:"en"})
  }));
  assert.equal(missingAuth.status,401);
  assert.match(missingAuth.headers.get("X-Request-ID"),/^[a-f0-9-]{36}$/i);
  assert.notEqual(missingAuth.headers.get("X-Request-ID"),invalid.headers.get("X-Request-ID"));
});
