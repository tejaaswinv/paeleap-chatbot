"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { buildSmartTripPrompt, TRIP_FOOD, TRIP_INTERESTS, TRIP_STYLES } from "../lib/client/smart-trip-planner.js";

const WORDS = {
  en: {
    eyebrow:"旅 · YOUR JOURNEY, REIMAGINED",
    title:"Plan something unforgettable.",
    description:"Tell TourMate how you like to travel. Your preferences become a personalized request for the AI — not a prewritten itinerary.",
    close:"Close trip planner",destination:"Where in China?",destinationHint:"e.g. Beijing, Hangzhou or Chengdu",
    origin:"Starting from",originHint:"Optional city or country",duration:"Days",travelers:"Travelers",
    date:"Departure date",dateHint:"Optional; no live availability checked",budget:"Total budget per person",
    budgetHint:"Optional — do not include currency symbols",currency:"Currency",
    style:"Your travel pace",food:"Food preferences",interests:"What excites you?",
    notes:"Anything else?",notesHint:"Accessibility, must-see places, transport, priorities…",
    generate:"Prepare my AI itinerary",disclaimer:"You can review and edit the request before sending it. AI suggestions aren't live bookings, confirmed prices or schedules.",
    styles:["Balanced","Slow & scenic","Adventure","Culture & heritage","Family-friendly"],
    foods:["No preference","Vegetarian","Vegan","Halal-friendly"],
    interests:["Heritage","Nature","Local food","Markets","Photography","Hidden gems"],
    error:"Please check your trip details."
  },
  zh: {
    eyebrow:"旅 · 专属中国之旅",
    title:"定制你的中国旅行。",
    description:"告诉 TourMate 你想怎样旅行。我们会生成可编辑的 AI 行程请求，而不是套用固定路线。",
    close:"关闭行程规划器",destination:"中国旅行目的地",destinationHint:"例如：北京、杭州、成都",
    origin:"从哪里出发",originHint:"可选：城市或国家",duration:"天数",travelers:"出行人数",
    date:"出发日期",dateHint:"可选；不会查询实时余票",budget:"每人总预算",
    budgetHint:"可选，仅填写数字",currency:"币种",
    style:"旅行节奏",food:"饮食偏好",interests:"喜欢的旅行体验",
    notes:"其他要求",notesHint:"无障碍设施、必去景点、交通偏好…",
    generate:"生成 AI 行程请求",disclaimer:"发送前可查看和修改请求；AI 建议不代表实时票价、交通时刻或预订结果。",
    styles:["平衡探索","轻松慢游","户外冒险","文化体验","亲子友好"],
    foods:["无特别要求","素食","纯素","清真友好"],
    interests:["历史文化","自然风光","当地美食","逛街市集","摄影打卡","小众体验"],
    error:"请检查所填信息。"
  }
};

const DEFAULTS = {
  destination:"",origin:"",days:4,travelers:2,startDate:"",
  budget:"",currency:"CNY",style:"balanced",food:"none",
  interests:["heritage","nature"],notes:""
};

