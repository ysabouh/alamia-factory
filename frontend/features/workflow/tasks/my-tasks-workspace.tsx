"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Columns3,
  LayoutGrid,
  ListTodo,
  RefreshCw,
  Rows3,
  Search,
  X
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { useFactoryAuth } from "@/contexts/factory-auth-context";
import { MyTasksKpiStrip } from "@/features/workflow/tasks/my-tasks-kpi-strip";
import {
  MY_TASKS_EMPTY,
  MY_TASKS_TAB_LABELS,
  computeMyTasksSummary,
  filterMyTasks,
  groupTasksByWorkflow,
  type MyTasksKpiFilter,
  type MyTasksTab,
  type MyTasksViewMode
} from "@/features/workflow/tasks/my-tasks-utils";
import { TaskCalendarView } from "@/features/workflow/tasks/task-calendar-view";
import { TaskCard } from "@/features/workflow/tasks/task-card";
import { TaskDetailsDrawer } from "@/features/workflow/tasks/task-details-drawer";
import { TaskKanbanBoard } from "@/features/workflow/tasks/task-kanban-board";
import { WorkflowGroupHeader } from "@/features/workflow/tasks/workflow-group-header";
import { workflowApi, type WorkflowTaskJson } from "@/lib/api/workflow-client";

const TABS: MyTasksTab[] = ["action", "waiting", "archive"];

