import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
async function source(path) { return readFile(new URL(path,root),"utf8"); }

test("Chinese heritage theme is loaded at the app root, after existing styles", async()=>{
  const layout=await source("app/layout.jsx");
  assert.ok(layout.includes('import "./globals.css";'));
  assert.ok(layout.includes('import "./china-theme.css";'));
  assert.ok(layout.indexOf('import "./china-theme.css";')>layout.indexOf('import "./globals.css";'));
});

test("landscape is original, purely decorative and does not download images or fetch remote assets",async()=>{
  const scene=await source("components/ChinaLandscape.jsx");
  assert.match(scene,/aria-hidden="true"/);
  assert.match(scene,/focusable="false"/);
  for(const motif of ["china-scene-sun-glow","china-scene-cloud-one","china-scene-cloud-two","china-scene-mountain-rear","china-scene-mountain-middle","china-scene-pavilion","china-scene-bridge","china-scene-lantern"]) {
    assert.match(scene,new RegExp(motif),motif);
  }
  assert.doesNotMatch(scene,/<img\b|https?:\/\/|fetch\(|<image\b|window\./);
});

test("chat opens an immersive bilingual hero but keeps custom museum persona greeting",async()=>{
  const ui=await source("components/ChatShell.jsx");
  assert.match(ui,/import ChinaLandscape from "\.\/ChinaLandscape\.jsx"/);
  assert.match(ui,/persona\?\.id === DEFAULT_PERSONA_ID \? \(/);
  assert.match(ui,/<ChinaLandscape \/>/);
  assert.match(ui,/hero-cn-title/);
  assert.match(ui,/山海之间/);
  assert.match(ui,/Find your China/);
  assert.match(ui,/persona\?\.greeting\[language\]/);
  assert.match(ui,/<AuthPanel language=\{language\} client=\{authClient\} \/>/);
  assert.match(ui,/className="message-list" aria-live="polite"/);
  assert.match(ui,/downloadItineraryPdf/);
  assert.match(ui,/downloadTravelPlan/);
  assert.match(ui,/submitMessage/);
  assert.match(ui,/onClick=\{startNewTrip\}/);
  assert.match(ui,/onClick=\{changeLanguage\("zh"\)\}/);
});

test("theme contains well-defined animations, responsive breakpoints and low-motion alternative",async()=>{
  const css=await source("app/china-theme.css");
  for(const motion of ["welcome-unfold","hero-rise","card-arrive","message-unfold","cloud-drift","mountain-appear","mountain-breathe","sun-breathe","water-breathe","bird-drift","lantern-sway"]) {
    assert.ok(css.includes("@keyframes "+motion),motion);
  }
  for(const component of [".sidebar",".new-trip-button",".china-hero-stage",".china-scene-svg",".china-scene-lantern",".suggestion-card",".message-list",".composer",".send-button",".trust-passport"]) {
    assert.ok(css.includes(component),component);
  }
  assert.match(css,/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css,/@media\(max-width:720px\)/);
  assert.match(css,/@media\(max-width:420px\)/);
  assert.match(css,/animation:none!important/);
  assert.doesNotMatch(css,/@import|url\(https?:\/\/|font-face|image-set\(/i);
});

test("welcome recommendations are real tourism questions, never canned generated responses",async()=>{
  const ui=await source("components/ChatShell.jsx");
  assert.match(ui,/Plan a 4-day 3-night Beijing trip/);
  assert.match(ui,/Hangzhou including West Lake/);
  assert.match(ui,/underrated heritage towns/);
  assert.match(ui,/帮我规划北京4天3晚行程/);
  assert.match(ui,/chooseSuggestion\(suggestion.prompt\)/);
  assert.match(ui,/chooseSuggestion\(action.prompt\)/);
});
