/**
 * A privacy-preserving, browser-only PDF exporter for TourMate itineraries.
 * It compiles a full AI-authored itinerary and later AI refinements in the
 * current trip, without re-querying a model or inventing trip content.
 *
 * PDF pages are rasterized from a branded canvas so Latin and Chinese glyphs
 * render using the visitor's installed browser fonts. No backend upload,
 * new npm dependency, external assets, or hidden network requests.
 */
const PLAN_DAY = /^\s*(?:#{1,4}\s*)?(?:\*{0,2})\s*(?:day\s*(\d{1,2})|第\s*([一二三四五六七八九十\d]{1,3})\s*天)\s*(?:[:：.\-–—]\s*|\*{0,2}\s*)(.*)$/iu;
const ITINERARY_HINT = /\b(?:itinerary|day\s*1|travel plan|trip plan|\d+\s*days?\s*\d*\s*nights?)\b|行程|第\s*[一二三四五六七八九十\d]+\s*天|旅遊計劃|旅行计划/iu;
const REFINEMENT_HINT = /\b(?:refine|revise|adjust|budget|cheaper|relax|food|vegetarian|transport|packing|checklist|change|add|remove|replace|day\s*\d|schedule|itinerary|plan)\b|调整|調整|清单|清單|预算|預算|素食|交通|行程|修改|增加|减少|減少|打包/iu;
const DAY_NUMBER = { 一:1, 二:2, 三:3, 四:4, 五:5, 六:6, 七:7, 八:8, 九:9, 十:10 };
const BG = "#F7F7F2";
const INK = "#173B36";
const MUTED = "#637772";
const MINT = "#E3F1ED";
const LINE = "#D8E3DC";
const GOLD = "#A98144";
const PDF_WIDTH = 595.28, PDF_HEIGHT = 841.89;

function stripFormatting(text) {
  return String(text).replace(/^\s{0,4}(?:#{1,5}\s+|>\s*)/, "")
    .replace(/^\s*([-*])\s+/, "• ")
    .replace(/\*\*/g, "").replace(/__/g, "").trim();
}

function hasDay(text) {
  return String(text).split(/\r?\n/).some(line => PLAN_DAY.test(line));
}

export function parseItinerarySections(text, language = "en") {
  const zh = language === "zh";
  const paragraphs = String(text || "").split(/\r?\n/);
  const sections = [];
  let current = { kind: "overview", label: zh ? "行程概览" : "Trip overview", lines: [] };
  function flush() {
    if (current.lines.some(line => line.trim())) {
      sections.push({...current, text:current.lines.join("\n").trim()});
    }
  }
  for (const raw of paragraphs) {
    const matched = raw.match(PLAN_DAY);
    if (matched) {
      flush();
      const rawNum = matched[1] || matched[2];
      const num = Number(rawNum) || DAY_NUMBER[rawNum] || null;
      const title = stripFormatting(matched[3] || "");
      current = { kind:"day", number:num,
        label: (zh ? "第" + (num || rawNum) + "天" : "Day " + (num || rawNum)) + (title ? " · " + title : ""),
        lines:[] };
    } else {
      current.lines.push(raw.trimEnd());
    }
  }
  flush();
  // A one-paragraph plan is still an itinerary; never discard model content.
  if (!sections.length && String(text).trim()) {
    sections.push({ kind:"overview", label:zh ? "完整行程" : "Full itinerary", text:String(text).trim() });
  }
  return sections;
}

/**
 * Select the latest full plan, not necessarily the last AI answer (which may
 * be a small refinement). Follow-up changes are included in a separate
 * clearly labeled section so they cannot silently overwrite itinerary facts.
 */
export function compileItinerary(messages, language = "en") {
  if (!Array.isArray(messages) || messages.length === 0) return null;
  const zh = language === "zh";
  const candidates = messages.map((message,index)=>({message,index}))
    .filter(({message})=>message?.role === "assistant" && message.safety === "allowed" &&
      message.ai?.mode === "ai_generated" && typeof message.content === "string" &&
      message.content.length >= 24 && message.content.length <= 5800 &&
      (hasDay(message.content) || ITINERARY_HINT.test(message.content)));
  if (!candidates.length) return null;
  // Prefer an answer with day headings over a later short answer that merely
  // mentions "itinerary" (often a refinement or checklist).
  const withDays = candidates.filter(({message})=>hasDay(message.content));
  const base = (withDays.length ? withDays : candidates).at(-1);
  const precedingUser = messages.slice(0,base.index).reverse().find(item=>item?.role==="user" &&
    typeof item.content === "string");
  const title = zh ? "我的中国旅行计划" : "My China itinerary";
  const subtitle = precedingUser?.content?.trim().slice(0,180) || (zh ? "根据本次对话整理" : "Compiled from your TourMate conversation");
  const baseSections = parseItinerarySections(base.message.content, language);
  const updates = [];
  for (let i=base.index+1;i<messages.length;i++) {
    const reply = messages[i];
    if (reply?.role !== "assistant" || reply.safety !== "allowed" ||
        reply.ai?.mode !== "ai_generated" || typeof reply.content !== "string" ||
        reply.content.length > 5800) continue;
    const question = messages.slice(base.index+1,i).reverse().find(item=>item?.role==="user" &&
      typeof item.content === "string");
    if (!question || !REFINEMENT_HINT.test(question.content)) continue;
    updates.push({
      kind:"update", label:question.content.trim().slice(0,150), text:reply.content.trim()
    });
  }
  const totalChars = baseSections.reduce((n,s)=>n+s.text.length,0) +
    updates.reduce((n,s)=>n+s.text.length,0);
  // Avoid dropping part of an itinerary silently. Very large conversations
  // must be handled in smaller exports rather than silently clipped.
  if (totalChars > 90000) return null;
  return {
    title, subtitle, original:base.message.content,
    sections:baseSections, updates,
    // The browser supplies its own local date; no server writes or sharing.
    disclosure: zh
      ? "AI 生成旅行建议，不代表实时核验。出行前请通过官方渠道核实交通、价格、预约、开放时间和入境要求。"
      : "AI-generated travel guidance, not live verified. Confirm transport, prices, reservations, opening times and entry requirements with official sources."
  };
}

function ascii(string) { return new TextEncoder().encode(string); }
function jpegBytes(dataUrl) {
  if (typeof dataUrl !== "string" || !/^data:image\/jpeg;base64,/.test(dataUrl)) throw new Error("INVALID_JPEG");
  const binary = atob(dataUrl.slice(dataUrl.indexOf(",")+1));
  const output = new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++) output[i]=binary.charCodeAt(i);
  return output;
}

/** PDF v1.4 single-image-per-page writer, no external files or fonts. */
export function assembleImagePdf(pages) {
  if (!Array.isArray(pages) || !pages.length || pages.length > 100) throw new Error("INVALID_PAGES");
  const enc = ascii;
  const images = pages.map(p=>{
    if(!Number.isInteger(p.width)||!Number.isInteger(p.height)||p.width<100||p.height<100||
       p.width>5000||p.height>7000) throw new Error("INVALID_PAGE_SIZE");
    return {...p,bytes:jpegBytes(p.jpeg)};
  });
  const objects = [null];
  objects[1] = [enc("<< /Type /Catalog /Pages 2 0 R >>")];
  const ids=images.map((_,i)=>3+i*3);
  objects[2] = [enc("<< /Type /Pages /Count "+ids.length+" /Kids ["+ids.map(id=>id+" 0 R").join(" ")+"] >>")];
  images.forEach((p,i)=>{
    const pid=ids[i],cid=pid+1,iid=pid+2;
    objects[pid]=[enc("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 "+PDF_WIDTH+" "+PDF_HEIGHT+"] /Resources << /XObject << /Pg "+iid+" 0 R >> >> /Contents "+cid+" 0 R >>")];
    const command=enc("q\n"+PDF_WIDTH+" 0 0 "+PDF_HEIGHT+" 0 0 cm\n/Pg Do\nQ\n");
    objects[cid]=[enc("<< /Length "+command.length+" >>\nstream\n"),command,enc("\nendstream")];
    objects[iid]=[enc("<< /Type /XObject /Subtype /Image /Width "+p.width+" /Height "+p.height+
      " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length "+p.bytes.length+" >>\nstream\n"),
      p.bytes,enc("\nendstream")];
  });
  const chunks=[enc("%PDF-1.4\n%TourMate\n")],offsets=[0];
  let offset=chunks[0].length;
  for(let i=1;i<objects.length;i++){
    offsets[i]=offset;
    for(const chunk of [enc(i+" 0 obj\n"),...objects[i],enc("\nendobj\n")]){
      chunks.push(chunk);offset+=chunk.length;
    }
  }
  const xrefAt=offset;
  const xref=["xref","0 "+objects.length,"0000000000 65535 f "];
  for(let i=1;i<objects.length;i++)xref.push(String(offsets[i]).padStart(10,"0")+" 00000 n ");
  const trailer=xref.join("\n")+"\ntrailer\n<< /Root 1 0 R /Size "+objects.length+" >>\nstartxref\n"+xrefAt+"\n%%EOF\n";
  chunks.push(enc(trailer));
  return new Blob(chunks,{type:"application/pdf"});
}

function wrapLine(ctx, line, maxWidth) {
  const pieces=String(line).split(/(\s+)/u);
  const lines=[];
  let buf="";
  function push(){if(buf){lines.push(buf.trimEnd());buf="";}}
  for (const p of pieces) {
    if(!p)continue;
    if(ctx.measureText(buf+p).width<=maxWidth){buf+=p;continue;}
    if(buf.trim())push();
    if(ctx.measureText(p).width<=maxWidth){buf=p.trimStart();continue;}
    // CJK runs and long URLs without spaces: wrap at grapheme boundaries.
    const symbols=Array.from(p);
    for(const char of symbols) {
      if(buf && ctx.measureText(buf+char).width>maxWidth)push();
      buf+=char;
    }
  }
  push();
  return lines.length?lines:[""];
}

/**
 * Render fully paginated, styled A4 pages. Each page is one local JPEG image.
 * Using the browser font stack allows Chinese itinerary text without a font
 * download or embedding/redistributing licensed font files.
 */
export function renderItineraryPages(document, {
  canvasFactory = ()=>documentGlobalCanvas(),
  scale = 2,
  now = new Date(),
  language = "en"
} = {}) {
  if (!document?.sections?.length || scale<1 || scale>3) throw new Error("INVALID_ITINERARY");
  const zh=language==="zh", pages=[];
  let canvas,ctx,y;
  const left=51,right=PDF_WIDTH-51,bodyWidth=right-left, bottom=PDF_HEIGHT-70;
  const family='"Helvetica Neue", Arial, "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif';
  function font(size,weight=400){ctx.font=weight+" "+size+"px "+family;}
  function line(x1,y1,x2,y2,color=LINE){ctx.strokeStyle=color;ctx.lineWidth=0.9;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
  function page() {
    canvas=canvasFactory();
    canvas.width=Math.round(PDF_WIDTH*scale);
    canvas.height=Math.round(PDF_HEIGHT*scale);
    ctx=canvas.getContext("2d");
    if(!ctx)throw new Error("CANVAS_UNAVAILABLE");
    ctx.setTransform(scale,0,0,scale,0,0);
    ctx.fillStyle=BG;ctx.fillRect(0,0,PDF_WIDTH,PDF_HEIGHT);
    ctx.fillStyle=INK;ctx.fillRect(0,0,PDF_WIDTH,77);
    font(17,700);ctx.fillStyle="#FFFFFF";ctx.fillText("TourMate",left,38);
    font(9,500);ctx.fillStyle="#CDE5DE";ctx.fillText(zh?"旅行计划 / ITINERARY":"TRAVEL ITINERARY",left,56);
    ctx.fillStyle=GOLD;ctx.fillRect(PDF_WIDTH-75,0,75,8);
    y=103;
  }
  function save() {
    // The footer is drawn after the page contents, so all pages get the same
    // stable branding and transparent verification notice.
    line(left,PDF_HEIGHT-49,right,PDF_HEIGHT-49);
    font(8);ctx.fillStyle=MUTED;
    ctx.fillText(zh?"AI 建议 · 非实时核验":"AI-generated · Verify changing details",left,PDF_HEIGHT-33);
    ctx.textAlign="right";ctx.fillText(String(pages.length+1).padStart(2,"0"),right,PDF_HEIGHT-33);ctx.textAlign="left";
    pages.push({width:canvas.width,height:canvas.height,jpeg:canvas.toDataURL("image/jpeg",0.88)});
    if(pages.length>100)throw new Error("ITINERARY_TOO_LONG");
  }
  function next(required=30) { if(y+required>bottom){save();page();} }
  function textLines(text,{size=10.5,height=17,color=INK,indent=0,weight=400}={}) {
    font(size,weight);ctx.fillStyle=color;
    const paras=String(text||"").split(/\r?\n/);
    for(const raw of paras){
      const clean=stripFormatting(raw);
      if(!clean){next(10);y+=8;continue;}
      const lines=wrapLine(ctx,clean,bodyWidth-indent);
      for(const str of lines) {
        next(height+4);font(size,weight);ctx.fillStyle=color;ctx.fillText(str,left+indent,y);y+=height;
      }
    }
  }
  function heading(label,kind="normal") {
    const title=stripFormatting(label);
    next(kind==="day"?88:57);
    y+=10;
    if(kind==="day"){
      ctx.fillStyle=MINT;ctx.fillRect(left,y-15,bodyWidth,39);
      ctx.fillStyle="#267366";ctx.fillRect(left,y-15,4,39);
      font(12.2,700);ctx.fillStyle=INK;
      const wrapped=wrapLine(ctx,title,bodyWidth-32);
      ctx.fillText(wrapped[0].slice(0,100),left+16,y+10);
      y+=47;
      // A long day heading is continued in body text rather than cut off.
      if(wrapped.length>1) textLines(wrapped.slice(1).join(" "),{size:10,weight:600});
    } else {
      font(12.2,700);ctx.fillStyle=INK;ctx.fillText(title.slice(0,90),left,y+9);
      y+=27;line(left,y,right,y);y+=15;
    }
  }
  page();
  font(9,700);ctx.fillStyle=GOLD;ctx.fillText(zh?"你的专属行程":"YOUR PERSONAL TRAVEL GUIDE",left,y);
  y+=32;
  font(23,700);ctx.fillStyle=INK;ctx.fillText(document.title,left,y);
  y+=26;
  textLines(document.subtitle,{size:11.1,height:17,color:MUTED});
  y+=11;
  ctx.fillStyle=MINT;ctx.fillRect(left,y,bodyWidth,8);y+=25;
  textLines(document.disclosure,{size:9.2,height:15.2,color:MUTED});
  y+=8;
  for(const section of document.sections){
    heading(section.label,section.kind);
    textLines(section.text,{size:10.6,height:17.2});
    y+=10;
  }
  if(document.updates.length){
    heading(zh?"后续调整和补充":"Refinements & follow-up notes");
    textLines(zh
      ?"以下保留了行程首次生成后由 AI 提供的修改建议；请结合原计划阅读，可能包含备选而非已确定安排。"
      :"These are later AI suggestions from the same trip. They may describe alternatives rather than confirmed changes to the original itinerary.",
      {size:9.5,height:16,color:MUTED});
    for(const update of document.updates){
      heading(update.label,"normal");textLines(update.text,{size:10.4,height:17});y+=9;
    }
  }
  next(74);y+=17;line(left,y,right,y);y+=24;
  textLines(zh?"导出时间：":"Exported on: ",{size:9.5,height:16,color:MUTED});
  textLines(new Intl.DateTimeFormat(zh?"zh-CN":"en-US",{dateStyle:"medium"}).format(now),
    {size:9.5,height:16,color:MUTED});
  save();
  return pages;
}

function documentGlobalCanvas(){
  if(typeof document==="undefined")throw new Error("BROWSER_REQUIRED");
  return document.createElement("canvas");
}

/** Public entrypoint: one browser-only operation, without a paid AI call. */
export function createItineraryPdf(messages,{language="en",now=new Date(),canvasFactory}={}){
  const doc=compileItinerary(messages,language);
  if(!doc)return null;
  const pages=renderItineraryPages(doc,{language,now,...(canvasFactory?{canvasFactory}:{})});
  return {blob:assembleImagePdf(pages),pageCount:pages.length,document:doc};
}
