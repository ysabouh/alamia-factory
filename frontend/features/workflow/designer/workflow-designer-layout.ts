import dagre from "dagre";
import { Position, type Edge, type Node } from "@xyflow/react";

import type { WorkflowStageJson, WorkflowVersionJson } from "@/lib/api/workflow-client";
import {
  WORKFLOW_GATEWAY_NODE_SIZE,
  WORKFLOW_LAYOUT_NODE_SEP,
  WORKFLOW_LAYOUT_RANK_SEP,
  WORKFLOW_STAGE_NODE_HEIGHT,
  WORKFLOW_STAGE_NODE_WIDTH,
  type WorkflowLayoutOptions
} from "@/features/workflow/shared/workflow-graph-layout";

const NODE_WIDTH = WORKFLOW_STAGE_NODE_WIDTH;
const NODE_HEIGHT = WORKFLOW_STAGE_NODE_HEIGHT;
const GATEWAY_SIZE = WORKFLOW_GATEWAY_NODE_SIZE;

export type WorkflowExecutionState = "completed" | "current" | "pending" | "delayed";

export type WorkflowStageNodeData = {
  name: string;
  assignmentType: string;
  /** حالة التنفيذ — تُمرَّر من خريطة التنفيذ فقط */
  executionState?: WorkflowExecutionState;
  slaDurationMinutes?: number | null;
  requiresApproval?: boolean;
  description?: string;
  estimatedDurationMinutes?: number | null;
  assignmentConfig?: Record<string, unknown>;
  checklist?: { label: string; isRequired: boolean }[];
  allowRejection?: boolean;
  allowReturn?: boolean;
  checklistRequired?: boolean;
  /** أسماء المعيَّنين — تُحفظ مع الرسم وتُعاد من API */
  assigneeNames?: string[];
  assigneeSubtitle?: string | null;
};

export function layoutWorkflowGraph(
  nodes: Node<WorkflowStageNodeData>[],
  edges: Edge[],
  options?: WorkflowLayoutOptions
) {
  const rankSep = options?.rankSep ?? WORKFLOW_LAYOUT_RANK_SEP;
  const nodeSep = options?.nodeSep ?? WORKFLOW_LAYOUT_NODE_SEP;
  const edgeSep = options?.edgeSep ?? 40;
  const marginX = options?.marginX ?? 48;
  const marginY = options?.marginY ?? 48;
  const stageWidth = options?.stageNodeWidth ?? NODE_WIDTH;
  const stageHeight = options?.stageNodeHeight ?? NODE_HEIGHT;

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "TB",
    nodesep: nodeSep,
    ranksep: rankSep,
    edgesep: edgeSep,
    marginx: marginX,
    marginy: marginY
  });

  nodes.forEach((n) => {
    const isGateway = n.type === "workflowGateway";
    g.setNode(n.id, {
      width: isGateway ? GATEWAY_SIZE : stageWidth,
      height: isGateway ? GATEWAY_SIZE : stageHeight
    });
  });
  edges.forEach((e) => g.setEdge(e.source, e.target));

  dagre.layout(g);

  return nodes.map((n) => {
    const pos = g.node(n.id);
    const isGateway = n.type === "workflowGateway";
    const width = isGateway ? GATEWAY_SIZE : stageWidth;
    const height = isGateway ? GATEWAY_SIZE : stageHeight;
    return {
      ...n,
      position: { x: pos.x - width / 2, y: pos.y - height / 2 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top
    };
  });
}

export function stagesToGraph(stages: {
  nodeId?: string | null;
  name: string;
  assignmentType: string;
  slaDurationMinutes?: number | null;
  positionX?: number | null;
  positionY?: number | null;
  requiresApproval?: boolean;
  id: number;
}[], edges: { source: string; target: string }[]): { nodes: Node<WorkflowStageNodeData>[]; edges: Edge[] } {
  const nodes: Node<WorkflowStageNodeData>[] = stages.map((s, i) => ({
    id: s.nodeId || `stage-${s.id || i}`,
    type: "workflowStage",
    position: { x: Number(s.positionX ?? i * (NODE_WIDTH + WORKFLOW_LAYOUT_NODE_SEP)), y: Number(s.positionY ?? 80) },
    data: {
      name: s.name,
      assignmentType: s.assignmentType,
      slaDurationMinutes: s.slaDurationMinutes,
      requiresApproval: s.requiresApproval
    }
  }));

  const flowEdges: Edge[] = edges.map((e, i) => ({
    id: `e-${i}`,
    source: e.source,
    target: e.target,
    animated: true
  }));

  return { nodes, edges: flowEdges };
}

