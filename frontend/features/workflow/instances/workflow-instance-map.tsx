"use client";

import { useCallback, useMemo } from "react";
import { Check, Circle, GitBranch, Play, RotateCcw } from "lucide-react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  type Node,
  type NodeMouseHandler
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { layoutWorkflowGraph } from "@/features/workflow/designer/workflow-designer-layout";
import { WorkflowAssignmentLookupProvider } from "@/features/workflow/designer/workflow-assignment-lookup-context";
import { WorkflowInstanceStageNode } from "@/features/workflow/instances/workflow-instance-stage-node";
import { WorkflowInstanceGatewayNode } from "@/features/workflow/instances/workflow-instance-gateway-node";
import { resolveInstanceGraphEdges } from "@/features/workflow/instances/workflow-instance-graph-utils";
import { resolveStageIdFromNodeId } from "@/features/workflow/instances/workflow-instance-stage-utils";
import { WorkflowGraphFitView } from "@/features/workflow/shared/workflow-graph-fit-view";
import {
  WORKFLOW_DEFAULT_EDGE_OPTIONS,
  WORKFLOW_INSTANCE_BRANCH_GRAPH_HEIGHT,
  WORKFLOW_INSTANCE_GRAPH_HEIGHT,
  WORKFLOW_INSTANCE_LAYOUT_BRANCH_NODE_SEP,
  WORKFLOW_INSTANCE_LAYOUT_EDGE_SEP,
  WORKFLOW_INSTANCE_LAYOUT_NODE_SEP,
  WORKFLOW_INSTANCE_LAYOUT_RANK_SEP,
  WORKFLOW_INSTANCE_STAGE_NODE_HEIGHT,
  WORKFLOW_INSTANCE_STAGE_NODE_WIDTH
} from "@/features/workflow/shared/workflow-graph-layout";
import type { WorkflowExecutionState } from "@/features/workflow/designer/workflow-designer-layout";
import type { WorkflowGraphJson } from "@/lib/api/workflow-client";

const nodeTypes = {
  workflowStage: WorkflowInstanceStageNode,
  workflowGateway: WorkflowInstanceGatewayNode
};

const defaultEdgeOptions = {
  ...WORKFLOW_DEFAULT_EDGE_OPTIONS,
  animated: false
};

type Props = {
  graph: WorkflowGraphJson;
  selectedStageId?: number | null;
  onStageSelect?: (stageId: number) => void;
};

