import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyCardDepth, resetCardDepth } from "../lib/client/visual-depth.js";

const read = async path => readFile(new URL("../" + path,import.meta.url),"utf8");

test("3D scene truly uses distinct depth planes and volumetric lantern faces",async()=>{
  const scene=await read("components/China3DScene.jsx");
  const css=await read("app/china-3d.css");
  assert.match(scene,/className="china-3d-experience"/);
  assert.match(scene,/className="china-3d-world"/);
  assert.match(scene,/className="china-3d-backplane"/);
  assert.match(scene,/className="china-3d-foreground"/);
  for(const face of ["lantern-face-front","lantern-face-right","lantern-face-back","lantern-face-left"]) assert.match(scene,new RegExp(face));
  assert.match(css,/perspective:\s*950px/);
  assert.match(css,/transform-style:\s*preserve-3d/);
  assert.match(css,/translateZ\(-70px\)/);
  assert.match(css,/translateZ\(118px\)/);
  for(const angle of [0,90,180,-90]) assert.ok(css.includes("rotateY("+angle+"deg) translateZ(14px)"),String(angle));
  assert.ok(!scene.includes("fetch(") && !css.includes("@import"),"No new network dependencies");
});

test("3D viewpoint control cycles three named angles without changing user prompts",async()=>{
  const scene=await read("components/China3DScene.jsx");
  assert.match(scene,/setView\(previous => \(previous \+ 1\) % VIEWS\.length\)/);
  assert.match(scene,/aria-label=\{language === "zh" \?/);
  assert.match(scene,/Rotate the 3D landscape view/);
  assert.match(scene,/requestAnimationFrame\(paint\)/);
  assert.match(scene,/cancelAnimationFrame\(frameRef\.current\)/);
  assert.match(scene,/stage\.addEventListener\("pointermove"/);
  assert.match(scene,/stage\.removeEventListener\("pointermove"/);
  assert.match(scene,/reduced\.matches \|\| !fine\.matches/);
  assert.match(scene,/getBoundingClientRect\(\)/);
});

test("3D card tilt is bounded, resettable and disabled for touch/reduced-motion",()=>{
  const prior=globalThis.window;
  const vars=new Map();
  const style={setProperty:(name,value)=>vars.set(name,value)};
  const event={
    pointerType:"mouse",clientX:100,clientY:100,
    currentTarget:{style,getBoundingClientRect:()=>({left:0,top:0,width:200,height:200})}
  };
  try {
    globalThis.window={matchMedia:q=>({matches:q.includes("pointer: fine")})};
    applyCardDepth(event);
    assert.equal(vars.get("--card-rotate-x"),"0.00deg");
    assert.equal(vars.get("--card-rotate-y"),"0.00deg");
    event.clientX=500;event.clientY=-100;
    applyCardDepth(event);
    assert.equal(vars.get("--card-rotate-x"),"5.00deg");
    assert.equal(vars.get("--card-rotate-y"),"7.00deg");
    event.pointerType="touch";
    event.clientX=0;event.clientY=0;
    applyCardDepth(event);
    assert.equal(vars.get("--card-rotate-y"),"7.00deg","touch must not move tilt");
    resetCardDepth(event);
    assert.equal(vars.get("--card-rotate-x"),"0deg");
    assert.equal(vars.get("--card-rotate-y"),"0deg");
    globalThis.window={matchMedia:q=>({matches:q.includes("reduced-motion")||q.includes("pointer: fine")})};
    applyCardDepth({...event,pointerType:"mouse"});
    assert.equal(vars.get("--card-rotate-y"),"0deg","no tilt under reduced motion");
  } finally {
    if(prior===undefined)delete globalThis.window;
    else globalThis.window=prior;
  }
});

test("3D scene respects touch screens, mobile layouts and reduced-motion settings",async()=>{
  const css=await read("app/china-3d.css");
  assert.match(css,/@media \(max-width:720px\)/);
  assert.match(css,/@media \(hover:none\), \(pointer:coarse\)/);
  assert.match(css,/@media \(prefers-reduced-motion:reduce\)/);
  assert.match(css,/\.china-3d-view-control \{display:none\}/);
  assert.match(css,/animation:none!important/);
  assert.match(css,/\.china-hero-stage \.china-hero-content \{pointer-events:none;\}/);
});

test("3D augmentation leaves core TourMate controls and existing landscape intact",async()=>{
  const ui=await read("components/ChatShell.jsx");
  const layout=await read("app/layout.jsx");
  assert.match(ui,/import China3DScene from "\.\/China3DScene\.jsx"/);
  assert.match(ui,/<China3DScene language=\{language\} onExplorePrompt=\{chooseSuggestion\}><ChinaLandscape \/><\/China3DScene>/);
  assert.match(ui,/onPointerMove=\{applyCardDepth\}/);
  assert.match(ui,/onPointerLeave=\{resetCardDepth\}/);
  assert.match(ui,/onClick=\{\(\) => chooseSuggestion\(suggestion\.prompt\)\}/);
  for(const untouched of ["downloadItineraryPdf","downloadTravelPlan","submitMessage","startNewTrip","selectTrip","changeLanguage","AuthPanel"]) {
    assert.ok(ui.includes(untouched),untouched);
  }
  assert.ok(layout.indexOf('import "./china-3d.css";')>layout.indexOf('import "./china-theme.css";'));
});

test("3D enhancement uses no external rendering library or font fetch",async()=>{
  const packageJson=JSON.parse(await read("package.json"));
  for(const dep of ["three","@react-three/fiber","gsap","babylonjs"]) {
    assert.equal(packageJson.dependencies?.[dep],undefined);
  }
  const scene=await read("components/China3DScene.jsx");
  const style=await read("app/china-3d.css");
  assert.doesNotMatch(scene,/https?:\/\/|fetch\(|XMLHttpRequest|canvas|getUserMedia/);
  assert.doesNotMatch(style,/@import|url\(https?:\/\/|@font-face|image-set\(/i);
});
