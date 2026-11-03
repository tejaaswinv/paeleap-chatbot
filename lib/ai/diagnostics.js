// Safe, bounded diagnostics for authenticated chat responses. Never pass raw
// upstream response text, prompts, exception messages, keys or URLs to users.
// Only exact application-owned messages and allowlisted transport error codes
// can become diagnostic labels. Unknown messages are never logged verbatim.
export function aiFailureCode(error) {
  const message = typeof error?.message === "string" ? error.message : "";
  const match = /^AI provider returned HTTP (400|401|402|403|404|408|409|422|429|500|502|503|504)$/.exec(message);
  if (match) return "UPSTREAM_HTTP_" + match[1];

  if (message === "AI provider not configured") return "PROVIDER_CONFIG_MISSING";
  if (message === "Unsupported AI_API_STYLE" || /^AI_BASE_URL must /.test(message) ||
      message === "Invalid URL") return "PROVIDER_CONFIG_INVALID";

  // A successful HTTP response can still produce an unsafe or malformed
  // selection. Do not report this as a network error.
  if (message === "Invalid evidence plan") return "INVALID_EVIDENCE_PLAN";
  if (message === "Unknown evidence record") return "UNKNOWN_EVIDENCE_RECORD";
  if (message === "Invalid approved evidence") return "INVALID_APPROVED_EVIDENCE";
  if (message === "Invalid published persona") return "INVALID_PUBLISHED_PERSONA";

  if (error?.name === "TimeoutError" || error?.name === "AbortError" ||
      ["ETIMEDOUT", "UND_ERR_CONNECT_TIMEOUT"].includes(error?.cause?.code)) return "UPSTREAM_TIMEOUT";
  if (message === "Empty or invalid AI provider response: length") return "UPSTREAM_OUTPUT_TRUNCATED";
  if (message === "Empty or invalid AI provider response: incomplete") return "UPSTREAM_RESPONSE_INCOMPLETE";
  if (/^Empty or invalid AI provider response/.test(message)) return "INVALID_PROVIDER_RESPONSE";

  // Node fetch wraps network details in `cause`. Only fixed, non-sensitive
  // transport codes can be used for diagnostics.
  if (["ENOTFOUND", "EAI_AGAIN"].includes(error?.cause?.code)) return "UPSTREAM_DNS_ERROR";
  if (["ECONNRESET", "UND_ERR_SOCKET"].includes(error?.cause?.code)) return "UPSTREAM_CONNECTION_RESET";
  if (["ECONNREFUSED", "ENETUNREACH", "EHOSTUNREACH"].includes(error?.cause?.code)) return "UPSTREAM_CONNECT_FAILED";
  if (["CERT_HAS_EXPIRED", "UNABLE_TO_VERIFY_LEAF_SIGNATURE", "SELF_SIGNED_CERT_IN_CHAIN"].includes(error?.cause?.code))
    return "UPSTREAM_TLS_ERROR";

  return "UPSTREAM_NETWORK_ERROR";
}
