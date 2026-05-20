import type { AnalyticsResponse, EmployeeProfile } from "@/lib/data/types";

const EMAIL_TRIAGE = "Email Triage";

function financeEmailTriageLeaders(employees: EmployeeProfile[]) {
  return employees
    .filter((employee) => employee.department.toLowerCase().includes("finance"))
    .map((employee) => {
      const emailTask = employee.topTasks.find((task) => task.taskCategory === EMAIL_TRIAGE);
      return {
        employeeId: employee.employeeId,
        department: employee.department,
        role: employee.role,
        emailTriageRepetitiveHours: emailTask?.repetitiveHours ?? 0,
        emailTriageTotalHours: emailTask?.hours ?? 0,
        repetitiveCostInr: employee.repetitiveCostInr,
        totalCostInr: employee.totalCostInr,
        monthlyMultiplierNote: "Scale observed costs to monthly using dateRange.monthlyMultiplier in headlineMetrics context"
      };
    })
    .filter((row) => row.emailTriageRepetitiveHours > 0 || row.emailTriageTotalHours > 0)
    .sort((a, b) => b.emailTriageRepetitiveHours - a.emailTriageRepetitiveHours);
}

export function buildAssistantContext(analytics: AnalyticsResponse) {
  const monthlyMultiplier = analytics.dateRange.monthlyMultiplier;

  return {
    source: "normalized Workforce Pulse dataset (in-memory, joined activity logs + HRMS)",
    dateRange: analytics.dateRange,
    activeFilters: analytics.activeFilters,
    headlineMetrics: analytics.headlines,
    cleaningAudit: {
      employeesWithNoMetadata: analytics.cleaning.employeesWithNoMetadata,
      metadataWithNoActivity: analytics.cleaning.metadataWithNoActivity
    },
    topAutomationOpportunities: analytics.automationRanking.slice(0, 12).map((row, index) => ({
      rank: index + 1,
      ...row
    })),
    highestRoiAutomation: analytics.automationRanking[0] ?? null,
    departmentBreakdown: analytics.breakdowns.byDepartment,
    taskCategoryBreakdown: analytics.breakdowns.byTaskCategory,
    appBreakdown: analytics.breakdowns.byApp,
    employeeProfiles: analytics.employees,
    financeEmailTriageLeaders: financeEmailTriageLeaders(analytics.employees),
    weekOverWeekTaskTrends: analytics.trends,
    employeeWeekOverWeek: analytics.employeeWeekTrends,
    employeesWithRisingRepetitiveShare: analytics.employeeWeekTrends
      .filter((employee) => employee.wentUpWeekOverWeek)
      .map((employee) => ({
        employeeId: employee.employeeId,
        department: employee.department,
        role: employee.role,
        latestWeekRepetitiveShare: employee.latestWeekRepetitiveShare,
        previousWeekRepetitiveShare: employee.previousWeekRepetitiveShare,
        repetitiveShareDelta: employee.repetitiveShareDelta,
        weeks: employee.weeks
      })),
    anomaly: analytics.anomaly,
    computationNotes: {
      monthlyScaling: `Multiply observed-period values by dateRange.monthlyMultiplier (${monthlyMultiplier}) for per-month estimates.`,
      inrRequiresHrms: "INR uses joined HRMS hourly rates; employees without compensation have null cost fields.",
      recoverabilityFactors: "Headline recoverable figures use per-task recoverability factors — not a flat percentage."
    }
  };
}
