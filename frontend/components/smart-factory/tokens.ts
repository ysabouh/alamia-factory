/**
 * Smart Factory design system tokens (reference for JS-driven charts / canvases).
 * Prefer Tailwind `sf-*` colors and `text-sf-*` utilities in JSX.
 */

export const sfPalette = {
  void: "#010409",
  deep: "#020617",
  chassis: "#0a1628",
  panel: "#0d1b2f",
  stroke: "#5f93c9",
  hairline: "#31567d",
  ink: "#f7fbff",
  copy: "#e9f3fc",
  muted: "#c2d7e9",
  dim: "#93abc2",
  accent: "#00d4aa",
  accentCool: "#22d3ee",
  siemensTeal: "#009999",
  alarm: "#ff3b30",
  caution: "#fbbf24",
  ok: "#34c759"
} as const;

export type SfOperationalState =
  | "running"
  | "idle"
  | "planned"
  | "maintenance"
  | "alarm"
  | "offline"
  | "quality_hold";
