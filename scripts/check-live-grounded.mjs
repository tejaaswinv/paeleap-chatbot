#!/usr/bin/env node
/**
 * Explicit opt-in ONE-CALL smoke test of Miaoqu evidence selection.
 * No Supabase, no visitor content, no dynamic prompt, no raw model output.
 * Skipped by the normal CI suite. May incur provider charges.
 */
import { CHINA_TOURISM_FAQS } from "../data/china-tourism-faq.js";
import { generateGroundedReply } from "../lib/ai/generate.js";
import { aiProtocol } from "../lib/ai/provider.js";
import { hasConfiguredValue, resolveAiApiKey } from "../lib/config.js";
import { aiFailureCode } from "../lib/ai/diagnostics.js";

if (process.argv.slice(2).join(" ") !== "--live") {
  console.error(JSON.stringify({result:"NOT_RUN", reason:"Requires explicit --live flag; this calls the paid external provider once."}));
  process.exitCode = 2;
} else if (![resolveAiApiKey(), process.env.AI_MODEL, process.env.AI_BASE_URL].every(hasConfiguredValue)) {
  console.error(JSON.stringify({result:"NOT_RUN", reason:"Set AI_BASE_URL, exact AI_MODEL and SUB2API_API_KEY in your shell."}));
  process.exitCode = 2;
} else {
  try {
    const answer = await generateGroundedReply({
      message: "What is West Lake and why is it culturally significant?",
      language: "en", history: [], faqs: CHINA_TOURISM_FAQS,
      persona: {id:"tourmate",version:1,name:{en:"TourMate",zh:"旅伴"},tone:"professional"}
    });
    const ok = answer.status === "allowed" && answer.mode === "evidence_composition" &&
      Array.isArray(answer.recordIds) && answer.recordIds.length >= 1 &&
      Array.isArray(answer.sources) && answer.reply.startsWith("TourMate");
    console.log(JSON.stringify({result:ok?"SUCCESS":"INSUFFICIENT_EVIDENCE",protocol:aiProtocol(),
      model:process.env.AI_MODEL,recordCount:answer.recordIds?.length||0,
      note:"One real provider request. No hosted Supabase, authorization, independent relevance grading, or deployment tested."}));
    if (!ok) process.exitCode = 1;
  } catch (error) {
    console.error(JSON.stringify({result:"FAILED",code:aiFailureCode(error)}));
    process.exitCode = 1;
  }
}
