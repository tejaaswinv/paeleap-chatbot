/**
 * Visitor-driven follow-up prompts. These are requests sent to the AI, never
 * pre-generated travel responses. Previous conversation context remains
 * server-owned and is not copied into a browser-authored prompt.
 */
const ACTIONS = Object.freeze({
  en: [
    { id: "budget", label: "Make it cheaper", prompt: "Refine your most recent China trip plan to be more budget-friendly. Keep the same destination, duration, confirmed dates and preferences. Group nearby stops and favor practical public transport; do not invent current prices." },
    { id: "adventure", label: "More adventure", prompt: "Refine your most recent China itinerary to include more memorable, active cultural and adventurous experiences, while preserving the destinations, length and travel constraints. Suggest feasible options without inventing availability or guarantees." },
    { id: "relaxed", label: "Slow it down", prompt: "Make your most recent China itinerary more relaxed. Keep the confirmed destinations and trip length, reduce excessive transfers, and build in rest breaks." },
    { id: "vegetarian", label: "Vegetarian-friendly", prompt: "Update your most recent China travel plan with practical vegetarian meal ideas near the activities, and include helpful Chinese phrases. Explain that dishes and ingredients must be confirmed with restaurant staff." },
    { id: "packing", label: "Packing checklist", prompt: "Based on our current China travel plan, create a clear packing checklist with travel documents, connectivity, useful essentials and itinerary-specific items. Do not assume live weather or entry eligibility." },
    { id: "transport", label: "Transport checklist", prompt: "Based on the China trip we're planning, make a practical intercity and local transport checklist. Explain which official channels and booking details to verify, without making up schedules, tickets or prices." }
  ],
  zh: [
    { id: "budget", label: "更省预算", prompt: "请根据我们最近的中国旅行计划，由你重新设计更省钱的行程，保持已确认的目的地、天数、日期与偏好；尽量安排相邻景点和公共交通，不要编造实时价格。" },
    { id: "adventure", label: "增加体验", prompt: "请根据我们最近的中国旅行计划，由你生成更有特色、体验感更强的行程，同时保持已确认的目的地、天数与限制，不要编造实时开放和预约情况。" },
    { id: "relaxed", label: "轻松一点", prompt: "请把我们最近的中国旅行计划改得更轻松一些，保持已确认目的地与天数，减少跨区域奔波并加入休息时间。" },
    { id: "vegetarian", label: "素食友好", prompt: "请在我们最近的中国旅行行程里加入合理的素食用餐建议和中文点餐用语，并提醒我们向店员确认食材与汤底。" },
    { id: "packing", label: "打包清单", prompt: "请根据我们目前的中国旅行计划，生成针对行程的行李打包与证件检查清单，不要假设实时天气或入境资格。" },
    { id: "transport", label: "交通清单", prompt: "请根据我们目前规划的中国行程，生成跨城及市内交通预订检查清单，注明要核实的官方渠道与信息，不要编造实时车次、价格或余票。" }
  ]
});

/** Only present refinements after a successful, genuinely model-authored turn. */
export function travelRefinementActions(messages, language = "en") {
  if (!Array.isArray(messages)) return [];
  const latest = [...messages].reverse().find(item => item?.role === "assistant");
  if (!latest || latest.ai?.mode !== "ai_generated" || latest.safety !== "allowed") return [];
  return ACTIONS[language === "zh" ? "zh" : "en"].map(action => ({...action}));
}

export function downloadableTravelPlan(messages) {
  if (!Array.isArray(messages)) return null;
  const latest = [...messages].reverse().find(item => item?.role === "assistant");
  if (latest?.ai?.mode !== "ai_generated" || latest.safety !== "allowed" ||
      typeof latest.content !== "string" || latest.content.length > 5800 ||
      !/(?:\bday\s*[1-9]\b|\b\d+\s*(?:days?|nights?)\b|(?:第[一二三四五六七八九十\d]+天)|行程|itinerary)/iu.test(latest.content)) return null;
  return latest;
}

/** Plain text only: local download, no new server call or PDF dependency. */
export function formatTravelPlanDownload(message, language = "en") {
  if (!message || typeof message.content !== "string" ||
      message.content.length < 12 || message.content.length > 5800) return null;
  const header = language === "zh"
    ? "TourMate · AI 旅行计划\nAI 生成建议；未实时核实票价、开放时间、车次、预约与天气。\n\n"
    : "TourMate · AI travel plan\nAI-generated suggestions. Prices, opening hours, trains, reservations and weather have NOT been checked live.\n\n";
  return header + message.content.trim() + "\n";
}
