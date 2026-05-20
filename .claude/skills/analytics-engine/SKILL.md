# Analytics Engine

Core math behind every dashboard number. Lives in `src/lib/data/analytics.ts` (exported via `getAnalytics(filters)` from `cache.ts`).

## Inputs
- Joined activity rows (from data-pipeline).
- `DashboardFilters` — optional `department`, `taskCategory`, `app`, `employeeId` (combined as AND).
- `RECOVERABILITY_FACTORS` per task category (default 0.25 when unmapped).

## Date scaling
- `observedDays` = inclusive calendar span of activity rows.
- `monthlyMultiplier` = `30 / observedDays` — scales sums to a synthetic 30-day month.

## Recoverable headline (per-task factor, NOT a flat %)
```
recoverable hours/month = Σ(repetitive task hours × task recoverability factor) × monthlyMultiplier
recoverable INR/month   = Σ(repetitive task cost  × task recoverability factor) × monthlyMultiplier
```
Rows missing comp count toward hours but not INR.

## Task cost
`costInr = (durationMinutes / 60) × employee.hourlyRateInr`. `null` if employee unmatched or comp missing.

## Automation priority score
```
score = 0.35 × normalized repetitive-hour volume
      + 0.30 × normalized recoverable INR
      + 0.20 × normalized employee spread (#distinct employees on task)
      + 0.15 × repetitiveness rate (repetitive hours / total task hours)
```
All four components are min-max normalized across tasks before weighting. Drives `AutomationRanking.tsx`.

## Anomaly detection
Picks the employee with the largest **weighted gap above the workforce-average repetitive-work share**, restricted to employees with ≥ 2 observed hours. Single outlier — intentionally simple given dataset size. Surfaces in `AnomalyCallout.tsx`.

## Breakdowns produced
- Time-sink breakdown (by task category and by app).
- Department × repetitive hours.
- Trend over time (per-week, per-employee where useful).
- Cleaning summary (counts of issues by type).
- Executive summary numbers (top headline metrics + top 5 automation opportunities).

## Conventions
- Round at the surface, not in the middle of sums (`round()` helper).
- Always reduce with safe selectors (`sum(items, x => x.value ?? 0)`).
- Filters apply BEFORE every aggregate — no global cache of unfiltered results inside the function.
