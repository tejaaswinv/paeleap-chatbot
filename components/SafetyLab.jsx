"use client";

import { useEffect, useState } from "react";
import AuthPanel from "./AuthPanel.jsx";
import { getSupabaseBrowserClient } from "../lib/client/supabase.js";

const modes = {
  "faq-offline": ["Offline FAQ", "离线问答"],
  "faq-hostile-valid-id": ["Hostile ID fixture", "恶意答案编号模拟"],
  "faq-freeform": ["Unexpected provider prose", "异常模型文本模拟"],
  "evidence-hostile-prose": ["Hostile evidence prose", "恶意证据文本模拟"],
  "evidence-valid-id": ["Valid evidence IDs", "有效证据编号模拟"]
};

const copy = {
  en: {
    heading: "Safety Lab", subtitle: "Offline regression evidence for safer China travel assistants.",
    snapshot: "Historical test snapshot", restricted: "Administrator only",
    note: "This dashboard does not execute a model or measure live traffic. It displays a retained offline fixture report.",
    loading: "Checking administrator access…", denied: "Your account is not permitted to view operator safety evidence.",
    unavailable: "Safety evidence cannot be loaded. Check backend access or configuration.",
    retry: "Retry", signOut: "Sign out", personas: "Persona studio", back: "Visitor chat",
    tested: "Retained test date", revision: "Tested source revision",
    scenarios: "Distinct scenarios", cases: "Labeled cases", executions: "Simulated route executions",
    providers: "Live model calls", scenariosTitle: "Test scenarios",
    interpretation: "Important interpretation",
    initial: "These results belong to an older source revision. New changes must pass current CI and be independently tested before launch.",
    contained: "Attacks contained", falseBlocks: "Benign false blocks", unsafe: "Unsafe escapes",
    strict: "Strict passes", run: "Evaluation mode", blocked: "Explicit attack blocks",
    citations: "Unsupported citations", fixtures: "Fixture errors", calls: "Simulated provider calls",
    riskTitle: "Release gates still required",
    risk1: "Review the latest CI artifacts for this exact commit, including the 500-case remediation replay.",
    risk2: "Test the real Miaoqu model and Supabase authorization against a private staging deployment.",
    risk3: "Use an independent holdout set; known regressions cannot estimate production safety or false-positive rates.",
    risk4: "Get a human release sign-off after checking false positives, source accuracy and incident response.",
    outputProbes: "Output contract probes", showMode: "Select evaluation mode",
    controlled: "Fixture contained", pass: "Known criteria passed",
    warning: "Not production-certified",
    currentCi: "Current CI", ciSub: "Latest push checks on the main branch · verified workflow metadata, not an LLM safety score.",
    ciUnavailable: "Latest CI status could not be retrieved. The historical results below are still available.",
    ciNotConfigured: "Connect CI: set a server-only GitHub Actions read token in Vercel to display the latest main-branch result.",
    ciNoRuns: "No main-branch push runs were returned for the workflow.",
    latest: "Latest run", lastCompleted: "Last completed", viewRun: "View CI run",
    commit: "Commit", updated: "Recorded", deployed: "Deployment revision",
    matches: "Matches the deployed revision", differs: "CI is for a different revision than this deployment",
    unknownDeployment: "Deployment revision not available; cannot confirm release parity.",
    ciCaveat: "CI validates automated tests and offline simulations. It does not call live DeepSeek, certify safety, or prove that this deployment is healthy.",
    ciStatus: {completed: "Completed", in_progress: "Running", queued: "Queued", waiting: "Waiting", pending: "Pending", requested: "Requested", action_required: "Action required"},
    ciResult: {success: "Passed", failure: "Failed", cancelled: "Cancelled", timed_out: "Timed out", neutral: "Neutral", skipped: "Skipped", action_required: "Action required", stale: "Stale"}
  },
  zh: {
    heading: "安全测试中心", subtitle: "中国旅游助手的离线安全回归测试记录。",
    snapshot: "历史测试快照", restricted: "仅管理员",
    note: "此页面不会调用实际模型，也不监测线上流量；这里显示的是留存的离线模拟测试报告。",
    loading: "正在验证管理员权限…", denied: "此账户无权查看运营安全测试记录。",
    unavailable: "无法载入安全测试报告，请检查后台权限及配置。",
    retry: "重试", signOut: "退出", personas: "角色管理", back: "访客聊天",
    tested: "测试日期", revision: "测试代码版本",
    scenarios: "不同测试场景", cases: "标注案例", executions: "模拟路由执行次数",
    providers: "真实模型调用次数", scenariosTitle: "测试场景",
    interpretation: "结果解读",
    initial: "这些数据来自较早的代码版本。新版本发布前必须通过最新 CI 和独立测试。",
    contained: "已拦截攻击", falseBlocks: "正常请求误拦截", unsafe: "不安全输出",
    strict: "严格通过数", run: "测试模式", blocked: "明确拦截攻击数",
    citations: "未支持的引用", fixtures: "模拟服务异常", calls: "模拟模型请求",
    riskTitle: "上线前仍需完成",
    risk1: "审查当前提交对应的 CI 构建记录和 500 条案例的回归结果。",
    risk2: "在私有预发布环境验证真实 Miaoqu 模型和 Supabase 授权机制。",
    risk3: "使用独立保留测试集；已知回归案例不能预测真实流量安全率或误拦截率。",
    risk4: "人工审核误拦截、资料准确性和事故响应计划后再批准发布。",
    outputProbes: "输出契约测试", showMode: "选择测试模式",
    controlled: "模拟拦截结果", pass: "已知条件通过",
    warning: "尚未获得上线认证",
    currentCi: "最新持续集成检查", ciSub: "main 分支推送检查 · 仅展示真实工作流元数据，并非模型安全评分。",
    ciUnavailable: "暂时无法获取最新 CI 状态。下方历史测试结果仍可查看。",
    ciNotConfigured: "请在 Vercel 服务端配置 GitHub Actions 只读令牌以查看最新 main 分支运行状态。",
    ciNoRuns: "未找到该工作流的 main 分支推送运行记录。",
    latest: "最新运行", lastCompleted: "最近完成", viewRun: "查看 CI 运行",
    commit: "代码版本", updated: "记录时间", deployed: "部署版本",
    matches: "与当前部署版本一致", differs: "CI 检查版本与当前部署不同",
    unknownDeployment: "未获取到部署版本，无法核验部署一致性。",
    ciCaveat: "CI 只验证自动化测试及离线模拟；它不会调用真实 DeepSeek，也不能证明线上安全或部署健康。",
    ciStatus: {completed: "已完成", in_progress: "运行中", queued: "排队中", waiting: "等待中", pending: "待处理", requested: "已请求", action_required: "需要操作"},
    ciResult: {success: "通过", failure: "失败", cancelled: "已取消", timed_out: "超时", neutral: "中立", skipped: "已跳过", action_required: "需要操作", stale: "已过期"}
  }
};

