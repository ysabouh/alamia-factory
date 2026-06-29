"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  GitBranch,
  Play,
  Plus,
  Search,
  Workflow
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  WfmTable,
  WfmTableBody,
  WfmTableCell,
  WfmTableHead,
  WfmTableHeader,
  WfmTableRow
} from "@/components/workforce/atlas";
import { useFactoryAuth } from "@/contexts/factory-auth-context";
import { StartWorkflowDialog } from "@/features/workflow/instances/start-workflow-dialog";
import { WorkflowInstancesKpiStrip } from "@/features/workflow/instances/workflow-instances-kpi-strip";
import {
  formatInstanceDate,
  formatInstanceDateTime,
  INSTANCE_STATUS_FILTERS,
  instancePriorityBadgeVariant,
  instancePriorityLabel,
  instanceStatusBadgeVariant,
  instanceStatusLabel,
  matchesInstanceFilter,
  matchesInstanceSearch,
  summarizeInstances,
  type InstanceStatusFilter
} from "@/features/workflow/instances/workflow-instance-list-utils";
import {
  formatStageIndex,
  getStageVisualTheme,
  type StageVisualState
} from "@/features/workflow/instances/workflow-stage-visuals";
import { workflowApi, type WorkflowInstanceJson, type WorkflowStageJson } from "@/lib/api/workflow-client";

function ProgressCell({ value }: { value: number }) {
  const color =
    value >= 100 ? "bg-emerald-500" : value >= 50 ? "bg-blue-500" : value > 0 ? "bg-amber-500" : "bg-zinc-300";

  return (
    <div className="flex min-w-[120px] items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="w-10 text-end text-xs font-bold tabular-nums text-atlas-ink dark:text-zinc-200">{value}%</span>
    </div>
  );
}

function TemplateSubjectCell({
  templateName,
  subjectLabel,
  subjectCode
}: {
  templateName?: string | null;
  subjectLabel?: string | null;
  subjectCode?: string | null;
}) {
  return (
    <div className="min-w-[180px] max-w-[260px] space-y-1.5 py-0.5">
      <div className="flex items-start gap-2">
        <GitBranch className="mt-0.5 h-3.5 w-3.5 shrink-0 text-atlas-muted" />
        <p className="text-sm font-semibold leading-snug text-atlas-ink dark:text-zinc-100">
          {templateName ?? "—"}
        </p>
      </div>
      <div className="border-s border-atlas-rule/80 ps-5 dark:border-zinc-700">
        <p className="text-sm leading-snug text-atlas-slate dark:text-zinc-300">{subjectLabel ?? "—"}</p>
        {subjectCode ? (
          <p className="mt-0.5 font-mono text-[11px] text-atlas-muted">{subjectCode}</p>
        ) : null}
      </div>
    </div>
  );
}

function resolveStageVisualState(status: string): StageVisualState {
  if (status === "completed") return "completed";
  if (status === "overdue") return "delayed";
  if (["in_progress", "assigned", "accepted", "waiting_approval", "waiting_information"].includes(status)) {
    return "current";
  }
  return "pending";
}

