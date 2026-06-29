"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, Filter, RefreshCw, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useFactoryAuth } from "@/contexts/factory-auth-context";
import {
  DIRECT_TASK_CATEGORY_LABELS,
  DIRECT_TASK_PRIORITY_LABELS,
  DIRECT_TASK_TYPE_LABELS
} from "@/features/direct-tasks/create/create-direct-task-labels";
import { statusLabel } from "@/features/direct-tasks/detail/direct-task-detail-utils";
import { MyDirectTaskRow } from "@/features/direct-tasks/my-tasks/my-direct-task-row";
import {
  MyDirectTasksAchievementWidget,
  MyDirectTasksHero,
  MyDirectTasksScheduleWidget
} from "@/features/direct-tasks/my-tasks/my-direct-tasks-widgets";
import {
  MY_DIRECT_TASKS_TAB_LABELS,
  buildTodaySchedule,
  computeMyDirectTasksSummary,
  filterMyDirectTasks,
  sortMyDirectTasks,
  type MyDirectTasksSort,
  type MyDirectTasksTab
} from "@/features/direct-tasks/my-tasks/my-direct-tasks-utils";
import { directTasksApi, type DirectTaskJson } from "@/lib/api/direct-tasks-client";
import { cn } from "@/lib/utils";

const TABS: MyDirectTasksTab[] = ["all", "active", "review", "overdue", "completed"];
const PAGE_SIZE = 8;

