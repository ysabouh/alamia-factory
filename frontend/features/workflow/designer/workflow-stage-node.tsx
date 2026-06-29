"use client";

import { memo, useMemo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Check, Clock } from "lucide-react";

import { useWorkflowAssignmentLookup } from "@/features/workflow/designer/workflow-assignment-lookup-context";
import { WorkflowStageAssignmentDisplay } from "@/features/workflow/designer/workflow-stage-assignment-display";
import {
  parseAssignmentConfig,
  resolveAssignmentDisplay
} from "@/features/workflow/designer/workflow-stage-assignment";
import { ASSIGNMENT_TYPE_LABELS } from "@/features/workflow/workflow-labels";
import { WORKFLOW_HANDLE_CENTER } from "@/features/workflow/shared/workflow-graph-layout";
import type { WorkflowExecutionState, WorkflowStageNodeData } from "./workflow-designer-layout";

const EXECUTION_CONTAINER: Record<WorkflowExecutionState, string> = {
  completed:
    "border-2 border-emerald-500 bg-emerald-50 shadow-emerald-100/80 dark:border-emerald-500 dark:bg-emerald-950/50 dark:shadow-none",
  current:
    "border-2 border-blue-500 bg-blue-50 shadow-md shadow-blue-100 ring-2 ring-blue-200 dark:border-blue-400 dark:bg-blue-950/50 dark:ring-blue-800/60",
  pending: "border-2 border-zinc-300 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800/80",
  delayed: "border-2 border-red-500 bg-red-50 ring-2 ring-red-200 dark:border-red-500 dark:bg-red-950/40"
};

const EXECUTION_TITLE: Record<WorkflowExecutionState, string> = {
  completed: "text-emerald-900 dark:text-emerald-100",
  current: "text-blue-900 dark:text-blue-100",
  pending: "text-zinc-600 dark:text-zinc-300",
  delayed: "text-red-900 dark:text-red-100"
};

function WorkflowStageNodeComponent({ data, selected }: NodeProps) {
  const d = data as WorkflowStageNodeData;
  const { employeeById, departmentById, roleById, loading } = useWorkflowAssignmentLookup();
  const executionState = d.executionState;

  const display = useMemo(() => {
    const config = parseAssignmentConfig(d.assignmentConfig);
    return resolveAssignmentDisplay(d.assignmentType, config, ASSIGNMENT_TYPE_LABELS, {
      employees: employeeById,
      departments: departmentById,
      roles: roleById
    }, {
      assigneeNames: d.assigneeNames,
      assigneeSubtitle: d.assigneeSubtitle
    });
  }, [d.assignmentType, d.assignmentConfig, d.assigneeNames, d.assigneeSubtitle, employeeById, departmentById, roleById]);

  const containerClass = executionState
    ? EXECUTION_CONTAINER[executionState]
    : selected
      ? "border-atlas-brand ring-2 ring-atlas-brand/30"
      : "border-atlas-border";

  const titleClass = executionState ? EXECUTION_TITLE[executionState] : "text-atlas-ink dark:text-zinc-100";

  return (
    <div
      className={`relative min-w-[210px] max-w-[240px] rounded-lg border px-3 py-2 shadow-sm ${
        executionState ? "" : "bg-white dark:bg-zinc-900"
      } ${containerClass}`}
    >
      {executionState === "completed" ? (
        <span
          className="absolute -end-2 -top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white shadow-md dark:border-zinc-900"
          aria-label="مرحلة منجزة"
        >
          <Check className="h-4 w-4" strokeWidth={3} />
        </span>
      ) : null}

      {executionState === "current" ? (
        <span className="absolute -end-1 -top-1 z-20 h-3 w-3 rounded-full border-2 border-white bg-blue-500 shadow-sm dark:border-zinc-900" />
      ) : null}

      <Handle
        type="target"
        id="in"
        position={Position.Top}
        isConnectable
        style={WORKFLOW_HANDLE_CENTER.top}
        className="!z-10 !h-3.5 !w-3.5 !border-2 !border-white !bg-atlas-brand"
      />
      <p className={`text-sm font-semibold ${titleClass}`}>{d.name}</p>

      {loading ? (
        <p className="mt-2 text-[10px] text-atlas-muted">جاري تحميل التعيين...</p>
      ) : (
        <WorkflowStageAssignmentDisplay display={display} />
      )}

      {(d.slaDurationMinutes || d.requiresApproval) && (
        <div className="mt-1.5 flex flex-wrap gap-1 text-[10px]">
          {d.slaDurationMinutes ? (
            <span className="inline-flex items-center gap-0.5 rounded bg-amber-50 px-1.5 py-0.5 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
              <Clock className="h-3 w-3" />
              SLA {d.slaDurationMinutes}د
            </span>
          ) : null}
          {d.requiresApproval ? (
            <span className="rounded bg-violet-50 px-1.5 py-0.5 text-violet-800 dark:bg-violet-950 dark:text-violet-200">
              موافقة
            </span>
          ) : null}
        </div>
      )}

      <Handle
        type="source"
        id="out"
        position={Position.Bottom}
        isConnectable
        style={WORKFLOW_HANDLE_CENTER.bottom}
        className="!z-10 !h-3.5 !w-3.5 !border-2 !border-white !bg-atlas-brand"
      />
    </div>
  );
}

export const WorkflowStageNode = memo(WorkflowStageNodeComponent);