function CurrentStageCell({
  stage,
  status
}: {
  stage?: WorkflowStageJson | null;
  status: string;
}) {
  if (status === "completed" && !stage?.name) {
    return (
      <div className="flex min-w-[160px] items-start gap-2.5 py-0.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500 shadow-sm">
          <Check className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-sm font-semibold leading-snug text-emerald-700 dark:text-emerald-300">اكتمل سير العمل</p>
          <p className="mt-0.5 text-[11px] text-atlas-muted">جميع المراحل منتهية</p>
        </div>
      </div>
    );
  }

  if (!stage?.name) {
    return <span className="text-sm text-atlas-muted">—</span>;
  }

  const visualState = resolveStageVisualState(status);
  const theme = getStageVisualTheme(visualState);
  const Icon = theme.icon;

  return (
    <div className="flex min-w-[160px] max-w-[240px] items-start gap-2.5 py-0.5">
      <div
        className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg shadow-sm ${theme.headerBg}`}
      >
        <Icon
          className={`mb-0.5 h-3 w-3 ${theme.iconClass} ${visualState === "current" ? "fill-current" : ""}`}
          strokeWidth={visualState === "completed" ? 2.5 : 2}
        />
        <span className={`text-[9px] font-bold leading-none ${theme.headerText}`}>
          {formatStageIndex(stage.stageNumber)}
        </span>
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-semibold leading-snug text-atlas-ink dark:text-zinc-100">{stage.name}</p>
        <p className={`text-[11px] font-medium leading-snug ${theme.kpiAccent}`}>{instanceStatusLabel(status)}</p>
        {stage.description ? (
          <p className="line-clamp-2 text-[11px] leading-snug text-atlas-muted">{stage.description}</p>
        ) : null}
        <div className="flex flex-wrap gap-1">
          {stage.requiresApproval ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              موافقة مطلوبة
            </span>
          ) : null}
          {stage.checklistRequired ? (
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-800 dark:bg-sky-950/40 dark:text-sky-300">
              قائمة تحقق
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function WorkflowInstancesWorkspace() {
  const router = useRouter();
  const { can } = useFactoryAuth();
  const canStart = can("workflow.instances.manage");

  const [rows, setRows] = useState<WorkflowInstanceJson[]>([]);
  const [loading, setLoading] = useState(true);
  const [startOpen, setStartOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InstanceStatusFilter>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workflowApi.listInstances({ pageSize: 100 });
      setRows(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => summarizeInstances(rows), [rows]);

  const filteredRows = useMemo(
    () => rows.filter((r) => matchesInstanceFilter(r, statusFilter) && matchesInstanceSearch(r, search)),
    [rows, statusFilter, search]
  );

  return (
    <div className="space-y-5 p-4 md:p-6 dark:bg-zinc-950">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-atlas-brand/10 text-atlas-brand">
                <Workflow className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-atlas-ink dark:text-zinc-100">تنفيذات سير العمل</h1>
                <p className="text-sm text-atlas-muted">متابعة جميع طلبات التنفيذ وحالتها ومراحلها الحالية</p>
              </div>
            </div>
          </div>
          {canStart ? (
            <button
              type="button"
              onClick={() => setStartOpen(true)}
              className="atlas-btn-primary inline-flex items-center gap-2 text-sm"
            >
              <Plus className="h-4 w-4" />
              تنفيذ جديد
            </button>
          ) : null}
        </div>

        <WorkflowInstancesKpiStrip
          summary={summary}
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
        />
      </div>

      <div className="rounded-xl border border-atlas-rule bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-atlas-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث برقم الطلب، القالب، الموضوع، أو المرحلة..."
              className="ps-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {INSTANCE_STATUS_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === f.id
                    ? "bg-atlas-brand text-white shadow-sm"
                    : "bg-atlas-canvas text-atlas-muted hover:bg-atlas-brand/10 hover:text-atlas-brand dark:bg-zinc-800"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <WfmTable>
        <WfmTableHeader>
          <WfmTableRow>
            <WfmTableHead>رقم الطلب</WfmTableHead>
            <WfmTableHead className="min-w-[200px]">القالب والموضوع</WfmTableHead>
            <WfmTableHead className="min-w-[180px]">المرحلة الحالية</WfmTableHead>
            <WfmTableHead>الحالة</WfmTableHead>
            <WfmTableHead>الأولوية</WfmTableHead>
            <WfmTableHead>التقدم</WfmTableHead>
            <WfmTableHead>تاريخ البدء</WfmTableHead>
            <WfmTableHead>الاستحقاق</WfmTableHead>
            <WfmTableHead className="text-end">إجراء</WfmTableHead>
          </WfmTableRow>
        </WfmTableHeader>
        <WfmTableBody>
          {loading ? (
            <WfmTableRow>
              <WfmTableCell colSpan={9} className="py-14 text-center text-atlas-muted">
                جاري تحميل التنفيذات...
              </WfmTableCell>
            </WfmTableRow>
          ) : filteredRows.length === 0 ? (
            <WfmTableRow>
              <WfmTableCell colSpan={9} className="py-14 text-center">
                <Play className="mx-auto mb-3 h-10 w-10 text-atlas-muted opacity-60" />
                <p className="font-medium text-atlas-ink dark:text-zinc-200">
                  {rows.length === 0 ? "لا توجد تنفيذات بعد" : "لا توجد نتائج مطابقة للبحث"}
                </p>
                <p className="mt-1 text-sm text-atlas-muted">
                  {rows.length === 0
                    ? "ابدأ أول تنفيذ لسير عمل من القوالب المنشورة"
                    : "جرّب تغيير كلمات البحث أو فلتر الحالة"}
                </p>
                {rows.length === 0 && canStart ? (
                  <button
                    type="button"
                    onClick={() => setStartOpen(true)}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-atlas-brand hover:underline"
                  >
                    <Plus className="h-4 w-4" />
                    بدء تنفيذ جديد
                  </button>
                ) : null}
              </WfmTableCell>
            </WfmTableRow>
          ) : (
            filteredRows.map((row) => (
              <WfmTableRow
                key={row.id}
                className="cursor-pointer"
                onClick={() => router.push(`/ar/workflow/instances/${row.id}`)}
              >
                <WfmTableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-atlas-brand">{row.workflowNumber}</span>
                    {row.status === "completed" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    ) : null}
                  </div>
                </WfmTableCell>
                <WfmTableCell>
                  <TemplateSubjectCell
                    templateName={row.templateName}
                    subjectLabel={row.subject?.label}
                    subjectCode={row.subject?.code}
                  />
                </WfmTableCell>
                <WfmTableCell>
                  <CurrentStageCell stage={row.currentStage} status={row.status} />
                </WfmTableCell>
                <WfmTableCell>
                  <Badge variant={instanceStatusBadgeVariant(row.status)}>
                    {instanceStatusLabel(row.status)}
                  </Badge>
                </WfmTableCell>
                <WfmTableCell>
                  <Badge variant={instancePriorityBadgeVariant(row.priority)}>
                    {instancePriorityLabel(row.priority)}
                  </Badge>
                </WfmTableCell>
                <WfmTableCell>
                  <ProgressCell value={row.progressPercent} />
                </WfmTableCell>
                <WfmTableCell>
                  <div className="flex items-center gap-1.5 text-xs text-atlas-muted">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatInstanceDate(row.startedAt ?? row.createdAt)}
                  </div>
                </WfmTableCell>
                <WfmTableCell>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Clock className="h-3.5 w-3.5 text-atlas-muted" />
                    <span className={row.dueAt && row.status !== "completed" ? "text-atlas-ink" : "text-atlas-muted"}>
                      {formatInstanceDateTime(row.dueAt)}
                    </span>
                  </div>
                </WfmTableCell>
                <WfmTableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                  <Link
                    href={`/ar/workflow/instances/${row.id}`}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-atlas-brand transition hover:bg-atlas-brand/10"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    عرض
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </WfmTableCell>
              </WfmTableRow>
            ))
          )}
        </WfmTableBody>
      </WfmTable>

      {!loading && filteredRows.length > 0 ? (
        <p className="text-center text-xs text-atlas-muted">
          عرض {filteredRows.length} من {rows.length} تنفيذ
        </p>
      ) : null}

      <StartWorkflowDialog
        open={startOpen}
        onClose={() => setStartOpen(false)}
        onStarted={(instance) => {
          void load();
          router.push(`/ar/workflow/instances/${instance.id}`);
        }}
      />
    </div>
  );
}
