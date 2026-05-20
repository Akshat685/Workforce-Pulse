# Workforce Pulse — Methodology & Design Notes

**Read this before opening the app.** This document explains how the two source files are interpreted, joined, and turned into the COO-facing metrics. The dashboard is a Next.js app that loads `data/activity_logs.csv` and `data/employees.json`, normalizes both in memory, and answers: *where is time and money leaking, and what should we automate first?*

---

## 1. Assumptions about the source files

### Activity logs (`activity_logs.csv`)

| Assumption | Rationale |
|------------|-----------|
| Timestamps are **IST** (`+05:30`). Slash dates (`21/10/2025 14:44`) are **DD/MM/YYYY**. | Matches Indian workforce context; mixed ISO and slash formats appear in the file. |
| **Exact duplicate rows** (all fields equal) are dropped. | Two identical rows were found in the 539-row file. |
| Duration `≤ 0`, blank, or non-numeric → **dropped**. Duration **> 480 min** → **flagged and excluded** from analytics. | Treats impossible or task-level outliers as data errors, not real work. |
| Missing app/task → `Unknown App` / `Unknown Task`. | Preserves row volume; ~50 app and ~64 task spellings are canonicalized via lookup maps. |
| `is_repetitive` accepts `TRUE`/`true`/`1`/`yes` and `FALSE`/`false`/`0`/`no`/`-`/blank. | Eleven raw spellings observed. |
| `department` on the activity row is a **fallback** only; HRMS department wins after join. | Activity department can disagree with HRMS; we trust HRMS when matched. |

### HRMS (`employees.json`)

| Assumption | Rationale |
|------------|-----------|
| **Duplicate `employeeId`** → keep the record with the highest completeness score (department, role, compensation, working hours, active status, migrated schema, explicit annual CTC). | `E007` appears twice; the richer migrated record (Senior Account Executive, ₹24L CTC) is kept. |
| Compensation resolved in order: `annual_ctc_inr` → `meta.compensation.annual` → `salary_LPA × 100,000` → hourly fields. | Supports legacy and migrated schema shapes in one file. |
| **Hourly rate** = annual INR ÷ (260 working days × daily hours). Default daily hours **9** if working hours missing (`09:00–18:00`). | Documented constant; 260 days/year in `constants.ts`. |
| **`terminated_on`** is enforced: activity on or after that date is flagged and **excluded** from normal analytics. | `E010` terminated 2025-10-22; post-termination rows must not inflate totals. |
| Missing working-hours string → default `09:00–18:00`. | One employee had no hours field. |

### Observed data-quality facts (this dataset)

- **539** raw activity rows → **530** rows used after cleaning (duplicates, bad durations, post-termination drops).
- **16** HRMS records → **15** unique employees after deduplication.
- **`E013`** and **`?`** appear in activity but not HRMS → hours included, **INR unknown**.
- **`E099`** in HRMS with no activity → shown in audit only.
- Observed calendar span: **2025-10-06 → 2025-10-24** (**19 days**).

---

## 2. Join strategy and conflict resolution

```
activity_logs  ──LEFT JOIN──►  employees (deduplicated)
     on employeeId
```

| Situation | Resolution |
|-----------|------------|
| Activity row, **no HRMS match** | Row **kept**. `costInr = null`. Included in hour totals and recoverable **hours**; excluded from recoverable **INR**. Flagged in cleaning summary. |
| HRMS record, **no activity** | Excluded from time/cost metrics; listed under data-quality audit (`metadataWithNoActivity`). |
| **Duplicate HRMS** `employeeId` | Single winner via completeness scoring (see above). Loser logged in `duplicateEmployeesResolved`. |
| **Post-termination** activity | Detected after join; rows flagged and removed from `joinedRows` but retained in audit trail. |
| Department / role | HRMS values override activity fallbacks when matched. |

All analytics run on the in-memory `joinedRows` array. Filters (department, task, app, employee) are AND-combined slices of this set—no re-fetch, no database.

---

## 3. Headline numbers and automation ranking

### Monthly scaling

```
observedDays     = inclusive calendar days from min to max activity date
monthlyMultiplier = 30 / observedDays
```

