/**
 * Minimal, safe presentation parser for AI travel responses.
 *
 * The model's text is untrusted. We never convert arbitrary HTML to DOM,
 * generate links, execute markup or change the original saved message.
 * This only provides visual structure for headings, day-by-day plans,
 * bullets, numbered steps and ordinary paragraphs.
 */
const DAY = /^((?:day\s*\d{1,2})|(?:第\s*[一二三四五六七八九十\d]{1,3}\s*天))(?:\s*[:：.\-–—]\s*|\s+)(.*)$/iu;
const MARKDOWN_HEADING = /^#{1,4}\s+(.+)$/u;
const BOLD_HEADING = /^\*\*(.+)\*\*$/u;
const BULLET = /^\s*(?:[-*•]|[◦▪])\s+(.+)$/u;
const NUMBERED = /^\s*(\d{1,2})[.)、]\s+(.+)$/u;

/**
 * @returns {Array<{kind:"paragraph"|"heading"|"day"|"list",text?:string,title?:string,items?:string[],ordered?:boolean}>}
 */
export function formatTravelBlocks(value) {
  const input = typeof value === "string" ? value.replace(/\r\n?/gu,"\n") : "";
  if (!input.trim()) return [];
  const lines = input.split("\n");
  const blocks = [];
  let paragraph = [];
  let list = null;

  function flushParagraph() {
    if (!paragraph.length) return;
    blocks.push({kind:"paragraph",text:paragraph.join("\n").trim()});
    paragraph=[];
  }
  function flushList() {
    if (!list) return;
    blocks.push(list);
    list=null;
  }
  for (const raw of lines) {
    const trimmed=raw.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }
    const clean=trimmed.replace(/^\*\*(.+)\*\*$/u,"$1");
    const day=clean.match(DAY);
    const heading=trimmed.match(MARKDOWN_HEADING);
    const bold=trimmed.match(BOLD_HEADING);
    if(day || heading || bold) {
      flushParagraph();flushList();
      if(day)blocks.push({kind:"day",title:day[1].trim(),text:day[2].trim()});
      else blocks.push({kind:"heading",text:(heading?.[1]||bold?.[1]||"").trim()});
      continue;
    }
    const bullet=trimmed.match(BULLET);
    const numbered=trimmed.match(NUMBERED);
    if(bullet || numbered) {
      flushParagraph();
      const ordered=Boolean(numbered);
      if(list && list.ordered !== ordered)flushList();
      if(!list)list={kind:"list",ordered,items:[]};
      list.items.push((bullet?.[1]||numbered?.[2]||"").trim());
      continue;
    }
    flushList();
    paragraph.push(trimmed);
  }
  flushParagraph();
  flushList();
  return blocks;
}
