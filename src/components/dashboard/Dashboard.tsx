"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Filter, Menu, RefreshCcw, X } from "lucide-react";
import { AnalyticsResponse, DashboardFilters } from "@/lib/data/types";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ChartSkeleton } from "@/components/ui/ChartSkeleton";
import { SectionSkeleton } from "@/components/ui/SectionSkeleton";
import { HeadlineCards } from "./HeadlineCards";
import { MethodologyDrawer } from "./MethodologyDrawer";
import { MethodologyPanel } from "./MethodologyPanel";
import { AnomalyCallout } from "./AnomalyCallout";
import { AutomationRanking } from "./AutomationRanking";
import { DeferredMount } from "./DeferredMount";
import { DashboardHeader } from "./DashboardHeader";
import { Sidebar, NavSection } from "./Sidebar";

const DepartmentRepetitiveChart = dynamic(
  () => import("./DepartmentRepetitiveChart").then((mod) => mod.DepartmentRepetitiveChart),
  { loading: () => <ChartSkeleton />, ssr: false }
);

const TaskRecoverableChart = dynamic(
  () => import("./TaskRecoverableChart").then((mod) => mod.TaskRecoverableChart),
  { loading: () => <ChartSkeleton />, ssr: false }
);

const TimeSinkBreakdown = dynamic(
  () => import("./TimeSinkBreakdown").then((mod) => mod.TimeSinkBreakdown),
  { loading: () => <ChartSkeleton />, ssr: false }
);

const TrendChart = dynamic(() => import("./TrendChart").then((mod) => mod.TrendChart), {
  loading: () => <ChartSkeleton />,
  ssr: false
});

const EmployeeDrilldown = dynamic(
  () => import("./EmployeeDrilldown").then((mod) => mod.EmployeeDrilldown),
  { loading: () => <SectionSkeleton rows={5} />, ssr: false }
);

const CleaningSummary = dynamic(
  () => import("./CleaningSummary").then((mod) => mod.CleaningSummary),
  { loading: () => <SectionSkeleton rows={6} />, ssr: false }
);

const ExecutiveSummary = dynamic(
  () => import("./ExecutiveSummary").then((mod) => mod.ExecutiveSummary),
  { loading: () => <SectionSkeleton rows={8} />, ssr: false }
);

const AssistantPanel = dynamic(
  () => import("@/components/assistant/AssistantPanel").then((mod) => mod.AssistantPanel),
  { loading: () => <SectionSkeleton rows={4} />, ssr: false }
);

const SCROLL_GAP = 12;

const SECTION_IDS: Record<NavSection, string> = {
  overview: "section-overview",
  charts: "section-charts",
  automation: "section-automation",
  breakdown: "section-breakdown",
  employees: "section-employees",
  "data-quality": "section-data-quality",
  assistant: "section-assistant"
};

function buildQuery(filters: DashboardFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params.toString();
}

function FilterBadge({ label, value, onClear }: { label: string; value: string; onClear: () => void }) {
  return (
    <Badge tone="brand" className="gap-2 pr-1.5">
      <span className="max-w-[140px] truncate sm:max-w-none">
        {label}: {value}
      </span>
      <button
        type="button"
        onClick={onClear}
        aria-label={`Clear ${label}`}
        className="rounded-full p-0.5 transition hover:bg-accent-cyan/20"
      >
        <X size={12} aria-hidden />
      </button>
    </Badge>
  );
}

