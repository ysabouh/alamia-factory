"use client";

import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Node,
  type OnNodeDrag
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  FileImage,
  FileText,
  Maximize2,
  Minimize2,
  Printer,
  Search,
  ZoomIn,
  ZoomOut
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { WfmInput } from "@/components/workforce/atlas";
import { cn } from "@/lib/utils";

import { OrgChartChangeManagerModal } from "./org-chart-change-manager-modal";
import { OrgChartChangePositionModal } from "./org-chart-change-position-modal";
import { OrgChartContextMenu, type ContextMenuState } from "./org-chart-context-menu";
import { exportOrgChartPdf, exportOrgChartPng, exportOrgChartSvg, printOrgChart } from "./org-chart-export";
import { matchesSearch } from "./org-chart-config";
import {
  buildFlowGraph,
  findVisibleHostForEmployee,
  type FlowNodeData
} from "./org-chart-layout";
import { OrgChartInteractionProvider } from "./org-chart-interaction-context";
import {
  DepartmentGroupNode,
  EmployeeOrgNode,
  FactoryRootNode,
  OrgPositionGroupNode,
  VirtualRootNode
} from "./nodes/org-chart-nodes";
import { OrgChartSettingsPanel } from "./org-chart-settings-panel";
import type { OrgChartLayoutPayload, OrgChartLayoutSettings } from "./org-chart-settings-types";
import type { OrgChartData, OrgChartEmployeeNode } from "./org-chart-types";
import { useOrgChart } from "./use-org-chart";

const nodeTypes = {
  employeeOrg: EmployeeOrgNode,
  departmentGroup: DepartmentGroupNode,
  virtualRoot: VirtualRootNode,
  factoryRoot: FactoryRootNode,
  orgPositionGroup: OrgPositionGroupNode
};

