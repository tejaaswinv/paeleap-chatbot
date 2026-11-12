"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AuthPanel from "./AuthPanel.jsx";
import TravelMessage from "./TravelMessage.jsx";
import SmartTripPlanner from "./SmartTripPlanner.jsx";
import ChinaLandscape from "./ChinaLandscape.jsx";
import China3DScene from "./China3DScene.jsx";
import ChinaDestinationArt from "./ChinaDestinationArt.jsx";
import ChinaHeroOrnament from "./ChinaHeroOrnament.jsx";
import { applyCardDepth, resetCardDepth } from "../lib/client/visual-depth.js";
import useTripHistory from "./useTripHistory.js";
import { getSupabaseBrowserClient } from "../lib/client/supabase.js";
import { localHistoryForRequest } from "../lib/client/trips.js";
import { travelRefinementActions, downloadableTravelPlan, formatTravelPlanDownload } from "../lib/client/travel-actions.js";
import { compileItinerary, createItineraryPdf } from "../lib/client/itinerary-pdf.js";
import { DEFAULT_PERSONA_ID, parsePublicPersona, personaIdFromSearch, provenanceLabel } from "../lib/client/personas.js";
import {
  MAX_MESSAGE_LENGTH,
  SAFETY_LABELS,
  SAFETY_REASON_LABELS,
  buildChatBody,
  chatErrorMessage,
  makeMessageId,
  parseChatResponse
} from "../lib/client/chat.js";

const text = {
  en: {
    brandTag: "山海行记 · EXPLORE CHINA",
    newTrip: "New chat",
    recent: "TRIP HISTORY",
    untitledTrip: "New trip",
    tripNavigation: "Saved trips",
    openTrips: "Open trips",
    closeTrips: "Close trips",
    historyLoading: "Loading your saved conversation…",
    historyError: "Your saved conversation couldn't be loaded. Try again.",
    syncError: "Saved trips couldn't be synced. Your local chats are still available.",
    storageError: "This browser couldn't save your history. Chats will remain available while this page is open.",
    emptyTrip: "Your first plan starts here",
    trustTitle: "Designed for safer travel",
    trustBody: "Administrator-selected knowledge with server-side scope and safety checks.",
    disclaimer: "AI can make mistakes. Confirm live hours, prices and transport with official providers.",
    signOut: "Sign out",
    localDemo: "Offline FAQ mode",
    localAi: "Local AI",
    privateSession: "Private session",
    unavailable: "Status unavailable",
    connectionTitle: "Let's reconnect",
    connectionBody: "TourMate couldn't reach the chat service. Check your connection and try again.",
    retry: "Try again",
    welcomeKicker: "YOUR CHINA TRAVEL COMPANION",
    welcomeTitle: "A thousand journeys. One unforgettable China.",
    welcomeBody: "Your AI travel companion for a deeper, more personal China journey.",
    composerLabel: "Ask TourMate",
    placeholder: "Ask me anything about travelling in China…",
    send: "Send message",
    stop: "Stop response",
    enterHint: "Enter to send · Shift + Enter for a new line",
    sourceTitle: "Reference links",
    receiptTitle: "Answer sources & limits",
    receiptCurated: "Drawn from curated guide records, not independently checked live.",
    receiptAI: "Written by AI using general travel knowledge and any relevant guide context. Not independently fact-checked; verify changing details with official providers.",
    receiptBrief: "Only explicitly named places and stated preferences in this trip's recent messages. No long-term profile or live booking information.",
    receiptPrepared: "Fixed restaurant phrases prepared by TourMate. Ask staff to confirm ingredients; not a medical or allergy guarantee.",
    receiptProfile: "Identity supplied by the published museum assistant profile.",
    receiptSafety: "A safety response from TourMate's application rules; not a live verification of a website, merchant, or payment.",
    receiptUnanswered: "No supported reference answer was returned.",
    receiptRefs: "Reference links supplied",
    receiptVersion: "Knowledge profile version",
    receiptNoLive: "Live prices, hours, closures and source pages were not checked.",
    receiptDegraded: "The AI provider was unavailable; a fallback was used.",
    faqLabel: "Travel FAQ",
    copied: "Copied",
    copy: "Copy response",
    dismiss: "Dismiss",
    thinking: "Following the winding roads…",
    loading: "Preparing your travel space…",
    profileError: "This assistant profile could not be loaded. Check the museum link or try again.",
    profileTitle: "Assistant unavailable",
    profileVersion: "Profile version",
    today: "Current conversation",
    quickTools: [
      { key: "trip_brief", title: "Trip brief", prompt: "Show my TourMate trip brief" },
      { key: "arrival_checklist", title: "Arrival checklist", prompt: "Show my China arrival checklist" },
      { key: "vegetarian_card", title: "Food phrase card", prompt: "Show my vegetarian restaurant phrase card" },
      { key: "reference_directory", title: "Reference guide", prompt: "Show TourMate official reference links" },
      { key: "heritage_choice", title: "Heritage choice", prompt: "Show West Lake vs Grand Canal choice card" }
    ],
    suggestions: [
      { title: "Imperial Beijing", body: "Palaces · History · Culture", prompt: "Plan a 4-day 3-night Beijing trip with temples, old neighborhoods and a Great Wall day trip." },
      { title: "Misty Hangzhou", body: "Lakes · Gardens · Poetry", prompt: "Plan a beautiful and relaxed 2-day itinerary for Hangzhou including West Lake, tea villages and local cultural experiences." },
      { title: "Ancient Heritage", body: "Old towns · Silk Road · Culture", prompt: "Recommend underrated heritage towns and memorable cultural experiences in China for a first-time traveler." }
    ]
  },
  zh: {
    brandTag: "AI 智能旅行伴侣",
    newTrip: "新对话",
    recent: "旅途记录",
    untitledTrip: "新行程",
    tripNavigation: "已保存行程",
    openTrips: "打开行程列表",
    closeTrips: "关闭行程列表",
    historyLoading: "正在加载已保存的对话…",
    historyError: "无法加载已保存的对话，请重试。",
    syncError: "无法同步已保存行程，本地对话仍可使用。",
    storageError: "浏览器无法保存历史记录。当前页面保持打开时仍可查看对话。",
    emptyTrip: "从这里开始你的第一个计划",
    trustTitle: "为安心旅行而设计",
    trustBody: "使用管理员配置的知识资料，并执行服务端范围和安全检查。",
    disclaimer: "AI 可能出错。实时开放时间、票价和交通信息请以官方渠道为准。",
    signOut: "退出登录",
    localDemo: "离线问答模式",
    localAi: "本地 AI",
    privateSession: "私密会话",
    unavailable: "状态不可用",
    connectionTitle: "请重新连接",
    connectionBody: "无法连接到聊天服务，请检查网络后重试。",
    retry: "重试",
    welcomeKicker: "你的中国旅行伴侣",
    welcomeTitle: "一程山水，一段故事。",
    welcomeBody: "从云雾缭绕的山间古镇，到灯火璀璨的城市街巷，让 AI 旅伴陪你写下独一无二的中国旅程。",
    composerLabel: "询问 TourMate",
    placeholder: "询问中国旅游相关问题…",
    send: "发送消息",
    stop: "停止回复",
    enterHint: "按 Enter 发送 · Shift + Enter 换行",
    sourceTitle: "参考资料链接",
    receiptTitle: "回答依据",
    receiptCurated: "内容来自经整理的导览资料，本次没有进行实时独立核查。",
    receiptAI: "由 AI 根据通用旅游知识及相关参考资料生成，未实时核实。请通过官方渠道确认可能变化的信息。",
    receiptBrief: "仅整理本次行程最近消息中明确提到的地点及偏好，不使用长期个人资料或实时预订数据。",
    receiptPrepared: "由 TourMate 提供的固定点餐短语，请向工作人员确认食材，不保证过敏原安全。",
    receiptProfile: "助手身份来自场馆管理员发布的配置。",
    receiptSafety: "此回复由 TourMate 应用安全规则生成，并未实时核验网站、商户或交易。",
    receiptUnanswered: "目前没有足够的已收录资料支持回答。",
    receiptRefs: "附带参考链接",
    receiptVersion: "知识配置版本",
    receiptNoLive: "未实时核查票价、开放时间、关闭情况或链接页面。",
    receiptDegraded: "AI 服务暂不可用，已启用备用回答。",
    faqLabel: "旅游问答",
    copied: "已复制",
    copy: "复制回复",
    dismiss: "关闭",
    thinking: "正在寻访山海之间…",
    loading: "正在准备你的旅行空间…",
    profileError: "无法加载此助手配置，请检查场馆链接或重试。",
    profileTitle: "助手暂不可用",
    profileVersion: "配置版本",
    today: "当前对话",
    quickTools: [
      { key: "trip_brief", title: "旅途摘要", prompt: "查看我的旅途摘要" },
      { key: "arrival_checklist", title: "入境清单", prompt: "查看中国入境准备清单" },
      { key: "vegetarian_card", title: "素食沟通卡", prompt: "查看素食点餐沟通卡" },
      { key: "reference_directory", title: "参考入口", prompt: "查看旅伴官方参考链接" },
      { key: "heritage_choice", title: "景点对比", prompt: "查看西湖与大运河对比卡" }
    ],
    suggestions: [
      { title: "京城旧梦", body: "四天走进北京的古今", prompt: "帮我规划北京4天3晚行程，包含故宫、老胡同和一天长城体验。" },
      { title: "烟雨杭州", body: "西湖茶山与慢生活", prompt: "帮我规划杭州两日悠闲行程，包含西湖、茶园和当地文化体验。" },
      { title: "寻访古韵", body: "探索更小众的中国", prompt: "推荐中国适合初次游客的小众古镇和有特色的传统文化体验。" }
    ]
  }
};