export default function SmartTripPlanner({ language = "en", onClose, onCompose }) {
  const [fields,setFields] = useState(DEFAULTS);
  const [error,setError] = useState("");
  const panelRef = useRef(null);
  const firstRef = useRef(null);
  const t = WORDS[language === "zh" ? "zh" : "en"];

  useEffect(() => {
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow="hidden";
    firstRef.current?.focus();
    function handleKeyDown(event) {
      if(event.key==="Escape") {
        event.preventDefault();onClose();return;
      }
      if(event.key!=="Tab")return;
      const focusable=[...(panelRef.current?.querySelectorAll(
        "button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)"
      )||[])].filter(element=>element.getClientRects().length);
      if(!focusable.length)return;
      const first=focusable[0],last=focusable.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
    document.addEventListener("keydown",handleKeyDown);
    return()=>{
      document.body.style.overflow=oldOverflow;
      document.removeEventListener("keydown",handleKeyDown);
    };
    // The dialog owns its close action throughout its single mounted lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  function update(key,value){
    setFields(current=>({...current,[key]:value}));
    if(error)setError("");
  }
  function toggleInterest(key){
    setFields(current=>({
      ...current,interests:current.interests.includes(key)
        ? current.interests.filter(item=>item!==key)
        : current.interests.length>=4 ? current.interests : [...current.interests,key]
    }));
  }
  function submit(event){
    event.preventDefault();
    try{
      const prompt=buildSmartTripPrompt(fields,language);
      setError("");
      onCompose(prompt);
    }catch(problem){
      setError(problem instanceof Error?problem.message:t.error);
    }
  }
  if(typeof document==="undefined")return null;
  return createPortal(
    <div className="smart-planner-backdrop" role="presentation" onMouseDown={event=>{
      if(event.target===event.currentTarget)onClose();
    }}>
      <section className="smart-planner" role="dialog" aria-modal="true"
        aria-labelledby="smart-planner-title" ref={panelRef}>
        <div className="smart-planner-top">
          <div className="smart-planner-title-group">
            <span className="smart-planner-seal" aria-hidden="true">行</span>
            <div>
              <p className="smart-planner-eyebrow">{t.eyebrow}</p>
              <h2 id="smart-planner-title">{t.title}</h2>
            </div>
          </div>
          <button className="smart-planner-close" type="button" onClick={onClose} aria-label={t.close}>
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <p className="smart-planner-intro">{t.description}</p>
        <form id="smart-planner-form" className="smart-planner-form" onSubmit={submit}>
          <div className="smart-planner-grid">
            <label className="smart-planner-field">
              <span>{t.destination} <em>*</em></span>
              <input ref={firstRef} value={fields.destination} onChange={event=>update("destination",event.target.value)}
                placeholder={t.destinationHint} maxLength={80} autoComplete="off" required/>
            </label>
            <label className="smart-planner-field">
              <span>{t.origin}</span>
              <input value={fields.origin} onChange={event=>update("origin",event.target.value)}
                placeholder={t.originHint} maxLength={80} autoComplete="off"/>
            </label>
          </div>
          <div className="smart-planner-grid planner-grid-4">
            <label className="smart-planner-field">
              <span>{t.duration}</span>
              <input type="number" min={1} max={21} step={1} value={fields.days}
                onChange={event=>update("days",event.target.value)} required/>
            </label>
            <label className="smart-planner-field">
              <span>{t.travelers}</span>
              <input type="number" min={1} max={12} step={1} value={fields.travelers}
                onChange={event=>update("travelers",event.target.value)} required/>
            </label>
            <label className="smart-planner-field">
              <span>{t.date}</span>
              <input type="date" value={fields.startDate} onChange={event=>update("startDate",event.target.value)}
                aria-describedby="smart-planner-date-note"/>
            </label>
            <label className="smart-planner-field">
              <span>{t.currency}</span>
              <select value={fields.currency} onChange={event=>update("currency",event.target.value)}>
                {["CNY","SGD","INR","USD","EUR"].map(currency=>
                  <option key={currency} value={currency}>{currency}</option>)}
              </select>
            </label>
          </div>
          <div className="smart-planner-grid">
            <label className="smart-planner-field">
              <span>{t.budget}</span>
              <input type="number" min={1} max={1000000} step={1} value={fields.budget}
                placeholder={t.budgetHint} onChange={event=>update("budget",event.target.value)}/>
            </label>
            <div className="smart-planner-field smart-planner-food">
              <span id="smart-planner-food-label">{t.food}</span>
              <div className="smart-planner-select-wrap">
                <select value={fields.food} onChange={event=>update("food",event.target.value)}
                  aria-labelledby="smart-planner-food-label">
                  {TRIP_FOOD.map((food,i)=><option key={food} value={food}>{t.foods[i]}</option>)}
                </select>
              </div>
            </div>
          </div>
          <fieldset className="smart-planner-group">
            <legend>{t.style}</legend>
            <div className="smart-planner-chip-list" role="group">
              {TRIP_STYLES.map((style,i)=><button type="button" key={style}
                aria-pressed={fields.style===style} className={fields.style===style?"selected":""}
                onClick={()=>update("style",style)}>{t.styles[i]}</button>)}
            </div>
          </fieldset>
          <fieldset className="smart-planner-group">
            <legend>{t.interests} <small>{language==="zh"?"最多选 4 项":"Choose up to 4"}</small></legend>
            <div className="smart-planner-chip-list">
              {TRIP_INTERESTS.map((interest,i)=><button type="button" key={interest}
                aria-pressed={fields.interests.includes(interest)}
                className={fields.interests.includes(interest)?"selected":""}
                disabled={!fields.interests.includes(interest)&&fields.interests.length>=4}
                onClick={()=>toggleInterest(interest)}>{t.interests[i]}</button>)}
            </div>
          </fieldset>
          <label className="smart-planner-field">
            <span>{t.notes}</span>
            <textarea rows={2} maxLength={170} value={fields.notes}
              onChange={event=>update("notes",event.target.value)} placeholder={t.notesHint}/>
          </label>
          <p className="smart-planner-date-note" id="smart-planner-date-note">{t.dateHint}</p>
          {error&&<p className="smart-planner-error" role="alert">{error}</p>}
          <div className="smart-planner-footer">
            <p>{t.disclaimer}</p>
            <button type="submit" className="smart-planner-submit">
              <span aria-hidden="true">✧</span>{t.generate}<span aria-hidden="true">↗</span>
            </button>
          </div>
        </form>
      </section>
    </div>,
    document.body
  );
}