export function MyTasksWorkspace() {
  const pathname = usePathname();
  const { user } = useFactoryAuth();
  const [tab, setTab] = useState<MyTasksTab>("action");
  const [view, setView] = useState<MyTasksViewMode>("cards");
  const [kpiFilter, setKpiFilter] = useState<MyTasksKpiFilter>("all");
  const [search, setSearch] = useState("");
  const [groupByWorkflow, setGroupByWorkflow] = useState(true);
  const [tasks, setTasks] = useState<WorkflowTaskJson[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workflowApi.myTasks();
      setTasks(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setSelectedId(null);
  }, [pathname]);

  useEffect(() => {
    setSelectedId(null);
  }, [tab, view, kpiFilter]);

  const summary = useMemo(() => computeMyTasksSummary(tasks), [tasks]);
  const filtered = useMemo(
    () => filterMyTasks(tasks, tab, search, kpiFilter),
    [tasks, tab, search, kpiFilter]
  );

  useEffect(() => {
    if (selectedId != null && !filtered.some((t) => t.id === selectedId)) {
      setSelectedId(null);
    }
  }, [filtered, selectedId]);

  const grouped = useMemo(() => groupTasksByWorkflow(filtered), [filtered]);

  const tabCounts = useMemo(
    () => ({
      action: filterMyTasks(tasks, "action", "", "all").length,
      waiting: filterMyTasks(tasks, "waiting", "", "all").length,
      archive: filterMyTasks(tasks, "archive", "", "all").length
    }),
    [tasks]
  );

  const runQuick = async (taskId: number, fn: () => Promise<unknown>) => {
    setBusyId(taskId);
    try {
      await fn();
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const firstName = user?.name?.split(/\s+/)[0] ?? "مستخدم";

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col dark:bg-zinc-950">
      <div className="space-y-5 p-4 md:p-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-atlas-brand/10 text-atlas-brand">
                  <ListTodo className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-atlas-ink dark:text-zinc-100">مهامي</h1>
                  <p className="text-sm text-atlas-muted">
                    مرحباً {firstName}
                    {summary.action > 0
                      ? ` — لديك ${summary.action} ${summary.action === 1 ? "مهمة تحتاج" : "مهام تحتاج"} إجراءً`
                      : " — لا مهام عاجلة حالياً"}
                  </p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="atlas-btn-secondary inline-flex items-center gap-2 text-sm"
              title="تحديث"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              تحديث
            </button>
          </div>

          <MyTasksKpiStrip summary={summary} activeFilter={kpiFilter} onFilterChange={setKpiFilter} />
        </div>

        <div className="rounded-xl border border-atlas-rule bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-atlas-muted" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بالقالب أو التنفيذ أو المرحلة..."
                className="ps-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {TABS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setTab(id);
                    setKpiFilter("all");
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    tab === id
                      ? "bg-atlas-brand text-white shadow-sm"
                      : "bg-atlas-canvas text-atlas-muted hover:bg-atlas-brand/10 hover:text-atlas-brand dark:bg-zinc-800"
                  }`}
                >
                  {MY_TASKS_TAB_LABELS[id]}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                      tab === id ? "bg-white/20" : "bg-atlas-border/60 dark:bg-zinc-700"
                    }`}
                  >
                    {tabCounts[id]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-atlas-rule/80 pt-3 dark:border-zinc-700">
            <div className="flex flex-wrap items-center gap-2">
              {view === "cards" ? (
                <button
                  type="button"
                  onClick={() => setGroupByWorkflow((v) => !v)}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${
                    groupByWorkflow ? "bg-atlas-brand/15 text-atlas-brand" : "text-atlas-muted hover:text-atlas-ink"
                  }`}
                >
                  <Rows3 className="h-3.5 w-3.5" />
                  تجميع حسب التنفيذ
                </button>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  ["cards", LayoutGrid, "بطاقات"],
                  ["kanban", Columns3, "كانبان"],
                  ["calendar", CalendarDays, "تقويم"]
                ] as const
              ).map(([id, Icon, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setView(id)}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${
                    view === id ? "bg-atlas-brand/15 text-atlas-brand" : "text-atlas-muted hover:text-atlas-ink"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <main
          className={`min-h-0 flex-1 overflow-auto p-4 lg:p-6 ${selectedId ? "hidden lg:block lg:w-[62%]" : "w-full"}`}
        >
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-44 animate-pulse rounded-xl border border-atlas-border bg-atlas-surface/50 dark:border-zinc-700"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-atlas-border bg-white px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900">
              <ListTodo className="mb-3 h-10 w-10 text-atlas-muted/60" />
              <p className="text-sm font-medium text-atlas-ink dark:text-zinc-200">{MY_TASKS_EMPTY[tab]}</p>
              {(search || kpiFilter !== "all") && (
                <button
                  type="button"
                  className="mt-3 text-xs text-atlas-brand hover:underline"
                  onClick={() => {
                    setSearch("");
                    setKpiFilter("all");
                  }}
                >
                  مسح الفلاتر
                </button>
              )}
            </div>
          ) : view === "kanban" ? (
            <TaskKanbanBoard tasks={filtered} onSelect={(t) => setSelectedId(t.id)} onRefresh={load} />
          ) : view === "calendar" ? (
            <TaskCalendarView tasks={filtered} onSelect={(t) => setSelectedId(t.id)} />
          ) : groupByWorkflow ? (
            <div className="space-y-6">
              {grouped.map((group) => (
                <section key={group.instanceId} className="overflow-hidden rounded-2xl border border-atlas-border bg-white dark:border-zinc-700 dark:bg-zinc-900">
                  <WorkflowGroupHeader
                    templateName={group.templateName}
                    workflowNumber={group.workflowNumber}
                    taskCount={group.tasks.length}
                  />
                  <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
                    {group.tasks.map((t) => (
                      <TaskCard
                        key={t.id}
                        task={t}
                        showTemplate={false}
                        selected={selectedId === t.id}
                        onSelect={() => setSelectedId(t.id)}
                        busy={busyId === t.id}
                        onAccept={() => void runQuick(t.id, () => workflowApi.acceptTask(t.id))}
                        onComplete={() =>
                          void runQuick(t.id, () =>
                            workflowApi.completeTask(t.id, {
                              checklist: (t.checklist ?? []).map((c) => ({
                                checklistItemId: c.checklistItemId,
                                isCompleted: c.isCompleted
                              }))
                            })
                          )
                        }
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  selected={selectedId === t.id}
                  onSelect={() => setSelectedId(t.id)}
                  busy={busyId === t.id}
                  onAccept={() => void runQuick(t.id, () => workflowApi.acceptTask(t.id))}
                  onComplete={() =>
                    void runQuick(t.id, () =>
                      workflowApi.completeTask(t.id, {
                        checklist: (t.checklist ?? []).map((c) => ({
                          checklistItemId: c.checklistItemId,
                          isCompleted: c.isCompleted
                        }))
                      })
                    )
                  }
                />
              ))}
            </div>
          )}
        </main>

        {selectedId ? (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={() => setSelectedId(null)}
              aria-hidden
            />
            <aside className="fixed inset-y-0 start-0 z-50 flex h-full w-full max-w-md flex-col border-s border-atlas-border bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900 lg:static lg:z-auto lg:w-[38%] lg:max-w-none lg:shadow-none">
              <div className="flex items-center justify-between border-b border-atlas-border px-3 py-2 lg:hidden dark:border-zinc-700">
                <span className="text-sm font-medium">تفاصيل المهمة</span>
                <button type="button" onClick={() => setSelectedId(null)} className="rounded p-1 text-atlas-muted">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <TaskDetailsDrawer
                key={selectedId}
                taskId={selectedId}
                onClose={() => setSelectedId(null)}
                onUpdated={load}
              />
            </aside>
          </>
        ) : null}
      </div>
    </div>
  );
}