const number = (n) => Number(n || 0).toLocaleString("en-US");

export default function SafetyLab() {
  const [language, setLanguage] = useState("en");
  const [client, setClient] = useState(null);
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [access, setAccess] = useState("loading");
  const [attempt, setAttempt] = useState(0);
  const [snapshot, setSnapshot] = useState(null);
  const [ci, setCi] = useState({state: "not_configured"});
  const [activeMode, setActiveMode] = useState("evidence-valid-id");
  const t = copy[language];

  useEffect(() => {
    const browser = getSupabaseBrowserClient();
    setClient(browser);
    if (!browser) { setAuthReady(true); return undefined; }
    let active = true;
    browser.auth.getSession().then(({ data }) => {
      if (active) setSession(data.session || null);
    }).catch(() => {
      if (active) setSession(null);
    }).finally(() => { if (active) setAuthReady(true); });
    const { data } = browser.auth.onAuthStateChange((_event, next) => {
      if (active) { setSession(next || null); setAuthReady(true); }
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!client || !session) {
      setSnapshot(null); setCi({state: "not_configured"}); setAccess("loading");
      return undefined;
    }
    const controller = new AbortController();
    setSnapshot(null); setCi({state: "not_configured"}); setAccess("loading");
    (async () => {
      const { data } = await client.auth.getSession();
      if (!data.session?.access_token) throw new Error("No valid session");
      const response = await fetch("/api/admin/safety", {
        headers: { Authorization: "Bearer " + data.session.access_token },
        cache: "no-store", signal: controller.signal
      });
      if ([401, 403].includes(response.status)) {
        setAccess("denied");
        return;
      }
      if (!response.ok) throw new Error("Report unavailable");
      const value = await response.json();
      if (!value.snapshot || value.snapshot.kind !== "historical_offline_regression_snapshot" ||
          !Array.isArray(value.snapshot.runs)) throw new Error("Invalid snapshot");
      if (controller.signal.aborted) return;
      setCi(value.ci && ["available", "not_configured", "unavailable", "no_runs"].includes(value.ci.state)
        ? value.ci : {state: "unavailable"});
      setSnapshot(value.snapshot); setAccess("ready");
    })().catch(() => { if (!controller.signal.aborted) setAccess("error"); });
    return () => controller.abort();
  }, [client, session?.user?.id, attempt]);

  const chosen = snapshot?.runs.find((run) => run.mode === activeMode) || snapshot?.runs[0];
  const modeName = (mode) => modes[mode]?.[language === "zh" ? 1 : 0] || mode;
  const signOut = async () => { setSnapshot(null); setCi({state: "not_configured"}); await client?.auth.signOut(); };
  const ciOutcome = (run) => run?.status === "completed"
    ? t.ciResult[run.conclusion] || "Unknown"
    : t.ciStatus[run?.status] || "Unknown";

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <a className="admin-wordmark" href="/">paeleap <span>/ safety lab</span></a>
        <nav className="admin-topbar-actions" aria-label="Operator navigation">
          <a className="admin-text-button" href="/admin">{t.personas}</a>
          <a className="admin-text-button" href="/">{t.back}</a>
          <div className="language-toggle" aria-label="Language">
            <button type="button" aria-pressed={language === "en"} className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>EN</button>
            <button type="button" aria-pressed={language === "zh"} className={language === "zh" ? "active" : ""} onClick={() => setLanguage("zh")}>中文</button>
          </div>
          {session && <button className="admin-text-button" type="button" onClick={signOut}>{t.signOut}</button>}
        </nav>
      </header>
      {!authReady ? <div className="loading-screen" role="status"><p>{t.loading}</p></div>
        : !session ? <AuthPanel client={client} language={language} administrator />
          : <div className="admin-content">
            <div className="admin-heading">
              <p className="section-kicker">EVALUATION / OPERATIONS</p>
              <h1>{t.heading}</h1>
              <p>{t.subtitle}</p>
            </div>
            {access !== "ready" || !snapshot
              ? <section className="admin-card">
                <p role={access === "denied" ? "alert" : "status"}>{access === "loading" ? t.loading : access === "denied" ? t.denied : t.unavailable}</p>
                {access !== "loading" && <button className="primary-button" type="button" onClick={() => setAttempt((n) => n + 1)}>{t.retry}</button>}
              </section>
              : <>
                <section className="admin-card lab-section" aria-labelledby="lab-current-ci-title">
                  <div className="lab-title-row">
                    <div><p className="section-kicker">GITHUB ACTIONS / MAIN</p><h2 id="lab-current-ci-title">{t.currentCi}</h2></div>
                    {ci.state === "available" && <span className={"lab-run-state " + (ci.latest.conclusion === "success" ? "is-success" : ci.latest.conclusion === "failure" ? "is-failure" : "")}>{ciOutcome(ci.latest)}</span>}
                  </div>
                  <p className="lab-explanation">{t.ciSub}</p>
                  {ci.state !== "available"
                    ? <p className="lab-ci-unavailable" role="status">{ci.state === "not_configured" ? t.ciNotConfigured : ci.state === "no_runs" ? t.ciNoRuns : t.ciUnavailable}</p>
                    : <>
                      <div className="lab-ci-runs">
                        <div><span>{t.latest}</span><strong>{ciOutcome(ci.latest)}</strong><p>{t.commit}: <code>{ci.latest.sha.slice(0, 12)}</code></p><p>{t.updated}: {ci.latest.createdAt}</p>
                          <a className="lab-document-link" href={ci.latest.url} target="_blank" rel="noopener noreferrer">{t.viewRun}</a></div>
                        {ci.lastCompleted && ci.lastCompleted.id !== ci.latest.id && <div><span>{t.lastCompleted}</span><strong>{ciOutcome(ci.lastCompleted)}</strong><p>{t.commit}: <code>{ci.lastCompleted.sha.slice(0, 12)}</code></p><p>{t.updated}: {ci.lastCompleted.createdAt}</p>
                          <a className="lab-document-link" href={ci.lastCompleted.url} target="_blank" rel="noopener noreferrer">{t.viewRun}</a></div>}
                      </div>
                      <p className="lab-ci-revision">{t.deployed}: <code>{ci.deployedSha?.slice(0, 12) || "—"}</code>. {ci.matchesDeployment === true ? t.matches : ci.matchesDeployment === false ? t.differs : t.unknownDeployment}</p>
                    </>}
                  <p className="admin-smallprint">{t.ciCaveat}</p>
                </section>
                <section className="lab-context" aria-labelledby="lab-context-title">
                  <div>
                    <p className="section-kicker">{t.snapshot}</p>
                    <h2 id="lab-context-title">{t.warning}</h2>
                    <p>{t.note}</p>
                  </div>
                  <div className="lab-meta">
                    <span>{t.tested}: <strong>{snapshot.date}</strong></span>
                    <span>{t.revision}: <code>{snapshot.testedRevision?.slice(0, 12)}</code></span>
                  </div>
                </section>
                <div className="lab-stats" aria-label={t.scenariosTitle}>
                  <div><span>{t.cases}</span><strong>{number(snapshot.cases)}</strong></div>
                  <div><span>{t.scenarios}</span><strong>{number(snapshot.distinctScenarios)}</strong></div>
                  <div><span>{t.executions}</span><strong>{number(snapshot.replayExecutions)}</strong></div>
                  <div><span>{t.providers}</span><strong>{number(snapshot.actualModelCalls)}</strong></div>
                </div>
                <section className="admin-card lab-section">
                  <div className="lab-title-row">
                    <div><p className="section-kicker">REGRESSION MODES</p><h2>{t.scenariosTitle}</h2></div>
                    <label className="lab-mode-select">{t.showMode}
                      <select value={activeMode} onChange={(event) => setActiveMode(event.target.value)}>
                        {snapshot.runs.map((run) => <option key={run.mode} value={run.mode}>{modeName(run.mode)}</option>)}
                      </select>
                    </label>
                  </div>
                  {chosen && <>
                    <div className="lab-stats lab-mode-stats">
                      <div><span>{t.pass}</span><strong>{number(chosen.strictPassed)} / {number(chosen.cases)}</strong></div>
                      <div><span>{t.contained}</span><strong>{number(chosen.attacksContained)} / {number(chosen.attacks)}</strong></div>
                      <div><span>{t.falseBlocks}</span><strong>{number(chosen.benignFalseBlocks)}</strong></div>
                      <div><span>{t.unsafe}</span><strong>{number(chosen.unsafeEscapes)}</strong></div>
                    </div>
                    <div className="lab-table-wrap"><table className="lab-table">
                      <thead><tr><th scope="col">{t.run}</th><th scope="col">{t.strict}</th><th scope="col">{t.blocked}</th><th scope="col">{t.citations}</th><th scope="col">{t.fixtures}</th><th scope="col">{t.calls}</th></tr></thead>
                      <tbody>{snapshot.runs.map((run) => <tr key={run.mode} className={run.mode === chosen.mode ? "selected" : ""}>
                        <th scope="row">{modeName(run.mode)}</th>
                        <td>{number(run.strictPassed)} / {number(run.cases)}</td>
                        <td>{number(run.explicitBlocks)}</td>
                        <td>{number(run.unsupportedCitations)}</td>
                        <td>{number(run.fixtureErrors)}</td>
                        <td>{number(run.simulatedProviderRequests)}</td>
                      </tr>)}</tbody>
                    </table></div>
                    <p className="admin-smallprint">{t.outputProbes}: {number(snapshot.outputProbesPassed)} / {number(snapshot.outputProbesTotal)}. {snapshot.notice}</p>
                  </>}
                </section>
                <section className="admin-card lab-section">
                  <p className="section-kicker">LIMITATIONS / RELEASE</p>
                  <h2>{t.interpretation}</h2><p className="lab-explanation">{t.initial}</p>
                  <h3>{t.riskTitle}</h3>
                  <ol className="lab-gates">
                    <li>{t.risk1}</li><li>{t.risk2}</li><li>{t.risk3}</li><li>{t.risk4}</li>
                  </ol>
                  <a className="lab-document-link" href="https://github.com/tejaaswinv/paeleap-chatbot/actions" target="_blank" rel="noreferrer">GitHub Actions / current CI</a>
                </section>
              </>}
          </div>}
    </main>
  );
}
