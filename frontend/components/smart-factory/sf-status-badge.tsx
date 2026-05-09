"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

import type { SfOperationalState } from "./tokens";

export type SfStatusBadgeTone = SfOperationalState | "neutral" | "signal";

const toneClass: Record<SfStatusBadgeTone, string> = {
  running: "border-emerald-400/35 bg-emerald-500/[0.12] text-emerald-50 shadow-[0_0_24px_rgba(34,197,94,0.12)]",
  idle: "border-amber-400/35 bg-amber-500/[0.12] text-amber-50",
  planned: "border-sky-400/35 bg-sky-500/[0.12] text-sky-50",
  maintenance: "border-cyan-400/35 bg-sf-accentCool/[0.1] text-cyan-50",
  alarm: "border-red-500/45 bg-red-600/[0.16] text-red-50 shadow-glowRed",
  offline: "border-sf-stroke/55 bg-white/[0.06] text-sf-copy",
  quality_hold: "border-violet-400/35 bg-violet-500/[0.14] text-violet-50",
  neutral: "border-sf-stroke/50 bg-sf-panel2/80 text-sf-copy",
  signal: "border-sf-signal/40 bg-sf-signal/[0.12] text-sky-50"
};

const pulseTones = new Set<SfStatusBadgeTone>(["running", "alarm"]);

const defaultLabels: Partial<Record<SfOperationalState | "neutral" | "signal", string>> = {
  running: "RUNNING",
  idle: "IDLE",
  planned: "PLANNED",
  maintenance: "MAINT",
  alarm: "ALARM",
  offline: "OFFLINE",
  quality_hold: "HOLD",
  neutral: "STANDBY",
  signal: "SIGNAL"
};

export function SfStatusBadge({
  tone,
  children,
  className,
  Icon,
  pulse
}: {
  tone: SfStatusBadgeTone;
  children?: ReactNode;
  className?: string;
  Icon?: LucideIcon;
  /** LED-style pulse — defaults on for RUNNING / ALARM unless false. */
  pulse?: boolean;
}) {
  const showPulse = pulse !== false && (pulse === true || pulseTones.has(tone));
  const label = children ?? defaultLabels[tone as keyof typeof defaultLabels];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em]",
        toneClass[tone],
        className
      )}
    >
      <span className="relative flex h-2 w-2 shrink-0 items-center justify-center">
        <span className={cn("h-1.5 w-1.5 rounded-full bg-current opacity-95", showPulse ? "animate-pulse" : "")} />
        {showPulse ? (
          <motion.span
            aria-hidden
            className={cn(
              "absolute inline-flex h-2.5 w-2.5 rounded-full opacity-65",
              tone === "alarm" ? "bg-red-400/80" : "bg-emerald-400/80"
            )}
            animate={{ opacity: [0.55, 0, 0.55], scale: [0.92, 1.45, 0.92] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : null}
      </span>
      {Icon ? <Icon className="h-3.5 w-3.5 opacity-90" aria-hidden /> : null}
      <span className="leading-none">{label}</span>
    </span>
  );
}
