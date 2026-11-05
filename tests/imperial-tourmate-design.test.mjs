import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const read=path=>readFile(new URL("../"+path,import.meta.url),"utf8");

test("complete imperial theme is loaded after the old themes without adding font or image requests",async()=>{
  const layout=await read("app/layout.jsx");
  const css=await read("app/imperial-tourmate.css");
  assert.ok(layout.includes('import "./imperial-tourmate.css";'));
  assert.ok(layout.indexOf('import "./imperial-tourmate.css";')>layout.indexOf('import "./china-cinematic.css";'));
  assert.ok(layout.includes('themeColor: "#67120f"'));
  for(const [name,value] of Object.entries({"--pine-900":"#621616","--paper":"#fbf3e8","--gold":"#bf8d48"})){
    assert.ok(css.includes(name+":"+value),name);
  }
  assert.doesNotMatch(css,/@import|url\(https?:\/\/|@font-face|image-set\(/i);
});

test("all visible main navigation controls actually do something",async()=>{
  const ui=await read("components/ChatShell.jsx");
  assert.match(ui,/className="imperial-side-menu"/);
  assert.match(ui,/className="imperial-topnav"/);
  assert.match(ui,/onClick=\{startNewTrip\}/);
  assert.match(ui,/navExplorerRef\.current = event\.currentTarget; setNavExplorerOpen\(true\)/);
  assert.match(ui,/navExplorerRef\.current\?\.focus\(\)/);
  assert.match(ui,/onClick=\{\(\) => chooseSuggestion\(language === "zh"/);
  assert.match(ui,/document\.getElementById\("trips-sidebar-history"\)/);
  assert.match(ui,/onClick=\{\(\) => textareaRef\.current\?\.focus\(\)\}/);
  assert.match(ui,/navExplorerOpen && persona\?\.id === DEFAULT_PERSONA_ID/);
  assert.match(ui,/<ChinaWorldExplorer language=\{language\} onClose=\{closeNavExplorer\}/);
  assert.match(ui,/onSelectPrompt=\{chooseSuggestion\}/);
  assert.match(ui,/!needsAuthentication/);
});

test("travel destination cards use distinct original visuals and pass prompts to real AI",async()=>{
  const ui=await read("components/ChatShell.jsx");
  const art=await read("components/ChinaDestinationArt.jsx");
  assert.match(ui,/<ChinaDestinationArt index=\{index\}\/>/);
  assert.match(ui,/onClick=\{\(\) => chooseSuggestion\(suggestion\.prompt\)\}/);
  assert.match(art,/const type = index % 3/);
  assert.match(art,/aria-hidden="true"/);
  assert.match(art,/viewBox="0 0 420 186"/);
  for(const marker of ["art-","ellipse","circle","path"]) assert.ok(art.includes(marker),marker);
  assert.doesNotMatch(art,/fetch\(|https?:\/\/|<img\b|<image\b/);
});

test("hero has ornamental vector foliage, lantern and red/gold typography while keeping 3D controls",async()=>{
  const ui=await read("components/ChatShell.jsx");
  const ornament=await read("components/ChinaHeroOrnament.jsx");
  const css=await read("app/imperial-tourmate.css");
  assert.match(ui,/<ChinaHeroOrnament \/>/);
  assert.match(ui,/className="china-hero-stage imperial-hero"/);
  assert.match(ui,/<China3DScene language=\{language\} onExplorePrompt=\{chooseSuggestion\}><ChinaLandscape \/><\/China3DScene>/);
  assert.match(ui,/<span className="hero-cn-title">山海之间<\/span>/);
  assert.match(ui,/Find your China\./);
  assert.match(ornament,/const leaves = \[/);
  assert.match(ornament,/imperial-lantern-glow/);
  assert.match(ornament,/stroke="#c49a5e"/);
  assert.match(css,/\.imperial-tourmate \.china-hero-stage/);
  assert.match(css,/\.imperial-tourmate \.china-3d-enter-control/);
});

test("full app uses red sidebar and header, parchment chat and gold composer—not just welcome styling",async()=>{
  const css=await read("app/imperial-tourmate.css");
  for(const selector of [
    ".imperial-tourmate .sidebar", ".imperial-tourmate .new-trip-button",
    ".imperial-tourmate .imperial-side-menu", ".imperial-tourmate .topbar",
    ".imperial-tourmate .imperial-topnav", ".imperial-tourmate .conversation.has-messages",
    ".imperial-tourmate .imperial-chat-heading", ".imperial-tourmate .user-bubble",
    ".imperial-tourmate .assistant-bubble", ".imperial-tourmate .trust-passport",
    ".imperial-tourmate .composer", ".imperial-tourmate .send-button",
    ".imperial-tourmate .auth-card", ".imperial-tourmate .suggestion-card"
  ]) assert.ok(css.includes(selector),selector);
  assert.match(css,/\.imperial-tourmate \.imperial-chat-heading \.china-landscape/);
  assert.match(css,/\.imperial-tourmate \.tool-strip \.export-trip-button/);
});

test("responsive layouts and accessibility fallbacks still work across small screens",async()=>{
  const css=await read("app/imperial-tourmate.css");
  for(const width of ["1460","1180","900","720","390"]){
    assert.match(css,new RegExp("@media\\(max-width:"+width+"px\\)"));
  }
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css,/animation:none!important/);
  assert.match(css,/\.imperial-tourmate :focus-visible/);
  assert.match(css,/\.imperial-tourmate \.imperial-topnav \{display:none\}/);
});

test("the functional backbone remains unchanged: chat, auth, saved trips, refinements and PDF",async()=>{
  const ui=await read("components/ChatShell.jsx");
  for(const required of [
    "submitMessage", "stopResponse", "buildChatBody", "parseChatResponse",
    "startNewTrip", "selectTrip", "getSupabaseBrowserClient", "changeLanguage",
    "travelRefinementActions", "downloadItineraryPdf", "downloadTravelPlan",
    "createItineraryPdf", "AuthPanel", "trust-passport", "sources-card"
  ]) assert.ok(ui.includes(required),required);
  assert.match(ui,/className="imperial-chat-heading"/);
  assert.match(ui,/onPointerMove=\{applyCardDepth\}/);
  assert.match(ui,/onPointerLeave=\{resetCardDepth\}/);
});
