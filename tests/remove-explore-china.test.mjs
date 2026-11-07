import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";

const read = path => readFile(new URL("../"+path,import.meta.url),"utf8");

test("Explore China full-screen page is removed, including obsolete CSS and modal tests",async()=>{
  for (const path of ["components/ChinaWorldExplorer.jsx","app/china-cinematic.css","tests/china-cinematic-world.test.mjs"]) {
    await assert.rejects(access(new URL("../"+path,import.meta.url)),{code:"ENOENT"});
  }
});

test("no Explore China navigation or page launcher remains in TourMate",async()=>{
  const shell=await read("components/ChatShell.jsx");
  const scene=await read("components/China3DScene.jsx");
  const layout=await read("app/layout.jsx");
  for (const source of [shell,scene,layout]) {
    assert.doesNotMatch(source,/ChinaWorldExplorer|navExplorerOpen|immersiveOpen|setImmersiveOpen|onExplorePrompt|china-cinematic.css/);
  }
  assert.doesNotMatch(shell,/Explore China|探索中国|setNavExplorerOpen/);
  assert.doesNotMatch(scene,/Enter the world|china-3d-enter-control/);
  assert.match(layout,/import "\.\/china-3d.css";/);
  assert.match(scene,/className="china-3d-world"/);
  assert.match(scene,/Rotate the 3D landscape view/);
});

test("trip planning, saved history, bilingual chat and PDF stay available",async()=>{
  const shell=await read("components/ChatShell.jsx");
  assert.match(shell,/className="imperial-side-menu"/);
  assert.match(shell,/className="imperial-topnav"/);
  assert.match(shell,/Plan a Trip/);
  assert.match(shell,/Travel Tips/);
  assert.match(shell,/onClick=\{startNewTrip\}/);
  assert.match(shell,/onClick=\{\(\) => chooseSuggestion\(suggestion\.prompt\)\}/);
  assert.match(shell,/onClick=\{downloadItineraryPdf\}/);
  assert.match(shell,/onClick=\{downloadTravelPlan\}/);
  assert.match(shell,/onClick=\{\(\) => changeLanguage\("zh"\)\}/);
  assert.match(shell,/import TravelMessage from "\.\/TravelMessage\.jsx";/);
  assert.match(shell,/<China3DScene language=\{language\}><ChinaLandscape \/><\/China3DScene>/);
});
