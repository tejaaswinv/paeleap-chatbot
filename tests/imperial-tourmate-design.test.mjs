import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const read=path=>readFile(new URL("../"+path,import.meta.url),"utf8");
test("editorial theme is loaded after existing layout styles",async()=>{
 const layout=await read("app/layout.jsx"),css=await read("app/editorial-tourmate.css");
 assert.ok(layout.indexOf('import "./editorial-tourmate.css";')>layout.indexOf('import "./smart-trip-planner.css";'));
 assert.match(layout,/themeColor: "#f5f0e6"/);
 assert.doesNotMatch(layout,/import "\.\/china-3d.css"/);
 for(const token of ["#f5f0e6","#efe8db","#211b17","#b32e19"])assert.ok(css.includes(token));
 assert.doesNotMatch(css,/@import|url\(https?:\/\/|@font-face|image-set\(/i);
});
test("flat hero and destination cards replace animated artwork",async()=>{
 const ui=await read("components/ChatShell.jsx");
 assert.match(ui,/className="editorial-hero"/);
 assert.match(ui,/className="editorial-mountains"/);
 assert.match(ui,/Find your China\./);
 assert.match(ui,/Start with a place/);
 assert.match(ui,/Browse all destinations/);
 assert.match(ui,/className="editorial-card-mark"/);
 assert.match(ui,/onClick=\{\(\) => chooseSuggestion\(suggestion\.prompt\)\}/);
 assert.doesNotMatch(ui,/China3DScene|ChinaDestinationArt|ChinaHeroOrnament|applyCardDepth|resetCardDepth|className="imperial-topnav"/);
});
test("real navigation, planner, suggested prompts and exports stay accessible",async()=>{
 const ui=await read("components/ChatShell.jsx");
 for(const required of ["Travel chat","Plan a trip","Travel tips","My trips","Build a trip around you","Plan my trip","More tools","Best time to visit Guilin?","submitMessage","stopResponse","buildChatBody","parseChatResponse","startNewTrip","selectTrip","getSupabaseBrowserClient","changeLanguage","travelRefinementActions","downloadItineraryPdf","downloadTravelPlan","createItineraryPdf","AuthPanel","trust-passport","sources-card"])assert.ok(ui.includes(required),required);
 assert.match(ui,/document\.getElementById\("trips-sidebar-history"\)/);
 assert.match(ui,/onClick=\{openTripPlanner\}/);
 assert.match(ui,/aria-expanded=\{toolsExpanded\}/);
});
test("paper theme covers desktop, mobile, chat and sign-in without motion dependency",async()=>{
 const css=await read("app/editorial-tourmate.css");
 for(const selector of [".sidebar",".topbar",".editorial-hero",".suggestion-card",".smart-planner-welcome",".composer",".assistant-bubble",".user-bubble",".auth-card",".trust-passport",".editorial-starter-prompts"])assert.ok(css.includes(selector),selector);
 assert.match(css,/@media\(max-width:720px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/:focus-visible/);
});
