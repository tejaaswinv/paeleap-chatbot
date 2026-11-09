/**
 * Bound the entire AI compatibility-retry sequence, not just each POST.
 * Without this, two 25-second calls plus a retry delay can outlive a single
 * serverless invocation. Each attempt still has its own 25-second cap.
 */
export function remainingProviderBudget(startedAt, now = Date.now, totalMs = 35000, perAttemptMs = 25000) {
  if (!Number.isFinite(startedAt) || !Number.isFinite(totalMs) || !Number.isFinite(perAttemptMs))
    throw new TypeError("Invalid provider deadline");
  const elapsed = Math.max(0, now() - startedAt);
  const remaining = Math.ceil(totalMs - elapsed);
  if (remaining <= 0) {
    const error = new Error("Provider retry deadline reached");
    error.name = "TimeoutError";
    throw error;
  }
  return Math.max(1, Math.min(perAttemptMs, remaining));
}

export function providerAttemptSignal(startedAt) {
  return AbortSignal.timeout(remainingProviderBudget(startedAt));
}
