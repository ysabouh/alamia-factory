"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type WfmBadgeTone = "active" | "idle" | "warning" | "danger" | "info" | "neutral";

const toneClass: Record<WfmBadgeTone, string> = {
  active: "border-atlas-success/30 bg-atlas-success/10 text-atlas-success",
  idle: "border-atlas-warning/35 bg-atlas-warning/10 text-atlas-warning",
  warning: "border-atlas-warning/35 bg-atlas-warning/10 text-atlas-warning",
  danger: "border-atlas-danger/35 bg-atlas-danger/10 text-atlas-danger",
  info: "border-atlas-info/30 bg-atlas-info/10 text-atlas-info",
  neutral: "border-atlas-rule bg-atlas-canvas text-atlas-muted"
};

export function WfmStatusBadge({
  tone,
  children,
  className
}: {
  tone: WfmBadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2 py-0.5 text-[11px] font-semibold",
        toneClass[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
