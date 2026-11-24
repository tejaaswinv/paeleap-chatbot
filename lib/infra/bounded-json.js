/**
 * Server-side network boundary: bound actual streamed bytes before decoding.
 * Content-Length is only an early rejection hint, never the source of truth.
 * Do not retain or log a remote response body in an exception.
 */
export async function readBoundedJson(response, { maxBytes = 512 * 1024, allowEmpty = false } = {}) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) throw new TypeError("Invalid response limit");
  const announced = response.headers.get("content-length");
  if (announced !== null && (!/^\d+$/u.test(announced) || Number(announced) > maxBytes)) {
    if (response.body) void response.body.cancel().catch(() => {});
    throw new Error("Upstream response exceeded its limit");
  }
  const reader = response.body?.getReader();
  if (!reader) {
    if (allowEmpty) return null;
    throw new Error("Missing upstream response");
  }
  const chunks = [];
  let bytes = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        void reader.cancel().catch(() => {});
        throw new Error("Upstream response exceeded its limit");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (bytes === 0 && allowEmpty) return null;
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks, bytes)));
  } catch {
    throw new Error("Invalid upstream JSON response");
  }
}

/** Treat expired/revoked credentials differently from a service outage. */
export function isAuthenticationRejection(status) {
  return status === 400 || status === 401 || status === 403;
}