function OrgChartFlowInner({
  canManage,
  data,
  layout,
  onReportingChange,
  onSettingsChange,
  onSavePosition,
  onResetPositions
}: {
  canManage: boolean;
  data: OrgChartData;
  layout: OrgChartLayoutPayload;
  onReportingChange: (employeeId: string, reportsToId: string | null, departmentId?: string | null, orgPositionId?: string | null) => Promise<void>;
  onSettingsChange: (partial: Partial<OrgChartLayoutSettings>, options?: { debounce?: boolean }) => void;
  onSavePosition: (nodeId: string, position: { x: number; y: number }) => Promise<void>;
  onResetPositions: () => Promise<void>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { fitView, zoomIn, zoomOut, setCenter } = useReactFlow();
  const [search, setSearch] = useState("");
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [changeManagerEmployee, setChangeManagerEmployee] = useState<OrgChartEmployeeNode | null>(null);
  const [changePositionEmployee, setChangePositionEmployee] = useState<OrgChartEmployeeNode | null>(null);
  const [busy, setBusy] = useState(false);

  const layoutOptions = useMemo(
    () => ({
      ...layout.settings,
      positions: layout.positions
    }),
    [layout]
  );

  const graph = useMemo(
    () => buildFlowGraph(data, highlightId, layoutOptions),
    [data, highlightId, layoutOptions]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges);

  useEffect(() => {
    setNodes(graph.nodes);
    setEdges(graph.edges);
  }, [graph, setNodes, setEdges]);

  useEffect(() => {
    const t = setTimeout(() => fitView({ padding: 0.15, duration: 300 }), 50);
    return () => clearTimeout(t);
  }, [nodes, edges, fitView, layout.settings.layoutMode, layout.settings.direction, layout.settings.nodeSep, layout.settings.rankSep]);

  const onSearch = useCallback(() => {
    const q = search.trim();
    if (!q) return;
    for (const emp of data.employees) {
      if (matchesSearch(emp, q)) {
        setHighlightId(emp.id);
        const host = findVisibleHostForEmployee(nodes, emp.id);
        if (host) {
          const w = typeof host.style?.width === "number" ? host.style.width : 280;
          const h = typeof host.style?.height === "number" ? host.style.height : 120;
          setCenter(host.position.x + w / 2, host.position.y + h / 2, { zoom: 1.2, duration: 400 });
        }
        return;
      }
    }
  }, [search, data.employees, nodes, setCenter]);

  const onEmployeeClick = useCallback((employee: OrgChartEmployeeNode) => {
    setHighlightId(employee.id);
  }, []);

  const onEmployeeContextMenu = useCallback((e: React.MouseEvent, employee: OrgChartEmployeeNode) => {
    setContextMenu({ x: e.clientX, y: e.clientY, employee });
  }, []);

  const onNodeDragStop: OnNodeDrag<Node<FlowNodeData>> = useCallback(
    async (_, node) => {
      if (!canManage || busy || layout.settings.layoutMode !== "manual") return;
      await onSavePosition(node.id, node.position);
    },
    [canManage, busy, layout.settings.layoutMode, onSavePosition]
  );

  const onNodeContextMenu = useCallback((e: React.MouseEvent, node: Node<FlowNodeData>) => {
    e.preventDefault();
    if (node.data.kind !== "employee" || !node.data.employee) return;
    setContextMenu({ x: e.clientX, y: e.clientY, employee: node.data.employee });
  }, []);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node<FlowNodeData>) => {
    if (node.data.kind === "employee" && node.data.employee) {
      setHighlightId(node.data.employee.id);
    }
  }, []);

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      void el.requestFullscreen();
      setFullscreen(true);
    } else {
      void document.exitFullscreen();
      setFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "org-chart-print-root flex flex-col rounded-sm border border-atlas-rule bg-atlas-surface",
        fullscreen ? "fixed inset-0 z-50" : "h-[min(72vh,820px)]"
      )}
    >
      <div className="org-chart-no-print flex flex-wrap items-center gap-2 border-b border-atlas-rule bg-atlas-paper px-3 py-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute start-2 top-2.5 h-4 w-4 text-atlas-muted" />
          <WfmInput
            className="ps-8"
            placeholder="بحث بالاسم، الرقم، القسم…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
          />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onSearch}>
          بحث
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => zoomIn({ duration: 200 })}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => zoomOut({ duration: 200 })}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => fitView({ padding: 0.15, duration: 300 })}>
          ملاءمة الشاشة
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={toggleFullscreen}>
          {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => containerRef.current && void exportOrgChartPng(containerRef.current)}
        >
          <FileImage className="ms-1 h-4 w-4" />
          PNG
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => containerRef.current && void exportOrgChartPdf(containerRef.current)}
        >
          <FileText className="ms-1 h-4 w-4" />
          PDF
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => exportOrgChartSvg(containerRef)}>
          <Download className="ms-1 h-4 w-4" />
          SVG
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={printOrgChart}>
          <Printer className="ms-1 h-4 w-4" />
          طباعة
        </Button>
      </div>

      <OrgChartSettingsPanel
        canManage={canManage}
        data={data}
        layout={layout}
        onSettingsChange={onSettingsChange}
        onResetPositions={onResetPositions}
      />

      <div className="relative min-h-0 flex-1">
        <OrgChartInteractionProvider
          value={{
            highlightedId: highlightId,
            onEmployeeClick,
            onEmployeeContextMenu
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            nodesDraggable={canManage}
            onNodeDragStop={onNodeDragStop}
            onNodeContextMenu={onNodeContextMenu}
            onNodeClick={onNodeClick}
            fitView
            minZoom={0.1}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={16} size={1} />
            <Controls showInteractive={false} className="org-chart-no-print" />
            <MiniMap
              className="org-chart-no-print !border-atlas-rule !bg-atlas-paper"
              nodeColor={(n) => (n.data?.kind === "department" ? "#0ea5e9" : "#64748b")}
            />
          </ReactFlow>
        </OrgChartInteractionProvider>
      </div>

      <OrgChartContextMenu
        menu={contextMenu}
        onClose={() => setContextMenu(null)}
        canManage={canManage}
        onChangeManager={canManage ? (emp) => setChangeManagerEmployee(emp) : undefined}
        onChangePosition={canManage ? (emp) => setChangePositionEmployee(emp) : undefined}
      />

      <OrgChartChangeManagerModal
        employee={changeManagerEmployee}
        employees={data.employees}
        open={changeManagerEmployee !== null}
        onOpenChange={(open) => {
          if (!open) setChangeManagerEmployee(null);
        }}
        onSave={onReportingChange}
      />

      <OrgChartChangePositionModal
        employee={changePositionEmployee}
        open={changePositionEmployee !== null}
        onClose={() => setChangePositionEmployee(null)}
        onSave={(id, orgPositionId) => onReportingChange(id, changePositionEmployee?.reportsToId ?? null, changePositionEmployee?.departmentId ?? null, orgPositionId)}
      />
    </div>
  );
}

export function OrgChartWorkspace({ canManage }: { canManage: boolean }) {
  const {
    data,
    layout,
    loading,
    error,
    reload,
    updateReporting,
    updateLayoutSettings,
    saveNodePosition,
    resetPositions
  } = useOrgChart();

  if (loading) {
    return <p className="py-12 text-center text-atlas-muted">جاري تحميل الهيكل التنظيمي…</p>;
  }
  if (error) {
    return (
      <div className="rounded-sm border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
        <Button type="button" variant="outline" size="sm" className="ms-3" onClick={() => void reload()}>
          إعادة المحاولة
        </Button>
      </div>
    );
  }
  if (!data) return null;

  return (
    <ReactFlowProvider>
      <OrgChartFlowInner
        canManage={canManage}
        data={data}
        layout={layout}
        onReportingChange={updateReporting}
        onSettingsChange={updateLayoutSettings}
        onSavePosition={saveNodePosition}
        onResetPositions={resetPositions}
      />
    </ReactFlowProvider>
  );
}
