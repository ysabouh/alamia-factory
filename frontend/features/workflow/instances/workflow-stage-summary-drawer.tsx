"use client";

import { useMemo } from "react";
import {
  ArrowRight,
  Calendar,
  Clock,
  GitBranch,
  ListChecks,
  RotateCcw,
  ShieldCheck,
  User,
  XCircle
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SfDrawer } from "@/components/smart-factory/sf-drawer";
import {
  buildStageChecklist,
  buildTasksById,
  enrichTimelineEntry,
  formatDateTime,
  formatMinutes,
  getDirectStageTransitions,
  getStageCompletedAt,
  getStageDefinition,
  getStageNodeData,
  getStageTasks,
  getStageTimeline,
  type StageProgress,
  type TimelineEntry
} from "@/features/workflow/instances/workflow-instance-stage-utils";
import {
  StageStateIcon,
  WorkflowAttachmentsSummary,
  WorkflowChecklistSummary,
  WorkflowCommentsSummary,
  WorkflowTimelineEventCard
} from "@/features/workflow/instances/workflow-stage-summary-parts";
import {
  ASSIGNMENT_TYPE_LABELS,
  WORKFLOW_COMMENT_TYPE_LABELS,
  WORKFLOW_STAGE_STATE_LABELS,
  WORKFLOW_STATUS_LABELS
} from "@/features/workflow/workflow-labels";
import type { WorkflowGraphJson, WorkflowInstanceJson, WorkflowTaskJson } from "@/lib/api/workflow-client";

