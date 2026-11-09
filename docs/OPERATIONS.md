# TourMate operations runbook

## Architecture

- **Frontend/API:** Next.js 16 App Router and React 19. `/api/chat` validates a bounded request, authenticates the Supabase session, enforces per-user quota, binds conversation/persona, then selects either reviewed evidence or the configured generative China-travel model.
- **Knowledge:** The 100 published China travel FAQ records are fetched from Supabase in production. The local SQLite seed is development-only.
- **AI gateway:** `AI_API_STYLE` selects an explicit Responses, Chat Completions or Anthropic protocol; it never guesses endpoints or changes providers. The gateway body has a strict allocation limit and upstream requests have individual 25-second timeouts. Repeated Responses/FAQ compatibility requests now share a 35-second overall deadline, limiting runaway retries on Vercel.
- **Source safety:** Personal sessions, user message text, bearer tokens, FAQ access credentials and upstream response bodies must never appear in production telemetry.

## Fast diagnosis from browser to logs

1. Inspect the response headers for a failed or degraded `POST /api/chat` request in the browser Network panel.
2. Copy **`X-Request-ID`** (server-generated UUID). **`Server-Timing`** reports the time elapsed inside the chat handler in milliseconds. Both are returned even for early 400/401/413/429 responses.
3. Look for a `chat upstream degraded` log and match its `requestId`. The only logged attributes are request ID, allowlisted stage, fixed diagnostic error code, and duration.
4. For unrecovered exceptions, look for `chat API error` with the same ID and an allowlisted category (`internal`, `configuration`, `timeout`, `provider`).
5. The user-facing `ai.errorCode` remains a fixed, non-sensitive category. For example, `UPSTREAM_RESPONSE_INCOMPLETE` can mean the provider delivered a truncated response, **not** that the API key was unused.
6. Inspect `/api/status` to determine which configured mode is active. It reports configuration flags, **not an actual inference or database connectivity probe**.

The Vercel log history available depends on the subscription's retention limits. A returned log query error is **not** evidence that requests did not happen. If old request logs are unavailable, reproduce the issue while looking at a recent time window. Never paste credentials, raw provider bodies, or private travel messages into tickets or logs.

## FAQ cache and resource usage

`getFaqBank` uses a **30-second, in-memory, single-flight cache only in production with Supabase**.

- Concurrent reads on the same warm function instance share one validated database request.
- Only the published non-user-specific 100-record FAQ bank is cached; it contains no authenticated chat content.
- Failed, incomplete or incorrectly sized reads **are not cached**.
- There is **no stale-on-error fallback**. After TTL expiry, an unreachable Supabase database surfaces the normal error until it recovers.
- Separate serverless instances can make separate reads. This is a best-effort reduction in redundant traffic, **not a globally consistent cache**.
- Newly published records can take up to 30 seconds to reach a warm instance. Roll out urgently corrected guidance with a new deployment if an immediate cache flush is needed.

## Testing and release

Run `npm ci`, `npm run faq:check`, `npm run test:syntax`, `npm test`, `npm run test:security`, and `npm run build` before merging to `main`.

GitHub Actions uses least-privilege read permissions, disables persisted checkout credentials, enables npm cache, cancels superseded runs, and has a bounded runtime. Vercel Git integration builds PR previews and `main` production deployments. Validate a PR preview and its test results before the merge. Afterwards verify the target production deployment is READY **and** assigned to the main domain. A READY preview is not a production release.

No new environment variables, secrets or paid services are required for the FAQ cache or request tracing.
