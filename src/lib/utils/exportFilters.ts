import { DashboardFilters, EmployeeProfile } from "@/lib/data/types";

const FILTER_LABELS: Record<keyof DashboardFilters, string> = {
  department: "Department",
  taskCategory: "Task",
  app: "App",
  employeeId: "Employee"
};

const FILTER_ORDER: (keyof DashboardFilters)[] = ["department", "taskCategory", "app", "employeeId"];

function formatFilterValue(key: keyof DashboardFilters, value: string, employees?: EmployeeProfile[]) {
  if (key === "employeeId" && employees) {
    const employee = employees.find((row) => row.employeeId === value);
    if (employee) {
      return employee.role ? `${employee.employeeId} (${employee.role})` : employee.employeeId;
    }
  }
  return value;
}

export function getActiveFilterRows(filters: DashboardFilters, employees?: EmployeeProfile[]) {
  return FILTER_ORDER.filter((key) => Boolean(filters[key])).map((key) => ({
    label: FILTER_LABELS[key],
    value: formatFilterValue(key, filters[key] as string, employees)
  }));
}

export function formatActiveFiltersSummary(filters: DashboardFilters, employees?: EmployeeProfile[]) {
  const rows = getActiveFilterRows(filters, employees);
  if (rows.length === 0) return "None applied";
  return rows.map((row) => `${row.label}: ${row.value}`).join(" · ");
}