type Props = {
  stage: StageProgress | null;
  instance: WorkflowInstanceJson;
  graph: WorkflowGraphJson | null;
  timeline: TimelineEntry[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function stateBadgeVariant(state: string): "default" | "secondary" | "outline" | "destructive" {
  if (state === "completed") return "default";
  if (state === "current") return "secondary";
  return "outline";
}

function stateRingClass(state: string): string {
  switch (state) {
    case "completed":
      return "ring-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:ring-emerald-800";
    case "current":
      return "ring-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:ring-blue-800";
    default:
      return "ring-zinc-200 bg-zinc-50 dark:bg-zinc-800 dark:ring-zinc-700";
  }
}

function TaskCard({ task }: { task: WorkflowTaskJson }) {
  const checklistDone = (task.checklist ?? []).filter((c) => c.isCompleted).length;
  const checklistTotal = task.checklist?.length ?? 0;

  return (
    <li className="rounded-lg border border-atlas-border px-3 py-2.5 dark:border-zinc-700">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold">{task.taskNumber}</p>
          <p className="text-[11px] text-atlas-muted">{task.assignee?.name ?? "غير معيّن"}</p>
        </div>
        <Badge variant="outline" className="shrink-0 text-[10px]">
          {WORKFLOW_STATUS_LABELS[task.status] ?? task.status}
        </Badge>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px] text-atlas-muted">
        {task.startedAt ? <span>بدء: {formatDateTime(task.startedAt)}</span> : null}
        {task.completedAt ? <span>إكمال: {formatDateTime(task.completedAt)}</span> : null}
        {task.dueAt ? (
          <span className={task.isOverdue ? "font-semibold text-red-600" : ""}>
            استحقاق: {formatDateTime(task.dueAt)}
          </span>
        ) : null}
        {task.durationMinutes ? <span>المدة: {formatMinutes(task.durationMinutes)}</span> : null}
        {checklistTotal > 0 ? (
          <span>
            تحقق: {checklistDone}/{checklistTotal}
          </span>
        ) : null}
      </div>
    </li>
  );
}

export function WorkflowStageSummaryDrawer({
  stage,
  instance,
  graph,
  timeline,
  open,
  onOpenChange
}: Props) {
  const tasksById = useMemo(() => buildTasksById(instance), [instance]);

  const summary = useMemo(() => {
    if (!stage) return null;

    const tasks = getStageTasks(instance, stage.id);
    const nodeData = graph ? getStageNodeData(graph, stage.id) : null;
    const stageDefinition = getStageDefinition(tasks, nodeData);
    const checklist = buildStageChecklist(tasks, nodeData, stageDefinition);
    const stageEvents = getStageTimeline(timeline, stage, tasks).map((e) => enrichTimelineEntry(e, tasksById));
    const completedAt = getStageCompletedAt(timeline, stage.name);
    const nextSteps = graph ? getDirectStageTransitions(graph, stage.id) : [];

    const allComments = tasks.flatMap((t) => t.comments ?? []);
    const allAttachments = tasks.flatMap((t) => t.attachments ?? []);

    const description =
      stageDefinition?.description ??
      (nodeData?.description as string | undefined) ??
      null;
    const assignmentType =
      stageDefinition?.assignmentType ?? (nodeData?.assignmentType as string | undefined);
    const estimated = formatMinutes(
      stageDefinition?.estimatedDurationMinutes ??
        (nodeData?.estimatedDurationMinutes as number | undefined)
    );
    const sla = formatMinutes(
      stageDefinition?.slaDurationMinutes ?? (nodeData?.slaDurationMinutes as number | undefined)
    );
    const requiresApproval = Boolean(
      stageDefinition?.requiresApproval ?? nodeData?.requiresApproval
    );
    const allowRejection = Boolean(stageDefinition?.allowRejection ?? nodeData?.allowRejection);
    const allowReturn = Boolean(stageDefinition?.allowReturn ?? nodeData?.allowReturn);
    const checklistRequired = Boolean(
      stageDefinition?.checklistRequired ?? nodeData?.checklistRequired
    );
    const assigneeNames = (nodeData?.assigneeNames as string[] | undefined) ?? [];

    return {
      tasks,
      checklist,
      stageEvents,
      completedAt,
      nextSteps,
      allComments,
      allAttachments,
      description,
      assignmentType,
      estimated,
      sla,
      requiresApproval,
      allowRejection,
      allowReturn,
      checklistRequired,
      assigneeNames,
      stageDefinition
    };
  }, [stage, instance, graph, timeline, tasksById]);

  if (!stage || !summary) return null;

  return (
    <SfDrawer
      variant="atlas"
      side="end"
      widthClassName="w-[min(100vw-0.75rem,32rem)]"
      open={open}
      onOpenChange={onOpenChange}
      title={stage.name}
      description={
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={stateBadgeVariant(stage.state)}>
            {WORKFLOW_STAGE_STATE_LABELS[stage.state] ?? stage.state}
          </Badge>
          {stage.stageNumber ? (
            <span className="text-xs text-atlas-muted">مرحلة {stage.stageNumber}</span>
          ) : null}
        </div>
      }
    >
      <div className="space-y-5 pb-2">
        <div className={`flex items-center gap-3 rounded-lg p-3 ring-1 ${stateRingClass(stage.state)}`}>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm dark:bg-zinc-900">
            <StageStateIcon state={stage.state} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-atlas-ink">{stage.name}</p>
            <p className="text-xs text-atlas-muted">
              {stage.state === "completed" && summary.completedAt
                ? `اكتملت ${formatDateTime(summary.completedAt)}`
                : stage.state === "current"
                  ? "المرحلة الجارية حالياً في هذا السير"
                  : "لم تبدأ بعد في مسار التنفيذ"}
            </p>
          </div>
        </div>

        {summary.description ? (
          <section>
            <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-atlas-muted">الوصف</h4>
            <p className="rounded-md bg-atlas-canvas px-3 py-2 text-sm leading-relaxed text-atlas-slate dark:bg-zinc-800/60">
              {summary.description}
            </p>
          </section>
        ) : null}

        <section className="grid grid-cols-2 gap-2">
          {summary.assignmentType ? (
            <div className="rounded-md border border-atlas-border px-3 py-2 dark:border-zinc-700">
              <p className="text-[10px] text-atlas-muted">التعيين</p>
              <p className="mt-0.5 text-xs font-semibold">
                {ASSIGNMENT_TYPE_LABELS[summary.assignmentType] ?? summary.assignmentType}
              </p>
            </div>
          ) : null}
          {summary.estimated ? (
            <div className="rounded-md border border-atlas-border px-3 py-2 dark:border-zinc-700">
              <p className="flex items-center gap-1 text-[10px] text-atlas-muted">
                <Clock className="h-3 w-3" /> المدة المتوقعة
              </p>
              <p className="mt-0.5 text-xs font-semibold">{summary.estimated}</p>
            </div>
          ) : null}
          {summary.sla ? (
            <div className="rounded-md border border-atlas-border px-3 py-2 dark:border-zinc-700">
              <p className="text-[10px] text-atlas-muted">SLA</p>
              <p className="mt-0.5 text-xs font-semibold">{summary.sla}</p>
            </div>
          ) : null}
        </section>

        {(summary.requiresApproval || summary.allowRejection || summary.allowReturn || summary.checklistRequired) ? (
          <section className="flex flex-wrap gap-1.5">
            {summary.requiresApproval ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-medium text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:ring-amber-800">
                <ShieldCheck className="h-3 w-3" /> يتطلب اعتماد
              </span>
            ) : null}
            {summary.checklistRequired ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-medium text-blue-800 ring-1 ring-blue-200 dark:bg-blue-950/30 dark:text-blue-200 dark:ring-blue-800">
                <ListChecks className="h-3 w-3" /> قائمة تحقق إلزامية
              </span>
            ) : null}
            {summary.allowRejection ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-medium text-red-700 ring-1 ring-red-200 dark:bg-red-950/30 dark:text-red-200 dark:ring-red-800">
                <XCircle className="h-3 w-3" /> يسمح بالرفض
              </span>
            ) : null}
            {summary.allowReturn ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-medium text-orange-700 ring-1 ring-orange-200 dark:bg-orange-950/30 dark:text-orange-200 dark:ring-orange-800">
                <RotateCcw className="h-3 w-3" /> يسمح بالإرجاع
              </span>
            ) : null}
          </section>
        ) : null}

        {summary.assigneeNames.length > 0 ? (
          <section>
            <h4 className="mb-1.5 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-atlas-muted">
              <User className="h-3.5 w-3.5" /> المعيّنون
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {summary.assigneeNames.map((name) => (
                <span
                  key={name}
                  className="rounded-full bg-atlas-canvas px-2.5 py-1 text-xs font-medium dark:bg-zinc-800"
                >
                  {name}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        <WorkflowChecklistSummary items={summary.checklist} />

        {summary.tasks.length > 0 ? (
          <section>
            <h4 className="mb-2 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-atlas-muted">
              <ListChecks className="h-3.5 w-3.5" /> المهام ({summary.tasks.length})
            </h4>
            <ul className="space-y-2">
              {summary.tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </ul>
          </section>
        ) : (
          <p className="rounded-md bg-atlas-canvas px-3 py-2 text-xs text-atlas-muted dark:bg-zinc-800/60">
            لا توجد مهام مسجّلة لهذه المرحلة بعد.
          </p>
        )}

        <WorkflowCommentsSummary comments={summary.allComments} typeLabels={WORKFLOW_COMMENT_TYPE_LABELS} />
        <WorkflowAttachmentsSummary attachments={summary.allAttachments} />

        {summary.nextSteps.length > 0 ? (
          <section>
            <h4 className="mb-2 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-atlas-muted">
              <GitBranch className="h-3.5 w-3.5" /> المسارات التالية
            </h4>
            <ul className="space-y-1.5">
              {summary.nextSteps.map((step, i) => (
                <li
                  key={`${step.targetName}-${i}`}
                  className="flex items-center gap-2 rounded-md border border-atlas-border px-3 py-2 text-xs dark:border-zinc-700"
                >
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-atlas-brand" />
                  <span className="font-medium">{step.label ?? step.targetName}</span>
                  {step.label ? <span className="text-atlas-muted">← {step.targetName}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {summary.stageEvents.length > 0 ? (
          <section>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-atlas-muted">
              نشاط المرحلة ({summary.stageEvents.length})
            </h4>
            <ul className="space-y-2">
              {[...summary.stageEvents].reverse().map((e) => (
                <WorkflowTimelineEventCard key={e.id} event={e} />
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </SfDrawer>
  );
}
