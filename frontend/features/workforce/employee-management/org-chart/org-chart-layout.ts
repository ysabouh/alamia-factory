import dagre from "dagre";
import type { Edge, Node } from "@xyflow/react";

import type {
  OrgChartData,
  OrgChartDepartmentNode,
  OrgChartEmployeeNode
} from "./org-chart-types";
import { deptVisual } from "./org-chart-config";
import {
  collectEmbeddedEmployees,
  employeeEmbedOffsetY,
  estimateDepartmentHeight,
  estimatePositionHeight,
  findEmployeeHostNodeId
} from "./org-chart-embed";
import type { OrgChartLayoutOptions } from "./org-chart-settings-types";
import { DEFAULT_ORG_CHART_LAYOUT_SETTINGS } from "./org-chart-settings-types";

const NODE_WIDTH = 240;
const NODE_HEIGHT = 130;
const DEPT_WIDTH = 280;
const POS_WIDTH = 220;

export type FlowNodeData = {
  kind: "department" | "employee" | "virtual_root" | "factory_root" | "org_position";
  label: string;
  employee?: OrgChartEmployeeNode;
  department?: OrgChartDepartmentNode;
  position?: import("./org-chart-types").OrgChartPositionNode;
  departmentColor?: string;
  highlighted?: boolean;
  highlightedEmployeeId?: string | null;
  gmName?: string | null;
};

function walkDepartment(
  dept: OrgChartDepartmentNode,
  parentId: string,
  nodes: Node<FlowNodeData>[],
  edges: Edge[],
  edgeType: OrgChartLayoutOptions["edgeType"],
  highlightId?: string | null,
  departmentColors?: Record<string, string>
) {
  const deptNodeId = `dept-${dept.departmentId}`;
  const visual = deptVisual(dept.code, departmentColors);
  const deptHeight = estimateDepartmentHeight(dept);

  nodes.push({
    id: deptNodeId,
    type: "departmentGroup",
    position: { x: 0, y: 0 },
    data: {
      kind: "department",
      label: dept.name,
      department: dept,
      departmentColor: visual.color,
      highlightedEmployeeId: highlightId
    },
    style: { width: DEPT_WIDTH, height: deptHeight }
  });

  edges.push({
    id: `e-${parentId}-${deptNodeId}`,
    source: parentId,
    target: deptNodeId,
    type: edgeType
  });

  for (const child of dept.children ?? []) {
    walkDepartment(child, deptNodeId, nodes, edges, edgeType, highlightId, departmentColors);
  }

  if (dept.isLeaf) {
    for (const pos of dept.positions ?? []) {
      const posNodeId = `pos-${pos.positionId}`;
      const posHeight = estimatePositionHeight(pos);
      nodes.push({
        id: posNodeId,
        type: "orgPositionGroup",
        position: { x: 0, y: 0 },
        data: {
          kind: "org_position",
          label: pos.name,
          position: pos,
          department: dept,
          departmentColor: visual.color,
          highlightedEmployeeId: highlightId
        },
        style: { width: POS_WIDTH, height: posHeight }
      });
      edges.push({
        id: `e-${deptNodeId}-${posNodeId}`,
        source: deptNodeId,
        target: posNodeId,
        type: edgeType
      });
    }
  }
}

function placeReportingAnchors(
  nodes: Node<FlowNodeData>[],
  departments: OrgChartDepartmentNode[],
  highlightId?: string | null
) {
  const embedded = departments.flatMap((d) => collectEmbeddedEmployees(d));
  const embeddedIds = new Set(embedded.map((e) => e.id));
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  for (const emp of embedded) {
    const hostId = findEmployeeHostNodeId(emp, departments);
    const host = hostId ? nodeById.get(hostId) : null;
    if (!host || !hostId) continue;

    const offsetY = employeeEmbedOffsetY(emp, hostId, departments);
    const anchorX = host.position.x + 24;
    const anchorY = host.position.y + offsetY + 20;

    nodes.push({
      id: `emp-${emp.id}`,
      type: "employeeOrg",
      position: { x: anchorX, y: anchorY },
      hidden: true,
      selectable: false,
      draggable: false,
      data: {
        kind: "employee",
        label: emp.fullName,
        employee: emp,
        highlighted: highlightId === emp.id
      }
    });
  }

  return embeddedIds;
}

