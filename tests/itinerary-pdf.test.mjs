import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  parseItinerarySections, compileItinerary, assembleImagePdf,
  renderItineraryPages, createItineraryPdf
} from "../lib/client/itinerary-pdf.js";

const JPEG="/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCABkAGQDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/ALAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH//Z";
const PLAN = [
  "Hangzhou to Beijing 4 days 3 nights",
  "Day 1 - Arrival in Beijing",
  "Take the train to Beijing and explore a local neighborhood. Confirm connections and hotel details.",
  "",
  "Day 2 - Imperial Beijing",
  "Visit historic palace sites, keeping a generous buffer for entry procedures.",
  "",
  "Day 3 - Great Wall",
  "Set aside most of the day for a Great Wall trip, then return to the city.",
  "",
  "Day 4 - Gardens and departure",
  "Explore a nearby garden if time permits before returning to Hangzhou. Check train schedules in advance.",
  "",
  "Trip notes: Bring comfortable shoes, check the official booking channels, and keep a flexible weather alternative."
].join("\n");
function assistant(content=PLAN, ai="ai_generated",safety="allowed"){
  return {role:"assistant",content,safety,ai:{mode:ai}};
}
const messages=[
  {role:"user",content:"Plan 4d3n Hangzhou to Beijing"},
  assistant(),
  {role:"user",content:"Make it cheaper and vegetarian-friendly"},
  assistant("Use public transport where practical and ask restaurants to confirm vegetable broth. This is an optional refinement, not confirmed ticket information.")
];
function fakeCanvas(){
  let context;
  return {
    width:0,height:0,
    getContext(type){
      assert.equal(type,"2d");
      if(!context) context={
        setTransform(){},fillRect(){},fillText(){},stroke(){},beginPath(){},
        moveTo(){},lineTo(){},
        measureText(text){return {width:Array.from(String(text)).reduce((a,char)=>a+(char.charCodeAt(0)>255?9:5.8),0)};},
        textAlign:"left",font:"",fillStyle:"",strokeStyle:"",lineWidth:1
      };
      return context;
    },
    toDataURL(type,quality){
      assert.equal(type,"image/jpeg");assert.ok(quality>0);
      return "data:image/jpeg;base64,"+JPEG;
    }
  };
}

