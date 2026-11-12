import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {
  buildSmartTripPrompt, TRIP_STYLES, TRIP_FOOD, TRIP_INTERESTS, TRIP_CURRENCIES
} from "../lib/client/smart-trip-planner.js";

const read=path=>readFile(new URL("../"+path,import.meta.url),"utf8");

test("builds a useful real-AI request from all English trip preferences, without canned answers",()=>{
  const prompt=buildSmartTripPrompt({
    destination:"Hangzhou",origin:"Singapore",days:5,travelers:4,
    startDate:"2027-03-12",budget:"850",currency:"SGD",
    style:"relaxed",food:"vegetarian",
    interests:["nature","heritage","photography"],notes:"Prefer trains, avoid long hikes."
  },"en");
  for(const expected of [
    "Destination: Hangzhou","Starting from: Singapore","Duration: 5 days",
    "Planned departure date: 2027-03-12","Group: 4 travelers",
    "Total budget per person: 850 SGD","relaxed, with fewer transfers",
    "strictly vegetarian","natural scenery","history and heritage","photography",
    "Prefer trains, avoid long hikes.","verify through official channels"
  ]) assert.ok(prompt.includes(expected),expected);
  assert.ok(prompt.length<=1500);
  assert.doesNotMatch(prompt,/Day 1:.*West Lake|day by day plan:|here is your itinerary/i);
});

test("Chinese planner produces a Chinese prompt with constrained, supported preferences",()=>{
  const prompt=buildSmartTripPrompt({
    destination:"北京",origin:"杭州",days:3,travelers:2,
    budget:1800,currency:"CNY",style:"culture",food:"vegan",
    interests:["heritage","hidden"]
  },"zh");
  for(const expected of ["北京","杭州","3天","2人","1800 CNY",
    "深入当地文化和历史","纯素","历史文化","小众目的地","请按天安排"]) {
    assert.ok(prompt.includes(expected),expected);
  }
  assert.ok(prompt.length<=1500);
  assert.doesNotMatch(prompt,/Book now|¥\s*\d/);
});

test("does not invent dates, budgets or a destination and validates empty or invalid input",()=>{
  assert.throws(()=>buildSmartTripPrompt({destination:"  "}),/Enter a destination/);
  assert.throws(()=>buildSmartTripPrompt({destination:" "},"zh"),/目的地/);
  assert.throws(()=>buildSmartTripPrompt({destination:"Chengdu",budget:0}),/Budget must/);
  assert.throws(()=>buildSmartTripPrompt({destination:"Chengdu",budget:"1.5"}),/Budget must/);
  assert.throws(()=>buildSmartTripPrompt({destination:"Chengdu",budget:"2000000"}),/Budget must/);
  const noDates=buildSmartTripPrompt({destination:"Xi'an",startDate:"2027-02-31",budget:""});
  assert.ok(!noDates.includes("2027-02-31"));
  assert.ok(!noDates.includes("budget per person"));
  assert.ok(!noDates.includes("Starting from:"));
  assert.ok(noDates.includes("Duration: 4 days."));
});

test("normalizes untrusted form text, bounds group size, and never exceeds the chat contract",()=>{
  const prompt=buildSmartTripPrompt({
    destination:"  Beijing \n   &  Tianjin ",
    origin:"Chennai\tIndia",
    days:99,travelers:500,style:"bad-value",food:"fake-food",currency:"DOGE",
    interests:["heritage","heritage","fake",...TRIP_INTERESTS],notes:"a".repeat(400)
  });
  assert.match(prompt,/Destination: Beijing & Tianjin/);
  assert.match(prompt,/Starting from: Chennai India/);
  assert.match(prompt,/Duration: 4 days/);
  assert.match(prompt,/Group: 2 travelers/);
  assert.match(prompt,/balanced sightseeing/);
  assert.match(prompt,/no specific food restrictions/);
  assert.match(prompt,/history and heritage/);
  assert.equal((prompt.match(/history and heritage/g)||[]).length,1);
  assert.ok(prompt.length<=1500);
  assert.ok(!prompt.includes("a".repeat(180)));
});

