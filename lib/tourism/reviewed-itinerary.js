/**
 * Reviewed Beijing trip outline, not a general-purpose route/booking engine.
 * Only an explicit Hangzhou -> Beijing duration request is supported.
 * All suggestions are authored and linked to official reference pages;
 * the app does not query live transport, ticketing, opening hours or prices.
 */
import { classifyInput } from "../ai/safety.js";

const SOURCES = Object.freeze([
  { name: "China Railway 12306 — official tickets", url: "https://www.12306.cn/en/" },
  { name: "Beijing municipal tourism — major attractions", url: "https://english.beijing.gov.cn/travellinginbeijing/mustvisitsites/" },
  { name: "Palace Museum — official visitor guidance", url: "https://intl.dpm.org.cn/visit" },
  { name: "Beijing municipal tourism — Temple of Heaven", url: "https://english.beijing.gov.cn/specials/parktours/guidevisitors/templeofheaven/" },
  { name: "Beijing municipal tourism — Summer Palace", url: "https://english.beijing.gov.cn/specials/parktours/guidevisitors/summerpalace/" },
  { name: "Beijing municipal tourism — attraction ticketing", url: "https://english.beijing.gov.cn/specials/ticketing/" }
]);

const DAYS = Object.freeze({
  en: [
    "Travel from Hangzhou to Beijing using a train or flight that fits your dates. Check in, then explore the Qianmen area if your arrival allows. If you arrive early, consider the Temple of Heaven instead of rushing to a late-entry attraction.",
    "Explore the Palace Museum (Forbidden City) using an advance official reservation, then consider Jingshan Park nearby for city views. Leave the evening flexible for local food or the Wangfujing area.",
    "Set aside most of the day for the Badaling section of the Great Wall. Arrange the journey from Beijing in advance and confirm tickets, transport and weather. Return to Beijing in the evening; do not assume a short city transfer.",
    "Visit the Summer Palace around Kunming Lake and the historic gardens. Return to Hangzhou only if your booked train or flight leaves adequate time; otherwise shorten this stop or move it to an earlier day.",
    "If you have a fifth day, visit the Temple of Heaven and spend any remaining time around Beijing's central historic neighborhoods. Allow a generous buffer for the journey back to Hangzhou."
  ],
  zh: [
    "从杭州乘坐适合出行日期的火车或飞机前往北京，办理入住。到达时间允许的话，傍晚可以逛前门一带；若抵达较早，也可考虑天坛，不要赶在景点停止入园前匆忙参观。",
    "提前通过官方渠道预约故宫博物院，参观故宫后可前往附近的景山公园欣赏城市景观。傍晚可自由安排当地美食或王府井附近活动。",
    "把大部分时间留给八达岭长城。提前核实从北京市区往返的交通、门票与天气，晚上返回北京；不要把长城当成市区内的短距离换乘。",
    "游览颐和园、昆明湖和皇家园林。只有在返程车次或航班留有充足时间时才安排这一天的参观，否则缩短行程或提前参观。",
    "如果有第五天，可游览天坛，并在返程前逛北京中轴线周边的历史街区。前往车站或机场应预留充足时间。"
  ]
});

function daysFor(count) {
  if (count === 2) return [0, 1];
  if (count === 3) return [0, 1, 2];
  if (count === 4) return [0, 1, 2, 3];
  return [0, 1, 2, 3, 4];
}

/**
 * Unsupported routes and durations return null for the normal existing
 * provider/FAQ path. Never infer unstated booking dates, budgets or people.
 */
export function reviewedBeijingItinerary(message, language = "en") {
  if (typeof message !== "string" || message.length > 300 ||
      classifyInput(message, language).status !== "allowed") return null;
  const text = message.normalize("NFKC").trim().toLowerCase();
  if (!/\bbeijing\b|北京/u.test(text) || !/\bhangzhou\b|杭州/u.test(text) ||
      !/\b(?:trip|itinerary|travel plan|plan a|plan my|schedule|route)\b|行程|攻略|规划|規劃|安排/u.test(text)) return null;
  const route = /\bfrom\s+hangzhou\b[\s\S]{0,100}\bbeijing\b|\bhangzhou\b[\s\S]{0,30}(?:to|→|->)[\s\S]{0,30}\bbeijing\b|杭州[\s\S]{0,40}(?:到|去|前往|→)[\s\S]{0,30}北京/u;
  if (!route.test(text) ||
      /\bbeijing\b[\s\S]{0,25}(?:to|→|->)\s*hangzhou\b|北京[\s\S]{0,15}(?:到|去|前往|→)[\s\S]{0,15}杭州/u.test(text)) return null;
  const duration = /([2-5])\s*(?:days?|d|天|日)\s*(?:and\s*|&\s*|\/\s*|[-,]\s*)?([1-4])\s*(?:nights?|n|晚|夜)/u.exec(text);
  if (!duration) return null;
  const dayCount = Number(duration[1]);
  if (Number(duration[2]) !== dayCount - 1) return null;
  const zh = language === "zh";
  const opening = zh
    ? "杭州 → 北京 · " + dayCount + "天" + (dayCount - 1) + "晚示例行程"
    : "Hangzhou → Beijing · " + dayCount + " days / " + (dayCount - 1) + " nights (sample itinerary)";
  const rows = daysFor(dayCount).map((index, n) => {
    // Two- and three-day trips require a return leg on their final day,
    // so explicitly flag the constrained schedule.
    let detail = DAYS[zh ? "zh" : "en"][index];
    if (n === dayCount - 1 && dayCount < 4) {
      detail += zh
        ? " 如当天返程时间较早，请缩短或取消该日景点，不要冒险赶车。"
        : " If you are returning that day, skip or shorten sightseeing to protect your departure buffer.";
    }
    return (zh ? "第" + (n + 1) + "天： " : "Day " + (n + 1) + ": ") + detail;
  });
  const note = zh
    ? "这是基于已收录官方景点资料的示例安排，不代表已查询实时车次、航班、票价或开放情况。故宫通常需提前购票，且通常周一不开放；请在官方渠道按日期核实。出发日期、预算和进出京时间尚未提供，具体路线与游览顺序需要据此调整。"
    : "This is a sample, not a live-checked or booked itinerary. No train/flight schedules, prices, availability or current opening times were checked. The Palace Museum generally requires advance booking and usually closes Mondays; check its official site for your date. The exact order depends on your dates, budget and arrival/departure times.";
  const reply = [opening, ...rows, note].join("\n\n");
  if (reply.length > 5800) return null;
  return { status: "allowed", mode: "reviewed_itinerary", reply, sources: SOURCES.map(source => ({...source})) };
}
