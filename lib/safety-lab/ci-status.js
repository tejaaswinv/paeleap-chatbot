/**
 * Authorized GitHub Actions CI metadata. Never claim the offline regression
 * fixture output is a real LLM evaluation, and never return raw GitHub payloads.
 * A fine-grained token with just repo Actions: Read is sufficient.
 */
const WORKFLOW_URL = "https://api.github.com/repos/tejaaswinv/paeleap-chatbot/actions/workflows/backend-check.yml/runs?branch=main&event=push&per_page=10";
const STATUSES = new Set(["queued", "in_progress", "completed", "waiting", "pending", "requested", "action_required"]);
const CONCLUSIONS = new Set(["success", "failure", "cancelled", "timed_out", "neutral", "skipped", "action_required", "stale"]);
const SHA = /^[a-f0-9]{40}$/;
const TIMESTAMP = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/;

function safeRun(raw) {
  if (!raw || typeof raw !== "object" || raw.head_branch !== "main" ||
      raw.event !== "push" || !SHA.test(raw.head_sha) ||
      !Number.isSafeInteger(raw.id) || raw.id < 1 ||
      !STATUSES.has(raw.status) || !TIMESTAMP.test(raw.created_at)) return null;
  if (raw.status === "completed" && !CONCLUSIONS.has(raw.conclusion)) return null;
  const run = {
    id: raw.id,
    sha: raw.head_sha,
    status: raw.status,
    conclusion: raw.status === "completed" ? raw.conclusion : null,
    createdAt: raw.created_at,
    completedAt: typeof raw.updated_at === "string" && TIMESTAMP.test(raw.updated_at) ? raw.updated_at : null,
    url: "https://github.com/tejaaswinv/paeleap-chatbot/actions/runs/" + raw.id
  };
  return Object.freeze(run);
}

export function parseWorkflowRuns(payload, deploymentSha = null) {
  if (!payload || !Array.isArray(payload.workflow_runs) || payload.workflow_runs.length > 10)
    throw new Error("Invalid workflow metadata");
  const runs = payload.workflow_runs.map(safeRun).filter(Boolean)
    .sort((a,b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
  const latest = runs[0] || null;
  const lastCompleted = runs.find(run => run.status === "completed") || null;
  return Object.freeze({
    state: latest ? "available" : "no_runs",
    source: "github_actions_metadata",
    workflow: "backend-check.yml",
    branch: "main",
    latest,
    lastCompleted,
    deployedSha: typeof deploymentSha === "string" && SHA.test(deploymentSha) ? deploymentSha : null,
    matchesDeployment: latest && SHA.test(deploymentSha || "") ? latest.sha === deploymentSha : null,
    // All model-inference calls in the tracked GitHub workflow are simulated.
    includesLiveModelTest: false,
    metricsFromLatestArtifact: false
  });
}

export async function getCurrentCiStatus({
  token = process.env.GITHUB_ACTIONS_READ_TOKEN,
  deploymentSha = process.env.VERCEL_GIT_COMMIT_SHA,
  fetchImpl = fetch
} = {}) {
  // Explicit unconfigured state, never silently treat a 404/403 as a passing run.
  if (typeof token !== "string" || token.length < 10 || token === "replace_me")
    return {state: "not_configured", source: "github_actions_metadata"};
  try {
    const response = await fetchImpl(WORKFLOW_URL, {
      headers: {
        Authorization: "Bearer " + token,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Paeleap-TourMate-SafetyLab"
      },
      signal: AbortSignal.timeout(7000),
      redirect: "error",
      cache: "no-store"
    });
    if (!response.ok) return {state: "unavailable", source: "github_actions_metadata"};
    // The query is restricted to ten workflow runs; enforce a network-level
    // byte cap too, not just a JSON field count.
    const reader = response.body?.getReader();
    if (!reader) return {state: "unavailable", source: "github_actions_metadata"};
    const pieces = [];
    let length = 0;
    try {
      while (true) {
        const {value, done} = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > 65536) { await reader.cancel(); throw new Error("Oversized GitHub metadata"); }
        pieces.push(value);
      }
    } finally { reader.releaseLock(); }
    const data = JSON.parse(new TextDecoder().decode(
      Uint8Array.from(pieces.flatMap(piece => Array.from(piece)))
    ));
    return parseWorkflowRuns(data, deploymentSha);
  } catch {
    // Do not log provider content, external error bodies or Authorization headers.
    return {state: "unavailable", source: "github_actions_metadata"};
  }
}
