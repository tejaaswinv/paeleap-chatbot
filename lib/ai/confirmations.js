/**
 * Safe handling of brief conversational confirmations.
 * Never interpret prior assistant/user text as new instructions or generate
 * unsupported facts. A reviewed FAQ may be selected only from a tightly
 * scoped, explicit assistant offer; ambiguous confirmations request detail.
 */
import { classifyInput } from "./safety.js";

const AFFIRMATIVE = /^(?:yes|yeah|yep|yup|sure|okay|ok|please do|yes please|yeah please|yeah pls do|yes pls do|go ahead|sounds good|当然|好的|可以|是的|请讲|好呀)[.!。！\s]*$/iu;

export function resolveConfirmation(message, history = [], language = "en") {
  if (typeof message !== "string" || message.length > 60 ||
      !AFFIRMATIVE.test(message.trim()) ||
      classifyInput(message, language).status !== "allowed" ||
      !Array.isArray(history)) return null;
  const previous = history.at(-1);
  // Only a recent server-stored assistant response can be an offer.
  if (!previous || previous.role !== "assistant" ||
      typeof previous.content !== "string" || previous.content.length > 6000) return null;
  const content = previous.content.trim();
  if (!content) return null;
  const lastQuestion = content.slice(-350);
  // Only explicit offers; don't resolve based on random mention of passport
  // in a long travel plan, and don't grant authority to preceding prose.
  const offered = /(?:would you like|shall i|want me to|can i (?:also )?(?:explain|share|show)|要我|需要我).{0,140}(?:\?|？)/iu.test(lastQuestion);
  if (offered && /\bpassport (?:validity|requirements|expiry)\b|护照有效期/u.test(lastQuestion) &&
      !/\b(?:visa|hotel|train|attraction)\b/iu.test(lastQuestion)) {
    return { kind: "reviewed_faq", question: "What passport validity should I check before traveling?" };
  }
  return {
    kind: "clarification",
    reason: "needs_followup_detail",
    reply: language === "zh"
      ? "当然可以。你想让我详细解释哪一部分？例如护照与入境准备、交通安排或景点预约。告诉我具体主题，我会根据已核实的资料回答。"
      : "Of course. Which part would you like me to expand on—passport and entry preparation, transport, or attraction reservations? Tell me the topic and I'll use the verified travel information."
  };
}
