import test from "node:test";
import assert from "node:assert/strict";
import { buildChatBody, parseChatResponse, chatErrorMessage } from "../lib/client/chat.js";

const conversationId = "550e8400-e29b-41d4-a716-446655440000";

test("frontend reuses the backend conversation UUID and language", () => {
  assert.deepEqual(buildChatBody({ message: "  西湖  ", conversationId, language: "zh" }), {
    message: "西湖", conversationId, language: "zh"
  });
  assert.equal(buildChatBody({ message: "Hello", language: "en" }).conversationId, null);
});

test("frontend handles every documented safety outcome and removes unsafe sources", () => {
  for (const status of ["allowed", "blocked", "emergency", "redirected", "sanitized"]) {
    const result = parseChatResponse({ reply: "A travel response", conversationId,
      safety: { status }, sources: [
        { name: "UNESCO", url: "https://whc.unesco.org/en/list/1334" },
        { name: "Unsafe", url: "javascript:alert(1)" },
        { name: "Invalid", url: ":bad" }
      ] });
    assert.equal(result.safety, status);
    assert.equal(result.sources.length, status === "allowed" ? 1 : 0);
  }
});

test("invalid server contracts cannot poison the next chat request", () => {
  const payload = { reply: "Hello", conversationId, sources: [], safety: { status: "allowed" } };
  assert.throws(() => parseChatResponse({ ...payload, conversationId: "not-a-uuid" }));
  assert.throws(() => parseChatResponse({ ...payload, reply: " " }));
  assert.throws(() => parseChatResponse({ ...payload, safety: { status: "unknown" } }));
});

test("documented HTTP errors have usable English and Chinese messages", () => {
  for (const status of [400, 401, 404, 413, 429, 502, 503, 504]) {
    assert.ok(chatErrorMessage(status, "en").length > 10);
    assert.match(chatErrorMessage(status, "zh"), /[\u3400-\u9fff]/);
  }
});

test("Trust Passport is optional, strictly validated and never claims live verification", () => {
  const sources=[{name:"UNESCO",url:"https://whc.unesco.org/en/list/1334"}];
  const trust={ schemaVersion:1,basis:"curated_knowledge",referenceCount:1,
    knowledgeVersion:2,liveChecked:false,linksChecked:false,limitedByProvider:false };
  const payload={reply:"Curated travel answer",conversationId,sources,safety:{status:"allowed"},trust};
  assert.deepEqual(parseChatResponse(payload).trust,trust);
  assert.equal(parseChatResponse({...payload,trust:{...trust,liveChecked:true}}).trust,undefined);
  assert.equal(parseChatResponse({...payload,trust:{...trust,referenceCount:2}}).trust,undefined);
  assert.equal(parseChatResponse({...payload,trust:{...trust,basis:"safety_notice"}}).trust,undefined);
  assert.equal(parseChatResponse({...payload,trust:{...trust,knowledgeVersion:"v2"}}).trust,undefined);
  assert.equal(parseChatResponse({...payload,trust:{...trust,extraPrompt:"secrets"}}).trust.extraPrompt,undefined);
  assert.equal(parseChatResponse({...payload,trust:undefined}).trust,undefined);
  assert.equal(parseChatResponse({...payload,safety:{status:"blocked"},trust}).trust,undefined);
});

test("unanswered in-scope travel questions do not show an out-of-scope reason",()=>{
  const base={reply:"Current guide material does not answer this",conversationId,sources:[],safety:{status:"redirected"}};
  assert.equal(parseChatResponse({...base,safety:{status:"redirected",reason:"unanswered"}}).safetyReason,"unanswered");
  assert.equal(parseChatResponse({...base,safety:{status:"redirected",reason:"out_of_scope"}}).safetyReason,"out_of_scope");
  assert.equal(parseChatResponse({...base,safety:{status:"redirected",reason:"provider_unavailable"}}).safetyReason,"provider_unavailable");
  assert.equal(parseChatResponse({...base,safety:{status:"redirected",reason:"spoof"}}).safetyReason,undefined);
  assert.equal(parseChatResponse({...base,safety:{status:"blocked",reason:"unanswered"}}).safetyReason,undefined);
});
