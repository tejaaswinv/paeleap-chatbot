"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ChinaLandscape from "./ChinaLandscape.jsx";

/**
 * Immersive, self-contained China diorama. Opens only after a click.
 * Uses CSS 3D planes and capped, requestAnimationFrame-throttled pointer
 * movement, not WebGL or external assets. All landmarks launch real AI
 * questions: nothing here is a pre-generated trip response.
 */
const STOPS = [
  {
    id: "beijing", mark: "京", en: "Imperial Beijing", zh: "京城旧梦",
    questionEn: "Create a memorable cultural itinerary in Beijing with the Forbidden City, traditional hutongs and a Great Wall day trip, including sensible travel buffers.",
    questionZh: "请规划富有文化特色的北京旅行行程，包括故宫、传统胡同和一天长城体验，合理安排交通时间。"
  },
  {
    id: "hangzhou", mark: "杭", en: "Misty Hangzhou", zh: "烟雨杭州",
    questionEn: "Plan a beautiful Hangzhou itinerary around West Lake, tea villages, classical gardens and authentic local culture.",
    questionZh: "请规划杭州的诗意旅行，包含西湖、茶村、园林和具有地方特色的文化体验。"
  },
  {
    id: "heritage", mark: "古", en: "Ancient China", zh: "千年古韵",
    questionEn: "Recommend an immersive China travel route through beautiful ancient towns and heritage landscapes, with realistic transport between stops.",
    questionZh: "请推荐一条中国古镇与文化遗产深度旅行线路，景点优美并安排合理的城际交通。"
  }
];

const STAR_FIELD = [
  [7,13],[12,29],[17,10],[23,22],[28,7],[33,15],[38,27],[44,9],
  [49,21],[55,6],[59,17],[64,12],[69,28],[73,9],[79,19],[85,6],
  [90,22],[94,11],[9,41],[21,37],[37,42],[52,34],[67,41],[82,38]
];

const clamp = (n,min,max) => Math.min(max,Math.max(min,n));