test("planner choice vocabularies stay explicit and stable",()=>{
  assert.deepEqual(TRIP_STYLES,["balanced","relaxed","adventure","culture","family"]);
  assert.deepEqual(TRIP_FOOD,["none","vegetarian","vegan","halal"]);
  assert.deepEqual(TRIP_CURRENCIES,["CNY","SGD","INR","USD","EUR"]);
  assert.ok(TRIP_INTERESTS.length>=6);
});

test("full-access guided form respects keyboard focus, scroll locking and mobile layouts",async()=>{
  const modal=await read("components/SmartTripPlanner.jsx");
  const css=await read("app/smart-trip-planner.css");
  const layout=await read("app/layout.jsx");
  assert.match(modal,/role="dialog" aria-modal="true"/);
  assert.match(modal,/aria-labelledby="smart-planner-title"/);
  assert.match(modal,/onMouseDown=\{event=>/);
  assert.match(modal,/event\.key==="Escape"/);
  assert.match(modal,/event\.key!=="Tab"/);
  assert.match(modal,/document\.body\.style\.overflow="hidden"/);
  assert.match(modal,/document\.body\.style\.overflow=oldOverflow/);
  assert.match(modal,/firstRef\.current\?\.focus\(\)/);
  assert.match(modal,/buildSmartTripPrompt\(fields,language\)/);
  assert.match(modal,/onCompose\(prompt\)/);
  assert.match(modal,/maxLength=\{170\}/);
  assert.match(modal,/type="date"/);
  assert.match(modal,/type="number"/);
  assert.match(modal,/aria-pressed=\{fields\.style===style\}/);
  assert.match(modal,/aria-pressed=\{fields\.interests\.includes\(interest\)\}/);
  assert.match(modal,/createPortal\(/);
  assert.match(css,/@media\(max-width:720px\)/);
  assert.match(css,/@media\(max-width:375px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css,/\.smart-planner-backdrop/);
  assert.match(css,/\.smart-planner-submit/);
  assert.ok(layout.includes('import "./smart-trip-planner.css";'));
  assert.ok(layout.indexOf('import "./smart-trip-planner.css";')>layout.indexOf('import "./tourmate-polish.css";'));
  assert.doesNotMatch(modal,/fetch\(|dangerouslySetInnerHTML|window\.open|localStorage/);
  assert.doesNotMatch(css,/@import|url\(https?:\/\/|@font-face/);
});

test("planner works from sidebar, topnav and both welcome and active-chat views",async()=>{
  const ui=await read("components/ChatShell.jsx");
  assert.match(ui,/import SmartTripPlanner from "\.\/SmartTripPlanner\.jsx";/);
  assert.match(ui,/function openTripPlanner\(event\)/);
  assert.ok((ui.match(/onClick=\{openTripPlanner\}/g)||[]).length>=4);
  assert.match(ui,/className="smart-planner-welcome"/);
  assert.match(ui,/className="chat-plan-trip"/);
  assert.match(ui,/plannerOpen && persona\?\.id === DEFAULT_PERSONA_ID && !needsAuthentication/);
  assert.match(ui,/<SmartTripPlanner language=\{language\} onClose=\{closeTripPlanner\} onCompose=\{composeSmartTrip\}\/>/);
  assert.match(ui,/function composeSmartTrip\(prompt\)[\s\S]*?chooseSuggestion\(prompt\)/);
  assert.match(ui,/plannerTriggerRef\.current\?\.focus\(\)/);
  assert.match(ui,/function submitMessage\(event\)/);
  assert.match(ui,/onClick=\{downloadItineraryPdf\}/);
  assert.match(ui,/onClick=\{startNewTrip\}/);
  assert.doesNotMatch(ui,/ChinaWorldExplorer/);
});
