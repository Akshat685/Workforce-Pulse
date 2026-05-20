# AI Assistant

Grounded chat answering COO questions over the in-memory analytics. UI: `src/components/assistant/AssistantPanel.tsx`. Backend: `src/app/api/assistant/route.ts`.

## Flow
1. UI POSTs `{ messages, filters, stream }` to `/api/assistant`.
2. Route fetches fresh `getAnalytics(filters)` from `cache.ts`.
3. `buildAssistantContext(analytics)` (`src/lib/ai/buildContext.ts`) shapes a compact JSON payload of metrics.
4. System prompt = `ASSISTANT_SYSTEM_PROMPT` + the context JSON appended.
5. POSTs to `${LLM_BASE_URL}/chat/completions` with `Authorization: Bearer ${LLM_API_KEY}`.
6. If `stream !== false` and upstream supports it → server forwards SSE chunks as `data: {delta}` / `data: {done:true}` / `data: {error}`. Otherwise returns `{ answer }` JSON.
7. `GET /api/assistant` returns `{ configured, model, baseUrl }` for the UI to know whether the key is set.

## Files
- `src/lib/ai/openai.ts` — `getLlmConfig()`, `buildChatPayload()`, `getLlmErrorMessage()` (filename kept for legacy).
- `src/lib/ai/systemPrompt.ts` — the grounding contract.
- `src/lib/ai/buildContext.ts` — full analytics payload (employees, breakdowns, trends, anomaly).
- `src/components/assistant/AssistantPanel.tsx` — chat UI, SSE parsing.

## Grounding contract
The system prompt **requires** every quantitative claim to cite a metric path, e.g. `(source: financeEmailTriageLeaders[0].emailTriageRepetitiveHours)`. Sentences with numbers but no source path are invalid. History is replayed each turn with a fresh context payload, so answers stay consistent with current filters.

## Env (`LLM_*` prefix — route is provider-agnostic)
- `LLM_API_KEY` (required to use).
- `LLM_BASE_URL` (any OpenAI-compatible endpoint; defaults to `https://api.openai.com/v1`).
- `LLM_MODEL` (defaults to `gpt-4o-mini`).

Tested with Google Gemini free tier:
```
LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
LLM_MODEL=gemini-2.5-flash
```
Groq, xAI, OpenAI, Ollama all work — see `.env.example`.

## Failure modes handled
- Missing API key → 500 with explicit message.
- Upstream non-2xx → `getLlmErrorMessage` maps to a clean status + message (handles 401, 403, 429, quota strings).
- Malformed SSE chunks ignored mid-stream; stream errors emit `data: {error}` frame.
