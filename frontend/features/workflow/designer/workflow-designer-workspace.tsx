"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { LayoutGrid, GitBranch, Plus, Save, Send, Trash2 } from "lucide-react";

import { WorkflowGatewayNode, type WorkflowGatewayNodeData } from "@/features/workflow/designer/workflow-gateway-node";
import { WorkflowAssignmentLookupProvider } from "@/features/workflow/designer/workflow-assignment-lookup-context";
import { WorkflowStageAssignmentPanel } from "@/features/workflow/designer/workflow-stage-assignment-panel";
import {
  assignmentConfigIsComplete,
  parseAssignmentConfig
} from "@/features/workflow/designer/workflow-stage-assignment";
import { WorkflowStageNode } from "@/features/workflow/designer/workflow-stage-node";
import {
  buildGraphFromVersion,
  layoutWorkflowGraph,
  type WorkflowStageNodeData
} from "@/features/workflow/designer/workflow-designer-layout";
import {
  normalizeWorkflowEdges,
  resolveTemplateGraphEdges
} from "@/features/workflow/instances/workflow-instance-graph-utils";
import { WorkflowGraphFitView } from "@/features/workflow/shared/workflow-graph-fit-view";
import {
  WORKFLOW_DEFAULT_EDGE_OPTIONS,
  WORKFLOW_LAYOUT_NODE_SEP,
  WORKFLOW_STAGE_NODE_WIDTH
} from "@/features/workflow/shared/workflow-graph-layout";
import { workflowApi, type WorkflowVersionJson } from "@/lib/api/workflow-client";

const CONDITION_OPTIONS = [
  { value: "default", label: "افتراضي" },
  { value: "on_approve", label: "عند الموافقة (نعم)" },
  { value: "on_reject", label: "عند الرفض (لا)" },
  { value: "on_return", label: "عند الإرجاع" }
] as const;

const nodeTypes = { workflowStage: WorkflowStageNode, workflowGateway: WorkflowGatewayNode };

type Props = {
  versionId: number;
  initialVersion?: WorkflowVersionJson | null;
  onSaved?: () => void;
};

