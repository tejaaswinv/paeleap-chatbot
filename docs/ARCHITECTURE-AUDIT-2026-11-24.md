# TourMate architecture audit — 24 November 2026

Baseline: main 3c2971c04c3e86e1f55ca496855e7cade91d303b (148 tracked files).
This pass focuses on concrete, reviewable simplification and fault containment rather than an unmeasured framework rewrite.

## Retired
- The unused attraction-only prototype dataset, retrieval module and itinerary-intent helper. The active FAQ and generative planning paths remain authoritative.
- Styles for the discontinued full-screen China explorer and an unmounted planner trigger.
- The unused chat-bottom DOM sentinel left over from the old auto-scroll implementation.
- Prototype-only tests, with active safety and FAQ contract coverage retained.

## Hardened boundaries
- A common bounded UTF-8 JSON reader for database, FAQ, authentication and CI metadata responses; rejects oversized/malformed bodies before parsing. Provider inference keeps its own specialized parser and limits.
- Supabase credentials are not forwarded through redirects. Non-HTTPS production database URLs and URL userinfo are rejected. Transient authentication service failures are not reported as invalid sessions (which previously caused automatic sign-out).
- Discovery of cloud trips no longer invalidates loaded or pending transcripts. History reads are scoped, coalesced, abortable on identity changes, and subject to a 30-second timeout. Repeated pages or runaway pagination fail explicitly rather than silently losing messages. Equal timestamps use a stable ID tie-breaker when listing trips.
- No changes to the live database, credentials, provider configuration, user data, pricing, or hosting account.

## Deliberately preserved
Generative travel planning, curated FAQ fallback, bilingual chat, Smart Trip Planner, PDF/TXT exports, saved conversations, ScamShield, Trust Passport, museum persona administration, Safety Lab, and the main Chinese-themed welcome scene. These have distinct product or security functions and should not be removed solely to reduce file counts.

## Remaining priorities
1. Persist validated provenance/AI mode with messages in a backwards-compatible, separately staged SQL migration. Current cloud history stores text without the full receipt; the application must not manufacture provenance on reload.
2. Add end-to-end browser tests with real staging authentication and hosted RLS/concurrency checks; current Node tests use controlled fixtures and local SQL.
3. Add request idempotency and atomic turn ordering after reviewing SQL schema compatibility. Current client cancellation cannot undo an already committed server exchange.
4. Paginate the administrator full-package catalogue to reduce its high maximum memory requirement; this changes the admin API contract and needs integration testing.
5. Measure live model quality, latency and costs; add a provider circuit breaker only when actual failure patterns justify it.
6. Split ChatShell into independently tested view/state modules incrementally, not as a large unverified rewrite.

Validate the new branch with the existing full Node/security/remediation/build workflow, then verify the exact deployed commit. A passing build is not independent live-provider or hosted-database certification.