export default function ChinaWorldExplorer({ language = "en", onClose, onSelectPrompt }) {
  const [atmosphere,setAtmosphere] = useState("sunset");
  const [zoom,setZoom] = useState(1);
  const [angle,setAngle] = useState(0);
  const modalRef = useRef(null);
  const closeRef = useRef(null);
  const worldRef = useRef(null);
  const frameRef = useRef(0);
  const mouseRef = useRef({x:0,y:0});
  const active = useRef(true);
  const zh = language === "zh";

  useEffect(()=>{
    if(typeof document==="undefined")return undefined;
    active.current = true;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(event) {
      if(event.key==="Escape") {event.preventDefault();onClose();return;}
      if(event.key!=="Tab")return;
      const focusables = modalRef.current?.querySelectorAll(
        'button:not(:disabled),input:not(:disabled),[tabindex="0"]'
      );
      if(!focusables?.length)return;
      const first=focusables[0], last=focusables[focusables.length-1];
      if(event.shiftKey && document.activeElement===first) {
        event.preventDefault();last.focus();
      } else if(!event.shiftKey && document.activeElement===last) {
        event.preventDefault();first.focus();
      }
    }
    document.addEventListener("keydown",onKeyDown);
    return ()=>{
      active.current=false;
      document.removeEventListener("keydown",onKeyDown);
      document.body.style.overflow=oldOverflow;
      if(frameRef.current)cancelAnimationFrame(frameRef.current);
    };
  },[onClose]);

  function paint() {
    frameRef.current=0;
    if(!active.current || !worldRef.current)return;
    const {x,y}=mouseRef.current;
    worldRef.current.style.setProperty("--cinematic-tilt-x",(-y*5-2).toFixed(2)+"deg");
    worldRef.current.style.setProperty("--cinematic-tilt-y",(x*13+angle).toFixed(2)+"deg");
  }
  function moveScene(event) {
    if(typeof window==="undefined" ||
       window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
       !window.matchMedia("(hover: hover) and (pointer: fine)").matches ||
       (event.pointerType && event.pointerType!=="mouse" && event.pointerType!=="pen"))return;
    const rect=modalRef.current?.querySelector(".cinematic-stage")?.getBoundingClientRect();
    if(!rect?.width||!rect?.height)return;
    mouseRef.current={
      x:clamp((event.clientX-rect.left)/rect.width*2-1,-1,1),
      y:clamp((event.clientY-rect.top)/rect.height*2-1,-1,1)
    };
    if(!frameRef.current)frameRef.current=requestAnimationFrame(paint);
  }
  function resetScene() {
    mouseRef.current={x:0,y:0};
    if(!frameRef.current)frameRef.current=requestAnimationFrame(paint);
  }
  function rotate(direction) {
    setAngle(a=>clamp(a+direction*18,-54,54));
  }
  useEffect(()=>{
    if(!worldRef.current)return;
    worldRef.current.style.setProperty("--cinematic-tilt-y",(mouseRef.current.x*13+angle).toFixed(2)+"deg");
  },[angle]);

  function choose(stop) {
    onSelectPrompt?.(zh?stop.questionZh:stop.questionEn);
    onClose(false);
  }

  if(typeof document==="undefined")return null;
  return createPortal(
    <div className="cinematic-overlay" ref={modalRef} role="dialog"
      aria-modal="true" aria-labelledby="cinematic-title"
      data-atmosphere={atmosphere}>
      <div className="cinematic-backdrop" aria-hidden="true"/>
      <header className="cinematic-header">
        <div className="cinematic-brand">
          <span className="cinematic-brand-seal" aria-hidden="true">游</span>
          <span><strong>TourMate</strong><small>{zh?"山海行记 · 三维旅境":"SHANSHUI · IMMERSIVE CHINA"}</small></span>
        </div>
        <div className="cinematic-header-right">
          <span className="cinematic-discovery-label">{zh?"探索中国":"DISCOVER CHINA"}</span>
          <button ref={closeRef} type="button" className="cinematic-close" onClick={()=>onClose()}
            aria-label={zh?"关闭沉浸式场景":"Close immersive 3D view"}>
            <span aria-hidden="true">×</span><span>{zh?"返回":"Close"}</span>
          </button>
        </div>
      </header>

      <div className="cinematic-stage" onPointerMove={moveScene} onPointerLeave={resetScene}>
        <div className="cinematic-world" ref={worldRef}
          style={{"--cinematic-zoom":zoom}}>
          <div className="cinematic-sky" aria-hidden="true">
            {STAR_FIELD.map(([x,y],i)=><i key={i} className="cinematic-star"
              style={{left:x+"%",top:y+"%",animationDelay:(i%7)*-.47+"s"}}/>)}
            <span className="cinematic-moon"/>
            <span className="cinematic-sun-halo"/>
          </div>
          <div className="cinematic-mountain-plane" aria-hidden="true"><ChinaLandscape/></div>
          <div className="cinematic-water-plane" aria-hidden="true"/>
          <div className="cinematic-pagoda" aria-hidden="true">
            <div className="cinematic-pagoda-spire"/>
            <div className="cinematic-pagoda-level level-one"><i className="cinematic-roof"/><i className="cinematic-pillars"/></div>
            <div className="cinematic-pagoda-level level-two"><i className="cinematic-roof"/><i className="cinematic-pillars"/></div>
            <div className="cinematic-pagoda-level level-three"><i className="cinematic-roof"/><i className="cinematic-pillars"/></div>
            <div className="cinematic-pagoda-base"/>
          </div>
          <div className="cinematic-foreground" aria-hidden="true">
            <span className="cinematic-lotus lotus-one"/><span className="cinematic-lotus lotus-two"/>
            <span className="cinematic-lotus lotus-three"/>
          </div>
          <div className="cinematic-petals" aria-hidden="true">
            {Array.from({length:11},(_,i)=><span key={i} style={{left:(4+i*8.5)+"%",animationDelay:-(i%6)*2.3+"s"}}/>)}
          </div>
        </div>

        <div className="cinematic-story">
          <span className="cinematic-eyebrow">{zh?"一眼千年 · 在山海之间":"ANOTHER WORLD AWAITS"}</span>
          <h2 id="cinematic-title"><span>山海奇遇</span><strong>{zh?"走进诗画中国":"Step into another China."}</strong></h2>
          <p>{zh
            ?"穿过山水与灯火，选择一个目的地，让 AI 为你设计独特的旅程。"
            :"Wander through mountains, ancient rooftops and lantern light. Choose a place and let AI turn it into your own journey."}</p>
          <div className="cinematic-story-rule" aria-hidden="true"><i/><span>✧</span><i/></div>
        </div>

        <nav className="cinematic-hotspots" aria-label={zh?"选择旅行灵感":"Choose a trip to plan"}>
          {STOPS.map((stop,i)=>(
            <button key={stop.id} type="button"
              className={"cinematic-hotspot hotspot-"+stop.id}
              onClick={()=>choose(stop)}>
              <span className="cinematic-hotspot-glow"/>
              <span className="cinematic-hotspot-seal" aria-hidden="true">{stop.mark}</span>
              <span className="cinematic-hotspot-text">{zh?stop.zh:stop.en}<small>{zh?"AI 行程灵感":"Plan with AI"}</small></span>
              <span className="cinematic-hotspot-arrow" aria-hidden="true">↗</span>
            </button>
          ))}
        </nav>
      </div>

      <footer className="cinematic-toolbar">
        <div className="cinematic-atmosphere" role="group"
          aria-label={zh?"切换天空氛围":"Choose the scene atmosphere"}>
          <button type="button" className={atmosphere==="sunset"?"active":""}
            aria-pressed={atmosphere==="sunset"} onClick={()=>setAtmosphere("sunset")}>
            <span aria-hidden="true">☀</span>{zh?"黄昏":"Golden hour"}
          </button>
          <button type="button" className={atmosphere==="night"?"active":""}
            aria-pressed={atmosphere==="night"} onClick={()=>setAtmosphere("night")}>
            <span aria-hidden="true">☾</span>{zh?"灯火":"Lantern night"}
          </button>
        </div>
        <div className="cinematic-navigation">
          <button type="button" aria-label={zh?"向左旋转场景":"Rotate scene left"}
            onClick={()=>rotate(-1)}>↶</button>
          <label htmlFor="cinematic-zoom">{zh?"远近":"Zoom"}</label>
          <input id="cinematic-zoom" type="range" min="0.85" max="1.2" step="0.05"
            value={zoom} onChange={event=>setZoom(Number(event.target.value))}
            aria-label={zh?"调整三维场景缩放":"Adjust 3D scene zoom"}/>
          <button type="button" aria-label={zh?"向右旋转场景":"Rotate scene right"}
            onClick={()=>rotate(1)}>↷</button>
        </div>
        <span className="cinematic-hint">{zh?"移动光标探索 · 点击地标开始规划":"MOVE TO EXPLORE · SELECT A DESTINATION"}</span>
      </footer>
    </div>,
    document.body
  );
}