export function buildFlowGraph(
  data: OrgChartData,
  highlightId?: string | null,
  layoutOptions?: Partial<OrgChartLayoutOptions>
): { nodes: Node<FlowNodeData>[]; edges: Edge[] } {
  const options: OrgChartLayoutOptions = {
    ...DEFAULT_ORG_CHART_LAYOUT_SETTINGS,
    positions: {},
    ...layoutOptions
  };
  const nodes: Node<FlowNodeData>[] = [];
  const edges: Edge[] = [];

  const factoryRoot = data.factoryRoot;
  const rootLabel = factoryRoot?.generalManagerEmployee
    ? `${factoryRoot.title} — ${factoryRoot.generalManagerEmployee.fullName}`
    : factoryRoot?.title ?? "المصنع";

  nodes.push({
    id: "factory-root",
    type: "factoryRoot",
    position: { x: 0, y: 0 },
    data: {
      kind: "factory_root",
      label: rootLabel,
      gmName: factoryRoot?.generalManagerEmployee?.fullName ?? null
    },
    style: { width: 300, height: 72 }
  });

  const tree = data.departmentTree?.length
    ? data.departmentTree
    : (data.departments ?? []).filter((d) => !d.parentId);

  for (const dept of tree) {
    walkDepartment(dept, "factory-root", nodes, edges, options.edgeType, highlightId, options.departmentColors);
  }

  const laid = applyLayout(nodes, edges, options);
  const embeddedIds = placeReportingAnchors(laid.nodes, tree, highlightId);

  for (const edge of data.reportingEdges ?? []) {
    const sourceId = `emp-${edge.from}`;
    const targetId = `emp-${edge.to}`;
    if (embeddedIds.has(edge.from) && embeddedIds.has(edge.to)) {
      laid.edges.push({
        id: `report-${edge.from}-${edge.to}`,
        source: sourceId,
        target: targetId,
        type: options.edgeType,
        style: { strokeDasharray: "6 4", stroke: "#94a3b8" },
        animated: false
      });
    }
  }

  return laid;
}

function applyLayout(
  nodes: Node<FlowNodeData>[],
  edges: Edge[],
  options: OrgChartLayoutOptions
): { nodes: Node<FlowNodeData>[]; edges: Edge[] } {
  const auto = layoutWithDagre(nodes, edges, options);

  if (options.layoutMode !== "manual") {
    return auto;
  }

  const laid = auto.nodes.map((node) => {
    const saved = options.positions[node.id];
    if (!saved) return node;
    return { ...node, position: { x: saved.x, y: saved.y } };
  });

  return { nodes: laid, edges: auto.edges };
}

function layoutWithDagre(
  nodes: Node<FlowNodeData>[],
  edges: Edge[],
  options: Pick<OrgChartLayoutOptions, "direction" | "nodeSep" | "rankSep" | "edgeType">
) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: options.direction,
    nodesep: options.nodeSep,
    ranksep: options.rankSep,
    marginx: 40,
    marginy: 40
  });

  for (const node of nodes) {
    const kind = node.data.kind;
    const isFactory = kind === "factory_root" || kind === "virtual_root";
    const isDept = kind === "department";
    const isPos = kind === "org_position";
    const w = isFactory ? 300 : isDept ? DEPT_WIDTH : isPos ? POS_WIDTH : NODE_WIDTH;
    const h =
      node.style?.height ??
      (isFactory ? 72 : isDept ? 100 : isPos ? 72 : NODE_HEIGHT);
    g.setNode(node.id, {
      width: typeof w === "number" ? w : DEPT_WIDTH,
      height: typeof h === "number" ? h : NODE_HEIGHT
    });
  }
  for (const edge of edges) {
    if (!edge.hidden && !edge.id.startsWith("report-")) {
      g.setEdge(edge.source, edge.target);
    }
  }

  dagre.layout(g);

  const laid = nodes.map((node) => {
    const pos = g.node(node.id);
    const kind = node.data.kind;
    const isFactory = kind === "factory_root" || kind === "virtual_root";
    const isDept = kind === "department";
    const isPos = kind === "org_position";
    const w = isFactory ? 300 : isDept ? DEPT_WIDTH : isPos ? POS_WIDTH : NODE_WIDTH;
    const h =
      node.style?.height ??
      (isFactory ? 72 : isDept ? 100 : isPos ? 72 : NODE_HEIGHT);
    const width = typeof w === "number" ? w : DEPT_WIDTH;
    const height = typeof h === "number" ? h : NODE_HEIGHT;
    return {
      ...node,
      position: { x: pos.x - width / 2, y: pos.y - height / 2 }
    };
  });

  const typedEdges = edges.map((edge) => ({ ...edge, type: options.edgeType }));

  return { nodes: laid, edges: typedEdges };
}

export function nearestEmployeeNode(
  nodes: Node<FlowNodeData>[],
  point: { x: number; y: number },
  excludeId: string
): string | null {
  let best: { id: string; d: number } | null = null;
  for (const n of nodes) {
    if (n.data.kind !== "employee" || n.id === excludeId || n.hidden) continue;
    const cx = n.position.x + NODE_WIDTH / 2;
    const cy = n.position.y + NODE_HEIGHT / 2;
    const d = Math.hypot(cx - point.x, cy - point.y);
    if (d < 180 && (!best || d < best.d)) best = { id: n.id.replace(/^emp-/, ""), d };
  }
  return best?.id ?? null;
}

export function findVisibleHostForEmployee(
  nodes: Node<FlowNodeData>[],
  employeeId: string
): Node<FlowNodeData> | null {
  for (const n of nodes) {
    if (n.data.kind === "department" && n.data.department) {
      const dept = n.data.department;
      if (dept.managerEmployee?.id === employeeId) return n;
      if ((dept.directEmployees ?? []).some((e) => e.id === employeeId)) return n;
    }
    if (n.data.kind === "org_position" && n.data.position?.employees.some((e) => e.id === employeeId)) {
      return n;
    }
  }
  return null;
}
