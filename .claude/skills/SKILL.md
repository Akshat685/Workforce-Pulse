# Workforce Pulse — Main Skill

Next.js + TypeScript dashboard that answers the COO's question: **where are we wasting the most time and money, and what should we automate first?** Loads `data/activity_logs.csv` and `data/employees.json`, cleans + joins in memory, surfaces analytics, and exposes a grounded AI assistant.

## Stack
- Next.js App Router + TypeScript
- Tailwind CSS, Recharts
- Next.js API routes as backend (Node runtime, dynamic)
- In-memory only — no database, no auth, no upload UI
- `html2canvas` + `jsPDF` for PDF export
- OpenAI-compatible Chat Completions via `/api/assistant`

## Architecture
```
data/*.csv|json
   ↓ load.ts
   ↓ normalize.ts            (clean, coerce, dedupe)
   ↓ analytics.ts (join)     (left join activities ↔ employees on employeeId)
   ↓ analytics.ts (compute)  (filters, recoverable, automation score, anomaly)
   ↓ cache.ts (getAnalytics)
   ├── /api/analytics  →  Dashboard UI (components/dashboard/*)
   └── /api/assistant  →  AssistantPanel (grounded via buildContext.ts)
```

Filters (`department`, `taskCategory`, `app`, `employeeId`) flow from `Sidebar` → query params → `getAnalytics(filters)`. The Executive Summary export captures the **filtered live DOM**, not a snapshot.

## Project layout
```
src/
  app/
    page.tsx, layout.tsx, globals.css
    api/analytics/route.ts        GET — filtered analytics JSON
    api/assistant/route.ts        GET status, POST chat (SSE)
    api/health/route.ts           liveness
  components/
    dashboard/                    Dashboard.tsx + all panels/charts
    assistant/AssistantPanel.tsx  chat UI, SSE parsing
    ui/                           Badge, Button, Card, Select, Tooltip, skeletons
  lib/
    data/   load, normalize, analytics, cache, constants, types
    ai/     openai, systemPrompt, buildContext
    utils/format.ts, chartTheme.ts
data/
  activity_logs.csv (539 rows)
  employees.json    (16 raw → 15 unique)
```

## Feature skills — read the one that matches your task
| Domain | Skill file | Covers |
|--------|------------|--------|
| Cleaning + join | [data-pipeline/SKILL.md](data-pipeline/SKILL.md) | CSV/JSON load, dedupe, timestamp normalization, comp → hourly INR, left join, `E007`/`E010`/`E013`/`E099` handling |
| Math | [analytics-engine/SKILL.md](analytics-engine/SKILL.md) | Per-task recoverability factor, 30-day scaling, 35/30/20/15 automation score, anomaly rule |
| UI | [dashboard-ui/SKILL.md](dashboard-ui/SKILL.md) | Dashboard composition, panels, charts, filter contract |
| Chat | [ai-assistant/SKILL.md](ai-assistant/SKILL.md) | Grounding contract, SSE streaming, OpenAI-compat config |
| Export | [export/SKILL.md](export/SKILL.md) | `#executive-summary-export` capture rules with `html2canvas` + `jsPDF` |
| Backend | [api-routes/SKILL.md](api-routes/SKILL.md) | Route contracts, runtime/dynamic conventions, error mapping |

## Key invariants
- All compensation is converted to **annual INR + hourly INR** before any cost math (`hourly = annual / (260 × dailyHours)`).
- Timestamps are IST (`+05:30`); slash dates parsed as `DD/MM/YYYY`.
- Activity rows without HRMS metadata → kept for **hours**, excluded from **INR**.
- HRMS-only employees → audit only, not in activity metrics.
- `E010` terminated `2025-10-22` → post-termination activity flagged + excluded.
- Recoverable headline uses a **per-task factor**, not a flat percentage; monthly multiplier = `30 / observedDays`.
- Every quantitative claim from the assistant **must cite a metric path** (`(source: …)`).
- API routes are `runtime = "nodejs"` + `dynamic = "force-dynamic"`.

## Setup
```bash
npm install
cp .env.example .env.local   # set LLM_API_KEY (+ LLM_BASE_URL, LLM_MODEL) to enable the assistant
npm run dev                   # http://localhost:3000
```
Env: `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL` (route is provider-agnostic — works with Gemini, OpenAI, Groq, xAI, Ollama). Tested with Gemini 2.5 Flash free tier.

## Intentional non-goals
No DB, no auth, no upload, no background jobs, no features beyond the six brief requirements.
