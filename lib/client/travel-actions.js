/**
 * Visitor-driven follow-up prompts. These are requests sent to the AI, never
 * pre-generated travel responses. Previous conversation context remains
 * server-owned and is not copied into a browser-authored prompt.
 */
const ACTIONS = Object.freeze({
  en: [
    { id: "budget", label: "Make it cheaper", prompt: "Make my latest China itinerary more budget-friendly. Keep the same destination, duration and confirmed dates, and suggest practical public transport and nearby stops." },
    { id: "adventure", label: "More adventure", prompt: "Make my latest China itinerary more adventurous and culturally immersive, while keeping its destinations, duration and confirmed constraints." },
    { id: "relaxed", label: "Slow it down", prompt: "Make my latest China itinerary more relaxed, with fewer transfers and more rest, keeping the same destinations, dates and duration." },
    { id: "vegetarian", label: "Vegetarian-friendly", prompt: "Make my latest China itinerary vegetarian-friendly, with practical meal ideas and helpful Chinese ordering phrases." },
    { id: "packing", label: "Packing checklist", prompt: "Create a tailored packing checklist for our latest China trip, including travel documents, connectivity and activity-specific essentials." },
    { id: "transport", label: "Transport checklist", prompt: "Create a practical transport checklist for our latest China trip, including what to verify before booking trains and local transport." }
  ],
  zh: [
    { id: "budget", label: "更省预算", prompt: "请把我们最近的中国行程改得更省预算，保留已确认的目的地、天数、日期和偏好，优先选择方便的公共交通及邻近景点。" },
    { id: "adventure", label: "增加体验", prompt: "请让我们最近的中国行程更有特色和冒险体验，同时保留已确认的目的地、天数和出行限制。" },
    { id: "relaxed", label: "轻松一点", prompt: "请把最近的中国行程安排得更轻松，减少长距离奔波、增加休息，同时保持原本的目的地、日期和天数。" },
    { id: "vegetarian", label: "素食友好", prompt: "请为最近的中国行程补充素食友好的用餐建议和实用中文点餐用语。" },
    { id: "packing", label: "打包清单", prompt: "请根据最近的中国行程准备一份行李与证件清单，包含通信和活动所需用品。" },
    { id: "transport", label: "交通清单", prompt: "请根据最近的中国行程制作跨城和市内交通检查清单，列出预订前需要向官方渠道核实的信息。" }
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
