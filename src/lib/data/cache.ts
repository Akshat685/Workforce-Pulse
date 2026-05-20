import { buildAnalyticsFromBase, buildBaseDataset } from "./analytics";
import type { BaseDataset, DashboardFilters } from "./types";

let cachedBaseDataset: BaseDataset | null = null;

export async function getBaseDataset(): Promise<BaseDataset> {
  if (!cachedBaseDataset) cachedBaseDataset = await buildBaseDataset();
  return cachedBaseDataset;
}

export async function getAnalytics(filters: DashboardFilters = {}) {
  const base = await getBaseDataset();
  return buildAnalyticsFromBase(base, filters);
}

export function clearAnalyticsCache() {
  cachedBaseDataset = null;
}
