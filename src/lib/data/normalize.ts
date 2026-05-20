import { APP_MAP, DEFAULT_DAILY_HOURS, TASK_MAP, WORKING_DAYS_PER_YEAR } from "./constants";
import type { CleaningIssue, NormalizedActivity, NormalizedEmployee, RawActivityRow, RawEmployeeRow } from "./types";

function cleanKey(value: unknown): string {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function titleCase(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((part) => part.length <= 3 && part === part.toUpperCase() ? part : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function normalizeDepartment(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "-") return "Unknown Department";
  const key = cleanKey(raw);
  if (key === "cs" || key === "customer support") return "Customer Support";
  if (key === "hr") return "HR";
  return titleCase(raw);
}

export function normalizeEmployeeId(value: unknown): string | null {
  const cleaned = String(value ?? "").trim().toUpperCase();
  return cleaned || null;
}

export function normalizeBoolean(value: unknown): { value: boolean; fixed: boolean } {
  const raw = String(value ?? "").trim();
  const key = raw.toLowerCase();
  if (["true", "1", "yes", "y"].includes(key)) return { value: true, fixed: raw !== "true" };
  if (["false", "0", "no", "n", "na", "n/a", "", "-", "null", "undefined"].includes(key)) return { value: false, fixed: raw !== "false" };
  return { value: false, fixed: true };
}

export function normalizeApp(value: unknown): { value: string; fixed: boolean } {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "-" || raw.toLowerCase() === "nan") return { value: "Unknown App", fixed: true };
  const key = cleanKey(raw);
  const mapped = APP_MAP[key] ?? titleCase(raw);
  return { value: mapped, fixed: mapped !== raw };
}

export function normalizeTaskCategory(value: unknown): { value: string; fixed: boolean } {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "-" || raw.toLowerCase() === "nan") return { value: "Unknown Task", fixed: true };
  const key = cleanKey(raw);
  const mapped = TASK_MAP[key] ?? titleCase(raw);
  return { value: mapped, fixed: mapped !== raw };
}

export function parseDuration(value: unknown): { value: number | null; action: "ok" | "drop" | "flag_drop"; reason?: string } {
  const n = Number(value);
  if (!Number.isFinite(n)) return { value: null, action: "drop", reason: "Blank or non-numeric duration" };
  if (n <= 0) return { value: null, action: "drop", reason: "Zero or negative duration" };
  if (n > 480) return { value: null, action: "flag_drop", reason: "Duration greater than 8 working hours" };
  return { value: n, action: "ok" };
}

type ParsedTimestamp = {
  timestampIst: string;
  timestampMs: number;
  localDate: string;
  weekStart: string;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function weekStartFromYmd(year: number, month: number, day: number): string {
  const utc = new Date(Date.UTC(year, month - 1, day));
  const weekday = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() - weekday + 1);
  return `${utc.getUTCFullYear()}-${pad(utc.getUTCMonth() + 1)}-${pad(utc.getUTCDate())}`;
}

export function parseTimestampIst(value: unknown): ParsedTimestamp | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  let y: number, m: number, d: number, hh = 0, mm = 0, ss = 0;

  let match = raw.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (match) {
    y = Number(match[1]);
    m = Number(match[2]);
    d = Number(match[3]);
    hh = Number(match[4]);
    mm = Number(match[5]);
    ss = Number(match[6] ?? 0);
  } else {
    match = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (!match) return null;
    d = Number(match[1]);
    m = Number(match[2]);
    y = Number(match[3]);
    hh = Number(match[4]);
    mm = Number(match[5]);
    ss = Number(match[6] ?? 0);
  }

  if (m < 1 || m > 12 || d < 1 || d > 31 || hh > 23 || mm > 59 || ss > 59) return null;
  const timestampMs = Date.UTC(y, m - 1, d, hh, mm, ss) - 5.5 * 60 * 60 * 1000;
  const localDate = `${y}-${pad(m)}-${pad(d)}`;
  return {
    timestampIst: `${localDate}T${pad(hh)}:${pad(mm)}:${pad(ss)}+05:30`,
    timestampMs,
    localDate,
    weekStart: weekStartFromYmd(y, m, d)
  };
}

