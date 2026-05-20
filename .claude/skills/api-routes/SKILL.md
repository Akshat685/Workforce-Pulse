# API Routes

All backend is Next.js App Router route handlers under `src/app/api/*`. `runtime = "nodejs"`, `dynamic = "force-dynamic"`. No DB; everything reads files + computes in memory.

## `GET /api/analytics`
- File: `src/app/api/analytics/route.ts`.
- Query params: `department`, `taskCategory`, `app`, `employeeId` (all optional).
- Builds `DashboardFilters` and returns `getAnalytics(filters)` (memoized via `lib/data/cache.ts`).
- 500 with `{ error: "Failed to build analytics dataset." }` on failure.

## `GET /api/assistant`
- File: `src/app/api/assistant/route.ts`.
- Returns `{ configured, model, baseUrl }` — UI uses it to detect missing key.

## `POST /api/assistant`
- Body: `{ messages: ChatMessage[], filters?: DashboardFilters, stream?: boolean }`.
- Filters user/assistant roles, calls `getAnalytics(filters)`, builds grounded system prompt, forwards to OpenAI-compatible endpoint.
- Streaming: SSE (`text/event-stream`) with frames `{ delta }`, `{ done: true }`, `{ error }`.
- Non-stream: `{ answer }` JSON.
- See **ai-assistant** skill for grounding + env details.

## `GET /api/health`
- File: `src/app/api/health/route.ts` — liveness probe.

## Conventions
- All routes use `runtime = "nodejs"` (filesystem access required for CSV/JSON loaders).
- All routes use `dynamic = "force-dynamic"` — avoid Next caching the analytics across filter sets.
- Wrap handler body in try/catch → `NextResponse.json({ error }, { status })`.
- Never expose raw upstream LLM provider errors; map via `getLlmErrorMessage`.
- Assistant env vars use `LLM_*` prefix (`LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`) — route is provider-agnostic.
