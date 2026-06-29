import { Position, MarkerType, type Edge, type Node } from "@xyflow/react";

import type { WorkflowGraphJson, WorkflowVersionJson } from "@/lib/api/workflow-client";
import {
  WORKFLOW_DEFAULT_EDGE_OPTIONS,
  WORKFLOW_INSTANCE_BRANCH_EDGE_OFFSET
} from "@/features/workflow/shared/workflow-graph-layout";

const STROKE_DEFAULT = "#94a3b8";
const STROKE_BRANCH = "#f97316";
const STROKE_RETURN = "#ea580c";

export function resolveWorkflowGraphEdges(graph: WorkflowGraphJson, nodes: Node[]): Edge[] {
  const raw = (graph.definitionJson?.edges ?? []) as Edge[];
  const edges = raw.length > 0 ? raw : buildEdgesFromTransitions(graph, nodes);

  return normalizeWorkflowEdges(edges, nodes);
}

export function resolveInstanceGraphEdges(graph: WorkflowGraphJson, nodes: Node[]): Edge[] {
  const raw = (graph.definitionJson?.edges ?? []) as Edge[];
  const edges = raw.length > 0 ? raw : buildEdgesFromTransitions(graph, nodes);

  return normalizeWorkflowEdges(edges, nodes, { branchSideLayout: true });
}

function buildEdgesFromTransitions(graph: WorkflowGraphJson, nodes: Node[]): Edge[] {
  const stageNodeId = new Map<number, string>();
  for (const s of graph.stageStates) {
    stageNodeId.set(s.id, s.nodeId || `stage-${s.id}`);
  }

  return graph.transitions
    .map((t, i) => {
      const target = stageNodeId.get(t.toStageId);
      if (!target) return null;

      const source = t.fromGatewayNodeId
        ? t.fromGatewayNodeId
        : t.fromStageId
          ? stageNodeId.get(t.fromStageId)
          : null;

      if (!source) return null;

      return {
        id: `t-${t.id ?? i}`,
        source,
        target,
        data: { conditionType: t.conditionType, label: t.label ?? undefined },
      } satisfies Edge;
    })
    .filter((e): e is Edge => e !== null);
}

export function normalizeWorkflowEdges(
  raw: Edge[],
  nodes: Node[],
  options?: { branchSideLayout?: boolean }
): Edge[] {
  const branchSideLayout = options?.branchSideLayout ?? false;
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  return raw.map((edge, index) => {
    const sourceNode = nodeById.get(edge.source);
    const targetNode = nodeById.get(edge.target);
    const data = edge.data as { conditionType?: string; label?: string } | undefined;
    const condition = data?.conditionType ?? "default";
    const isReturn = condition === "on_return";
    const isReject = condition === "on_reject";
    const isApprove = condition === "on_approve";

    let sourceHandle = edge.sourceHandle;
    if (sourceNode?.type === "workflowGateway") {
      if (branchSideLayout) {
        sourceHandle = isReject ? "out-no" : "out-yes";
      } else if (!sourceHandle) {
        sourceHandle = isReject ? "out-no" : "out-yes";
      }
    } else if (!sourceHandle) {
      sourceHandle = "out";
    }

    const isBranch = isApprove || isReject;
    const stroke = isReturn ? STROKE_RETURN : isBranch ? STROKE_BRANCH : STROKE_DEFAULT;
    const branchOffset = branchSideLayout ? WORKFLOW_INSTANCE_BRANCH_EDGE_OFFSET : 28;

    const label = (data?.label || edge.label || "").trim() || undefined;

    return {
      ...edge,
      id: edge.id ?? `edge-${edge.source}-${edge.target}-${index}`,
      type: edge.type ?? WORKFLOW_DEFAULT_EDGE_OPTIONS.type,
      pathOptions: {
        ...WORKFLOW_DEFAULT_EDGE_OPTIONS.pathOptions,
        ...(edge.pathOptions ?? {}),
        offset: isBranch || branchSideLayout ? branchOffset : WORKFLOW_DEFAULT_EDGE_OPTIONS.pathOptions.offset
      },
      sourceHandle,
      targetHandle: edge.targetHandle ?? "in",
      label,
      labelStyle: { fontSize: 11, fontWeight: 600, fill: stroke },
      labelBgStyle: { fill: "#ffffff", fillOpacity: 0.92 },
      labelBgPadding: [4, 6] as [number, number],
      labelBgBorderRadius: 4,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: stroke,
        width: 20,
        height: 20,
      },
      style: {
        stroke,
        strokeWidth: 2.5,
        ...(isReturn ? { strokeDasharray: "8 5" } : {}),
        ...edge.style,
      },
      animated: condition === "default" && !branchSideLayout,
      interactionWidth: 20,
    };
  });
}

export function resolveTemplateGraphEdges(version: WorkflowVersionJson, nodes: Node[]): Edge[] {
  const raw = (version.definitionJson?.edges ?? []) as Edge[];
  if (raw.length > 0) {
    return normalizeWorkflowEdges(raw, nodes);
  }

  const transitions = version.transitions ?? [];
  if (transitions.length > 0) {
    const stageNodeId = new Map<number, string>();
    for (const s of version.stages ?? []) {
      stageNodeId.set(s.id, s.nodeId || `stage-${s.id}`);
    }

    const built = transitions
      .map((t, i) => {
        const target = stageNodeId.get(t.toStageId);
        if (!target) return null;

        const source = t.fromGatewayNodeId
          ? t.fromGatewayNodeId
          : t.fromStageId
            ? stageNodeId.get(t.fromStageId)
            : null;

        if (!source) return null;

        return {
          id: `t-${t.id ?? i}`,
          source,
          target,
          data: { conditionType: t.conditionType, label: t.label ?? undefined },
        } satisfies Edge;
      })
      .filter((e): e is Edge => e !== null);

    if (built.length > 0) {
      return normalizeWorkflowEdges(built, nodes);
    }
  }

  const stages = version.stages ?? [];
  const stageById = new Map(stages.map((s) => [s.id, s]));
  const nodeIdForStage = (s: (typeof stages)[0]) => s.nodeId || `stage-${s.id}`;

  const linear = stages
    .filter((s) => s.nextStageId)
    .map((s, i) => {
      const target = stageById.get(s.nextStageId!);
      if (!target) return null;
      return {
        id: `e-${s.id}-${i}`,
        source: nodeIdForStage(s),
        target: nodeIdForStage(target),
        data: { conditionType: "default" },
      } satisfies Edge;
    })
    .filter((e): e is Edge => e !== null);

  return normalizeWorkflowEdges(linear, nodes);
}