export function MyDirectTasksWorkspace() {
  const { user, can } = useFactoryAuth();
  const canView = can("direct_tasks.view");
  const canCreate = can("direct_tasks.create");
  const canExecute = can("direct_tasks.execute");

  const [tasks, setTasks] = useState<DirectTaskJson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<MyDirectTasksTab>("all");
  const [kpiTab, setKpiTab] = useState<MyDirectTasksTab | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sort, setSort] = useState<MyDirectTasksSort>("newest");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await directTasksApi.list({ mine: 1, pageSize: 100 });
      setTasks(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل تحميل المهام");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canView) void load();
    else setLoading(false);
  }, [canView, load]);

  const effectiveTab = kpiTab ?? tab;

  const summary = useMemo(() => computeMyDirectTasksSummary(tasks), [tasks]);
  const schedule = useMemo(() => buildTodaySchedule(tasks), [tasks]);

  const tabCounts = useMemo(
    () => ({
      all: tasks.length,
      active: filterMyDirectTasks(tasks, "active", "", "", "", "").length,
      review: filterMyDirectTasks(tasks, "review", "", "", "", "").length,
      overdue: filterMyDirectTasks(tasks, "overdue", "", "", "", "").length,
      completed: filterMyDirectTasks(tasks, "completed", "", "", "", "").length
    }),
    [tasks]
  );

  const filtered = useMemo(
    () => sortMyDirectTasks(filterMyDirectTasks(tasks, effectiveTab, search, statusFilter, priorityFilter, typeFilter, categoryFilter), sort),
    [tasks, effectiveTab, search, statusFilter, priorityFilter, typeFilter, categoryFilter, sort]
  );

  const visible = filtered.slice(0, visibleCount);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [effectiveTab, search, statusFilter, priorityFilter, typeFilter, categoryFilter, sort]);

  const firstName = user?.name?.split(/\s+/)[0] ?? "مستخدم";

  const handleKpiClick = (kpi: "completed" | "review" | "active" | "overdue" | null) => {
    if (!kpi) {
      setKpiTab(null);
      return;
    }
    const map: Record<string, MyDirectTasksTab> = {
      completed: "completed",
      review: "review",
      active: "active",
      overdue: "overdue"
    };
    setKpiTab((prev) => (prev === map[kpi] ? null : map[kpi]));
    setTab(map[kpi]);
  };

  const startTask = async (taskId: number) => {
    setBusyId(taskId);
    try {
      await directTasksApi.start(taskId);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  if (!canView) {
    return <p className="p-6 text-atlas-muted">ليس لديك صلاحية عرض المهام المباشرة.</p>;
  }

  return (
    <div className="min-h-full bg-zinc-50/80 dark:bg-zinc-950">
      {/* رأس الصفحة */}
      <header className="border-b border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">مهامي المباشرة</h1>
              <p className="text-sm text-zinc-500">قائمة المهام الموكلة إليك</p>
            </div>
          </div>
          <button type="button" onClick={() => void load()} className="atlas-btn-secondary inline-flex items-center gap-2 text-sm" disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            تحديث
          </button>
        </div>
      </header>

      <div className="space-y-5 p-4 md:p-6">
        {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        <MyDirectTasksHero
          firstName={firstName}
          summary={summary}
          canCreate={canCreate}
          activeKpi={kpiTab}
          onKpiClick={handleKpiClick}
        />

        {/* شريط البحث والتصفية */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث في المهام..."
                className="ps-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900">
                <option value="">جميع الأنواع</option>
                {Object.entries(DIRECT_TASK_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900">
                <option value="">جميع الحالات</option>
                {Object.entries({
                  assigned: statusLabel("assigned"),
                  accepted: statusLabel("accepted"),
                  in_progress: statusLabel("in_progress"),
                  waiting_review: statusLabel("waiting_review"),
                  completed: statusLabel("completed"),
                  overdue: statusLabel("overdue")
                }).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900">
                <option value="">جميع الأولويات</option>
                {Object.entries(DIRECT_TASK_PRIORITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className={cn("inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm", showAdvanced ? "border-sky-300 bg-sky-50 text-sky-700" : "border-zinc-200 text-zinc-600 dark:border-zinc-700")}
              >
                <Filter className="h-4 w-4" />
                تصفية متقدمة
              </button>
            </div>
          </div>
          {showAdvanced ? (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
              <select value={sort} onChange={(e) => setSort(e.target.value as MyDirectTasksSort)} className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900">
                <option value="newest">الأحدث</option>
                <option value="oldest">الأقدم</option>
                <option value="due">حسب الموعد</option>
                <option value="priority">حسب الأولوية</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="">تصنيف حسب القسم</option>
                {Object.entries(DIRECT_TASK_CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        {/* المحتوى الرئيسي */}
        <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
          <div className="min-w-0">
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
              {/* تبويبات */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 px-4 dark:border-zinc-800">
                <div className="flex flex-wrap gap-1 overflow-x-auto py-2">
                  {TABS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => { setTab(t); setKpiTab(null); }}
                      className={cn(
                        "shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition",
                        effectiveTab === t
                          ? "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300"
                          : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      )}
                    >
                      {MY_DIRECT_TASKS_TAB_LABELS[t]} ({tabCounts[t]})
                    </button>
                  ))}
                </div>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as MyDirectTasksSort)}
                  className="mb-2 h-8 rounded-lg border border-zinc-200 bg-white px-2 text-xs dark:border-zinc-700 dark:bg-zinc-900 lg:mb-0"
                >
                  <option value="newest">الأحدث</option>
                  <option value="oldest">الأقدم</option>
                  <option value="due">حسب الموعد</option>
                  <option value="priority">حسب الأولوية</option>
                </select>
              </div>

              {loading ? (
                <p className="p-8 text-center text-sm text-zinc-500">جاري تحميل المهام...</p>
              ) : filtered.length === 0 ? (
                <p className="p-8 text-center text-sm text-zinc-500">لا توجد مهام مطابقة</p>
              ) : (
                <ul>
                  {visible.map((task) => (
                    <MyDirectTaskRow
                      key={task.id}
                      task={task}
                      onStart={canExecute && busyId !== task.id ? () => void startTask(task.id) : undefined}
                    />
                  ))}
                </ul>
              )}

              {filtered.length > visibleCount ? (
                <div className="border-t border-zinc-100 p-3 text-center dark:border-zinc-800">
                  <button
                    type="button"
                    className="text-sm font-medium text-sky-600 hover:underline"
                    onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                  >
                    عرض المزيد من المهام
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {/* الشريط الجانبي */}
          <aside className="space-y-4">
            <MyDirectTasksScheduleWidget entries={schedule} />
            <MyDirectTasksAchievementWidget summary={summary} />
          </aside>
        </div>
      </div>
    </div>
  );
}
