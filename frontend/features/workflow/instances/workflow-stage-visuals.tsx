import type { LucideIcon } from "lucide-react";
import { Check, Circle, Play, RotateCcw } from "lucide-react";

import type { WorkflowExecutionState } from "@/features/workflow/designer/workflow-designer-layout";
import { WORKFLOW_STAGE_STATE_LABELS } from "@/features/workflow/workflow-labels";

export type StageVisualState = WorkflowExecutionState;

export type StageVisualTheme = {
  headerBg: string;
  headerText: string;
  border: string;
  bodyBg: string;
  title: string;
  badge: string;
  ring: string;
  connector: string;
  icon: LucideIcon;
  iconClass: string;
  kpiAccent: string;
  kpiIconBg: string;
};

export const STAGE_VISUAL_THEMES: Record<StageVisualState, StageVisualTheme> = {
  completed: {
    headerBg: "bg-emerald-500",
    headerText: "text-white",
    border: "border-emerald-500",
    bodyBg: "bg-emerald-50/40 dark:bg-emerald-950/20",
    title: "text-emerald-900 dark:text-emerald-100",
    badge: "bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-800",
    ring: "ring-emerald-400",
    connector: "from-emerald-400 to-emerald-500",
    icon: Check,
    iconClass: "text-white",
    kpiAccent: "text-emerald-600",
    kpiIconBg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
  },
  current: {
    headerBg: "bg-blue-500",
    headerText: "text-white",
    border: "border-blue-500",
    bodyBg: "bg-blue-50/50 dark:bg-blue-950/25",
    title: "text-blue-900 dark:text-blue-100",
    badge: "bg-blue-100 text-blue-800 ring-blue-200 dark:bg-blue-950/50 dark:text-blue-200 dark:ring-blue-800",
    ring: "ring-blue-400",
    connector: "from-blue-400 to-blue-300",
    icon: Play,
    iconClass: "text-white fill-white",
    kpiAccent: "text-blue-600",
    kpiIconBg: "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
  },
  delayed: {
    headerBg: "bg-red-500",
    headerText: "text-white",
    border: "border-red-500",
    bodyBg: "bg-red-50/40 dark:bg-red-950/20",
    title: "text-red-900 dark:text-red-100",
    badge: "bg-red-100 text-red-800 ring-red-200 dark:bg-red-950/50 dark:text-red-200 dark:ring-red-800",
    ring: "ring-red-400",
    connector: "from-red-400 to-red-300",
    icon: RotateCcw,
    iconClass: "text-white",
    kpiAccent: "text-red-600",
    kpiIconBg: "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400"
  },
  pending: {
    headerBg: "bg-zinc-400 dark:bg-zinc-600",
    headerText: "text-white",
    border: "border-zinc-300 dark:border-zinc-600",
    bodyBg: "bg-zinc-50 dark:bg-zinc-800/60",
    title: "text-zinc-700 dark:text-zinc-200",
    badge: "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700",
    ring: "ring-zinc-300 dark:ring-zinc-600",
    connector: "from-zinc-300 to-zinc-300 dark:from-zinc-600 dark:to-zinc-600",
    icon: Circle,
    iconClass: "text-white",
    kpiAccent: "text-amber-600",
    kpiIconBg: "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
  }
};

export function getStageVisualTheme(state: string): StageVisualTheme {
  if (state in STAGE_VISUAL_THEMES) {
    return STAGE_VISUAL_THEMES[state as StageVisualState];
  }
  return STAGE_VISUAL_THEMES.pending;
}

export function formatStageIndex(stageNumber?: number | null): string {
  if (stageNumber == null || stageNumber <= 0) return "—";
  return String(stageNumber).padStart(2, "0");
}

export function formatStageOfTotal(stageNumber?: number | null, total?: number): string {
  if (stageNumber == null || !total) return "—";
  return `${stageNumber} من ${total}`;
}

export function stageStateLabel(state: string): string {
  return WORKFLOW_STAGE_STATE_LABELS[state] ?? state;
}

type IconProps = {
  state: string;
  className?: string;
};

export function WorkflowStageStateIcon({ state, className = "h-4 w-4" }: IconProps) {
  const theme = getStageVisualTheme(state);
  const Icon = theme.icon;
  return <Icon className={`${className} ${theme.iconClass}`} strokeWidth={state === "completed" ? 3 : 2} />;
}
