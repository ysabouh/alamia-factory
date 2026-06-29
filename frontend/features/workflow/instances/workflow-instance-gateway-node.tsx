"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { GitBranch } from "lucide-react";

import {
  WORKFLOW_GATEWAY_NODE_SIZE,
  WORKFLOW_HANDLE_CENTER
} from "@/features/workflow/shared/workflow-graph-layout";

export type WorkflowGatewayNodeData = {
  question?: string;
  gatewayType?: string;
};

/** بوابة قرار بمخرجين جانبيين — أوضح في خريطة التنفيذ عند التفرعات */
export function WorkflowInstanceGatewayNode({ data }: NodeProps) {
  const question = (data as WorkflowGatewayNodeData).question ?? "قرار";
  const size = WORKFLOW_GATEWAY_NODE_SIZE;

  return (
    <div
      className="relative flex rotate-45 items-center justify-center rounded-md border-2 border-amber-400 bg-amber-50 shadow-sm dark:border-amber-600 dark:bg-amber-950/40"
      style={{ width: size, height: size }}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        style={WORKFLOW_HANDLE_CENTER.top}
        className="!z-10 !h-3.5 !w-3.5 !border-2 !border-white !bg-amber-600"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="out-yes"
        style={WORKFLOW_HANDLE_CENTER.right}
        className="!z-10 !h-3.5 !w-3.5 !border-2 !border-white !bg-emerald-600"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="out-no"
        style={WORKFLOW_HANDLE_CENTER.left}
        className="!z-10 !h-3.5 !w-3.5 !border-2 !border-white !bg-orange-600"
      />
      <div className="-rotate-45 text-center">
        <GitBranch className="mx-auto h-4 w-4 text-amber-700 dark:text-amber-300" />
        <p className="max-w-[56px] truncate text-[9px] font-bold text-amber-900 dark:text-amber-100">{question}</p>
      </div>
    </div>
  );
}
