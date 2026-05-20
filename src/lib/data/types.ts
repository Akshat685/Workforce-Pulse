export type RawActivityRow = Record<string, string | number | null | undefined>;
export type RawEmployeeRow = Record<string, any>;

export type CleaningIssueType = "fixed" | "dropped" | "flagged" | "missing_metadata" | "extra_metadata" | "duplicate_employee";

export type CleaningIssue = {
  type: CleaningIssueType;
  entity: "activity" | "employee" | "join";
  message: string;
  count: number;
  examples?: string[];
};

export type NormalizedActivity = {
  rowId: string;
  sourceRowIndex: number;
  employeeId: string;
  departmentRaw: string;
  timestampIst: string;
  timestampMs: number;
  localDate: string;
  weekStart: string;
  app: string;
  taskCategory: string;
  durationMinutes: number;
  isRepetitive: boolean;
  raw: RawActivityRow;
};

export type NormalizedEmployee = {
  employeeId: string;
  name: string | null;
  department: string | null;
  role: string | null;
  tenureMonths: number | null;
  annualCompensationInr: number | null;
  hourlyRateInr: number | null;
  compensationSource: "annual_ctc_inr" | "salary_LPA" | "hourly_rate_inr" | "meta.compensation.annual" | "missing";
  workingHoursStart: string | null;
  workingHoursEnd: string | null;
  dailyWorkingHours: number;
  workingHoursSource: "explicit" | "default_9h";
  status: string;
  terminatedOn: string | null;
  schemaSource: "legacy" | "migrated" | "nested_meta";
  quality: "complete" | "partial" | "missing_compensation" | "conflict_resolved";
  raw: RawEmployeeRow;
};

export type JoinedActivity = NormalizedActivity & {
  employeeName: string | null;
  department: string;
  role: string | null;
  annualCompensationInr: number | null;
  hourlyRateInr: number | null;
  costInr: number | null;
  employeeMetadataStatus: "matched" | "missing_employee_metadata";
};

export type BreakdownItem = {
  key: string;
  totalHours: number;
  repetitiveHours: number;
  totalCostInr: number;
  repetitiveCostInr: number;
  recoverableHoursMonthly: number;
  recoverableCostMonthlyInr: number;
  employeeCount: number;
  rowCount: number;
};

export type AutomationOpportunity = {
  taskCategory: string;
  totalHours: number;
  repetitiveHours: number;
  repetitiveShare: number;
  estimatedRecoverableHoursMonthly: number;
  estimatedRecoverableCostMonthlyInr: number;
  employeeCount: number;
  departmentCount: number;
  score: number;
  formulaExplanation: string;
};

export type EmployeeProfile = {
  employeeId: string;
  employeeName: string | null;
  department: string;
  role: string | null;
  totalHours: number;
  repetitiveHours: number;
  repetitiveShare: number;
  totalCostInr: number | null;
  repetitiveCostInr: number | null;
  topTasks: Array<{ taskCategory: string; hours: number; repetitiveHours: number }>;
  peerComparison: {
    roleAverageRepetitiveShare: number | null;
    differenceFromRoleAverage: number | null;
  };
};

export type TrendItem = {
  weekStart: string;
  taskCategory: string;
  totalHours: number;
  repetitiveHours: number;
  repetitiveShare: number;
};

export type EmployeeWeekTrend = {
  employeeId: string;
  department: string;
  role: string | null;
  weeks: Array<{ weekStart: string; repetitiveShare: number; totalHours: number }>;
  latestWeekRepetitiveShare: number;
  previousWeekRepetitiveShare: number | null;
  repetitiveShareDelta: number | null;
  wentUpWeekOverWeek: boolean;
};

export type AnomalyResult = {
  title: string;
  description: string;
  metric: string;
  value: number;
  reason: string;
};

export type DashboardFilters = {
  department?: string;
  taskCategory?: string;
  app?: string;
  employeeId?: string;
};

export type CleaningSummary = {
  totalRawActivityRows: number;
  cleanActivityRows: number;
  droppedRows: number;
  fixedRows: number;
  flaggedRows: number;
  duplicateActivityRowsDropped: number;
  rawEmployeeRecords: number;
  normalizedEmployeeRecords: number;
  duplicateEmployeesResolved: string[];
  employeesWithNoMetadata: string[];
  metadataWithNoActivity: string[];
  issues: CleaningIssue[];
};

export type AnalyticsResponse = {
  dateRange: { start: string | null; end: string | null; observedDays: number; monthlyMultiplier: number };
  activeFilters: DashboardFilters;
  cleaning: CleaningSummary;
  headlines: {
    totalHours: number;
    repetitiveHours: number;
    repetitiveShare: number;
    recoverableHoursMonthly: number;
    recoverableCostMonthlyInr: number;
    totalCostInr: number;
    costCoverageShare: number;
    methodology: string;
  };
  breakdowns: {
    byDepartment: BreakdownItem[];
    byTaskCategory: BreakdownItem[];
    byApp: BreakdownItem[];
  };
  automationRanking: AutomationOpportunity[];
  employees: EmployeeProfile[];
  trends: TrendItem[];
  employeeWeekTrends: EmployeeWeekTrend[];
  anomaly: AnomalyResult | null;
  filterOptions: {
    departments: string[];
    taskCategories: string[];
    apps: string[];
    employees: string[];
  };
};

export type BaseDataset = {
  joinedRows: JoinedActivity[];
  allJoinedRowsBeforeTerminationDrop: JoinedActivity[];
  employees: NormalizedEmployee[];
  cleaning: CleaningSummary;
};