function MapCanvas({ graph, selectedStageId, onStageSelect }: Props) {
  const hasBranches = useMemo(
    () => ((graph.definitionJson?.nodes ?? []) as Node[]).some((n) => n.type === "workflowGateway"),
    [graph.definitionJson?.nodes]
  );

  const graphHeight = hasBranches ? WORKFLOW_INSTANCE_BRANCH_GRAPH_HEIGHT : WORKFLOW_INSTANCE_GRAPH_HEIGHT;

  const stageStateByNodeId = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of graph.stageStates) {
      if (s.nodeId) map.set(s.nodeId, s.state);
      map.set(`stage-${s.id}`, s.state);
    }
    return map;
  }, [graph.stageStates]);

  const totalStages = graph.stageStates.length;

  const stageMetaByNodeId = useMemo(() => {
    const map = new Map<string, { stageNumber?: number }>();
    for (const s of graph.stageStates) {
      const meta = { stageNumber: s.stageNumber };
      if (s.nodeId) map.set(s.nodeId, meta);
      map.set(`stage-${s.id}`, meta);
    }
    return map;
  }, [graph.stageStates]);

  const nodes = useMemo(() => {
    const raw = (graph.definitionJson?.nodes ?? []) as Node[];
    const mapped = raw.map((n) => {
      const state = (stageStateByNodeId.get(n.id) ?? "pending") as WorkflowExecutionState;
      const stageId = resolveStageIdFromNodeId(graph, n.id);
      const isSelected = stageId != null && stageId === selectedStageId;
      const meta = stageMetaByNodeId.get(n.id);

      if (n.type === "workflowGateway") {
        return {
          ...n,
          type: "workflowGateway",
          draggable: false,
          selectable: false,
          connectable: false
        };
      }

      const nodeData = (n.data ?? {}) as Record<string, unknown>;
      return {
        ...n,
        type: "workflowStage",
        draggable: false,
        selectable: true,
        selected: isSelected,
        connectable: false,
        className: "cursor-pointer",
        data: {
          ...nodeData,
          executionState: state,
          stageNumber: meta?.stageNumber,
          totalStages
        }
      };
    });

    const edgesForLayout = resolveInstanceGraphEdges(graph, mapped);
    try {
      return layoutWorkflowGraph(mapped, edgesForLayout, {
        rankSep: WORKFLOW_INSTANCE_LAYOUT_RANK_SEP,
        nodeSep: hasBranches ? WORKFLOW_INSTANCE_LAYOUT_BRANCH_NODE_SEP : WORKFLOW_INSTANCE_LAYOUT_NODE_SEP,
        edgeSep: WORKFLOW_INSTANCE_LAYOUT_EDGE_SEP,
        marginX: hasBranches ? 96 : 72,
        marginY: hasBranches ? 96 : 72,
        stageNodeWidth: WORKFLOW_INSTANCE_STAGE_NODE_WIDTH,
        stageNodeHeight: WORKFLOW_INSTANCE_STAGE_NODE_HEIGHT
      });
    } catch {
      return mapped;
    }
  }, [graph, stageStateByNodeId, stageMetaByNodeId, selectedStageId, hasBranches, totalStages]);

  const edges = useMemo(() => resolveInstanceGraphEdges(graph, nodes), [graph, nodes]);
  const fitKey = `${nodes.length}-${graph.stageStates.map((s) => `${s.id}:${s.state}`).join(",")}-${selectedStageId ?? ""}`;

  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      if (node.type !== "workflowStage") return;
      const stageId = resolveStageIdFromNodeId(graph, node.id);
      if (stageId != null) onStageSelect?.(stageId);
    },
    [graph, onStageSelect]
  );

  if (nodes.length === 0) {
    return (
      <div className="flex h-full min-h-[280px] items-center justify-center text-sm text-atlas-muted">
        لا توجد خريطة محفوظة لهذا السير.
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height: graphHeight }} dir="ltr">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={Boolean(onStageSelect)}
        onNodeClick={onNodeClick}
        panOnScroll
        fitView
        fitViewOptions={{ padding: hasBranches ? 0.4 : 0.35 }}
        minZoom={0.15}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        className="h-full w-full dark:bg-zinc-900 [&_.react-flow__edge-path]:stroke-[2.5px]"
      >
        <WorkflowGraphFitView dep={fitKey} />
        <Background gap={16} color="#e2e8f0" />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable nodeStrokeWidth={2} />
      </ReactFlow>
    </div>
  );
}

export function WorkflowInstanceMap({ graph, selectedStageId, onStageSelect }: Props) {
  const hasBranches = ((graph.definitionJson?.nodes ?? []) as Node[]).some(
    (n) => n.type === "workflowGateway"
  );
  const graphHeight = hasBranches ? WORKFLOW_INSTANCE_BRANCH_GRAPH_HEIGHT : WORKFLOW_INSTANCE_GRAPH_HEIGHT;

  return (
    <div className="flex flex-col rounded-lg border border-atlas-border bg-white dark:border-zinc-700 dark:bg-zinc-900">
      <div className="border-b border-atlas-border px-4 py-2 dark:border-zinc-700">
        <h3 className="text-sm font-bold">خريطة سير العمل</h3>
        <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-atlas-muted">
          <span className="inline-flex items-center gap-1">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-emerald-500 text-white">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            منجزة
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-blue-500 text-white">
              <Play className="h-3 w-3 fill-white" />
            </span>
            حالية
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-red-500 text-white">
              <RotateCcw className="h-3 w-3" />
            </span>
            إعادة
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-zinc-400 text-white">
              <Circle className="h-3 w-3" />
            </span>
            قادمة
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-flex h-5 w-5 rotate-45 items-center justify-center rounded bg-amber-400 text-white">
              <GitBranch className="h-3 w-3 -rotate-45" />
            </span>
            فروع
          </span>
          {onStageSelect ? (
            <span className="text-atlas-brand">· اضغط على مرحلة لعرض التفاصيل</span>
          ) : null}
        </div>
      </div>
      <div className="w-full" style={{ height: graphHeight }}>
        <WorkflowAssignmentLookupProvider>
          <ReactFlowProvider>
            <MapCanvas graph={graph} selectedStageId={selectedStageId} onStageSelect={onStageSelect} />
          </ReactFlowProvider>
        </WorkflowAssignmentLookupProvider>
      </div>
    </div>
  );
}