test("English parser retains complete 4-day itinerary with separate day headings",()=>{
  const sections=parseItinerarySections(PLAN,"en");
  assert.ok(sections.length>=5);
  assert.equal(sections.filter(x=>x.kind==="day").length,4);
  assert.match(sections[1].label,/Day 1/);
  assert.match(sections[4].text,/weather alternative/);
  assert.ok(sections.reduce((a,x)=>a+x.text.length,0)>300);
});
test("Chinese parser keeps Chinese day headings and instructions",()=>{
  const raw="杭州到北京行程\n第1天：坐火车到北京\n参观前门历史街区。\n第2天：参观故宫\n提前核实门票。";
  const sections=parseItinerarySections(raw,"zh");
  assert.equal(sections.filter(x=>x.kind==="day").length,2);
  assert.match(sections[1].label,/第1天/);
  assert.match(sections[2].text,/提前核实门票/);
});
test("PDF compilation includes latest complete plan plus safe AI refinement notes",()=>{
  const doc=compileItinerary(messages);
  assert.equal(doc.sections.filter(x=>x.kind==="day").length,4);
  assert.equal(doc.updates.length,1);
  assert.match(doc.updates[0].text,/vegetable broth/);
  assert.match(doc.subtitle,/Hangzhou to Beijing/);
  assert.match(doc.disclosure,/not live verified/);
  assert.equal(doc.original,PLAN);
  const revised=[...messages,{role:"user",content:"Plan 2 days in Shanghai"},
    assistant("Day 1: Explore the Bund.\nDay 2: Visit a museum and depart.")];
  const other=compileItinerary(revised);
  assert.match(other.original,/Bund/);
  assert.equal(other.updates.length,0,"Previous trip refinements must not leak into the new trip");
});
test("PDF compilation never exports unsafe or non-AI replies",()=>{
  assert.equal(compileItinerary([assistant(PLAN,"curated_faq")]),null);
  assert.equal(compileItinerary([assistant(PLAN,"ai_generated","sanitized")]),null);
  assert.equal(compileItinerary([{role:"user",content:"Plan a trip"}]),null);
  assert.equal(compileItinerary(null),null);
});
test("PDF writer encodes two valid JPEG image pages with correct PDF object indexes",async()=>{
  const jpeg="data:image/jpeg;base64,"+JPEG;
  const pdf=assembleImagePdf([{width:100,height:100,jpeg},{width:100,height:100,jpeg}]);
  assert.equal(pdf.type,"application/pdf");
  const bytes=new Uint8Array(await pdf.arrayBuffer());
  const latin1=new TextDecoder("latin1").decode(bytes);
  assert.ok(latin1.startsWith("%PDF-1.4"));
  assert.match(latin1,/\/Type \/Pages \/Count 2 \/Kids \[3 0 R 6 0 R\]/);
  assert.match(latin1,/\/Subtype \/Image \/Width 100 \/Height 100/);
  assert.match(latin1,/\/Filter \/DCTDecode/);
  assert.ok(latin1.endsWith("%%EOF\n"));
  const start=Number(latin1.match(/startxref\n(\d+)\n%%EOF/)[1]);
  assert.equal(latin1.slice(start,start+4),"xref");
  assert.equal((latin1.match(/\/Type \/Page \/Parent/g)||[]).length,2);
  assert.ok(bytes.length>900);
});
test("invalid page image and unsupported counts fail instead of downloading corrupted PDF",()=>{
  assert.throws(()=>assembleImagePdf([]),/INVALID_PAGES/);
  assert.throws(()=>assembleImagePdf([{width:1,height:1,jpeg:"x"}]),/INVALID_PAGE_SIZE/);
  assert.throws(()=>assembleImagePdf([{width:100,height:100,jpeg:"data:image/png;base64,AA"}]),/INVALID_JPEG/);
});
test("branded A4 renderer paginates long text without clipping it to one page",()=>{
  const longPlan=Array.from({length:42},(_,i)=>"Day "+(i+1)+": Detailed morning and afternoon activities in China with realistic transfer breaks and time to rest. "+("More helpful context. ".repeat(10))).join("\n");
  const doc={
    title:"My China itinerary",subtitle:"A longer itinerary test",
    disclosure:"AI-generated and not live verified",
    sections:parseItinerarySections(longPlan),updates:[]
  };
  const pages=renderItineraryPages(doc,{canvasFactory:fakeCanvas,now:new Date("2026-11-04T12:00:00Z")});
  assert.ok(pages.length>=2);
  assert.ok(pages.length<100);
  assert.ok(pages.every(p=>p.width>1000 && p.jpeg.startsWith("data:image/jpeg;base64,")));
});
test("one browser-side export produces a PDF without new model or database calls",async()=>{
  const result=createItineraryPdf(messages,{canvasFactory:fakeCanvas,now:new Date("2026-11-04T12:00:00Z")});
  assert.ok(result.pageCount>=1);
  assert.equal(result.document.updates.length,1);
  const b=new Uint8Array(await result.blob.arrayBuffer());
  assert.equal(new TextDecoder().decode(b.slice(0,8)),"%PDF-1.4");
});
test("UI offers PDF first with a local text fallback and no new network upload",async()=>{
  const ui=await readFile(new URL("../components/ChatShell.jsx",import.meta.url),"utf8");
  assert.match(ui,/createItineraryPdf\(activeTrip\?\.messages \|\| \[\], \{language\}\)/);
  assert.match(ui,/anchor\.download = "tourmate-full-itinerary\.pdf"/);
  assert.match(ui,/Download itinerary PDF/);
  assert.match(ui,/Download plain text trip plan/);
  assert.match(ui,/URL\.createObjectURL\(result\.blob\)/);
});
