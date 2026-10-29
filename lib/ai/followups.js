/**
 * Bounded follow-up resolver for TourMate's reviewed China-tourism FAQ bank.
 * This does NOT generate answers, infer venue facts, access live services,
 * trust assistant messages or grant authority to previous user content.
 * It handles only short, exact follow-up intents and a single explicitly
 * named place in recent, safe user turns.
 */
import { classifyInput } from "./safety.js";

const PLACES = Object.freeze([
  {name:"West Lake", zh:"西湖", terms:[/\bwest lake\b/i,/西湖/u]},
  {name:"Grand Canal", zh:"大运河", terms:[/\bgrand canal\b/i,/大运河|大運河/u]},
  {name:"Forbidden City", zh:"故宫", terms:[/\b(?:forbidden city|palace museum)\b/i,/故宫|故宮/u]},
  {name:"Great Wall", zh:"长城", terms:[/\bgreat wall\b/i,/长城|長城/u]},
  {name:"Terracotta Army", zh:"兵马俑", terms:[/\bterracotta (?:army|warriors?)\b/i,/兵马俑|兵馬俑/u]}
]);

// English question strings must exactly match the authored 100-FAQ bank.
// This is intentionally not a loose place-name match for a venue-specific claim.
const REVIEWED = Object.freeze({
  price: "Where can I check current attraction ticket prices?",
  hours: "Where can I check an attraction's opening hours?",
  booking: "Do attractions in China require advance reservations?",
  accessible: "How can I plan wheelchair-accessible sightseeing?"
});

function topicFor(message) {
  if (typeof message !== "string" || message.length > 130) return null;
  const text = message.normalize("NFKC").toLowerCase().trim()
    .replace(/[?.!。？!！\s]+$/gu, "").replace(/\s+/g," ");
  if ([
    /^(?:and |what about )(?:the |its |their )?(?:ticket |entry |admission )?(?:price|cost|fee|prices|fees)$/,
    /^(?:how much (?:is it|does it cost|is entry|are tickets|would it cost)|what(?:'s| is) (?:the |its )?(?:price|ticket price|entry fee)|is it free)$/,
    /^(?:那里|那裡|那边|那邊|它|这里|這裡)?(?:的)?(?:门票|門票|票价|票價|入场费|入場費)?(?:多少钱|多少錢|价格呢|價格呢|贵吗|貴嗎)$/,
    /^(?:那|它的|那里的|那裡的)?(?:门票|門票|票价|票價)(?:是多少钱|是多少錢|呢)$/,
  ].some(r=>r.test(text))) return "price";
  if ([
    /^(?:and |what about )(?:the |its |their )?(?:opening )?hours$/,
    /^(?:what (?:are (?:its|the) opening hours|time does it open)|when (?:does it open|is it open)|is it open (?:today|tomorrow))$/,
    /^(?:那里|那裡|那边|那邊|它|这个地方|這個地方)?(?:几点开门|幾點開門|几点关门|幾點關門|开放时间|開放時間|营业时间|營業時間)(?:呢|是多少)?$/,
    /^(?:它的|那里的|那裡的)?(?:开放时间|開放時間|营业时间|營業時間)(?:呢|是多少)?$/
  ].some(r=>r.test(text))) return "hours";
  if ([
    /^(?:do i (?:need|have) to (?:book|reserve)(?: tickets)?(?: in advance| there)?|can i book tickets(?: there| for it)?|how (?:do|can) i (?:book|reserve)(?: tickets)?(?: there| for it)?|and (?:the )?(?:tickets|booking|reservations))$/,
    /^(?:需要|要)(?:提前)?(?:预约|預約|订票|訂票|买票|買票)(?:吗|嗎|呢)?$/,
    /^(?:怎么|怎麼|如何)(?:预约|預約|订票|訂票|买票|買票)(?:呢)?$/,
    /^(?:那里|那裡|那边|那邊|它)(?:需要|要)?(?:提前)?(?:预约|預約|订票|訂票)(?:吗|嗎|呢)?$/
  ].some(r=>r.test(text))) return "booking";
  if ([
    /^(?:is it (?:wheelchair accessible|accessible by wheelchair)|what about (?:wheelchair )?accessibility|and wheelchair access)$/,
    /^(?:那里|那裡|它|那边|那邊)?(?:有无障碍设施|有無障礙設施|轮椅能进吗|輪椅能進嗎|方便轮椅吗|方便輪椅嗎|无障碍吗|無障礙嗎)$/
  ].some(r=>r.test(text))) return "accessible";
  if ([
    /^(?:how (?:do|can) i get there|how (?:do|can) we get there|how to get there|how can i reach it|and directions)$/,
    /^(?:怎么|怎麼|如何)(?:去那里|去那裡|去那边|去那邊|到那里|到那裡|到那边|到那邊|过去|過去)(?:呢)?$/
  ].some(r=>r.test(text))) return "directions";
  return null;
}

function mentionedPlaces(text) {
  return PLACES.filter(place=>place.terms.some(term=>term.test(text)));
}

function pickReferent(history, language) {
  if (!Array.isArray(history)) return null;
  let followed = 0;
  // Do not silently filter an invalid recent user turn and inherit an older
  // place: malformed/oversized inputs break the context chain.
  const userTurns = history.slice(-12).filter(turn=>turn && turn.role === "user").slice(-4).reverse();
  for (const turn of userTurns) {
    if (typeof turn.content !== "string" || turn.content.length > 1500) return null;
    const text = turn.content.trim();
    // A historic unsafe or off-topic turn cannot establish a reference.
    if (classifyInput(text,language).status !== "allowed") return null;
    const mentions = mentionedPlaces(text);
    if (mentions.length > 1) return null;
    if (mentions.length === 1) return mentions[0];
    // Allow only short, supported follow-up turns between the current
    // question and the last explicit place. No arbitrary-topic inheritance.
    if (!topicFor(text) || ++followed > 2) return null;
  }
  return null;
}

export function resolveTravelFollowup(message, history = [], language = "en") {
  const topic = topicFor(message);
  if (!topic) return null;
  // The ordinary safety classifier is always checked by the chat route first.
  // This guard additionally prevents direct callers from laundering an unsafe
  // phrase through a historical conversation.
  if (classifyInput(message,language).status !== "allowed") return null;
  const place = pickReferent(history,language);
  if (!place) return Object.freeze({
    kind:"clarification",reason:"needs_context",
    reply:language==="zh"
      ? "你指的是哪个具体景点？请告诉我地点名称，我可以提供现有资料中的一般参观建议；实时信息仍需通过景点官方渠道核实。"
      : "Which attraction are you asking about? Please name the place. I can share relevant general guidance from the reviewed travel notes, but live details still need official verification."
  });
  if (topic === "directions") return Object.freeze({
    kind:"clarification",reason:"needs_departure",
    reply:language==="zh"
      ? "你想去"+place.zh+"。请告诉我你的出发地点和交通偏好；我目前无法查询实时路线、票价或行程时间。"
      : "To get to "+place.name+", where are you starting from and how would you like to travel? I can't check live routes, fares or travel times here."
  });
  return Object.freeze({kind:"reviewed_faq",question:REVIEWED[topic],topic,place:place.name});
}
