/**
 * Minimal social-turn support. Only EXACT short standalone phrases are handled
 * here. This is deliberately NOT a semantic override of the tourism scope:
 * mixed tourist questions or appended hostile instructions must continue
 * through the normal safety and evidence pipeline.
 */
export function socialReply(message, language = "en", persona = null) {
  if (typeof message !== "string" || message.length > 75) return null;
  const normalized = message.normalize("NFKC").trim().toLowerCase()
    .replace(/[!?.。，！？~～]+/gu, "")
    .replace(/\s+/g, " ").trim();
  const enGreeting = /^(?:h+i+|h+e+y+|h+e+l+o+|hiya+|howdy|yo+|good (?:morning|afternoon|evening))(?: (?:there|bud+y+|buddy+|friend|bro+|tourmate))?$/u;
  const zhGreeting = /^(?:你好+|您好+|嗨+|哈喽+|哈囉+|早上好|下午好|晚上好)$/u;
  const enThanks = /^(?:thanks+|thank you(?: very much)?|thx+|ty)(?: (?:buddy+|friend|tourmate))?$/u;
  const zhThanks = /^(?:谢谢+|謝謝+|多谢|多謝|感谢你|感謝你)$/u;
  const enGoodbye = /^(?:bye+|goodbye+|see you(?: later)?|take care)$/u;
  const zhGoodbye = /^(?:再见|再見|拜拜|下次见|下次見)$/u;
  const enHelp = /^(?:help|what can you do|what can i ask(?: you)?|how can you help(?: me)?)$/u;
  const zhHelp = /^(?:你能做什么|你能做什麼|可以帮我什么|可以幫我什麼|怎么使用|怎麼使用)$/u;
  const isZh = language === "zh";
  const name = persona?.name?.[isZh ? "zh" : "en"] || (isZh ? "旅伴" : "TourMate");
  if (enGreeting.test(normalized) || zhGreeting.test(normalized)) {
    // Administrator-approved custom personas keep their published greeting.
    const published = persona?.greeting?.[isZh ? "zh" : "en"];
    return { kind:"greeting", reply: persona?.id !== "tourmate" && published
      ? published
      : isZh
        ? "嗨！我是旅伴，很高兴认识你！你想探索中国的哪个地方，还是需要交通、支付或美食方面的建议？"
        : "Hey there! I'm TourMate, your companion for exploring China. Planning a trip, looking for somewhere to visit, or need help getting around?" };
  }
  if (enThanks.test(normalized) || zhThanks.test(normalized)) return {
    kind:"thanks",
    reply: isZh ? `不客气！有关于中国旅行或场馆参观的问题，随时可以问${name}。`
      : `You're welcome! ${name} is here whenever you need help with travel or visits in China.`
  };
  if (enGoodbye.test(normalized) || zhGoodbye.test(normalized)) return {
    kind:"farewell",
    reply: isZh ? "再见！祝你在中国旅途愉快、平安顺利。" : "See you! Wishing you a wonderful and safe time exploring China."
  };
  if (enHelp.test(normalized) || zhHelp.test(normalized)) return {
    kind:"help",
    reply: persona?.id !== "tourmate"
      ? (isZh ? `你可以向${name}了解该场馆已发布的展览、文化和参观指引。`
        : `Ask ${name} about the venue's published exhibitions, cultural background, and visitor guidance.`)
      : isZh ? "我能帮助你了解中国的景点、交通、支付、饮食和文化活动。告诉我你的目的地或旅行需求吧！"
        : "I can help with attractions, transport, payments, food, and cultural experiences across China. Tell me where you're going or what you need!"
  };
  return null;
}