export function normalizeActivities(rawRows: RawActivityRow[]): { activities: NormalizedActivity[]; issues: CleaningIssue[]; droppedRows: number; fixedRows: number; flaggedRows: number; duplicateRows: number } {
  const issues: CleaningIssue[] = [];
  const seen = new Set<string>();
  const deduped: Array<{ row: RawActivityRow; sourceRowIndex: number }> = [];
  let duplicateRows = 0;

  rawRows.forEach((row, index) => {
    const key = JSON.stringify(row);
    if (seen.has(key)) {
      duplicateRows += 1;
      return;
    }
    seen.add(key);
    deduped.push({ row, sourceRowIndex: index + 1 });
  });

  const activities: NormalizedActivity[] = [];
  let droppedRows = duplicateRows;
  let fixedRows = 0;
  let flaggedRows = 0;
  let durationDropped = 0;
  let durationOutliers = 0;
  let timestampDropped = 0;
  let appFixed = 0;
  let taskFixed = 0;
  let boolFixed = 0;

  for (const { row, sourceRowIndex } of deduped) {
    let rowFixed = false;
    const employeeId = normalizeEmployeeId(row.employee_id);
    if (!employeeId) {
      droppedRows += 1;
      durationDropped += 1;
      continue;
    }

    const parsedTimestamp = parseTimestampIst(row.timestamp);
    if (!parsedTimestamp) {
      droppedRows += 1;
      timestampDropped += 1;
      continue;
    }

    const duration = parseDuration(row.duration_minutes);
    if (duration.action !== "ok" || duration.value == null) {
      droppedRows += 1;
      if (duration.action === "flag_drop") {
        flaggedRows += 1;
        durationOutliers += 1;
      } else {
        durationDropped += 1;
      }
      continue;
    }

    const app = normalizeApp(row.app_used);
    const task = normalizeTaskCategory(row.task_category);
    const repetitive = normalizeBoolean(row.is_repetitive);
    const departmentRaw = normalizeDepartment(row.department);

    if (app.fixed) { appFixed += 1; rowFixed = true; }
    if (task.fixed) { taskFixed += 1; rowFixed = true; }
    if (repetitive.fixed) { boolFixed += 1; rowFixed = true; }
    if (departmentRaw !== String(row.department ?? "").trim()) rowFixed = true;

    if (rowFixed) fixedRows += 1;

    activities.push({
      rowId: `A${sourceRowIndex}`,
      sourceRowIndex,
      employeeId,
      departmentRaw,
      timestampIst: parsedTimestamp.timestampIst,
      timestampMs: parsedTimestamp.timestampMs,
      localDate: parsedTimestamp.localDate,
      weekStart: parsedTimestamp.weekStart,
      app: app.value,
      taskCategory: task.value,
      durationMinutes: duration.value,
      isRepetitive: repetitive.value,
      raw: row
    });
  }

  if (duplicateRows) issues.push({ type: "dropped", entity: "activity", message: "Exact duplicate activity rows were removed before analytics.", count: duplicateRows });
  if (durationDropped) issues.push({ type: "dropped", entity: "activity", message: "Rows with blank, zero, negative, or non-numeric durations were removed.", count: durationDropped });
  if (durationOutliers) issues.push({ type: "flagged", entity: "activity", message: "Rows over 480 minutes were flagged as outliers and excluded from normal metrics.", count: durationOutliers });
  if (timestampDropped) issues.push({ type: "dropped", entity: "activity", message: "Rows with unparseable timestamps were removed.", count: timestampDropped });
  if (appFixed) issues.push({ type: "fixed", entity: "activity", message: "App names were canonicalized, including casing, whitespace, aliases, and missing markers.", count: appFixed });
  if (taskFixed) issues.push({ type: "fixed", entity: "activity", message: "Task categories were canonicalized, including abbreviations and missing markers.", count: taskFixed });
  if (boolFixed) issues.push({ type: "fixed", entity: "activity", message: "Repetitive flags were normalized to boolean values.", count: boolFixed });

  return { activities, issues, droppedRows, fixedRows, flaggedRows, duplicateRows };
}

function normalizeTime(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const match = raw.match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2] ?? 0);
  if (hour > 23 || minute > 59) return null;
  return `${pad(hour)}:${pad(minute)}`;
}

function hourDiff(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let diff = eh + em / 60 - (sh + sm / 60);
  if (diff <= 0) diff += 24;
  return Number(diff.toFixed(2));
}

function normalizeWorkingHours(row: RawEmployeeRow): { start: string | null; end: string | null; hours: number; source: "explicit" | "default_9h" } {
  const raw = row.working_hours ?? row.workingHours ?? row.meta?.working_hours;
  if (typeof raw === "string") {
    const [s, e] = raw.split("-");
    const start = normalizeTime(s);
    const end = normalizeTime(e);
    const hours = hourDiff(start, end);
    if (start && end && hours) return { start, end, hours, source: "explicit" };
  }
  if (raw && typeof raw === "object") {
    const start = normalizeTime(raw.start);
    const end = normalizeTime(raw.end);
    const hours = hourDiff(start, end);
    if (start && end && hours) return { start, end, hours, source: "explicit" };
  }
  return { start: "09:00", end: "18:00", hours: DEFAULT_DAILY_HOURS, source: "default_9h" };
}

