export type OrgChartLayoutMode = "auto" | "manual";
export type OrgChartDirection = "TB" | "LR";
export type OrgChartEdgeType = "smoothstep" | "step" | "straight";

export type OrgChartLayoutSettings = {
  layoutMode: OrgChartLayoutMode;
  direction: OrgChartDirection;
  nodeSep: number;
  rankSep: number;
  edgeType: OrgChartEdgeType;
  reparentOnDrag: boolean;
  departmentColors: Record<string, string>;
};

export type OrgChartNodePosition = { x: number; y: number };

export type OrgChartLayoutPayload = {
  settings: OrgChartLayoutSettings;
  positions: Record<string, OrgChartNodePosition>;
};

export const DEFAULT_ORG_CHART_LAYOUT_SETTINGS: OrgChartLayoutSettings = {
  layoutMode: "auto",
  direction: "TB",
  nodeSep: 40,
  rankSep: 70,
  edgeType: "smoothstep",
  reparentOnDrag: false,
  departmentColors: {}
};

export type OrgChartLayoutOptions = OrgChartLayoutSettings & {
  positions: Record<string, OrgChartNodePosition>;
};