function Icon({ name, size = 20 }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  if (name === "plus") return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
  if (name === "home") return <svg {...common}><path d="m3 10 9-7 9 7v10H3V10Z"/><path d="M9 20v-7h6v7"/></svg>;
  if (name === "calendar") return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18"/></svg>;
  if (name === "compass") return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.4 4.6-4.6 2.4 2.4-4.6 4.6-2.4Z"/></svg>;
  if (name === "book") return <svg {...common}><path d="M12 6C9 4 6 4 3 5v14c4-2 6-2 9 0 3-2 5-2 9 0V5c-3-1-6-1-9 1Zm0 0v13"/></svg>;
  if (name === "history") return <svg {...common}><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/><path d="M12 7v5l3 2"/></svg>;
  if (name === "menu") return <svg {...common}><path d="M4 6h16M4 12h16M4 18h16" /></svg>;
  if (name === "close") return <svg {...common}><path d="m6 6 12 12M18 6 6 18" /></svg>;
  if (name === "send") return <svg {...common}><path d="m21 3-7.5 18-4.2-7.8L3 9l18-6Z" /><path d="m9.3 13.2 4.2-4.2" /></svg>;
  if (name === "shield") return <svg {...common}><path d="M12 3 5 6v5c0 4.8 2.8 8.1 7 10 4.2-1.9 7-5.2 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-5" /></svg>;
  if (name === "copy") return <svg {...common}><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>;
  if (name === "link") return <svg {...common}><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1.1" /><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1" /></svg>;
  if (name === "spark") return <svg {...common}><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z" /><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" /></svg>;
  if (name === "stop") return <svg {...common}><rect x="6" y="6" width="12" height="12" rx="2" /></svg>;
  if (name === "download") return <svg {...common}><path d="M12 3v12m-4-4 4 4 4-4" /><path d="M5 17v3h14v-3" /></svg>;
  if (name === "logout") return <svg {...common}><path d="M10 17l5-5-5-5M15 12H3" /><path d="M15 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" /></svg>;
  return null;
}

