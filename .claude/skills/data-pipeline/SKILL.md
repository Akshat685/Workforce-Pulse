# Data Pipeline

Loads, cleans, normalizes, and joins the two source files (`data/activity_logs.csv`, `data/employees.json`) into the in-memory dataset the rest of the app consumes.

## Files
- `src/lib/data/load.ts` — raw CSV/JSON readers (file-system, no DB).
- `src/lib/data/normalize.ts` — cleaning + normalization for activities and employees.
- `src/lib/data/types.ts` — `JoinedActivity`, `NormalizedEmployee`, `CleaningIssue`, `AnalyticsResponse`, etc.
- `src/lib/data/constants.ts` — `RECOVERABILITY_FACTORS`, app/task spelling maps, defaults.
- `src/lib/data/cache.ts` — memoized `getAnalytics(filters)` entry point used by API routes.
- `src/lib/data/analytics.ts` — joins activities ↔ employees (left join on `employeeId`).

## Cleaning rules (activities)
- Drop exact duplicate rows (2 found).
- Drop blank / zero / negative / non-numeric `durationMinutes` (4 found).
- Flag and exclude durations > 480 min as outliers (3 found).
- Parse mixed timestamps; slash dates as `DD/MM/YYYY`; normalize to IST `YYYY-MM-DDTHH:mm:ss+05:30`.
- Collapse 50 raw app spellings, 64 task-category spellings, 11 repetitive-flag spellings.
- Boolean coercion: `TRUE/true/1/yes/Yes` → true; `FALSE/false/0/no/No/-/blank` → false.
- Missing/dash app → `Unknown App`; missing task → `Unknown Task`.

## Cleaning rules (employees)
- 16 raw → 15 unique; `E007` duplicate resolved by completeness score (department, role, comp, working hours, active, migrated schema, explicit annual CTC) → keeps Senior Account Executive record.
- Missing working hours default `09:00-18:00`.
- Compensation → annual INR + hourly INR:
  - `annual CTC INR` direct
  - `meta.compensation.annual` direct
  - `salary_LPA × 100000`
  - `hourly_rate_inr × dailyHours × 260`
  - hourly = annual / (260 × dailyHours)

## Join
- Left join activities → employees on `employeeId`.
- Unmatched activity (`E013`, `?`): kept for time totals, excluded from INR (no comp basis).
- HRMS-only (`E099`): shown in audit, excluded from activity metrics.
- `E010` terminated `2025-10-22` — activity after that date is flagged and excluded.

## Output
`CleaningIssue[]` surfaces every drop/flag for the data-quality audit panel. Joined rows feed `analytics.ts`.
