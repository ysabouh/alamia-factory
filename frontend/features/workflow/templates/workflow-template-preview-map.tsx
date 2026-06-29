"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  type Node
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { WorkflowGatewayNode } from "@/features/workflow/designer/workflow-gateway-node";
import { WorkflowAssignmentLookupProvider } from "@/features/workflow/designer/workflow-assignment-lookup-context";
import { WorkflowStageNode } from "@/features/workflow/designer/workflow-stage-node";
import { buildGraphFromVersion } from "@/features/workflow/designer/workflow-designer-layout";
import { resolveTemplateGraphEdges } from "@/features/workflow/instances/workflow-instance-graph-utils";
import { WORKFLOW_GRAPH_HEIGHT, WorkflowGraphFitView } from "@/features/workflow/shared/workflow-graph-fit-view";
import { WORKFLOW_DEFAULT_EDGE_OPTIONS } from "@/features/workflow/shared/workflow-graph-layout";
import type { WorkflowVersionJson } from "@/lib/api/workflow-client";

const nodeTypes = { workflowStage: WorkflowStageNode, workflowGateway: WorkflowGatewayNode };

const defaultEdgeOptions = {
  ...WORKFLOW_DEFAULT_EDGE_OPTIONS,
  animated: false,
};

type Props = {
  version: WorkflowVersionJson | null | undefined;
  title?: string;
};

function PreviewCanvas({ version }: { version: WorkflowVersionJson }) {
  const { nodes: rawNodes, edges: _ignored } = useMemo(() => buildGraphFromVersion(version), [version]);

  const nodes = useMemo(
    () =>
      rawNodes.map((n) => {
        const nodeType = n.type ?? "workflowStage";
        return {
          ...n,
          type: nodeType,
          draggable: false,
          selectable: false,
          connectable: false,
          data: {
            ...(n.data ?? {}),
            executionState: nodeType === "workflowGateway" ? undefined : ("pending" as const),
          },
        };
      }) as Node[],
    [rawNodes]
  );

  const edges = useMemo(() => resolveTemplateGraphEdges(version, nodes), [version, nodes]);
  const fitKey = `${nodes.length}-${edges.length}`;

  if (nodes.length === 0) {
    return (
      <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-atlas-muted">
        لا يوجد رسم محفوظ — افتح المصمم لإنشاء المراحل.
      </div>
    );
  }

  return (
    <div className="h-full w-full" dir="ltr">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnScroll
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.25}
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

export function WorkflowTemplatePreviewMap({ version, title = "معاينة التصميم" }: Props) {
  if (!version) {
    return (
      <section className="rounded-lg border border-atlas-border bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-2 text-sm font-bold">{title}</h2>
        <p className="text-sm text-atlas-muted">لا توجد نسخة منشورة لعرض التصميم.</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-atlas-border bg-white dark:border-zinc-700 dark:bg-zinc-900">
      <div className="border-b border-atlas-border px-4 py-3 dark:border-zinc-700">
        <h2 className="text-sm font-bold">{title}</h2>
        <p className="mt-0.5 text-xs text-atlas-muted">
          نسخة v{version.version} · {version.status === "published" ? "منشورة" : version.status}
        </p>
        <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-atlas-muted">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-zinc-400" /> مرحلة
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rotate-45 rounded-sm bg-orange-500" /> فروع
          </span>
        </div>
      </div>
      <div className="w-full p-2" style={{ height: WORKFLOW_GRAPH_HEIGHT }}>
        <WorkflowAssignmentLookupProvider>
          <ReactFlowProvider>
            <PreviewCanvas version={version} />
          </ReactFlowProvider>
        </WorkflowAssignmentLookupProvider>
      </div>
    </section>
  );
}
