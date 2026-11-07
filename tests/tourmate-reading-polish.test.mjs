import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {formatTravelBlocks} from "../lib/client/message-format.js";

const source=(name)=>readFile(new URL("../"+name,import.meta.url),"utf8");

test("a real-style English trip answer becomes clear day, list and paragraph blocks",()=>{
  const answer=[
    "## Four days in Beijing",
    "A relaxed introduction to the city.",
    "",
    "**Day 1: Arrival & Qianmen**",
    "- Check into your hotel",
    "- Explore Qianmen and nearby hutongs",
    "",
    "Day 2 — Forbidden City",
    "Reserve tickets through the official channel.",
    "",
    "Day 3",
    "Visit the Great Wall, leaving transfer buffers.",
    "",
    "Day 4: Gardens and departure",
    "Confirm transport before departure."
  ].join("\n");
  const blocks=formatTravelBlocks(answer);
  assert.equal(blocks[0].kind,"heading");
  assert.equal(blocks[0].text,"Four days in Beijing");
  assert.deepEqual(blocks.filter(b=>b.kind==="day").map(b=>b.title),["Day 1","Day 2","Day 3","Day 4"]);
  assert.deepEqual(blocks.find(b=>b.kind==="list").items,["Check into your hotel","Explore Qianmen and nearby hutongs"]);
  assert.ok(blocks.some(b=>b.kind==="paragraph"&&b.text.includes("Reserve tickets")));
  assert.equal(blocks.at(-1).text,"Confirm transport before departure.");
});

test("Chinese itineraries and numbered steps are rendered without losing text",()=>{
  const message="### 杭州三天行程\n\n第1天：西湖漫步\n- 游览断桥与苏堤\n- 享受湖边慢生活\n\n第2天\n1. 参观茶园\n2. 与工作人员确认开放时间\n\n第3天 - 返程\n注意：请核实实际票价。";
  const blocks=formatTravelBlocks(message);
  assert.equal(blocks.filter(b=>b.kind==="day").length,3);
  assert.equal(blocks.find(b=>b.kind==="heading").text,"杭州三天行程");
  assert.deepEqual(blocks.filter(b=>b.kind==="list").map(b=>b.ordered),[false,true]);
  assert.ok(blocks.some(b=>b.kind==="paragraph"&&b.text.includes("请核实")));
});

test("ordinary and multiline answers remain readable without inventing headings",()=>{
  const single=formatTravelBlocks("West Lake is in Hangzhou.");
  assert.deepEqual(single,[{kind:"paragraph",text:"West Lake is in Hangzhou."}]);
  const multiline=formatTravelBlocks("Line one.\nLine two.");
  assert.equal(multiline.length,1);
  assert.equal(multiline[0].text,"Line one.\nLine two.");
  assert.deepEqual(formatTravelBlocks("  "),[]);
  assert.deepEqual(formatTravelBlocks(null),[]);
});

test("malicious markup remains literal user-facing text; never becomes executable HTML",async()=>{
  const input="<img src=x onerror=alert(1)>\n<script>steal()</script>";
  const blocks=formatTravelBlocks(input);
  assert.deepEqual(blocks,[{kind:"paragraph",text:input}]);
  const ui=await source("components/TravelMessage.jsx");
  assert.doesNotMatch(ui,/dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/);
  assert.match(ui,/formatTravelBlocks\(content\)/);
  assert.match(ui,/<InlineEmphasis text=\{block\.text\}/);
  assert.match(ui,/<section className="travel-day"/);
  assert.match(ui,/<Tag className="travel-list"/);
});

test("travel replies use structured formatting; user messages stay unchanged",async()=>{
  const shell=await source("components/ChatShell.jsx");
  assert.match(shell,/import TravelMessage from "\.\/TravelMessage\.jsx";/);
  assert.match(shell,/assistant \? <TravelMessage content=\{message\.content\}\/> : <p>\{message\.content\}<\/p>/);
  assert.match(shell,/onClick=\{\(\) => onCopy\(message\)\}/);
});

test("conversation auto-scroll respects readers browsing earlier messages",async()=>{
  const shell=await source("components/ChatShell.jsx");
  assert.match(shell,/pinnedToBottomRef/);
  assert.match(shell,/onScroll=\{onConversationScroll\}/);
  assert.match(shell,/scrollHeight - container\.scrollTop - container\.clientHeight < 130/);
  assert.match(shell,/if \(!pinnedToBottomRef\.current\) return undefined/);
  assert.match(shell,/className="jump-to-latest" onClick=\{jumpToLatest\}/);
  assert.match(shell,/prefers-reduced-motion: reduce/);
  assert.doesNotMatch(shell,/endRef\.current\?\.scrollIntoView\(/);
});

test("compact tools are optional and PDF is accessible outside refinements",async()=>{
  const shell=await source("components/ChatShell.jsx");
  const quick=await shell.indexOf('id="tourmate-quick-tools"');
  const pdf=await shell.indexOf('className="chat-save-pdf"');
  assert.ok(quick>0 && pdf>0 && pdf<quick);
  assert.match(shell,/className="chat-tools-toggle" aria-expanded=\{toolsExpanded\}/);
  assert.match(shell,/toolsExpanded && \(/);
  assert.match(shell,/disabled=\{pending\} aria-label=\{language === "zh" \? "下载完整行程 PDF"/);
  assert.match(shell,/onClick=\{downloadTravelPlan\}/);
  assert.match(shell,/onClick=\{downloadItineraryPdf\}/);
  assert.match(shell,/createItineraryPdf/);
});

test("premium red/gold polish is responsive, preserves Chinese typography and reduces motion",async()=>{
  const layout=await source("app/layout.jsx");
  const css=await source("app/tourmate-polish.css");
  assert.ok(layout.includes('import "./tourmate-polish.css";'));
  assert.ok(layout.indexOf('import "./tourmate-polish.css";')>layout.indexOf('import "./imperial-tourmate.css";'));
  for (const selector of [".travel-answer",".travel-day",".travel-subheading",".travel-list",
    ".chat-utility-toolbar",".chat-save-pdf",".jump-to-latest",".composer-area"]){
    assert.ok(css.includes(selector),selector);
  }
  assert.match(css,/@media \(max-width:720px\)/);
  assert.match(css,/@media \(prefers-reduced-motion:reduce\)/);
  assert.match(css,/font:700 14px\/1\.35 "Songti SC"/);
  assert.doesNotMatch(css,/@import|url\(https?:\/\/|@font-face|image-set\(/i);
});
