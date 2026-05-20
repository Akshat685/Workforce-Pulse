import { RECOVERABILITY_FACTORS } from "./constants";
import { loadRawActivityRows, loadRawEmployeeRows } from "./load";
import { normalizeActivities, normalizeEmployees } from "./normalize";
import type {
  AnalyticsResponse,
  AnomalyResult,
  BaseDataset,
  BreakdownItem,
  CleaningIssue,
  DashboardFilters,
  EmployeeProfile,
  JoinedActivity,
  NormalizedEmployee,
  TrendItem,
  EmployeeWeekTrend
} from "./types";

function round(value: number, decimals = 2): number {
  if (!Number.isFinite(value)) return 0;
  const p = 10 ** decimals;
  return Math.round(value * p) / p;
}

function sum<T>(items: T[], selector: (item: T) => number | null | undefined): number {
  return items.reduce((acc, item) => acc + (selector(item) ?? 0), 0);
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function getRecoverabilityFactor(taskCategory: string): number {
  return RECOVERABILITY_FACTORS[taskCategory] ?? 0.25;
}

function daysBetweenInclusive(start: string | null, end: string | null): number {
  if (!start || !end) return 1;
  const startMs = Date.parse(`${start}T00:00:00+05:30`);
  const endMs = Date.parse(`${end}T00:00:00+05:30`);
  return Math.max(1, Math.round((endMs - startMs) / 86400000) + 1);
}

function dateRange(rows: JoinedActivity[]): { start: string | null; end: string | null; observedDays: number; monthlyMultiplier: number } {
  if (!rows.length) return { start: null, end: null, observedDays: 0, monthlyMultiplier: 0 };
  const dates = rows.map((row) => row.localDate).sort();
  const start = dates[0];
  const end = dates[dates.length - 1];
  const observedDays = daysBetweenInclusive(start, end);
  return { start, end, observedDays, monthlyMultiplier: 30 / observedDays };
}

function joinRows(activities: ReturnType<typeof normalizeActivities>["activities"], employees: NormalizedEmployee[]) {
  const employeeMap = new Map(employees.map((employee) => [employee.employeeId, employee]));
  const activityIds = new Set(activities.map((activity) => activity.employeeId));

  const allJoinedRowsBeforeTerminationDrop: JoinedActivity[] = activities.map((activity) => {
    const employee = employeeMap.get(activity.employeeId);
    if (!employee) {
      return {
        ...activity,
        employeeName: null,
        department: activity.departmentRaw || "Unknown Department",
        role: null,
        annualCompensationInr: null,
        hourlyRateInr: null,
        costInr: null,
        employeeMetadataStatus: "missing_employee_metadata" as const
      };
    }

    const costInr = employee.hourlyRateInr == null ? null : (activity.durationMinutes / 60) * employee.hourlyRateInr;
    return {
      ...activity,
      employeeName: employee.name,
      department: employee.department ?? activity.departmentRaw ?? "Unknown Department",
      role: employee.role,
      annualCompensationInr: employee.annualCompensationInr,
      hourlyRateInr: employee.hourlyRateInr,
      costInr,
      employeeMetadataStatus: "matched" as const
    };
  });

  const employeesWithNoMetadata = unique(activities.filter((activity) => !employeeMap.has(activity.employeeId)).map((activity) => activity.employeeId)).sort();
  const metadataWithNoActivity = employees.filter((employee) => !activityIds.has(employee.employeeId)).map((employee) => employee.employeeId).sort();

  const postTerminationRows = allJoinedRowsBeforeTerminationDrop.filter((row) => {
    const employee = employeeMap.get(row.employeeId);
    return Boolean(employee?.terminatedOn && row.localDate > employee.terminatedOn);
  });

  const postTerminationRowIds = new Set(postTerminationRows.map((row) => row.rowId));
  const joinedRows = allJoinedRowsBeforeTerminationDrop.filter((row) => !postTerminationRowIds.has(row.rowId));

  return { joinedRows, allJoinedRowsBeforeTerminationDrop, employeesWithNoMetadata, metadataWithNoActivity, postTerminationRows };
}

export async function buildBaseDataset(): Promise<BaseDataset> {
  const rawActivityRows = await loadRawActivityRows();
  const rawEmployeeRows = await loadRawEmployeeRows();

  const activityResult = normalizeActivities(rawActivityRows);
  const employeeResult = normalizeEmployees(rawEmployeeRows);
  const joinResult = joinRows(activityResult.activities, employeeResult.employees);

  const issues: CleaningIssue[] = [
    ...activityResult.issues,
    ...employeeResult.issues
  ];

  if (joinResult.employeesWithNoMetadata.length) {
    issues.push({
      type: "missing_metadata",
      entity: "join",
      message: "Activity rows exist for employee IDs missing from HRMS metadata. Rows are kept, but INR cost is unknown.",
      count: joinResult.employeesWithNoMetadata.length,
      examples: joinResult.employeesWithNoMetadata
    });
  }

  if (joinResult.metadataWithNoActivity.length) {
    issues.push({
      type: "extra_metadata",
      entity: "join",
      message: "HRMS employees with no activity in the period are excluded from time/cost totals but shown for auditability.",
      count: joinResult.metadataWithNoActivity.length,
      examples: joinResult.metadataWithNoActivity
    });
  }

  if (joinResult.postTerminationRows.length) {
    issues.push({
      type: "flagged",
      entity: "join",
      message: "Activity rows after an employee's terminated_on date were flagged and excluded from normal analytics.",
      count: joinResult.postTerminationRows.length,
      examples: joinResult.postTerminationRows.map((row) => `${row.employeeId} ${row.localDate}`)
    });
  }

  return {
    joinedRows: joinResult.joinedRows,
    allJoinedRowsBeforeTerminationDrop: joinResult.allJoinedRowsBeforeTerminationDrop,
    employees: employeeResult.employees,
    cleaning: {
      totalRawActivityRows: rawActivityRows.length,
      cleanActivityRows: joinResult.joinedRows.length,
      droppedRows: activityResult.droppedRows + joinResult.postTerminationRows.length,
      fixedRows: activityResult.fixedRows,
      flaggedRows: activityResult.flaggedRows + joinResult.postTerminationRows.length,
      duplicateActivityRowsDropped: activityResult.duplicateRows,
      rawEmployeeRecords: rawEmployeeRows.length,
      normalizedEmployeeRecords: employeeResult.employees.length,
      duplicateEmployeesResolved: employeeResult.duplicateEmployeesResolved,
      employeesWithNoMetadata: joinResult.employeesWithNoMetadata,
      metadataWithNoActivity: joinResult.metadataWithNoActivity,
      issues
    }
  };
}

function applyFilters(rows: JoinedActivity[], filters: DashboardFilters): JoinedActivity[] {
  return rows.filter((row) => {
    if (filters.department && row.department !== filters.department) return false;
    if (filters.taskCategory && row.taskCategory !== filters.taskCategory) return false;
    if (filters.app && row.app !== filters.app) return false;
    if (filters.employeeId && row.employeeId !== filters.employeeId) return false;
    return true;
  });
}

function buildBreakdown(rows: JoinedActivity[], dimension: "department" | "taskCategory" | "app", monthlyMultiplier: number): BreakdownItem[] {
  const groups = new Map<string, JoinedActivity[]>();
  rows.forEach((row) => {
    const key = row[dimension];
    groups.set(key, [...(groups.get(key) ?? []), row]);
  });

  return Array.from(groups.entries())
    .map(([key, group]) => {
      const totalHours = sum(group, (row) => row.durationMinutes) / 60;
      const repetitiveRows = group.filter((row) => row.isRepetitive);
      const repetitiveHours = sum(repetitiveRows, (row) => row.durationMinutes) / 60;
      const totalCostInr = sum(group, (row) => row.costInr);
      const repetitiveCostInr = sum(repetitiveRows, (row) => row.costInr);
      const recoverableHoursMonthly = sum(repetitiveRows, (row) => (row.durationMinutes / 60) * getRecoverabilityFactor(row.taskCategory)) * monthlyMultiplier;
      const recoverableCostMonthlyInr = sum(repetitiveRows, (row) => (row.costInr ?? 0) * getRecoverabilityFactor(row.taskCategory)) * monthlyMultiplier;
      return {
        key,
        totalHours: round(totalHours),
        repetitiveHours: round(repetitiveHours),
        totalCostInr: round(totalCostInr),
        repetitiveCostInr: round(repetitiveCostInr),
        recoverableHoursMonthly: round(recoverableHoursMonthly),
        recoverableCostMonthlyInr: round(recoverableCostMonthlyInr),
        employeeCount: unique(group.map((row) => row.employeeId)).length,
        rowCount: group.length
      };
    })
    .sort((a, b) => b.repetitiveHours - a.repetitiveHours || b.totalHours - a.totalHours);
}

function buildAutomationRanking(rows: JoinedActivity[], monthlyMultiplier: number) {
  const taskGroups = new Map<string, JoinedActivity[]>();
  rows.forEach((row) => taskGroups.set(row.taskCategory, [...(taskGroups.get(row.taskCategory) ?? []), row]));
  const totalEmployees = Math.max(1, unique(rows.map((row) => row.employeeId)).length);

  const base = Array.from(taskGroups.entries()).map(([taskCategory, group]) => {
    const repetitiveRows = group.filter((row) => row.isRepetitive);
    const totalHours = sum(group, (row) => row.durationMinutes) / 60;
    const repetitiveHours = sum(repetitiveRows, (row) => row.durationMinutes) / 60;
    const repetitiveCost = sum(repetitiveRows, (row) => row.costInr);
    const factor = getRecoverabilityFactor(taskCategory);
    return {
      taskCategory,
      totalHours,
      repetitiveHours,
      repetitiveShare: totalHours ? repetitiveHours / totalHours : 0,
      estimatedRecoverableHoursMonthly: repetitiveHours * factor * monthlyMultiplier,
      estimatedRecoverableCostMonthlyInr: repetitiveCost * factor * monthlyMultiplier,
      employeeCount: unique(group.map((row) => row.employeeId)).length,
      departmentCount: unique(group.map((row) => row.department)).length
    };
  });

  const maxHours = Math.max(1, ...base.map((item) => item.repetitiveHours));
  const maxCost = Math.max(1, ...base.map((item) => item.estimatedRecoverableCostMonthlyInr));

  return base
    .map((item) => {
      const volumeScore = item.repetitiveHours / maxHours;
      const costScore = item.estimatedRecoverableCostMonthlyInr / maxCost;
      const employeeSpreadScore = item.employeeCount / totalEmployees;
      const repetitivenessScore = item.repetitiveShare;
      const score = 100 * (0.35 * volumeScore + 0.3 * costScore + 0.2 * employeeSpreadScore + 0.15 * repetitivenessScore);
      return {
        ...item,
        totalHours: round(item.totalHours),
        repetitiveHours: round(item.repetitiveHours),
        repetitiveShare: round(item.repetitiveShare, 4),
        estimatedRecoverableHoursMonthly: round(item.estimatedRecoverableHoursMonthly),
        estimatedRecoverableCostMonthlyInr: round(item.estimatedRecoverableCostMonthlyInr),
        score: round(score),
        formulaExplanation: "Score = 35% repetitive-hour volume + 30% recoverable INR + 20% employee spread + 15% repetitiveness rate."
      };
    })
    .sort((a, b) => b.score - a.score);
}

function buildEmployeeProfiles(rows: JoinedActivity[]): EmployeeProfile[] {
  const groups = new Map<string, JoinedActivity[]>();
  rows.forEach((row) => groups.set(row.employeeId, [...(groups.get(row.employeeId) ?? []), row]));

  const preliminary = Array.from(groups.entries()).map(([employeeId, group]) => {
    const totalHours = sum(group, (row) => row.durationMinutes) / 60;
    const repetitiveRows = group.filter((row) => row.isRepetitive);
    const repetitiveHours = sum(repetitiveRows, (row) => row.durationMinutes) / 60;
    const taskGroups = new Map<string, JoinedActivity[]>();
    group.forEach((row) => taskGroups.set(row.taskCategory, [...(taskGroups.get(row.taskCategory) ?? []), row]));
    return {
      employeeId,
      employeeName: group[0].employeeName,
      department: group[0].department,
      role: group[0].role,
      totalHours,
      repetitiveHours,
      repetitiveShare: totalHours ? repetitiveHours / totalHours : 0,
      totalCostInr: group.every((row) => row.costInr == null) ? null : sum(group, (row) => row.costInr),
      repetitiveCostInr: repetitiveRows.every((row) => row.costInr == null) ? null : sum(repetitiveRows, (row) => row.costInr),
      topTasks: Array.from(taskGroups.entries()).map(([taskCategory, taskRows]) => ({
        taskCategory,
        hours: sum(taskRows, (row) => row.durationMinutes) / 60,
        repetitiveHours: sum(taskRows.filter((row) => row.isRepetitive), (row) => row.durationMinutes) / 60
      })).sort((a, b) => b.repetitiveHours - a.repetitiveHours).slice(0, 5)
    };
  });

  return preliminary
    .map((employee) => {
      const rolePeers = preliminary.filter((peer) => peer.role && peer.role === employee.role && peer.employeeId !== employee.employeeId);
      const roleAverage = rolePeers.length ? sum(rolePeers, (peer) => peer.repetitiveShare) / rolePeers.length : null;
      return {
        ...employee,
        totalHours: round(employee.totalHours),
        repetitiveHours: round(employee.repetitiveHours),
        repetitiveShare: round(employee.repetitiveShare, 4),
        totalCostInr: employee.totalCostInr == null ? null : round(employee.totalCostInr),
        repetitiveCostInr: employee.repetitiveCostInr == null ? null : round(employee.repetitiveCostInr),
        topTasks: employee.topTasks.map((task) => ({ ...task, hours: round(task.hours), repetitiveHours: round(task.repetitiveHours) })),
        peerComparison: {
          roleAverageRepetitiveShare: roleAverage == null ? null : round(roleAverage, 4),
          differenceFromRoleAverage: roleAverage == null ? null : round(employee.repetitiveShare - roleAverage, 4)
        }
      };
    })
    .sort((a, b) => b.repetitiveHours - a.repetitiveHours);
}

function buildEmployeeWeekTrends(rows: JoinedActivity[]): EmployeeWeekTrend[] {
  const byEmployee = new Map<string, JoinedActivity[]>();
  rows.forEach((row) => byEmployee.set(row.employeeId, [...(byEmployee.get(row.employeeId) ?? []), row]));

  return Array.from(byEmployee.entries())
    .map(([employeeId, group]) => {
      const weekGroups = new Map<string, JoinedActivity[]>();
      group.forEach((row) => weekGroups.set(row.weekStart, [...(weekGroups.get(row.weekStart) ?? []), row]));

      const weeks = Array.from(weekGroups.entries())
        .map(([weekStart, weekRows]) => {
          const totalHours = sum(weekRows, (row) => row.durationMinutes) / 60;
          const repetitiveHours = sum(weekRows.filter((row) => row.isRepetitive), (row) => row.durationMinutes) / 60;
          return {
            weekStart,
            totalHours: round(totalHours),
            repetitiveShare: round(totalHours ? repetitiveHours / totalHours : 0, 4)
          };
        })
        .filter((week) => week.totalHours > 0)
        .sort((a, b) => a.weekStart.localeCompare(b.weekStart));

      const latest = weeks[weeks.length - 1];
      const previous = weeks.length > 1 ? weeks[weeks.length - 2] : null;
      const repetitiveShareDelta = latest && previous ? round(latest.repetitiveShare - previous.repetitiveShare, 4) : null;

      return {
        employeeId,
        department: group[0].department,
        role: group[0].role,
        weeks,
        latestWeekRepetitiveShare: latest?.repetitiveShare ?? 0,
        previousWeekRepetitiveShare: previous?.repetitiveShare ?? null,
        repetitiveShareDelta,
        wentUpWeekOverWeek: repetitiveShareDelta != null && repetitiveShareDelta > 0
      };
    })
    .sort((a, b) => (b.repetitiveShareDelta ?? 0) - (a.repetitiveShareDelta ?? 0));
}

function buildTrends(rows: JoinedActivity[]): TrendItem[] {
  const taskTotals = buildBreakdown(rows, "taskCategory", 1).slice(0, 5).map((item) => item.key);
  const groups = new Map<string, JoinedActivity[]>();
  rows.filter((row) => taskTotals.includes(row.taskCategory)).forEach((row) => {
    const key = `${row.weekStart}|||${row.taskCategory}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  });

  return Array.from(groups.entries()).map(([key, group]) => {
    const [weekStart, taskCategory] = key.split("|||");
    const totalHours = sum(group, (row) => row.durationMinutes) / 60;
    const repetitiveHours = sum(group.filter((row) => row.isRepetitive), (row) => row.durationMinutes) / 60;
    return {
      weekStart,
      taskCategory,
      totalHours: round(totalHours),
      repetitiveHours: round(repetitiveHours),
      repetitiveShare: round(totalHours ? repetitiveHours / totalHours : 0, 4)
    };
  }).sort((a, b) => a.weekStart.localeCompare(b.weekStart) || a.taskCategory.localeCompare(b.taskCategory));
}

function buildAnomaly(rows: JoinedActivity[]): AnomalyResult | null {
  const employees = buildEmployeeProfiles(rows).filter((employee) => employee.totalHours >= 2);
  if (!employees.length) return null;
  const avgShare = sum(employees, (employee) => employee.repetitiveShare) / employees.length;
  const strongest = [...employees].sort((a, b) => (b.repetitiveShare - avgShare) * b.totalHours - (a.repetitiveShare - avgShare) * a.totalHours)[0];
  if (!strongest || strongest.repetitiveShare <= avgShare) return null;
  return {
    title: `${strongest.employeeId} has the highest repetitive-work concentration`,
    description: `${strongest.employeeId} spent ${round(strongest.repetitiveShare * 100, 1)}% of observed time on repetitive work versus a workforce average of ${round(avgShare * 100, 1)}%.`,
    metric: "employee.repetitiveShare - workforceAverageRepetitiveShare",
    value: round(strongest.repetitiveShare - avgShare, 4),
    reason: "Flagged as the employee with the largest weighted gap above the workforce repetitive-share average among employees with at least two observed hours."
  };
}

export function buildAnalyticsFromBase(base: BaseDataset, filters: DashboardFilters = {}): AnalyticsResponse {
  const rows = applyFilters(base.joinedRows, filters);
  const range = dateRange(rows.length ? rows : base.joinedRows);
  const monthlyMultiplier = range.monthlyMultiplier || 1;
  const repetitiveRows = rows.filter((row) => row.isRepetitive);
  const costKnownRows = rows.filter((row) => row.costInr != null);

  const totalHours = sum(rows, (row) => row.durationMinutes) / 60;
  const repetitiveHours = sum(repetitiveRows, (row) => row.durationMinutes) / 60;
  const totalCostInr = sum(rows, (row) => row.costInr);
  const recoverableHoursMonthly = sum(repetitiveRows, (row) => (row.durationMinutes / 60) * getRecoverabilityFactor(row.taskCategory)) * monthlyMultiplier;
  const recoverableCostMonthlyInr = sum(repetitiveRows, (row) => (row.costInr ?? 0) * getRecoverabilityFactor(row.taskCategory)) * monthlyMultiplier;

  return {
    dateRange: range,
    activeFilters: filters,
    cleaning: base.cleaning,
    headlines: {
      totalHours: round(totalHours),
      repetitiveHours: round(repetitiveHours),
      repetitiveShare: round(totalHours ? repetitiveHours / totalHours : 0, 4),
      recoverableHoursMonthly: round(recoverableHoursMonthly),
      recoverableCostMonthlyInr: round(recoverableCostMonthlyInr),
      totalCostInr: round(totalCostInr),
      costCoverageShare: round(rows.length ? costKnownRows.length / rows.length : 0, 4),
      methodology: "Observed repetitive task time is multiplied by task-specific recoverability factors, then scaled to a 30-day month using observed calendar days. INR impact uses joined HRMS hourly rates only; rows without employee compensation are excluded from INR totals but remain in hours."
    },
    breakdowns: {
      byDepartment: buildBreakdown(rows, "department", monthlyMultiplier),
      byTaskCategory: buildBreakdown(rows, "taskCategory", monthlyMultiplier),
      byApp: buildBreakdown(rows, "app", monthlyMultiplier)
    },
    automationRanking: buildAutomationRanking(rows, monthlyMultiplier),
    employees: buildEmployeeProfiles(rows),
    trends: buildTrends(rows),
    employeeWeekTrends: buildEmployeeWeekTrends(rows),
    anomaly: buildAnomaly(rows),
    filterOptions: {
      departments: unique(base.joinedRows.map((row) => row.department)).sort(),
      taskCategories: unique(base.joinedRows.map((row) => row.taskCategory)).sort(),
      apps: unique(base.joinedRows.map((row) => row.app)).sort(),
      employees: unique(base.joinedRows.map((row) => row.employeeId)).sort()
    }
  };
}