Headlines express a **30-day month** extrapolated from the observed window (here ~1.579×).

### Recoverable hours and INR (not a flat 60%)

We do **not** apply one global recovery rate. Each repetitive row is scaled by a **task-specific recoverability factor** (15%–70%, documented in `RECOVERABILITY_FACTORS`—e.g. Data Entry 70%, Meetings 15%).

```
recoverableHours/month = Σ (repetitive_hours × recoverability[task]) × monthlyMultiplier
recoverableINR/month   = Σ (repetitive_cost_inr × recoverability[task]) × monthlyMultiplier

repetitive_cost_inr = (duration_minutes / 60) × employee_hourly_rate_inr
```

Rows without compensation contribute to **hours** only. **Repetitive work share** = repetitive hours ÷ total hours. **Cost coverage** = share of rows with a known `costInr`.

### Automation priority score (0–100)

Per task category, after computing recoverable hours/INR:

| Component | Weight | Normalization |
|-----------|--------|----------------|
| Repetitive-hour volume | 35% | ÷ max repetitive hours across tasks |
| Recoverable INR | 30% | ÷ max recoverable INR across tasks |
| Employee spread | 20% | employees on task ÷ total employees in filtered set |
| Repetitiveness rate | 15% | repetitive hours ÷ total hours for that task |

```
score = 100 × (0.35×volume + 0.30×cost + 0.20×spread + 0.15×repetitiveness)
```

Tasks are ranked descending. This favours high-volume, high-cost, widely shared, highly repetitive work—i.e. automation with broad impact.

---

## 4. Anomaly detection

Goal: surface **one actionable outlier** without overfitting a small sample.

1. Build employee profiles (≥ **2 observed hours**).
2. Compute workforce average **repetitive share**.
3. Score each employee: `(repetitiveShare − average) × totalHours` (weighted gap).
4. Return the top scorer if their share is **above** the average; otherwise no anomaly.

This highlights who concentrates repetitive work most relative to peers, weighted by how much time they logged—e.g. a high-% but low-hours employee does not dominate.

---

## 5. What was cut (and why)

| Cut | Why |
|-----|-----|
| Database / persistence | Brief specifies in-memory processing; ~500 rows does not justify infra. |
| Auth, upload UI, multi-tenant | Fixed input files; scope is analytics, not platform. |
| Background jobs / queues | Single-request recomputation is fast enough; keeps ops simple. |
| ML-based anomaly or clustering | N≈15 employees; rule-based outlier is explainable to a COO. |
| Per-row API for every chart click | Client holds one analytics payload; filters re-slice in memory. |
| Full methodology in PDF export | Executive PDF is a snapshot (KPIs, filters, top 5 tasks); deep methodology stays in-app drawer. |

**In scope:** six dashboard areas (headlines, charts, automation ranking, time-sink breakdown, employee drilldown, cleaning summary), cross-filtering, executive PDF export, optional LLM assistant grounded on normalized JSON.

---

## 6. What I would build with two more days

1. **Row-level audit trail** — click any headline or bar → underlying activity rows with cleaning flags and join status.
2. **Export cleaned joined dataset** — CSV/Parquet of `joinedRows` for finance validation.
3. **Schema-drift tests** — fixture CSVs for new timestamp formats, duplicate policies, and compensation shapes.
4. **Anomaly confidence** — show gap size, peer count, and “insufficient data” when N is too small.
5. **Assistant tool calls** — structured metric lookup instead of stuffing full JSON into context.

---

## Quick start (after reading the above)

```bash
npm install
cp .env.example .env.local   # optional: LLM_API_KEY for /api/assistant
npm run dev
```

Open `http://localhost:3000`. Optional assistant uses any OpenAI-compatible API (`LLM_BASE_URL`, `LLM_MODEL`). **PDF export** captures the live filtered executive-summary block via `html2canvas` + `jsPDF`.

**Key code paths:** `src/lib/data/normalize.ts` (cleaning), `src/lib/data/analytics.ts` (join + metrics), `src/lib/data/constants.ts` (recoverability factors), `src/components/dashboard/` (UI).
