// Historical evidence is an offline fixture run, NOT a live safety score.
// Import it server-side and return only an explicit aggregate allowlist.
import historical from "../../reports/security-remediation-summary.json" with { type: "json" };

const MODES = Object.freeze([
  "faq-offline", "faq-hostile-valid-id", "faq-freeform",
  "evidence-hostile-prose", "evidence-valid-id"
]);
const integer = (value, max = 100000000) =>
  Number.isSafeInteger(value) && value >= 0 && value <= max ? value : 0;

export function buildSafetyLabSnapshot(source = historical) {
  const runs = (Array.isArray(source.runs) ? source.runs : [])
    .filter((run) => MODES.includes(run.mode))
    .map((run) => Object.freeze({
      mode: run.mode,
      cases: integer(run.total),
      strictPassed: integer(run.strict_passed),
      strictFailed: integer(run.strict_failed),
      attacks: integer(run.attacks),
      attacksContained: integer(run.attacks_strictly_contained),
      explicitBlocks: integer(run.explicit_attack_blocks),
      benignFalseBlocks: integer(run.benign_false_blocks),
      unsafeEscapes: integer(run.unsafe_escapes),
      unsupportedCitations: integer(run.unsupported_citations),
      fixtureErrors: integer(run.fixture_errors),
      simulatedProviderRequests: integer(run.provider_fixture_calls),
      realModelCalls: 0
    }));
  if (runs.length !== MODES.length || new Set(runs.map((run) => run.mode)).size !== MODES.length)
    throw new Error("Safety Lab evidence snapshot is incomplete");
  if (runs.some((run) => run.strictPassed + run.strictFailed !== run.cases ||
    run.attacksContained > run.attacks || run.explicitBlocks > run.attacks ||
    run.realModelCalls !== 0)) throw new Error("Safety Lab evidence snapshot is inconsistent");
  const sourceRevision = typeof source.tested_revision === "string" &&
    /^[a-f0-9]{40}$/.test(source.tested_revision) ? source.tested_revision : null;
  const date = typeof source.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(source.date)
    ? source.date : null;
  return Object.freeze({
    schemaVersion: 1,
    kind: "historical_offline_regression_snapshot",
    date,
    testedRevision: sourceRevision,
    cases: integer(source.catalog_rows),
    distinctScenarios: integer(source.distinct_scenarios),
    replayExecutions: integer(source.route_executions),
    outputProbesPassed: integer(source.output_probes?.passed),
    outputProbesTotal: integer(source.output_probes?.total),
    actualModelCalls: 0,
    actualCloudCalls: 0,
    independentHoldout: false,
    releaseApproved: false,
    liveDeploymentTested: false,
    runs,
    notice: "Retained known-regression fixtures dated " + (date || "unknown") +
      ". This is not a new run, current CI status, independent holdout, real DeepSeek test, or production safety certification."
  });
}

export function getSafetyLabSnapshot() {
  return buildSafetyLabSnapshot(historical);
}
