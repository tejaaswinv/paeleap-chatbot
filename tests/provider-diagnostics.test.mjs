import test from "node:test";
import assert from "node:assert/strict";
import { aiFailureCode } from "../lib/ai/diagnostics.js";
import { resolveAiApiKey } from "../lib/config.js";
import { generateGroundedReply } from "../lib/ai/generate.js";
import { CHINA_TOURISM_FAQS } from "../data/china-tourism-faq.js";

test("Codex Sub2API variable is preferred over legacy AI_API_KEY", () => {
  assert.equal(resolveAiApiKey({SUB2API_API_KEY:"dedicated-key",AI_API_KEY:"legacy-key"}),"dedicated-key");
  assert.equal(resolveAiApiKey({SUB2API_API_KEY:"replace_me",AI_API_KEY:"legacy-key"}),"legacy-key");
  assert.equal(resolveAiApiKey({AI_API_KEY:"replace_me"}),null);
});
test("diagnostics report safe allowlisted status without reflecting upstream detail", () => {
  for (const code of [400,401,402,403,404,422,429,500,503])
    assert.equal(aiFailureCode(new Error("AI provider returned HTTP "+code)),"UPSTREAM_HTTP_"+code);
  assert.equal(aiFailureCode(new Error("AI provider not configured")),"PROVIDER_CONFIG_MISSING");
  assert.equal(aiFailureCode(Object.assign(new Error(""),{name:"TimeoutError"})),"UPSTREAM_TIMEOUT");
  assert.equal(aiFailureCode(new Error("Empty or invalid AI provider response")),"INVALID_PROVIDER_RESPONSE");
  assert.equal(aiFailureCode(new Error("sk-topsecret user data")),"UPSTREAM_NETWORK_ERROR");
});
test("grounded mode uses SUB2API_API_KEY from Codex config when configured",async()=>{
  let calls=0;
  const result=await generateGroundedReply({
    message:"Tell me about West Lake", language:"en", faqs:CHINA_TOURISM_FAQS,
    env:{SUB2API_API_KEY:"test-dedicated",AI_API_KEY:"test-legacy",AI_BASE_URL:"https://api.miaoquai.com/v1",AI_MODEL:"deepseek-v4-pro"},
    fetchImpl: async (url,init)=>{
      calls++;
      assert.equal(url,"https://api.miaoquai.com/v1/responses");
      assert.equal(init.headers.Authorization,"Bearer test-dedicated");
      return Response.json({status:"completed",output:[{type:"message",role:"assistant",
        content:[{type:"output_text",text:'{"decision":"answer","recordIds":["CN061"]}'}]}]});
    }
  });
  assert.equal(calls,1);
  assert.equal(result.mode,"evidence_composition");
});

test("structured diagnostics distinguish invalid evidence from network errors", () => {
  const cases = [
    ["Invalid evidence plan", "INVALID_EVIDENCE_PLAN"],
    ["Unknown evidence record", "UNKNOWN_EVIDENCE_RECORD"],
    ["Invalid approved evidence", "INVALID_APPROVED_EVIDENCE"],
    ["Invalid published persona", "INVALID_PUBLISHED_PERSONA"],
    ["Unsupported AI_API_STYLE", "PROVIDER_CONFIG_INVALID"],
    ["AI_BASE_URL must end with /v1 or a supported API path", "PROVIDER_CONFIG_INVALID"],
    ["Empty or invalid AI provider response: length", "UPSTREAM_OUTPUT_TRUNCATED"],
    ["Empty or invalid AI provider response: incomplete", "UPSTREAM_RESPONSE_INCOMPLETE"],
    ["Empty or invalid AI provider response: max_output_tokens", "UPSTREAM_OUTPUT_TOKEN_LIMIT"],
    ["Empty or invalid AI provider response: content_filter", "UPSTREAM_CONTENT_FILTER"],
    ["Empty or invalid AI provider response: failed", "UPSTREAM_RESPONSE_FAILED"]
  ];
  for (const [message, expected] of cases) assert.equal(aiFailureCode(new Error(message)), expected);
});
test("transport diagnostics never leak arbitrary cause messages or secrets", () => {
  const kinds = [
    ["ENOTFOUND", "UPSTREAM_DNS_ERROR"],
    ["UND_ERR_CONNECT_TIMEOUT", "UPSTREAM_TIMEOUT"],
    ["ECONNRESET", "UPSTREAM_CONNECTION_RESET"],
    ["ECONNREFUSED", "UPSTREAM_CONNECT_FAILED"],
    ["CERT_HAS_EXPIRED", "UPSTREAM_TLS_ERROR"]
  ];
  for (const [code, expected] of kinds) {
    const error = Object.assign(new Error("secret-key-should-not-show"), {
      cause: Object.assign(new Error("secret-key-should-not-show"), { code })
    });
    const result = aiFailureCode(error);
    assert.equal(result, expected);
    assert.doesNotMatch(result, /secret/);
  }
});
