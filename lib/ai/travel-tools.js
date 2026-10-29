/**
 * Opt-in China-tourism utilities. Exact commands only.
 * Normal input guardrails, authentication and quotas must run first.
 * Never fetch URLs, make bookings, infer unstated preferences or call AI.
 */
import { classifyInput } from "./safety.js";

const COMMANDS=Object.freeze([
  ["trip_brief","Show my TourMate trip brief","查看我的旅途摘要"],
  ["arrival_checklist","Show my China arrival checklist","查看中国入境准备清单"],
  ["vegetarian_card","Show my vegetarian restaurant phrase card","查看素食点餐沟通卡"],
  ["reference_directory","Show TourMate official reference links","查看旅伴官方参考链接"],
  ["heritage_choice","Show West Lake vs Grand Canal choice card","查看西湖与大运河对比卡"]
]);
export const TRAVEL_TOOL_IDS=Object.freeze(COMMANDS.map(x=>x[0]));
export function matchTravelTool(message){
  if(typeof message!=="string" || message.length>110)return null;
  const key=message.normalize("NFKC").trim().replace(/[?？!！.。\s]+$/gu,"").toLowerCase();
  return COMMANDS.find(x=>x[1].toLowerCase()===key || x[2]===key)?.[0]||null;
}

const PLACES=Object.freeze([
  ["West Lake","西湖",/\bwest lake\b|西湖/iu],
  ["Grand Canal","大运河",/\bgrand canal\b|大运河|大運河/iu],
  ["Forbidden City","故宫",/\b(?:forbidden city|palace museum)\b|故宫|故宮/iu],
  ["Great Wall","长城",/\bgreat wall\b|长城|長城/iu],
  ["Terracotta Army","兵马俑",/\bterracotta (?:army|warriors?)\b|兵马俑|兵馬俑/iu],
  ["Hangzhou","杭州",/\bhangzhou\b|杭州/iu],
  ["Shanghai","上海",/\bshanghai\b|上海/iu],
  ["Beijing","北京",/\bbeijing\b|北京/iu],
  ["Chengdu","成都",/\bchengdu\b|成都/iu],
  ["Suzhou","苏州",/\bsuzhou\b|苏州|蘇州/iu],
  ["Nanjing","南京",/\bnanjing\b|南京/iu],
  ["Guilin","桂林",/\bguilin\b|桂林/iu],
  ["Xi'an","西安",/\bxi['’]?an\b|西安/iu]
]);
const PREFERENCES=Object.freeze([
  ["vegetarian","素食",/\b(?:i am|i'm|we are|we're) vegetarian\b|(?:我|我们|我們)吃素|我是素食者/iu],
  ["budget-conscious","注重预算",/\b(?:on a budget|low-budget trip|budget trip|travel cheaply)\b|预算有限|預算有限|穷游|窮遊/iu],
  ["relaxed pace","轻松节奏",/\b(?:prefer a relaxed|want a relaxed|slow pace|easy pace)\b|想轻松|想輕鬆|慢节奏|慢節奏/iu],
  ["packed schedule","紧凑行程",/\b(?:packed itinerary|fast-paced itinerary|fully packed trip)\b|行程紧凑|行程緊湊/iu],
  ["avoid hiking","尽量不徒步",/\b(?:don't like hiking|do not like hiking|avoid hiking|no hiking)\b|不想爬山|不喜欢徒步|不喜歡徒步/iu]
]);
function tripBrief(history,language){
  const zh=language==="zh";
  const turns=(Array.isArray(history)?history:[]).slice(-12)
    .filter(x=>x && x.role==="user" && typeof x.content==="string" &&
      x.content.length<=1500 && classifyInput(x.content,language).status==="allowed")
    .slice(-6).map(x=>x.content);
  // Capture only explicit public place names and self-described preferences.
  // Do not echo any raw visitor message or assistant-authored content.
  const places=PLACES.filter(x=>turns.some(t=>x[2].test(t))).slice(0,5);
  const prefs=PREFERENCES.filter(x=>turns.some(t=>x[2].test(t) &&
    !(x[0]==="vegetarian" && /not vegetarian|不是素食|不吃素/iu.test(t)))).slice(0,4);
  const none=zh?"尚未提到":"Not specified yet";
  const placeText=places.length?places.map(x=>x[zh?1:0]).join(zh?"、":", "):none;
  const prefText=prefs.length?prefs.map(x=>x[zh?1:0]).join(zh?"、":", "):none;
  return {status:"allowed",mode:"trip_brief",sources:[],
    reply:zh?
      "本次对话的旅途摘要（仅整理近期聊天内容）：\n目的地："+placeText+"\n明确提到的偏好："+prefText+"\n下一步：请告诉我出行日期、出发地及优先活动，以便继续规划。此摘要不包含预订、实时价格、开放时间或长期记忆。":
      "Your trip brief (recent messages in this conversation only):\nPlaces mentioned: "+placeText+"\nExplicit preferences: "+prefText+"\nNext: share your dates, starting point and priorities. This brief is not a booking, live-price check, opening-hours check or long-term memory."};
}
const QUESTIONS={
  arrival:["How should I prepare for my first trip to China?","Do I need a visa to visit China?","What should I do after landing in China?"],
  heritage:["How does the Grand Canal compare with West Lake?","How can I plan a relaxed day in Hangzhou?"]
};
const KNOWN_URLS=new Set([
  "https://en.nia.gov.cn/",
  "https://english.www.gov.cn/news/202404/11/content_WS6617c858c6d0868f4e8e5f4d.html",
  "https://www.12306.cn/en/",
  "https://whc.unesco.org/en/list/1334/",
  "https://whc.unesco.org/en/list/1443/",
  "https://whc.unesco.org/en/list/438/"
]);
function reviewed(bank,questions) {
  if(!Array.isArray(bank))return [];
  const results=questions.map(q=>bank.find(x=>x?.question_en===q && typeof x.answer_en==="string" && typeof x.answer_zh==="string"));
  return results.every(Boolean)?results:[];
}
function sourcesFrom(rows){
  const map=new Map();
  for(const row of rows)for(const src of row.sources||[]){
    if(typeof src?.url!=="string" || typeof src.name!=="string" || !KNOWN_URLS.has(src.url) || map.has(src.url))continue;
    map.set(src.url,{url:src.url,name:src.name});
  }
  return [...map.values()].slice(0,6);
}
function faqCard(rows,language,heading,mode){
  if(!rows.length)return null;
  const key=language==="zh"?"answer_zh":"answer_en";
  const reply=heading+"\n\n"+rows.map((row,i)=>(i+1)+". "+row[key]).join("\n\n")+
    (language==="zh"?"\n\n以上为通用资料，不代表实时预约、签证资格、开放时间或票价。":
      "\n\nGeneral guidance only; no live reservations, entry eligibility, opening hours or ticket prices were checked.");
  return reply.length<=5800?{status:"allowed",mode,reply,sources:sourcesFrom(rows)}:null;
}
const FOOD={
  en:[
    "Vegetarian dining card · show these Chinese phrases to restaurant staff:",
    "我吃素，不吃肉、鱼或海鲜。 — I eat vegetarian food; no meat, fish or seafood.",
    "请问这道菜里有肉汤、鱼露或猪油吗？ — Does this dish contain meat broth, fish sauce or lard?",
    "请帮我确认食材，谢谢。 — Please help me confirm the ingredients. Thank you.",
    "This is a communication aid, not an allergy guarantee. Ask staff to confirm ingredients and shared cooking methods."
  ].join("\n"),
  zh:[
    "素食点餐沟通卡 · 可向餐厅工作人员展示：",
    "我吃素，不吃肉、鱼或海鲜。",
    "请问这道菜里有肉汤、鱼露或猪油吗？",
    "请帮我确认食材，谢谢。",
    "本卡仅帮助沟通，不保证食物不含过敏原。请向店员确认食材和烹饪方式。"
  ].join("\n")
};
export function runTravelTool(id,{history=[],language="en",faqs=[]}={}){
  const zh=language==="zh";
  if(id==="trip_brief")return tripBrief(history,language);
  if(id==="vegetarian_card")return {status:"allowed",mode:"travel_phrasebook",reply:FOOD[zh?"zh":"en"],sources:[]};
  if(id==="arrival_checklist")return faqCard(reviewed(faqs,QUESTIONS.arrival),language,
    zh?"出发与入境准备清单（基于现有旅行问答）：":"Arrival readiness checklist (from reviewed travel FAQ):","arrival_checklist");
  if(id==="heritage_choice")return faqCard(reviewed(faqs,QUESTIONS.heritage),language,
    zh?"西湖与大运河参观选择卡：":"West Lake vs Grand Canal · heritage choice card:","heritage_choice");
  if(id==="reference_directory"){
    const refs=sourcesFrom(faqs);
    if(!refs.length)return null;
    return {status:"allowed",mode:"reference_directory",sources:refs,
      reply:zh?"TourMate 已收录的参考入口：\n"+refs.map((s,i)=>(i+1)+". "+s.name).join("\n")+
        "\n请使用下方参考链接自行查阅最新信息。链接由知识库提供，本次未实时打开或验证页面内容。":
        "Reference directory from TourMate's reviewed travel bank:\n"+refs.map((s,i)=>(i+1)+". "+s.name).join("\n")+
        "\nOpen the reference links below for current information. They were not opened or live-verified during this request."};
  }
  return null;
}
