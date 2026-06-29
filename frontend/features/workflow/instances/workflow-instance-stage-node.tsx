"use client";

import { memo, useMemo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

import { useWorkflowAssignmentLookup } from "@/features/workflow/designer/workflow-assignment-lookup-context";
import { WorkflowStageAssignmentDisplay } from "@/features/workflow/designer/workflow-stage-assignment-display";
import {
  parseAssignmentConfig,
  resolveAssignmentDisplay
} from "@/features/workflow/designer/workflow-stage-assignment";
import {
  formatStageIndex,
  formatStageOfTotal,
  getStageVisualTheme,
  stageStateLabel,
  WorkflowStageStateIcon
} from "@/features/workflow/instances/workflow-stage-visuals";
import { ASSIGNMENT_TYPE_LABELS } from "@/features/workflow/workflow-labels";
import { WORKFLOW_HANDLE_CENTER } from "@/features/workflow/shared/workflow-graph-layout";
import type { WorkflowExecutionState, WorkflowStageNodeData } from "@/features/workflow/designer/workflow-designer-layout";

type InstanceStageData = WorkflowStageNodeData & {
  stageNumber?: number;
  totalStages?: number;
};

function WorkflowInstanceStageNodeComponent({ data, selected }: NodeProps) {
  const d = data as InstanceStageData;
  const state = (d.executionState ?? "pending") as WorkflowExecutionState;
  const theme = getStageVisualTheme(state);
  const { employeeById, departmentById, roleById, loading } = useWorkflowAssignmentLookup();

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

  return (
    <div
      className={`min-w-[220px] max-w-[240px] overflow-hidden rounded-lg border-2 shadow-md ${theme.border} ${
        selected ? "ring-2 ring-atlas-brand ring-offset-2 dark:ring-offset-zinc-900" : ""
      }`}
    >
      <div className={`flex items-center justify-between px-3 py-1.5 ${theme.headerBg}`}>
        <span className={`text-sm font-bold tracking-wide ${theme.headerText}`}>
          {formatStageIndex(d.stageNumber)}
        </span>
        <WorkflowStageStateIcon state={state} className="h-4 w-4" />
      </div>

      <div className={`px-3 py-2.5 ${theme.bodyBg}`}>
        <p className={`text-sm font-bold leading-snug ${theme.title}`}>{d.name}</p>

        {loading ? (
          <p className="mt-1.5 text-[10px] text-atlas-muted">جاري تحميل التعيين...</p>
        ) : (
          <div className="mt-1.5">
            <WorkflowStageAssignmentDisplay display={display} />
          </div>
        )}

        <div className="mt-2 flex items-center justify-between gap-2 border-t border-black/5 pt-2 dark:border-white/10">
          <span className="text-[10px] font-semibold text-atlas-muted">
            {formatStageOfTotal(d.stageNumber, d.totalStages)}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ring-1 ${theme.badge}`}>
            {stageStateLabel(state)}
          </span>
        </div>
      </div>

      <Handle
        type="target"
        id="in"
        position={Position.Top}
        isConnectable={false}
        style={WORKFLOW_HANDLE_CENTER.top}
        className="!z-10 !h-3.5 !w-3.5 !border-2 !border-white !bg-atlas-brand"
      />
      <Handle
        type="source"
        id="out"
        position={Position.Bottom}
        isConnectable={false}
        style={WORKFLOW_HANDLE_CENTER.bottom}
        className="!z-10 !h-3.5 !w-3.5 !border-2 !border-white !bg-atlas-brand"
      />
    </div>
  );
}

export const WorkflowInstanceStageNode = memo(WorkflowInstanceStageNodeComponent);
