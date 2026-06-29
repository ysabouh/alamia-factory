"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

import { useFactoryAuth } from "@/contexts/factory-auth-context";
import { WorkflowInstanceHeader } from "@/features/workflow/instances/workflow-instance-header";
import { WorkflowInstanceKpiStrip } from "@/features/workflow/instances/workflow-instance-kpi-strip";
import { WorkflowInstanceStagePanel } from "@/features/workflow/instances/workflow-instance-stage-panel";
import { WorkflowInstanceTransitionLog } from "@/features/workflow/instances/workflow-instance-transition-log";
import { WorkflowStageSummaryDrawer } from "@/features/workflow/instances/workflow-stage-summary-drawer";
import type { StageProgress, TimelineEntry } from "@/features/workflow/instances/workflow-instance-stage-utils";
import {
  workflowApi,
  type WorkflowGraphJson,
  type WorkflowInstanceJson,
  type WorkflowProgressJson,
  type WorkflowTaskJson
} from "@/lib/api/workflow-client";

const WorkflowInstanceMap = dynamic(
  () =>
    import("@/features/workflow/instances/workflow-instance-map").then(
      (mod) => mod.WorkflowInstanceMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[480px] items-center justify-center rounded-lg border border-atlas-border bg-white text-sm text-atlas-muted dark:border-zinc-700 dark:bg-zinc-900">
        جاري تحميل خريطة سير العمل...
      </div>
    )
  }
);

const ACTIVE_STATUSES = new Set(["assigned", "pending", "accepted", "in_progress", "waiting_information"]);

function resolveActiveTask(instance: WorkflowInstanceJson, employeeId: number | null): WorkflowTaskJson | null {
  const tasks = instance.tasks ?? [];

  if (instance.gatewayDecision?.taskId) {
    const gatewayTask = tasks.find((t) => t.id === instance.gatewayDecision!.taskId);
    if (gatewayTask) return gatewayTask;
  }

  const currentStageId = instance.currentStageId;
  const stageTasks = tasks.filter((t) => t.stageId === currentStageId);

  if (instance.status === "waiting_approval") {
    const pendingApproval = stageTasks.find((t) => t.status === "completed");
    if (pendingApproval) return pendingApproval;
  }

  if (employeeId != null) {
    const mine = stageTasks.find((t) => t.assignedTo === employeeId && ACTIVE_STATUSES.has(t.status));
    if (mine) return mine;
  }

  return stageTasks.find((t) => ACTIVE_STATUSES.has(t.status)) ?? stageTasks.find((t) => t.status === "completed") ?? null;
}

export function WorkflowInstanceWorkspace({ instanceId }: { instanceId: number }) {
  const { user } = useFactoryAuth();

  const [instance, setInstance] = useState<WorkflowInstanceJson | null>(null);
  const [progress, setProgress] = useState<WorkflowProgressJson | null>(null);
  const [graph, setGraph] = useState<WorkflowGraphJson | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = useCallback(async () => {
    const [inst, prog, gr, tl] = await Promise.all([
      workflowApi.getInstance(instanceId),
      workflowApi.getProgress(instanceId),
      workflowApi.getGraph(instanceId),
      workflowApi.getTimeline(instanceId)
    ]);
    setInstance(inst);
    setProgress(prog);
    setGraph(gr);
    setTimeline(tl.data);
  }, [instanceId]);

  useEffect(() => {
    void load();
  }, [load]);

  const employeeId = user?.employeeId ? Number(user.employeeId) : null;
  const activeTask = useMemo(
    () => (instance ? resolveActiveTask(instance, employeeId) : null),
    [instance, employeeId]
  );

  const selectedStage = useMemo((): StageProgress | null => {
    if (selectedStageId == null || !progress) return null;
    return progress.stages.find((s) => s.id === selectedStageId) ?? null;
  }, [selectedStageId, progress]);

  const handleStageSelect = useCallback((stageId: number) => {
    setSelectedStageId(stageId);
    setDrawerOpen(true);
  }, []);

  if (!instance || !progress) {
    return <p className="p-6 text-atlas-muted">جاري التحميل...</p>;
  }

  return (
    <div className="-mx-4 -mt-4 dark:bg-zinc-950 md:-mx-6">
      <WorkflowInstanceHeader />

      <div className="space-y-4 p-4 md:p-6">
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <WorkflowInstanceKpiStrip
        progressPercent={progress.progressPercent}
        completedCount={progress.completedCount}
        currentCount={progress.currentCount}
        remainingCount={progress.remainingCount}
        totalStages={progress.totalStages}
        workflowNumber={instance.workflowNumber}
        status={instance.status}
        startedAt={instance.startedAt}
        createdAt={instance.createdAt}
        subjectLabel={instance.subject?.label}
      />

      <div className="grid min-h-[480px] grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {graph ? (
            <WorkflowInstanceMap
              graph={graph}
              selectedStageId={selectedStageId}
              onStageSelect={handleStageSelect}
            />
          ) : null}
        </div>
        <div className="min-h-[480px]">
          <WorkflowInstanceStagePanel
            instance={instance}
            activeTask={activeTask}
            onRefresh={load}
            busy={busy}
            setBusy={setBusy}
            setError={setError}
          />
        </div>
      </div>

      <WorkflowInstanceTransitionLog
        stages={progress.stages}
        timeline={timeline}
        instance={instance}
        selectedStageId={selectedStageId}
        onStageSelect={handleStageSelect}
      />

      <WorkflowStageSummaryDrawer
        stage={selectedStage}
        instance={instance}
        graph={graph}
        timeline={timeline}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
      </div>
    </div>
  );
}
