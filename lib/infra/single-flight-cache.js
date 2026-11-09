/**
 * Tiny process-local cache for reviewed, non-user-specific reference data.
 *
 * - Single-flight coalesces concurrent Supabase reads per warm instance.
 * - A successful read stays fresh for a short bounded TTL.
 * - Failed reads are never cached; after expiry, failures propagate.
 * - No stale-on-error for safety-sensitive corrections to reviewed guidance.
 * - Serverless instances do not share memory; correctness never relies on it.
 */
export function createSingleFlightCache({ ttlMs = 30000, now = Date.now } = {}) {
  if (!Number.isInteger(ttlMs) || ttlMs < 1 || ttlMs > 300000)
    throw new Error("Invalid cache TTL");
  let cached = null;
  let pending = null;
  let revision = 0;

  async function get(key, load) {
    if (typeof key !== "string" || !key || typeof load !== "function")
      throw new Error("Invalid cache request");
    const timestamp = now();
    if (cached?.key === key && timestamp < cached.expiresAt) return cached.value;
    if (pending?.key === key) return pending.promise;

    const ownRevision = ++revision;
    const promise = Promise.resolve().then(load).then(value => {
      if (ownRevision === revision) cached = { key, value, expiresAt: now() + ttlMs };
      return value;
    }).finally(() => {
      if (pending?.promise === promise) pending = null;
    });
    pending = { key, promise };
    return promise;
  }

  function clear() {
    revision++;
    cached = null;
    pending = null;
  }
  return { get, clear };
}
