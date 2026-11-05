import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = path => readFile(new URL("../"+path,import.meta.url),"utf8");

test("new hero action opens a real fullscreen China-world portal and restores focus",async()=>{
  const hero=await read("components/China3DScene.jsx");
  assert.match(hero,/import ChinaWorldExplorer from "\.\/ChinaWorldExplorer\.jsx"/);
  assert.match(hero,/const \[immersiveOpen, setImmersiveOpen\] = useState\(false\)/);
  assert.match(hero,/onClick=\{\(\) => setImmersiveOpen\(true\)\}/);
  assert.match(hero,/immersiveOpen &&/);
  assert.match(hero,/<ChinaWorldExplorer language=\{language\} onClose=\{closeImmersive\}/);
  assert.match(hero,/onSelectPrompt=\{onExplorePrompt\}/);
  assert.match(hero,/immersiveButtonRef\.current\?\.focus\(\)/);
});

test("immersive view is keyboard accessible, locks scroll, closes on Escape and traps Tab",async()=>{
  const modal=await read("components/ChinaWorldExplorer.jsx");
  assert.match(modal,/createPortal\(/);
  assert.match(modal,/document\.body\s*\)/);
  assert.match(modal,/role="dialog"/);
  assert.match(modal,/aria-modal="true"/);
  assert.match(modal,/aria-labelledby="cinematic-title"/);
  assert.match(modal,/closeRef\.current\?\.focus\(\)/);
  assert.match(modal,/active\.current = true/);
  assert.match(modal,/document\.body\.style\.overflow = "hidden"/);
  assert.match(modal,/document\.body\.style\.overflow=oldOverflow/);
  assert.match(modal,/event\.key==="Escape"/);
  assert.match(modal,/event\.key!=="Tab"/);
  assert.match(modal,/document\.addEventListener\("keydown",onKeyDown\)/);
  assert.match(modal,/document\.removeEventListener\("keydown",onKeyDown\)/);
});

test("landmark hotspots use only legitimate China travel prompts passed to the existing AI composer",async()=>{
  const scene=await read("components/ChinaWorldExplorer.jsx");
  const shell=await read("components/ChatShell.jsx");
  assert.match(scene,/id: "beijing"/);
  assert.match(scene,/id: "hangzhou"/);
  assert.match(scene,/id: "heritage"/);
  assert.match(scene,/onSelectPrompt\?\.\(zh\?stop\.questionZh:stop\.questionEn\)/);
  assert.match(scene,/onClose\(false\)/);
  assert.match(shell,/onExplorePrompt=\{chooseSuggestion\}/);
  assert.match(shell,/function chooseSuggestion\(/);
  assert.match(scene,/questionEn: "Create a memorable cultural itinerary in Beijing/);
  assert.match(scene,/questionZh: "请规划富有文化特色的北京旅行行程/);
  assert.doesNotMatch(scene,/fetch\(|\/api\/chat|Bearer|process\.env/);
});

test("golden-hour and night lighting actually change scene, moon, stars and pagoda",async()=>{
  const scene=await read("components/ChinaWorldExplorer.jsx");
  const css=await read("app/china-cinematic.css");
  assert.match(scene,/data-atmosphere=\{atmosphere\}/);
  assert.match(scene,/setAtmosphere\("sunset"\)/);
  assert.match(scene,/setAtmosphere\("night"\)/);
  assert.match(scene,/aria-pressed=\{atmosphere==="sunset"\}/);
  assert.match(scene,/aria-pressed=\{atmosphere==="night"\}/);
  for(const fragment of [
    ".cinematic-overlay[data-atmosphere=\"night\"] .cinematic-sky",
    ".cinematic-overlay[data-atmosphere=\"night\"] .cinematic-moon",
    ".cinematic-overlay[data-atmosphere=\"night\"] .cinematic-star",
    ".cinematic-overlay[data-atmosphere=\"night\"] .cinematic-pagoda",
    ".cinematic-overlay[data-atmosphere=\"night\"] .cinematic-mountain-plane"
  ]) assert.ok(css.includes(fragment),fragment);
  for(const feature of [".cinematic-pagoda-level",".cinematic-roof",".cinematic-pillars",".cinematic-petals",".cinematic-moon",".cinematic-water-plane"]) {
    assert.ok(css.includes(feature),feature);
  }
  assert.match(css,/transform:translateZ\(140px\) rotateY\(-16deg\)/);
  assert.match(css,/transform:translateZ\(-75px\) scale\(1\.12\)/);
  assert.match(css,/\.cinematic-sky::after/);
  assert.match(css,/\.cinematic-overlay\[data-atmosphere="night"\] \.cinematic-sky::after \{opacity:1\}/);
});

test("orbit movement uses raf, clamps angles and updates zoom without paid inference",async()=>{
  const scene=await read("components/ChinaWorldExplorer.jsx");
  assert.match(scene,/requestAnimationFrame\(paint\)/);
  assert.match(scene,/cancelAnimationFrame\(frameRef\.current\)/);
  assert.match(scene,/clamp\(\(event\.clientX-rect\.left\)\/rect\.width\*2-1,-1,1\)/);
  assert.match(scene,/const \[zoom,setZoom\] = useState\(1\)/);
  assert.match(scene,/setZoom\(Number\(event\.target\.value\)\)/);
  assert.match(scene,/setAngle\(a=>clamp\(a\+direction\*18,-54,54\)\)/);
  assert.match(scene,/--cinematic-tilt-y/);
  assert.match(scene,/hover: hover\) and \(pointer: fine/);
  assert.match(scene,/prefers-reduced-motion: reduce/);
});

test("original SVG uses unique gradients when hero and cinematic portal are both mounted",async()=>{
  const landscape=await read("components/ChinaLandscape.jsx");
  assert.match(landscape,/useId\(\)\.replace/);
  for(const gradient of ["c-mountain-back","c-mountain-mid","c-water","c-mist","c-sun-glow"]) {
    assert.ok(landscape.includes('gradientPrefix')&&landscape.includes(gradient),gradient);
  }
});

test("visual improvements are opt-in, progressive and preserve accessibility fallbacks",async()=>{
  const css=await read("app/china-cinematic.css");
  const layout=await read("app/layout.jsx");
  assert.ok(layout.includes('import "./china-cinematic.css";'));
  assert.ok(layout.indexOf('import "./china-cinematic.css";')>layout.indexOf('import "./china-3d.css";'));
  assert.match(css,/@media\(max-width:720px\)/);
  assert.match(css,/\.cinematic-petals span:nth-child\(n\+7\) \{display:none\}/);
  assert.match(css,/@media\(hover:none\), \(pointer:coarse\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css,/\.cinematic-petals \{display:none\}/);
  assert.match(css,/animation:none!important/);
  assert.doesNotMatch(css,/@import|url\(https?:\/\/|@font-face|image-set\(/i);
  const pkg=JSON.parse(await read("package.json"));
  for(const dep of ["three","@react-three/fiber","gsap","babylonjs"])assert.equal(pkg.dependencies?.[dep],undefined);
});