function DesignerCanvas({ versionId, initialVersion, onSaved }: Props) {
  const graph = useMemo(() => {
    const built = buildGraphFromVersion(initialVersion);
    const nodes = built.nodes as Node[];
    const edges =
      built.edges.length > 0
        ? normalizeWorkflowEdges(built.edges, nodes)
        : initialVersion
          ? resolveTemplateGraphEdges(initialVersion, nodes)
          : [];
    return { nodes: built.nodes, edges };
  }, [initialVersion]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<WorkflowStageNodeData>>(graph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const built = buildGraphFromVersion(initialVersion);
    const nodeList = built.nodes as Node[];
    const nextEdges =
      built.edges.length > 0
        ? normalizeWorkflowEdges(built.edges, nodeList)
        : initialVersion
          ? resolveTemplateGraphEdges(initialVersion, nodeList)
          : [];
    setNodes(built.nodes);
    setEdges(nextEdges);
    setSelectedId(null);
    setSelectedEdgeId(null);
  }, [initialVersion, setNodes, setEdges]);

  useEffect(() => {
    if (selectedEdgeId && !edges.some((e) => e.id === selectedEdgeId)) {
      setSelectedEdgeId(null);
    }
  }, [edges, selectedEdgeId]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedId) ?? null,
    [nodes, selectedId]
  );

  const selectedEdge = useMemo(
    () => edges.find((e) => e.id === selectedEdgeId) ?? null,
    [edges, selectedEdgeId]
  );

  const stageNodes = useMemo(() => nodes.filter((n) => n.type !== "workflowGateway"), [nodes]);
  const gatewayNodes = useMemo(() => nodes.filter((n) => n.type === "workflowGateway"), [nodes]);

  const onConnect = useCallback(
    (c: Connection) => {
      if (!c.source || !c.target || c.source === c.target) return;
      setEdges((eds) =>
        addEdge(
          {
            ...c,
            id: `e-${c.source}-${c.target}`,
            sourceHandle: c.sourceHandle ?? "out",
            targetHandle: c.targetHandle ?? "in",
            animated: true,
            type: "smoothstep"
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const deleteSelectedEdge = useCallback(() => {
    if (!selectedEdgeId) return;
    setEdges((eds) => eds.filter((e) => e.id !== selectedEdgeId));
    setSelectedEdgeId(null);
  }, [selectedEdgeId, setEdges]);

  const addStage = () => {
    const id = `stage-${Date.now()}`;
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: "workflowStage",
        position: { x: 80 + stageNodes.length * (WORKFLOW_STAGE_NODE_WIDTH + WORKFLOW_LAYOUT_NODE_SEP) * 0.15, y: 80 + stageNodes.length * 24 },
        data: {
          name: `مرحلة ${stageNodes.length + 1}`,
          assignmentType: "single_employee",
          assignmentConfig: {},
          checklist: [],
          requiresApproval: false,
          allowRejection: false,
          allowReturn: false,
          checklistRequired: false
        }
      }
    ]);
  };

  const addGateway = () => {
    const id = `gateway-${Date.now()}`;
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: "workflowGateway",
        position: { x: 180 + nds.length * 40, y: 180 + nds.length * 20 },
        data: { question: "قرار؟", gatewayType: "exclusive" } satisfies WorkflowGatewayNodeData
      }
    ]);
  };

  const validateGraph = (): string | null => {
    const incomplete = stageNodes.filter(
      (n) => !assignmentConfigIsComplete(n.data.assignmentType, parseAssignmentConfig(n.data.assignmentConfig))
    );
    if (incomplete.length > 0) {
      return `أكمل تعيين المنفّذ لـ ${incomplete.length} مرحلة.`;
    }

    for (const gw of gatewayNodes) {
      const outs = edges.filter((e) => e.source === gw.id);
      if (outs.length < 2) {
        return `عقدة القرار «${(gw.data as WorkflowGatewayNodeData).question ?? gw.id}» تحتاج مخرجين على الأقل.`;
      }
    }

    const orphanStages = stageNodes.filter((stage) => {
      const outs = edges.filter((e) => e.source === stage.id);
      const hasIncoming = edges.some((e) => e.target === stage.id);
      return !hasIncoming && outs.length === 0;
    });
    if (orphanStages.length > 0) {
      return `المرحلة «${orphanStages[0]!.data.name}» غير موصولة بالمسار (لا دخول ولا خروج).`;
    }

    if (stageNodes.length > 1) {
      const hasTerminalStage = stageNodes.some((stage) => {
        const outs = edges.filter((e) => e.source === stage.id);
        const hasIncoming = edges.some((e) => e.target === stage.id);
        return hasIncoming && outs.length === 0;
      });
      if (!hasTerminalStage) {
        return "يجب أن ينتهي المسار بمرحلة أخيرة (بدون سهم خروج) مثل «مراجعة وإغلاق».";
      }
    }

    return null;
  };

  const autoLayout = () => {
    setNodes((nds) => layoutWorkflowGraph(nds, edges));
  };

  const save = async () => {
    const validationError = validateGraph();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await workflowApi.saveDesigner(versionId, { nodes, edges });
      onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    const validationError = validateGraph();
    if (validationError) {
      setError(validationError);
      return;
    }
    setPublishing(true);
    setError(null);
    try {
      await workflowApi.saveDesigner(versionId, { nodes, edges });
      await workflowApi.publishVersion(versionId);
      onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل النشر");
    } finally {
      setPublishing(false);
    }
  };

  const updateSelected = (patch: Partial<WorkflowStageNodeData>) => {
    if (!selectedId) return;
    setNodes((nds) =>
      nds.map((n) => (n.id === selectedId ? { ...n, data: { ...n.data, ...patch } } : n))
    );
  };

  const updateSelectedGateway = (patch: Partial<WorkflowGatewayNodeData>) => {
    if (!selectedId) return;
    setNodes((nds) =>
      nds.map((n) => (n.id === selectedId ? { ...n, data: { ...(n.data as WorkflowGatewayNodeData), ...patch } } : n))
    );
  };

  const updateSelectedEdge = (patch: { conditionType?: string; label?: string }) => {
    if (!selectedEdgeId) return;
    setEdges((eds) =>
      eds.map((e) =>
        e.id === selectedEdgeId
          ? { ...e, data: { ...(e.data ?? {}), ...patch }, label: patch.label ?? e.label }
          : e
      )
    );
  };

  const isReadOnly = initialVersion?.status === "published";
  const fitKey = `${nodes.length}-${edges.length}-${initialVersion?.id ?? 0}`;

  return (
    <div className="flex h-[min(72vh,820px)] min-h-[520px] flex-col gap-3 dark:bg-zinc-950">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={addStage}
          disabled={isReadOnly}
          className="atlas-btn-secondary inline-flex items-center gap-1 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> مرحلة
        </button>
        <button
          type="button"
          onClick={addGateway}
          disabled={isReadOnly}
          className="atlas-btn-secondary inline-flex items-center gap-1 disabled:opacity-50"
        >
          <GitBranch className="h-4 w-4" /> قرار
        </button>
        <button type="button" onClick={autoLayout} className="atlas-btn-secondary inline-flex items-center gap-1">
          <LayoutGrid className="h-4 w-4" /> ترتيب تلقائي
        </button>
        {selectedEdgeId && !isReadOnly ? (
          <button
            type="button"
            onClick={deleteSelectedEdge}
            className="atlas-btn-secondary inline-flex items-center gap-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <Trash2 className="h-4 w-4" /> حذف الرابط
          </button>
        ) : null}
        <button
          type="button"
          onClick={save}
          disabled={saving || isReadOnly}
          className="atlas-btn-primary inline-flex items-center gap-1 disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {saving ? "جاري الحفظ..." : "حفظ"}
        </button>
        <button
          type="button"
          onClick={publish}
          disabled={publishing || isReadOnly}
          className="atlas-btn-primary inline-flex items-center gap-1 disabled:opacity-50"
        >
          <Send className="h-4 w-4" /> {publishing ? "جاري النشر..." : "نشر النسخة"}
        </button>
        {isReadOnly ? (
          <span className="text-xs text-amber-700 dark:text-amber-300">نسخة منشورة — أنشئ مسودة جديدة للتعديل</span>
        ) : (
          <span className="text-xs text-atlas-muted">
            للربط: اسحب من منتصف الأسفل إلى منتصف الأعلى. عقدة القرار: من الرأس السفلي/الأيمن. استخدم «ترتيب تلقائي» لتوزيع المراحل بتباعد مناسب.
          </span>
        )}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>

      <div className="flex min-h-0 flex-1 gap-3">
        <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-lg border border-atlas-border bg-atlas-surface dark:border-zinc-700 dark:bg-zinc-900">
          {nodes.length === 0 ? (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6 text-center text-sm text-atlas-muted">
              لا توجد مراحل بعد. اضغط «مرحلة» لإضافة أول مرحلة في سير العمل.
            </div>
          ) : null}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            nodesConnectable={!isReadOnly}
            nodesDraggable={!isReadOnly}
            edgesDeletable={!isReadOnly}
            elementsSelectable
            deleteKeyCode={isReadOnly ? null : ["Backspace", "Delete"]}
            connectionRadius={28}
            snapToGrid
            snapGrid={[16, 16]}
            defaultEdgeOptions={WORKFLOW_DEFAULT_EDGE_OPTIONS}
            onNodeClick={(_, n) => {
              setSelectedId(n.id);
              setSelectedEdgeId(null);
            }}
            onEdgeClick={(_, e) => {
              setSelectedEdgeId(e.id);
              setSelectedId(null);
            }}
            onPaneClick={() => {
              setSelectedId(null);
              setSelectedEdgeId(null);
            }}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            minZoom={0.25}
            maxZoom={1.5}
            proOptions={{ hideAttribution: true }}
            style={{ width: "100%", height: "100%" }}
            className="dark:bg-zinc-900 [&_.react-flow__edge-path]:stroke-[2.5px]"
          >
            <WorkflowGraphFitView dep={fitKey} />
            <Background gap={16} color="#e2e8f0" />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable nodeStrokeWidth={2} className="!border-atlas-border !bg-white dark:!bg-zinc-800" />
          </ReactFlow>
        </div>

        {selectedNode && selectedNode.type === "workflowGateway" ? (
          <aside className="w-80 shrink-0 overflow-y-auto rounded-lg border border-atlas-border bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="mb-3 text-sm font-bold">عقدة قرار</h3>
            <label className="mb-2 block text-xs text-atlas-muted">السؤال / التسمية</label>
            <input
              className="atlas-input mb-3 w-full"
              value={(selectedNode.data as WorkflowGatewayNodeData).question ?? ""}
              disabled={isReadOnly}
              onChange={(e) => updateSelectedGateway({ question: e.target.value })}
            />
            <p className="text-xs text-atlas-muted">
              اربط مرحلة → قرار → مسارين (نعم/لا) مع تحديد شرط كل رابط من لوحة الرابط.
            </p>
          </aside>
        ) : selectedNode ? (
          <aside className="w-80 shrink-0 overflow-y-auto rounded-lg border border-atlas-border bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="mb-3 text-sm font-bold">إعدادات المرحلة</h3>
            <label className="mb-2 block text-xs text-atlas-muted">الاسم</label>
            <input
              className="atlas-input mb-3 w-full"
              value={selectedNode.data.name}
              disabled={isReadOnly}
              onChange={(e) => updateSelected({ name: e.target.value })}
            />
            <label className="mb-2 block text-xs text-atlas-muted">نوع التعيين</label>
            <select
              className="atlas-input mb-3 w-full"
              value={selectedNode.data.assignmentType}
              disabled={isReadOnly}
              onChange={(e) =>
                updateSelected({
                  assignmentType: e.target.value,
                  assignmentConfig: {}
                })
              }
            >
              <option value="single_employee">موظف واحد</option>
              <option value="multiple_any">عدة — أي واحد</option>
              <option value="multiple_all">عدة — الكل</option>
              <option value="sequential">تسلسلي</option>
              <option value="department">قسم</option>
              <option value="role">دور</option>
            </select>
            <WorkflowStageAssignmentPanel
              assignmentType={selectedNode.data.assignmentType}
              assignmentConfig={selectedNode.data.assignmentConfig}
              disabled={isReadOnly}
              onChange={(assignmentConfig) => updateSelected({ assignmentConfig })}
            />
            <label className="mb-2 block text-xs text-atlas-muted">SLA (دقائق)</label>
            <input
              type="number"
              className="atlas-input mb-3 w-full"
              value={selectedNode.data.slaDurationMinutes ?? ""}
              disabled={isReadOnly}
              onChange={(e) => updateSelected({ slaDurationMinutes: Number(e.target.value) || null })}
            />
            <label className="mb-2 flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={!!selectedNode.data.requiresApproval}
                disabled={isReadOnly}
                onChange={(e) => updateSelected({ requiresApproval: e.target.checked })}
              />
              يتطلب موافقة
            </label>
            <label className="mb-2 flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={!!selectedNode.data.checklistRequired}
                disabled={isReadOnly}
                onChange={(e) => updateSelected({ checklistRequired: e.target.checked })}
              />
              قائمة تحقق إلزامية
            </label>
          </aside>
        ) : selectedEdge ? (
          <aside className="w-80 shrink-0 overflow-y-auto rounded-lg border border-atlas-border bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="mb-3 text-sm font-bold">خصائص الرابط</h3>
            <label className="mb-2 block text-xs text-atlas-muted">شرط الانتقال</label>
            <select
              className="atlas-input mb-3 w-full"
              value={(selectedEdge.data as { conditionType?: string })?.conditionType ?? "default"}
              disabled={isReadOnly}
              onChange={(e) => updateSelectedEdge({ conditionType: e.target.value })}
            >
              {CONDITION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <label className="mb-2 block text-xs text-atlas-muted">التسمية (نعم / لا / ...)</label>
            <input
              className="atlas-input mb-3 w-full"
              value={(selectedEdge.data as { label?: string })?.label ?? selectedEdge.label ?? ""}
              disabled={isReadOnly}
              placeholder="مثال: نعم"
              onChange={(e) => updateSelectedEdge({ label: e.target.value })}
            />
          </aside>
        ) : null}
      </div>
    </div>
  );
}

export function WorkflowDesignerWorkspace(props: Props) {
  return (
    <WorkflowAssignmentLookupProvider>
      <ReactFlowProvider>
        <DesignerCanvas key={props.versionId} {...props} />
      </ReactFlowProvider>
    </WorkflowAssignmentLookupProvider>
  );
}
