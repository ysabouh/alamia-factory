/**
 * Atlas — نظام ألوان داخلي دافئ (ورق/حجر + كهرمان + يشم).
 * يطابق مفاتيح `atlas.*` في tailwind.config.ts للاستخدام في الرسوم والـ canvas.
 */
export const atlasPalette = {
  canvas: "#f4f0e8",
  paper: "#fffcf7",
  ink: "#1c1814",
  slate: "#5c5650",
  muted: "#8a8278",
  rule: "#e0d9ce",
  sidebar: "#241f1b",
  sidebarLine: "#3d3530",
  sidebarMuted: "#c4b8ab",
  brand: "#c25621",
  brandHover: "#a3471a",
  brandSoft: "#fde8dc",
  accent: "#1b6b56",
  tableHead: "#ede8df",
  success: "#2d7a3e",
  warning: "#b8860b",
  danger: "#b42318",
  info: "#2a6f97"
} as const;

export type AtlasPaletteKey = keyof typeof atlasPalette;