export function Dashboard({ initialData }: { initialData: AnalyticsResponse }) {
  const [data, setData] = useState<AnalyticsResponse>(initialData);
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<NavSection>("overview");
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLElement>(null);
  const filterBarHeightBeforeRef = useRef(0);
  const afterFilterScrollRef = useRef<{ kind: "section"; section: NavSection } | { kind: "compensate" } | null>(null);
  const resyncScrollAfterLoadRef = useRef<NavSection | null>(null);
  const [scrollOffset, setScrollOffset] = useState(160);

  const query = useMemo(() => buildQuery(filters), [filters]);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const syncFiltersOpen = () => {
      if (desktopQuery.matches) setFiltersOpen(true);
    };
    syncFiltersOpen();
    desktopQuery.addEventListener("change", syncFiltersOpen);
    return () => desktopQuery.removeEventListener("change", syncFiltersOpen);
  }, []);

  useEffect(() => {
    const filtersEl = filtersRef.current;
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;

    if (!filtersEl) return;

    const measure = () => {
      const stickyTop = parseFloat(getComputedStyle(filtersEl).top) || 0;
      setScrollOffset(filtersEl.getBoundingClientRect().height + stickyTop + SCROLL_GAP);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(filtersEl);
    return () => observer.disconnect();
  }, [activeFilterCount, loading, filtersOpen]);

  const getFilterScrollOffset = useCallback(() => {
    const filtersEl = filtersRef.current;
    if (!filtersEl) return scrollOffset;
    const stickyTop = parseFloat(getComputedStyle(filtersEl).top) || 0;
    return filtersEl.getBoundingClientRect().height + stickyTop + SCROLL_GAP;
  }, [scrollOffset]);

  const scrollToSection = useCallback(
    (section: NavSection, behavior: ScrollBehavior = "smooth") => {
      const target = document.getElementById(SECTION_IDS[section]);
      if (!target) return;
      const top = target.getBoundingClientRect().top + window.scrollY - getFilterScrollOffset();
      window.scrollTo({ top: Math.max(0, top), behavior });
    },
    [getFilterScrollOffset]
  );

  const compensateFilterBarGrowth = useCallback((behavior: ScrollBehavior = "auto") => {
    const filtersEl = filtersRef.current;
    if (!filtersEl) return;
    const heightAfter = filtersEl.getBoundingClientRect().height;
    const delta = heightAfter - filterBarHeightBeforeRef.current;
    if (delta > 0) {
      window.scrollBy({ top: delta, behavior });
    }
    filterBarHeightBeforeRef.current = heightAfter;
  }, []);

  const queueAfterFilterScroll = useCallback(
    (intent: { kind: "section"; section: NavSection } | { kind: "compensate" }) => {
      filterBarHeightBeforeRef.current = filtersRef.current?.getBoundingClientRect().height ?? 0;
      afterFilterScrollRef.current = intent;
    },
    []
  );

  useLayoutEffect(() => {
    const intent = afterFilterScrollRef.current;
    if (!intent) return;
    afterFilterScrollRef.current = null;

    if (intent.kind === "section") {
      scrollToSection(intent.section, "auto");
    } else {
      compensateFilterBarGrowth("auto");
    }
  });

  useEffect(() => {
    if (loading || !resyncScrollAfterLoadRef.current) return;
    const section = resyncScrollAfterLoadRef.current;
    resyncScrollAfterLoadRef.current = null;
    requestAnimationFrame(() => scrollToSection(section, "auto"));
  }, [loading, scrollToSection]);

  const navigateTo = useCallback(
    (section: NavSection) => {
      setActiveSection(section);
      scrollToSection(section);
    },
    [scrollToSection]
  );

  useEffect(() => {
    const preload = () => {
      void import("./ExecutiveSummary");
    };
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(preload);
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(preload, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!query) {
      setData(initialData);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/api/analytics?${query}`)
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Failed to load analytics.");
        if (!cancelled) setData(body);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load analytics.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query, initialData]);

  function updateFilter<K extends keyof DashboardFilters>(key: K, value?: DashboardFilters[K]) {
    setFilters((previous) => ({ ...previous, [key]: value || undefined }));
  }

  function filterByDepartment(department: string) {
    updateFilter("department", department);
    queueAfterFilterScroll({ kind: "compensate" });
  }

  function filterByTaskCategory(taskCategory: string) {
    const willRefetch = buildQuery({ ...filters, taskCategory }) !== query;
    updateFilter("taskCategory", taskCategory);
    setActiveSection("employees");
    queueAfterFilterScroll({ kind: "section", section: "employees" });
    if (willRefetch) {
      resyncScrollAfterLoadRef.current = "employees";
    }
  }

  if (error && !data) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-canvas p-4">
        <div className="glass-card max-w-lg p-6 sm:p-8">
          <p className="text-base font-semibold text-red-400 sm:text-lg">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-canvas">
      <Sidebar active={activeSection} onNavigate={navigateTo} />

      <div className="lg:pl-60">
        <DashboardHeader data={data} />

        <div
          className="page-shell space-y-6 pb-24 lg:pb-8"
          style={{ ["--dashboard-scroll-offset" as string]: `${scrollOffset}px` }}
        >
          <section
            id="dashboard-filters"
            ref={filtersRef}
            className="glass-card sticky top-0 z-20 p-4 sm:top-2 sm:p-5"
            aria-label="Filters"
          >
            <div className="flex items-center gap-2">
              <Filter size={16} className="shrink-0 text-accent-cyan" aria-hidden />
              <p className="text-sm font-semibold text-foreground">Filters</p>
              {activeFilterCount > 0 ? <Badge tone="brand">{activeFilterCount} active</Badge> : null}
              {loading ? (
                <span className="hidden text-xs text-muted sm:ml-auto sm:inline" role="status" aria-live="polite">
                  Updating…
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => setFiltersOpen((open) => !open)}
                aria-expanded={filtersOpen}
                aria-controls="dashboard-filters-panel"
                aria-label={filtersOpen ? "Close filters" : "Open filters"}
                className="ml-auto shrink-0 rounded-lg border border-border bg-surface p-2 text-foreground transition hover:border-accent-cyan/30 hover:bg-accent-cyan/10 lg:hidden"
              >
                {filtersOpen ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
              </button>
            </div>

            <div id="dashboard-filters-panel" className={`${filtersOpen ? "mt-3 block" : "hidden"} lg:mt-3 lg:block`}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Department</span>
                <Select value={filters.department ?? ""} onChange={(e) => updateFilter("department", e.target.value)}>
                  <option value="">All departments</option>
                  {data.filterOptions.departments.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Task</span>
                <Select value={filters.taskCategory ?? ""} onChange={(e) => updateFilter("taskCategory", e.target.value)}>
                  <option value="">All tasks</option>
                  {data.filterOptions.taskCategories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">App</span>
                <Select value={filters.app ?? ""} onChange={(e) => updateFilter("app", e.target.value)}>
                  <option value="">All apps</option>
                  {data.filterOptions.apps.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              </label>
              <Button variant="secondary" onClick={() => setFilters({})} className="mt-auto h-[42px] w-full">
                <RefreshCcw size={16} aria-hidden /> Reset
              </Button>
            </div>

            {activeFilterCount > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {filters.department ? (
                  <FilterBadge label="Department" value={filters.department} onClear={() => updateFilter("department")} />
                ) : null}
                {filters.taskCategory ? (
                  <FilterBadge label="Task" value={filters.taskCategory} onClear={() => updateFilter("taskCategory")} />
                ) : null}
                {filters.app ? <FilterBadge label="App" value={filters.app} onClear={() => updateFilter("app")} /> : null}
                {filters.employeeId ? (
                  <FilterBadge label="Employee" value={filters.employeeId} onClear={() => updateFilter("employeeId")} />
                ) : null}
              </div>
            ) : null}
            </div>
          </section>

          <section id={SECTION_IDS.overview} className="scroll-mt-[var(--dashboard-scroll-offset,9rem)] space-y-6">
            <HeadlineCards data={data} onOpenMethodology={() => setMethodologyOpen(true)} />
            <MethodologyPanel data={data} onOpenDrawer={() => setMethodologyOpen(true)} />
          </section>

          <MethodologyDrawer open={methodologyOpen} onClose={() => setMethodologyOpen(false)} data={data} />

          <section id={SECTION_IDS["data-quality"]} className="scroll-mt-[var(--dashboard-scroll-offset,9rem)]">
            <DeferredMount fallback={<SectionSkeleton rows={6} />}>
              <CleaningSummary data={data} />
            </DeferredMount>
          </section>

          <section id={SECTION_IDS.charts} className="scroll-mt-[var(--dashboard-scroll-offset,9rem)] space-y-6">
            <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
              <DeferredMount fallback={<ChartSkeleton />}>
                <DepartmentRepetitiveChart data={data} onDepartmentClick={filterByDepartment} />
              </DeferredMount>
              <DeferredMount fallback={<ChartSkeleton />}>
                <TaskRecoverableChart data={data} onTaskCategoryClick={filterByTaskCategory} />
              </DeferredMount>
            </div>
          </section>

          <section id={SECTION_IDS.breakdown} className="scroll-mt-[var(--dashboard-scroll-offset,9rem)]">
            <DeferredMount fallback={<ChartSkeleton />}>
              <TimeSinkBreakdown
                data={data}
                onDepartmentClick={filterByDepartment}
                onTaskCategoryClick={filterByTaskCategory}
              />
            </DeferredMount>
          </section>

          <section id={SECTION_IDS.automation} className="scroll-mt-[var(--dashboard-scroll-offset,9rem)]">
            <AutomationRanking data={data} onTaskCategoryClick={filterByTaskCategory} />
          </section>

          <section id={SECTION_IDS.employees} className="scroll-mt-[var(--dashboard-scroll-offset,9rem)] space-y-6">
            <DeferredMount fallback={<SectionSkeleton rows={5} />}>
              <EmployeeDrilldown
                data={data}
                employeeId={filters.employeeId}
                onEmployeeChange={(employeeId) => updateFilter("employeeId", employeeId)}
                activeTaskFilter={filters.taskCategory}
              />
            </DeferredMount>
            <DeferredMount fallback={<ChartSkeleton />}>
              <TrendChart data={data} />
            </DeferredMount>
            <AnomalyCallout data={data} />
          </section>

          <div className="pointer-events-none fixed left-[-10000px] top-0" aria-hidden>
            <ExecutiveSummary data={data} filters={filters} />
          </div>

          <section id={SECTION_IDS.assistant} className="scroll-mt-[var(--dashboard-scroll-offset,9rem)]">
            <DeferredMount fallback={<SectionSkeleton rows={4} />}>
              <AssistantPanel data={data} />
            </DeferredMount>
          </section>
        </div>
      </div>
    </div>
  );
}
