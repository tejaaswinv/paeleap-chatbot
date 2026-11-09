import { randomUUID } from "node:crypto";

const STAGES = new Set(["tourism_generation", "evidence_selection", "faq_selection"]);
const KINDS = new Set(["internal", "configuration", "timeout", "provider"]);

/**
 * Per-request correlation without retaining user text, identifiers, secrets,
 * upstream response bodies or URLs. IDs are server-generated, never trusted
 * from arbitrary client X-Request-ID headers.
 */
export function createChatTrace({ now = Date.now, uuid = randomUUID, logger = console } = {}) {
  const requestId = uuid();
  const startedAt = now();
  const elapsedMs = () => Math.max(0, Math.min(600000, Math.round(now() - startedAt)));
  function headers() {
    return {
      "X-Request-ID": requestId,
      "Server-Timing": "chat;dur=" + elapsedMs()
    };
  }
  function degraded(stage, code) {
    // Both strings come from application code, but validate again at the
    // telemetry boundary so no future caller can accidentally log raw data.
    logger.warn("chat upstream degraded", {
      requestId, stage: STAGES.has(stage) ? stage : "other",
      code: typeof code === "string" && /^[A-Z][A-Z0-9_]{2,47}$/.test(code)
        ? code : "UPSTREAM_UNKNOWN",
      durationMs: elapsedMs()
    });
  }
  function failed(kind) {
    logger.error("chat request failed", {
      requestId, kind: KINDS.has(kind) ? kind : "internal",
      durationMs: elapsedMs()
    });
  }
  return { requestId, elapsedMs, headers, degraded, failed };
}