function Brand({ name = "paeleap", avatar = "旅" }) {
  return (
    <div className="brand" aria-label={name}>
      <span className="brand-symbol" aria-hidden="true"><span>{avatar}</span></span>
      <span className="brand-name">{name}</span>
    </div>
  );
}

function SafetyBadge({ status, reason, language }) {
  if (!status || status === "allowed") return null;
  const label = status === "redirected" && reason
    ? SAFETY_REASON_LABELS[language][reason] || SAFETY_LABELS[language][status]
    : SAFETY_LABELS[language][status];
  return (
    <span className={`safety-badge safety-${status}`}>
      <Icon name="shield" size={14} />
      {label}
    </span>
  );
}

function Message({ message, language, copied, onCopy, avatar }) {
  const t = text[language];
  const assistant = message.role === "assistant";
  return (
    <article className={`message-row ${assistant ? "assistant-row" : "user-row"}`}>
      {assistant && <div className="assistant-avatar" aria-hidden="true">{avatar}</div>}
      <div className="message-column">
        <div className={`message-bubble ${assistant ? "assistant-bubble" : "user-bubble"}`}>
          {assistant ? <TravelMessage content={message.content}/> : <p>{message.content}</p>}
        </div>
          <div className="message-meta">
            {message.createdAt && <time className="message-time" dateTime={message.createdAt}
              title={new Date(message.createdAt).toLocaleString(language === "zh" ? "zh-CN" : "en-US")}>
              {new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", { hour: "2-digit", minute: "2-digit" }).format(new Date(message.createdAt))}
            </time>}
            {assistant && <SafetyBadge status={message.safety} reason={message.safetyReason} language={language} />}
            {assistant && message.faq && <span className="grounded-label" title={message.faq.question}>{t.faqLabel} · {message.faq.id}</span>}
            {assistant && message.safety === "allowed" && provenanceLabel(message.ai?.mode, language) && (
              <span className="grounded-label">{provenanceLabel(message.ai.mode, language)}</span>
            )}
            {assistant && <button className="copy-button" type="button" onClick={() => onCopy(message)} aria-label={t.copy}>
              <Icon name="copy" size={14} />{copied === message.id ? t.copied : t.copy}
            </button>}
          </div>
        {assistant && message.trust && (
          <details className="trust-passport">
            <summary><Icon name="shield" size={14} />{t.receiptTitle}</summary>
            <div className="trust-passport-body">
              <p>{message.trust.basis === "ai_generated" ? t.receiptAI
                : message.trust.basis === "curated_knowledge" ? t.receiptCurated
                : message.trust.basis === "user_trip_context" ? t.receiptBrief
                : message.trust.basis === "prepared_guidance" ? t.receiptPrepared
                : message.trust.basis === "published_profile" ? t.receiptProfile
                : message.trust.basis === "safety_notice" ? t.receiptSafety : t.receiptUnanswered}</p>
              <p>{t.receiptRefs}: {message.trust.referenceCount}</p>
              {message.trust.knowledgeVersion !== null && <p>{t.receiptVersion}: {message.trust.knowledgeVersion}</p>}
              <p>{t.receiptNoLive}</p>
              {message.trust.limitedByProvider && <p>{t.receiptDegraded}</p>}
            </div>
          </details>
        )}
        {assistant && message.sources?.length > 0 && (
          <div className="sources-card">
            <p><Icon name="link" size={15} />{t.sourceTitle}</p>
            <div className="source-links">
              {message.sources.map((source) => (
                <a key={`${source.name}-${source.url}`} href={source.url} target="_blank" rel="noreferrer">
                  {source.name}<span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

export default function ChatShell() {
  const [language, setLanguage] = useState("en");
  const [service, setService] = useState({ state: "loading", data: null });
  const [statusAttempt, setStatusAttempt] = useState(0);
  const [personaId, setPersonaId] = useState(null);
  const [profile, setProfile] = useState({ state: "loading", data: null });
  const [authClient, setAuthClient] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState(null);
  const [copied, setCopied] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const plannerTriggerRef = useRef(null);
  const endRef = useRef(null);
  const conversationRef = useRef(null);
  const pinnedToBottomRef = useRef(true);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [toolsExpanded, setToolsExpanded] = useState(false);
  const textareaRef = useRef(null);
  const requestsRef = useRef(new Map());
  const sidebarRef = useRef(null);
  const historyButtonRef = useRef(null);
  const t = text[language];
  const persona = profile.data;
  const personaName = persona?.name[language] || "Paeleap";
  const avatar = persona?.id === DEFAULT_PERSONA_ID ? "旅" : Array.from(personaName)[0];
  const personaReady = profile.state === "ready";

  useEffect(() => {
    function selectPersona() {
      try { setPersonaId(personaIdFromSearch(window.location.search)); }
      catch { setPersonaId(null); setProfile({ state: "error", data: null }); }
    }
    selectPersona();
    window.addEventListener("popstate", selectPersona);
    return () => window.removeEventListener("popstate", selectPersona);
  }, []);

  useEffect(() => {
    if (!personaId) return undefined;
    const controller = new AbortController();
    let active = true;
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    setProfile({ state: "loading", data: null });
    fetch(`/api/personas?id=${encodeURIComponent(personaId)}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Assistant unavailable");
        const payload = await response.json();
        const next = parsePublicPersona(payload.persona);
        if (next.id !== personaId) throw new Error("Mismatched assistant profile");
        if (active) setProfile({ state: "ready", data: next });
      })
      .catch(() => { if (active) setProfile({ state: "error", data: null }); })
      .finally(() => window.clearTimeout(timeout));
    return () => { active = false; window.clearTimeout(timeout); controller.abort(); };
  }, [personaId, statusAttempt]);

  useEffect(() => {
    if (persona) document.title = `${persona.name[language]} · ${persona.venue[language]}`;
  }, [persona, language]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("paeleap.language");
      if (saved === "zh") setLanguage("zh");
    } catch { /* The chat can run when browser storage is disabled. */ }
  }, []);

  useEffect(() => {
    try { window.localStorage.setItem("paeleap.language", language); } catch { /* Optional preference. */ }
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  }, [language]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    setService({ state: "loading", data: null });
    fetch("/api/status", { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Status unavailable");
        return response.json();
      })
      .then((data) => {
        if (data?.service !== "paeleap-tourism-ai") throw new Error("Invalid service status");
        if (active) setService({ state: "ready", data });
      })
      .catch(() => {
        if (active) setService({ state: "error", data: null });
      })
      .finally(() => window.clearTimeout(timeout));
    return () => { active = false; window.clearTimeout(timeout); controller.abort(); };
  }, [statusAttempt]);

  useEffect(() => {
    let active = true;
    let client;
    try { client = getSupabaseBrowserClient(); } catch { client = null; }
    setAuthClient(client);
    if (!client) {
      setAuthReady(true);
      return undefined;
    }
    client.auth.getSession()
      .then(({ data }) => { if (active) setSession(data.session || null); })
      .catch(() => { if (active) setSession(null); })
      .finally(() => { if (active) setAuthReady(true); });
    const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
      setAuthReady(true);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  const demoMode = service.data?.localDemoMode === true;
  const chatIdentity = !personaReady ? null : demoMode ? "demo" : session?.user?.id || null;
  const history = useTripHistory(chatIdentity, authClient, personaId || DEFAULT_PERSONA_ID);
  const { trips, activeTrip } = history;
  const messages = activeTrip?.messages || [];
  const refinementActions = travelRefinementActions(messages, language);
  const exportablePlan = downloadableTravelPlan(messages);
  const pdfExportReady = Boolean(compileItinerary(messages, language));
  const draft = activeTrip?.draft || "";
  const error = activeTrip?.error || "";
  const pending = activeTrip?.pending === true;
  const historyUnavailable = activeTrip?.loaded === false;

  useEffect(() => () => {
    for (const controller of requestsRef.current.values()) controller.abort();
    requestsRef.current.clear();
  }, [chatIdentity, personaId]);

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const media = window.matchMedia("(max-width: 720px)");
    const onResize = () => { if (!media.matches) setSidebarOpen(false); };
    const onKeyDown = (event) => {
      if (event.key === "Escape") { setSidebarOpen(false); historyButtonRef.current?.focus(); }
      if (event.key === "Tab") {
        const buttons = [...sidebarRef.current.querySelectorAll("button:not(:disabled)")].filter((button) => button.offsetParent !== null);
        const first = buttons[0]; const last = buttons.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    sidebarRef.current?.querySelector("button:not(:disabled)")?.focus();
    document.addEventListener("keydown", onKeyDown);
    media.addEventListener("change", onResize);
    return () => { document.removeEventListener("keydown", onKeyDown); media.removeEventListener("change", onResize); };
  }, [sidebarOpen]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 144)}px`;
    setCopied(null);
  }, [activeTrip?.id]);

  // Preserve the reader's position when looking at earlier itinerary days.
  // Scroll automatically only while the conversation is already at the bottom.
  useEffect(() => {
    pinnedToBottomRef.current = true;
    setShowJumpToLatest(false);
    setToolsExpanded(false);
    const container = conversationRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [activeTrip?.id]);

  useEffect(() => {
    if (!pinnedToBottomRef.current) return undefined;
    const frame = requestAnimationFrame(() => {
      const container = conversationRef.current;
      if (container && pinnedToBottomRef.current) container.scrollTop = container.scrollHeight;
    });
    return () => cancelAnimationFrame(frame);
  }, [messages.length, pending, activeTrip?.id]);

  function setDraft(value) { if (activeTrip) history.updateTrip(activeTrip.id, { draft: value }); }
  function setError(value) { if (activeTrip) history.updateTrip(activeTrip.id, { error: value }); }

  const statusLabel = useMemo(() => {
    if (service.state === "error") return t.unavailable;
    if (demoMode) return service.data?.aiMockMode === false ? t.localAi : t.localDemo;
    return t.privateSession;
  }, [demoMode, service.state, service.data?.aiMockMode, t]);

  function changeLanguage(nextLanguage) {
    setLanguage(nextLanguage);
    setError("");
  }

  function resetComposerHeight() {
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function startNewTrip() {
    history.newTrip();
    setSidebarOpen(false);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function selectTrip(id) {
    history.selectTrip(id);
    setSidebarOpen(false);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  async function signOut() {
    for (const controller of requestsRef.current.values()) controller.abort();
    requestsRef.current.clear();
    if (authClient) await authClient.auth.signOut();
  }

  async function copyMessage(message) {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(message.id);
      window.setTimeout(() => setCopied(null), 1400);
    } catch {
      setCopied(null);
    }
  }

  function downloadItineraryPdf() {
    let url;
    try {
      const result = createItineraryPdf(activeTrip?.messages || [], {language});
      if (!result) throw new Error("NO_ITINERARY");
      url = URL.createObjectURL(result.blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "tourmate-full-itinerary.pdf";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch {
      setError(language === "zh"
        ? "无法生成 PDF。请在行程中生成完整的每日计划后重试。"
        : "Couldn't create the PDF. Generate a full day-by-day itinerary and try again.");
    } finally {
      if (url) window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  function downloadTravelPlan() {
    const plan = downloadableTravelPlan(activeTrip?.messages || []);
    const content = formatTravelPlanDownload(plan, language);
    if (!content) return;
    let url;
    try {
      url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "tourmate-trip-plan.txt";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch {
      setError(language === "zh" ? "无法保存行程文件，请重试。" : "Couldn't save the itinerary file. Please try again.");
    } finally {
      if (url) window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  function resizeTextarea(event) {
    event.currentTarget.style.height = "auto";
    event.currentTarget.style.height = `${Math.min(event.currentTarget.scrollHeight, 144)}px`;
  }

  function onComposerKeyDown(event) {
    if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return;
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  function onConversationScroll(event) {
    const container = event.currentTarget;
    const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 130;
    pinnedToBottomRef.current = nearBottom;
    setShowJumpToLatest(!nearBottom && messages.length > 0);
  }

  function jumpToLatest() {
    pinnedToBottomRef.current = true;
    setShowJumpToLatest(false);
    const container = conversationRef.current;
    if (!container) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    container.scrollTo({top:container.scrollHeight,behavior:reduced?"auto":"smooth"});
  }

  function openTripPlanner(event) {
    if (!personaReady || !activeTrip || historyUnavailable || pending) return;
    plannerTriggerRef.current = event?.currentTarget || null;
    setSidebarOpen(false);
    setPlannerOpen(true);
  }

  function closeTripPlanner(restoreFocus = true) {
    setPlannerOpen(false);
    if (restoreFocus) requestAnimationFrame(() => plannerTriggerRef.current?.focus());
  }

  function composeSmartTrip(prompt) {
    closeTripPlanner(false);
    chooseSuggestion(prompt);
  }

  function chooseSuggestion(prompt) {
    setDraft(prompt);
    setError("");
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 144)}px`;
      }
    });
  }

  async function submitMessage(event) {
    event.preventDefault();
    const message = draft.trim();
    if (!personaReady || !activeTrip || historyUnavailable || !message || pending || requestsRef.current.has(activeTrip.id) || message.length > MAX_MESSAGE_LENGTH) return;
    const tripId = activeTrip.id;
    const conversationId = activeTrip.conversationId;
    const previousMessages = activeTrip.messages;

    pinnedToBottomRef.current = true;
    setShowJumpToLatest(false);
    resetComposerHeight();
    const createdAt = new Date().toISOString();
    history.updateTrip(tripId, (trip) => ({ ...trip, draft: "", error: "", pending: true,
      title: trip.title || message.slice(0, 80), updatedAt: createdAt,
      messages: [...trip.messages, { id: makeMessageId("user"), role: "user", content: message, createdAt }] }));

    const controller = new AbortController();
    requestsRef.current.set(tripId, controller);
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 90000);

    try {
      let token = null;
      if (!demoMode) {
        const { data } = authClient ? await authClient.auth.getSession() : { data: {} };
        token = data.session?.access_token;
        if (!token) {
          const sessionError = new Error("Missing session");
          sessionError.status = 401;
          throw sessionError;
        }
      }
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      controller.signal.throwIfAborted();
      const response = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({ ...buildChatBody({ message, conversationId, language, personaId }),
          ...(demoMode ? { history: localHistoryForRequest(previousMessages) } : {}) }),
        signal: controller.signal
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const requestError = new Error(payload.error || "Chat request failed");
        requestError.status = response.status;
        requestError.serverMessage = payload.error;
        throw requestError;
      }
      const parsed = parseChatResponse(payload);
      if (parsed.persona && parsed.persona.id !== personaId) throw new Error("Mismatched assistant reply");
      if (requestsRef.current.get(tripId) !== controller) return;
      const repliedAt = new Date().toISOString();
      history.updateTrip(tripId, (trip) => ({ ...trip, conversationId: parsed.conversationId,
        updatedAt: repliedAt, messages: [...trip.messages, {
        id: makeMessageId("assistant"),
        role: "assistant",
        content: parsed.reply,
        sources: parsed.sources,
        safety: parsed.safety,
        ...(parsed.safetyReason ? { safetyReason: parsed.safetyReason } : {}),
        ...(parsed.trust ? { trust: parsed.trust } : {}),
        ...(parsed.ai ? { ai: parsed.ai } : {}),
        ...(parsed.persona ? { persona: parsed.persona } : {}),
        ...(parsed.faq ? { faq: parsed.faq } : {}),
        createdAt: repliedAt
      }] }));
    } catch (requestError) {
      if (requestsRef.current.get(tripId) !== controller) return;
      const status = timedOut ? 504 : requestError.status;
      if (requestError.name === "AbortError" && !timedOut) {
        history.updateTrip(tripId, { error: language === "zh" ? "已停止生成回复。" : "Response stopped." });
      } else {
        history.updateTrip(tripId, { error: chatErrorMessage(status, language, requestError.serverMessage) });
      }
      if (status === 401 && authClient) await authClient.auth.signOut();
      if (status === 404) history.updateTrip(tripId, { conversationId: null });
    } finally {
      window.clearTimeout(timeout);
      if (requestsRef.current.get(tripId) === controller) {
        requestsRef.current.delete(tripId);
        history.updateTrip(tripId, { pending: false });
      }
    }
  }

  function stopResponse() {
    requestsRef.current.get(activeTrip?.id)?.abort();
  }

  const showLoading = service.state === "loading" || profile.state === "loading" || (!demoMode && !authReady) || (chatIdentity && !history.ready);
  const needsAuthentication = !demoMode && authReady && !session;
  const suggestions = persona?.id === DEFAULT_PERSONA_ID ? t.suggestions : [
    { title: language === "zh" ? "认识导览助手" : "Meet your guide", body: personaName,
      prompt: language === "zh" ? "你是谁？" : "Who are you?" },
    { title: language === "zh" ? "探索场馆" : "Explore the venue", body: persona?.venue[language] || "",
      prompt: language === "zh" ? `请介绍${persona?.venue.zh || "这个场馆"}。` : `Tell me about ${persona?.venue.en || "this venue"}.` },
    { title: language === "zh" ? "参观帮助" : "Visitor information", body: language === "zh" ? "查阅馆方提供的资料" : "Ask about the venue's visitor guidance",
      prompt: language === "zh" ? "参观这个场馆有哪些需要了解的信息？" : "What should I know before visiting this venue?" }
  ];

  return (
    <div className="app-shell imperial-tourmate grid min-h-dvh grid-cols-[310px_minmax(0,1fr)] max-[900px]:grid-cols-[245px_minmax(0,1fr)] max-[720px]:block">
      {sidebarOpen && <button className="sidebar-backdrop" type="button" aria-label={t.closeTrips} onClick={() => { setSidebarOpen(false); historyButtonRef.current?.focus(); }} />}
      <aside id="trips-sidebar" ref={sidebarRef} className={`sidebar ${sidebarOpen ? "is-open" : ""}`} aria-label={t.tripNavigation}>
        <div className="sidebar-brand-row">
          <div>
          <Brand name={personaName} avatar={avatar} />
          <p className="brand-tag">{t.brandTag}</p>
          {persona && <p className="venue-name">{persona.venue[language]}</p>}
          {persona?.id === DEFAULT_PERSONA_ID && <div className="sidebar-heritage-sign" aria-hidden="true"><span>山</span><span>海</span><span>行</span><span>记</span></div>}
          </div>
          <button className="sidebar-close" type="button" aria-label={t.closeTrips} onClick={() => { setSidebarOpen(false); historyButtonRef.current?.focus(); }}><Icon name="close" size={20} /></button>
        </div>
        <button className="new-trip-button" type="button" onClick={startNewTrip} disabled={!history.ready}>
          <Icon name="plus" size={19} />{t.newTrip}
        </button>
        {persona?.id === DEFAULT_PERSONA_ID && !needsAuthentication && (
          <nav className="imperial-side-menu" aria-label={language === "zh" ? "旅行导航" : "Travel navigation"}>
            <button type="button" onClick={openTripPlanner} disabled={!personaReady || historyUnavailable || pending}>
              <Icon name="calendar" size={17}/>{language === "zh" ? "规划旅行" : "Plan a trip"}
            </button>
            <button type="button" onClick={() => chooseSuggestion(language === "zh"
              ? "请根据我的兴趣推荐中国独特的文化旅行灵感和目的地。"
              : "Give me inspiring China travel destination ideas, including unique cultural experiences.")}>
              <Icon name="spark" size={17}/>{language === "zh" ? "旅行灵感" : "Travel inspiration"}
            </button>
            <button type="button" onClick={() => document.getElementById("trips-sidebar-history")?.scrollIntoView({behavior:"smooth",block:"nearest"})}>
              <Icon name="history" size={17}/>{language === "zh" ? "我的行程" : "My trips"}
            </button>
          </nav>
        )}
        <nav id="trips-sidebar-history" className="trip-list" aria-label={t.tripNavigation}>
          <p className="sidebar-label">{t.recent}</p>
          <div className="trip-scroll">
          {trips.map((trip) => <button key={trip.id} type="button" data-trip-id={trip.id}
            className={`trip-item ${activeTrip?.id === trip.id ? "active" : ""}`}
            aria-pressed={activeTrip?.id === trip.id} onClick={() => selectTrip(trip.id)}>
            <span className="trip-icon" aria-hidden="true"><Icon name="spark" size={17} /></span>
            <span className="trip-description">
              <strong>{trip.title || t.untitledTrip}</strong>
              <small>
                {new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(trip.updatedAt))}
                {trip.pending && <span className="trip-pending" aria-label={t.thinking}> ···</span>}
              </small>
            </span>
          </button>)}
          </div>
        </nav>
        <div className="sidebar-spacer" />
        <div className="trust-card">
          <span className="trust-icon"><Icon name="shield" size={18} /></span>
          <div><strong>{t.trustTitle}</strong><p>{t.trustBody}</p></div>
        </div>
        <p className="sidebar-disclaimer">{t.disclaimer}</p>
      </aside>

      <main className="main-panel min-w-0" inert={sidebarOpen ? true : undefined}>
        <header className="topbar">
          <div className="mobile-brand"><Brand name={personaName} avatar={avatar} /></div>
          <button className="mobile-history" ref={historyButtonRef} type="button" aria-label={t.openTrips}
            aria-expanded={sidebarOpen} aria-controls="trips-sidebar" onClick={() => setSidebarOpen(true)}><Icon name="menu" size={19} /></button>
          <button className="mobile-new-trip" type="button" onClick={startNewTrip} disabled={!history.ready} aria-label={t.newTrip}>
            <Icon name="plus" size={19} />
          </button>
          {persona?.id === DEFAULT_PERSONA_ID && !needsAuthentication && (
            <nav className="imperial-topnav" aria-label={language === "zh" ? "主导航" : "Main navigation"}>
              <button type="button" className="imperial-nav-active"
                onClick={() => textareaRef.current?.focus()}><Icon name="spark" size={17}/>{language === "zh" ? "AI 旅行对话" : "AI Travel Chat"}</button>
              <span aria-hidden="true" className="imperial-nav-divider"/>
              <button type="button" onClick={openTripPlanner} disabled={!personaReady || historyUnavailable || pending}>
                <Icon name="calendar" size={17}/>{language === "zh" ? "规划旅行" : "Plan a Trip"}</button>
              <span aria-hidden="true" className="imperial-nav-divider"/>
              <button type="button" onClick={() => chooseSuggestion(language === "zh"
                ? "请分享在中国旅行时实用的交通、支付、礼仪和预订小贴士。"
                : "Share practical travel tips for China, including transport, payments, local etiquette, and what to verify before booking.")}>
                <Icon name="book" size={17}/>{language === "zh" ? "旅行贴士" : "Travel Tips"}</button>
            </nav>
          )}
          <div className="service-pill"><span className={`status-dot ${service.state}`} />{statusLabel}</div>
          {persona?.id === DEFAULT_PERSONA_ID && <div className="topbar-poem" aria-hidden="true"><span className="topbar-poem-mark">山</span><span>云游四方 · 风雅中国</span></div>}
          {persona && <span className="profile-identity" title={`${t.profileVersion} ${persona.version}`}>{personaName}</span>}
          <div className="topbar-actions">
            <div className="language-toggle" aria-label="Language">
              <button type="button" className={language === "en" ? "active" : ""} onClick={() => changeLanguage("en")} aria-pressed={language === "en"}>EN</button>
              <button type="button" className={language === "zh" ? "active" : ""} onClick={() => changeLanguage("zh")} aria-pressed={language === "zh"}>中文</button>
            </div>
            {!demoMode && session && (
              <button type="button" className="signout-button" onClick={signOut}><Icon name="logout" size={17} /><span>{t.signOut}</span></button>
            )}
          </div>
        </header>

        {showLoading ? (
          <div className="loading-screen" role="status"><span className="loader" /><p>{t.loading}</p></div>
        ) : service.state === "error" ? (
          <section className="auth-wrap" aria-labelledby="connection-title">
            <div className="auth-card">
              <h1 id="connection-title">{t.connectionTitle}</h1>
              <p className="auth-intro">{t.connectionBody}</p>
              <button className="primary-button" type="button" onClick={() => setStatusAttempt((attempt) => attempt + 1)}>{t.retry}</button>
            </div>
          </section>
        ) : profile.state === "error" ? (
          <section className="auth-wrap" aria-labelledby="profile-error-title">
            <div className="auth-card">
              <h1 id="profile-error-title">{t.profileTitle}</h1>
              <p className="auth-intro">{t.profileError}</p>
              <button className="primary-button" type="button" onClick={() => setStatusAttempt((attempt) => attempt + 1)}>{t.retry}</button>
            </div>
          </section>
        ) : needsAuthentication ? (
          <AuthPanel language={language} client={authClient} />
        ) : (
          <div className="chat-layout">
            <section ref={conversationRef} onScroll={onConversationScroll}
              className={`conversation ${messages.length ? "has-messages" : ""}`}
              aria-label={activeTrip?.title || t.today}>
              {historyUnavailable ? (
                <div className="history-loading" role="status">
                  {!activeTrip.historyError && <span className="loader" />}
                  <p>{activeTrip.historyError ? t.historyError : t.historyLoading}</p>
                  {activeTrip.historyError && <button className="primary-button" type="button" onClick={history.retryMessages}>{t.retry}</button>}
                </div>
              ) : messages.length === 0 ? (
                <div className="welcome-panel">
                  {persona?.id === DEFAULT_PERSONA_ID ? (
                    <div className="china-hero-stage imperial-hero">
                      <ChinaHeroOrnament />
                      <China3DScene language={language}><ChinaLandscape /></China3DScene>
                      <div className="china-hero-content">
                        <div className="china-hero-overline"><span className="china-hero-rule" />{language === "zh" ? "诗与远方 · YOUR CHINA STORY" : "诗与远方 · A JOURNEY THROUGH CHINA"}<span className="china-hero-rule" /></div>
                        <span className="china-hero-seal" aria-hidden="true">旅<span>行</span></span>
                        <h1><span className="hero-en-title">{language === "zh" ? "遇见你的中国" : "Find your China."}</span><span className="hero-cn-title">山海之间</span></h1>
                        <p className="welcome-copy">{t.welcomeBody}</p>
                        <div className="china-hero-divider" aria-hidden="true"><span />✧<span /></div>
                      </div>
                    </div>
                  ) : (
                    <div className="china-persona-intro">
                      <div className="welcome-seal" aria-hidden="true"><span>{avatar}</span></div>
                      <p className="section-kicker">{persona?.venue[language] || t.welcomeKicker}</p>
                      <h1>{personaName}</h1>
                      <p className="welcome-copy">{persona?.greeting[language] || t.welcomeBody}</p>
                    </div>
                  )}
                  {persona?.id === DEFAULT_PERSONA_ID && <div className="china-journey-heading"><span className="china-journey-eyebrow">{language === "zh" ? "启程 · 寻找你的下一段故事" : "Get inspired for your next journey"}</span><p>{language === "zh" ? "选一个故事开始，或写下你心中的目的地" : "Explore somewhere extraordinary."}</p></div>}
                  <div className="suggestion-grid grid grid-cols-3 gap-3 text-left max-[900px]:grid-cols-1">
                    {suggestions.map((suggestion, index) => (
                      <button key={suggestion.title} type="button" className="suggestion-card" onClick={() => chooseSuggestion(suggestion.prompt)}
                        onPointerMove={applyCardDepth} onPointerLeave={resetCardDepth} onBlur={resetCardDepth}>
                        {persona?.id === DEFAULT_PERSONA_ID && <ChinaDestinationArt index={index}/>}
                        <span className="suggestion-number"><span className="suggestion-index">0{index + 1}</span><span className="suggestion-chop" aria-hidden="true">{["京","杭","古"][index]}</span></span>
                        <strong>{suggestion.title}</strong>
                        <span>{suggestion.body}</span>
                        <i aria-hidden="true">→</i>
                      </button>
                    ))}
                  </div>
                  {persona?.id === DEFAULT_PERSONA_ID && (
                    <section className="smart-planner-welcome" aria-label={language === "zh" ? "智能行程规划" : "Smart trip planning"}>
                      <div className="smart-planner-welcome-copy">
                        <span className="smart-planner-welcome-mark" aria-hidden="true">程</span>
                        <div>
                          <strong>{language === "zh" ? "专属旅程，从这里启程" : "Your next adventure, made personal."}</strong>
                          <small>{language === "zh" ? "告诉我们你的预算、天数和喜好。" : "Choose your budget, pace, destination and must-sees."}</small>
                        </div>
                      </div>
                      <button type="button" className="smart-planner-launch" onClick={openTripPlanner}>
                        <Icon name="calendar" size={17}/>
                        {language === "zh" ? "智能规划行程" : "Build my trip"}
                        <span aria-hidden="true">↗</span>
                      </button>
                    </section>
                  )}
                  {persona?.id === DEFAULT_PERSONA_ID && (
                    <div className="tool-strip" aria-label={language === "zh" ? "旅途快捷工具" : "Travel quick tools"}>
                      {t.quickTools.filter(tool => tool.key !== "trip_brief").map(tool => (
                        <button type="button" key={tool.key} onClick={() => chooseSuggestion(tool.prompt)}>{tool.title}</button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="message-list" aria-live="polite">
                  {persona?.id === DEFAULT_PERSONA_ID && (
                    <div className="imperial-chat-heading">
                      <ChinaLandscape />
                      <span className="imperial-chat-heading-seal" aria-hidden="true">旅</span>
                      <div><span className="imperial-chat-eyebrow">{language === "zh" ? "山海行记 · AI 旅伴" : "THE JOURNEY CONTINUES"}</span>
                      <h2>{activeTrip?.title || (language === "zh" ? "我的中国之旅" : "Your China travel story")}</h2></div>
                      <span className="imperial-chat-heading-art" aria-hidden="true">云 · 山 · 水</span>
                    </div>
                  )}
                  {messages.map((message) => <Message key={message.id} message={message} language={language} copied={copied} onCopy={copyMessage} avatar={avatar} />)}
                  {pending && (
                    <div className="message-row assistant-row" role="status">
                      <div className="assistant-avatar" aria-hidden="true">{avatar}</div>
                      <div className="typing-bubble"><span /><span /><span /><em>{t.thinking}</em></div>
                    </div>
                  )}
                  <div ref={endRef} />
                </div>
              )}
              {showJumpToLatest && messages.length > 0 && (
                <button type="button" className="jump-to-latest" onClick={jumpToLatest}
                  aria-label={language === "zh" ? "跳到最新消息" : "Jump to latest message"}>
                  <span aria-hidden="true">↓</span>{language === "zh" ? "最新消息" : "Latest message"}
                </button>
              )}
            </section>

            <div className="composer-area">
              {persona?.id === DEFAULT_PERSONA_ID && messages.length > 0 && (
                <>
                  <div className="chat-utility-toolbar">
                    <button type="button" className="chat-plan-trip" onClick={openTripPlanner}
                      disabled={!personaReady || historyUnavailable || pending}>
                      <Icon name="calendar" size={15}/>
                      {language === "zh" ? "智能规划" : "Plan a trip"}
                    </button>
                    <button type="button" className="chat-tools-toggle" aria-expanded={toolsExpanded}
                      aria-controls="tourmate-quick-tools" onClick={() => setToolsExpanded(open => !open)}>
                      <Icon name="spark" size={15}/>
                      {language === "zh" ? "旅行工具" : "Travel tools"}
                      <span aria-hidden="true">{toolsExpanded ? "⌃" : "⌄"}</span>
                    </button>
                    {pdfExportReady && (
                      <button type="button" className="chat-save-pdf" onClick={downloadItineraryPdf}
                        disabled={pending} aria-label={language === "zh" ? "下载完整行程 PDF" : "Download itinerary PDF"}>
                        <Icon name="download" size={15}/>
                        {language === "zh" ? "保存 PDF 行程" : "Save trip PDF"}
                      </button>
                    )}
                    {exportablePlan && (
                      <button type="button" className="chat-save-text" onClick={downloadTravelPlan}
                        disabled={pending} aria-label={language === "zh" ? "下载纯文本行程" : "Download plain text trip plan"}>
                        TXT
                      </button>
                    )}
                  </div>
                  {toolsExpanded && (
                    <nav id="tourmate-quick-tools" className="tool-strip tool-strip-compact"
                      aria-label={language === "zh" ? "旅途快捷工具" : "Travel quick tools"}>
                      {t.quickTools.map(tool => (
                        <button type="button" key={tool.key} disabled={!personaReady || pending || historyUnavailable}
                          onClick={() => chooseSuggestion(tool.prompt)}>{tool.title}</button>
                      ))}
                    </nav>
                  )}
                </>
              )}
              {persona?.id === DEFAULT_PERSONA_ID && !historyUnavailable && refinementActions.length > 0 && (
                <nav className="tool-strip tool-strip-compact refinement-strip"
                  aria-label={language === "zh" ? "AI 行程调整" : "AI trip refinements"}>
                  <span className="refinement-label">{language === "zh" ? "AI 调整" : "Refine with AI"}</span>
                  {refinementActions.map(action => (
                    <button type="button" key={action.id}
                      disabled={!personaReady || pending || historyUnavailable}
                      onClick={() => chooseSuggestion(action.prompt)}>{action.label}</button>
                  ))}

                </nav>
              )}
              {history.storageFailed && <p className="history-notice" role="status">{t.storageError}</p>}
              {history.syncFailed && <div className="history-notice" role="status">{t.syncError} <button type="button" onClick={history.retrySync}>{t.retry}</button></div>}
              {error && (
                <div className="error-banner" role="alert">
                  <span>{error}</span>
                  <button type="button" onClick={() => setError("")} aria-label={t.dismiss}>×</button>
                </div>
              )}
              <form className="composer" onSubmit={submitMessage}>
                <label className="sr-only" htmlFor="chat-message">{language === "zh" ? `询问${personaName}` : `Ask ${personaName}`}</label>
                <textarea id="chat-message" ref={textareaRef} rows="1" maxLength={MAX_MESSAGE_LENGTH}
                  placeholder={persona?.id === DEFAULT_PERSONA_ID ? t.placeholder : language === "zh" ? `向${personaName}询问场馆相关问题…` : `Ask ${personaName} about this venue…`} value={draft} onChange={(event) => setDraft(event.target.value)}
                  onInput={resizeTextarea} onKeyDown={onComposerKeyDown} disabled={!personaReady || pending || historyUnavailable} />
                <div className="composer-bottom">
                  <span className={`character-count ${draft.length > 1350 ? "near-limit" : ""}`}>{draft.length}/{MAX_MESSAGE_LENGTH}</span>
                  {pending ? (
                    <button className="send-button stop-button" type="button" onClick={stopResponse} aria-label={t.stop}><Icon name="stop" size={18} /></button>
                  ) : (
                    <button className="send-button" type="submit" disabled={!personaReady || !draft.trim() || historyUnavailable} aria-label={t.send}><Icon name="send" size={18} /></button>
                  )}
                </div>
              </form>
              <p className="composer-note"><span>{t.enterHint}</span><span>{t.disclaimer}</span></p>
            </div>
          </div>
        )}
      </main>
      {plannerOpen && persona?.id === DEFAULT_PERSONA_ID && !needsAuthentication && (
        <SmartTripPlanner language={language} onClose={closeTripPlanner} onCompose={composeSmartTrip}/>
      )}
    </div>
  );
}