function numberOrNull(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeCompensation(row: RawEmployeeRow, dailyHours: number): Pick<NormalizedEmployee, "annualCompensationInr" | "hourlyRateInr" | "compensationSource"> {
  const annualCtc = numberOrNull(row.annual_ctc_inr ?? row.annualCompensationInr);
  if (annualCtc != null) return { annualCompensationInr: annualCtc, hourlyRateInr: annualCtc / (WORKING_DAYS_PER_YEAR * dailyHours), compensationSource: "annual_ctc_inr" };

  const metaAnnual = numberOrNull(row.meta?.compensation?.annual);
  if (metaAnnual != null) return { annualCompensationInr: metaAnnual, hourlyRateInr: metaAnnual / (WORKING_DAYS_PER_YEAR * dailyHours), compensationSource: "meta.compensation.annual" };

  const lpa = numberOrNull(row.salary_LPA ?? row.salary_lpa ?? row.LPA ?? row.lpa);
  if (lpa != null) {
    const annual = lpa * 100000;
    return { annualCompensationInr: annual, hourlyRateInr: annual / (WORKING_DAYS_PER_YEAR * dailyHours), compensationSource: "salary_LPA" };
  }

  const hourly = numberOrNull(row.hourly_rate_inr ?? row.hourlyRateInr);
  if (hourly != null) return { annualCompensationInr: hourly * dailyHours * WORKING_DAYS_PER_YEAR, hourlyRateInr: hourly, compensationSource: "hourly_rate_inr" };

  return { annualCompensationInr: null, hourlyRateInr: null, compensationSource: "missing" };
}

function employeeCompletenessScore(employee: NormalizedEmployee): number {
  let score = 0;
  if (employee.name) score += 1;
  if (employee.department) score += 1;
  if (employee.role) score += 1;
  if (employee.annualCompensationInr) score += 3;
  if (employee.compensationSource === "annual_ctc_inr") score += 2;
  if (employee.workingHoursSource === "explicit") score += 1;
  if (employee.status === "active") score += 1;
  if (employee.schemaSource === "migrated") score += 1;
  return score;
}

function normalizeOneEmployee(row: RawEmployeeRow): NormalizedEmployee | null {
  const employeeId = normalizeEmployeeId(row.employee_id ?? row.EmployeeID);
  if (!employeeId) return null;
  const working = normalizeWorkingHours(row);
  const comp = normalizeCompensation(row, working.hours);
  const schemaSource: NormalizedEmployee["schemaSource"] = row.meta ? "nested_meta" : row.employee_id ? "migrated" : "legacy";
  const role = row.role ?? row.Role ?? row.meta?.role ?? null;
  const department = row.department ?? row.Dept ?? row.dept ?? null;
  const status = String(row.status ?? row.Status ?? "unknown").toLowerCase();
  return {
    employeeId,
    name: String(row.name ?? row.Name ?? "").trim() || null,
    department: department ? normalizeDepartment(department) : null,
    role: role ? titleCase(String(role)) : null,
    tenureMonths: numberOrNull(row.tenure_months ?? row.tenureMonths ?? row.meta?.tenure_months),
    ...comp,
    workingHoursStart: working.start,
    workingHoursEnd: working.end,
    dailyWorkingHours: working.hours,
    workingHoursSource: working.source,
    status,
    terminatedOn: String(row.terminated_on ?? row.terminatedOn ?? "").trim() || null,
    schemaSource,
    quality: comp.annualCompensationInr == null ? "missing_compensation" : "complete",
    raw: row
  };
}

export function normalizeEmployees(rawRows: RawEmployeeRow[]): { employees: NormalizedEmployee[]; issues: CleaningIssue[]; duplicateEmployeesResolved: string[] } {
  const normalized = rawRows.map(normalizeOneEmployee).filter((row): row is NormalizedEmployee => Boolean(row));
  const byId = new Map<string, NormalizedEmployee[]>();
  normalized.forEach((employee) => {
    byId.set(employee.employeeId, [...(byId.get(employee.employeeId) ?? []), employee]);
  });

  const employees: NormalizedEmployee[] = [];
  const duplicateEmployeesResolved: string[] = [];
  const issues: CleaningIssue[] = [];
  let defaultHoursCount = 0;
  let mixedSchemaCount = 0;

  for (const [employeeId, candidates] of byId) {
    candidates.forEach((candidate) => {
      if (candidate.workingHoursSource === "default_9h") defaultHoursCount += 1;
      if (candidate.schemaSource !== "migrated") mixedSchemaCount += 1;
    });

    if (candidates.length === 1) {
      employees.push(candidates[0]);
    } else {
      const sorted = [...candidates].sort((a, b) => employeeCompletenessScore(b) - employeeCompletenessScore(a));
      const winner = { ...sorted[0], quality: "conflict_resolved" as const };
      employees.push(winner);
      duplicateEmployeesResolved.push(employeeId);
    }
  }

  if (duplicateEmployeesResolved.length) {
    issues.push({
      type: "duplicate_employee",
      entity: "employee",
      message: "Duplicate HRMS employee records were resolved by choosing the most complete active record and preferring explicit annual CTC over LPA/hourly estimates.",
      count: duplicateEmployeesResolved.length,
      examples: duplicateEmployeesResolved
    });
  }
  if (defaultHoursCount) issues.push({ type: "fixed", entity: "employee", message: "Missing working hours were normalized to a documented 09:00-18:00 default.", count: defaultHoursCount });
  if (mixedSchemaCount) issues.push({ type: "fixed", entity: "employee", message: "Legacy EmployeeID/Dept/Role/workingHours fields were reconciled into the canonical employee schema.", count: mixedSchemaCount });

  return { employees, issues, duplicateEmployeesResolved };
}