/** Prefer saved xyflow graph; fall back to DB stages when definitionJson is empty. */
export function buildGraphFromVersion(version: WorkflowVersionJson | null | undefined): {
  nodes: Node<WorkflowStageNodeData>[];
  edges: Edge[];
} {
  const def = version?.definitionJson;
  const defNodes = (def?.nodes as Node<WorkflowStageNodeData>[] | undefined) ?? [];
  const defEdges = (def?.edges as Edge[] | undefined) ?? [];

  if (defNodes.length > 0) {
    return {
      nodes: defNodes.map((n) => {
        const nodeType = n.type ?? "workflowStage";
        const base = {
          ...n,
          sourcePosition: n.sourcePosition ?? Position.Bottom,
          targetPosition: n.targetPosition ?? Position.Top,
        };
        if (nodeType === "workflowGateway") {
          return {
            ...base,
            type: "workflowGateway",
            data: n.data ?? { question: "قرار؟", gatewayType: "exclusive" },
          } as Node<WorkflowStageNodeData>;
        }
        return {
          ...base,
          type: "workflowStage",
          data: {
            name: n.data?.name ?? "مرحلة",
            assignmentType: n.data?.assignmentType ?? "single_employee",
            assignmentConfig: n.data?.assignmentConfig ?? {},
            checklist: n.data?.checklist ?? [],
            requiresApproval: n.data?.requiresApproval ?? false,
            allowRejection: n.data?.allowRejection ?? false,
            allowReturn: n.data?.allowReturn ?? false,
            checklistRequired: n.data?.checklistRequired ?? false,
            slaDurationMinutes: n.data?.slaDurationMinutes ?? null,
            estimatedDurationMinutes: n.data?.estimatedDurationMinutes ?? null,
            description: n.data?.description,
            assigneeNames: n.data?.assigneeNames ?? undefined,
            assigneeSubtitle: n.data?.assigneeSubtitle ?? undefined,
          },
        };
      }),
      edges: defEdges.map((e, i) => ({
        ...e,
        id: e.id ?? `e-${i}`,
        type: e.type ?? "smoothstep",
        animated: e.animated ?? true,
      })),
    };
  }

  const stages = version?.stages ?? [];
  if (stages.length === 0) {
    return { nodes: [], edges: [] };
  }

  const stageById = new Map(stages.map((s) => [s.id, s]));

  const nodes: Node<WorkflowStageNodeData>[] = stages.map((s, i) => ({
    id: s.nodeId || `stage-${s.id}`,
    type: "workflowStage",
    position: { x: Number(s.positionX ?? i * (NODE_WIDTH + WORKFLOW_LAYOUT_NODE_SEP)), y: Number(s.positionY ?? 100) },
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    data: {
      name: s.name,
      description: s.description ?? undefined,
      assignmentType: s.assignmentType,
      assignmentConfig: s.assignmentConfig ?? {},
      slaDurationMinutes: s.slaDurationMinutes,
      estimatedDurationMinutes: s.estimatedDurationMinutes ?? undefined,
      requiresApproval: s.requiresApproval,
      allowRejection: s.allowRejection,
      allowReturn: s.allowReturn,
      checklistRequired: s.checklistRequired,
      checklist: (s.checklist ?? []).map((c) => ({ label: c.label, isRequired: c.isRequired }))
    }
  }));

  const nodeIdForStage = (s: WorkflowStageJson) => s.nodeId || `stage-${s.id}`;

  const edges = stages
    .filter((s) => s.nextStageId)
    .flatMap((s) => {
      const target = stageById.get(s.nextStageId!);
      if (!target) return [];
      return [
        {
          id: `e-${s.id}-${target.id}`,
          source: nodeIdForStage(s),
          target: nodeIdForStage(target),
          animated: true
        } satisfies Edge
      ];
    });

  if (edges.length === 0 && nodes.length > 1) {
    return {
      nodes,
      edges: nodes.slice(0, -1).map((n, i) => ({
        id: `e-fallback-${i}`,
        source: n.id,
        target: nodes[i + 1]!.id,
        animated: true
      }))
    };
  }

  return { nodes, edges };
}
