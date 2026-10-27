/**
 * TourMate Trust Passport v1: a conservative provenance receipt attached by
 * the SERVER, not by the language model.
 *
 * "Curated" means content came from administrator-selected knowledge records.
 * It does not mean references were accessed, checked for freshness, or verified
 * by an independent fact-checker during this request.
 */
export function buildTrustPassport({
  status, mode, sources = [], personaVersion = null, providerDegraded = false
}) {
  const allowed = status === "allowed";
  const basis = status === "emergency" || status === "blocked" || status === "sanitized"
    ? "safety_notice"
    : !allowed ? "unanswered"
    : mode === "persona_identity" ? "published_profile" : "curated_knowledge";

  // This count refers to reference LINKS included in the response, NOT
  // the number of facts independently corroborated.
  const referenceCount = allowed && Array.isArray(sources)
    ? Math.min(12, sources.length) : 0;
  const version = Number.isInteger(personaVersion) && personaVersion > 0 &&
    personaVersion <= 1000000 ? personaVersion : null;
  return Object.freeze({
    schemaVersion: 1,
    basis,
    referenceCount,
    knowledgeVersion: version,
    // Neither the FAQ database nor administrator-provided links are queried
    // live by the chatbot. Never misrepresent a reference URL as verification.
    liveChecked: false,
    linksChecked: false,
    limitedByProvider: Boolean(providerDegraded)
  });
}
