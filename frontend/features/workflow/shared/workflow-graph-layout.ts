/** أبعاد العقد في الترتيب التلقائي والتباعد بين المراحل */
export const WORKFLOW_STAGE_NODE_WIDTH = 230;
export const WORKFLOW_STAGE_NODE_HEIGHT = 112;
export const WORKFLOW_GATEWAY_NODE_SIZE = 80;

/** مسافة عمودية بين صفوف المراحل (طول السهم الافتراضي تقريباً) */
export const WORKFLOW_LAYOUT_RANK_SEP = 120;
/** مسافة أفقية بين المراحل المتجاورة */
export const WORKFLOW_LAYOUT_NODE_SEP = 100;

/** تباعد أوسع لخرائط التنفيذ والمعاينة */
export const WORKFLOW_INSTANCE_LAYOUT_RANK_SEP = 200;
export const WORKFLOW_INSTANCE_LAYOUT_NODE_SEP = 160;
export const WORKFLOW_INSTANCE_LAYOUT_BRANCH_NODE_SEP = 260;
export const WORKFLOW_INSTANCE_LAYOUT_EDGE_SEP = 90;
export const WORKFLOW_INSTANCE_BRANCH_EDGE_OFFSET = 64;
export const WORKFLOW_INSTANCE_GRAPH_HEIGHT = 520;
export const WORKFLOW_INSTANCE_BRANCH_GRAPH_HEIGHT = 580;
export const WORKFLOW_INSTANCE_STAGE_NODE_WIDTH = 240;
export const WORKFLOW_INSTANCE_STAGE_NODE_HEIGHT = 128;

export type WorkflowLayoutOptions = {
  rankSep?: number;
  nodeSep?: number;
  edgeSep?: number;
  marginX?: number;
  marginY?: number;
  stageNodeWidth?: number;
  stageNodeHeight?: number;
};

export const WORKFLOW_DEFAULT_EDGE_OPTIONS = {
  type: "smoothstep" as const,
  animated: true,
  interactionWidth: 24,
  pathOptions: {
    borderRadius: 16,
    offset: 28,
  },
};

/** توسيط المقبض على منتصف حافة العقدة */
export const WORKFLOW_HANDLE_CENTER = {
  top: { left: "50%", transform: "translate(-50%, -50%)" },
  bottom: { left: "50%", transform: "translate(-50%, 50%)" },
  right: { top: "50%", transform: "translate(50%, -50%)" },
  left: { top: "50%", transform: "translate(-50%, -50%)" },
} as const;
