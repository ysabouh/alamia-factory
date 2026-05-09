"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

import { SFEyebrow, SFBody, SFTelemetry } from "./typography";

const halo: Record<string, string> = {
  neutral: "from-teal-400/40 via-transparent to-cyan-500/15",
  positive: "from-emerald-400/55 via-transparent to-teal-500/25",
  caution: "from-amber-400/50 via-transparent to-orange-600/18",
  critical: "from-red-500/55 via-transparent to-orange-900/35"
};

export interface SfKpiCardProps {
  label: string;
  value: string;
  subtitle?: string;
  delta?: { text: string; tone?: keyof typeof halo };
  Icon?: LucideIcon;
  badge?: ReactNode;
  footer?: ReactNode;
  accent?: keyof typeof halo;
  delay?: number;
}

export function SfKpiCard({
  label,
  value,
  subtitle,
  delta,
  Icon,
  badge,
  footer,
  accent = "neutral",
  delay = 0
}: SfKpiCardProps) {
  const dTone = delta
    ? delta.tone ??
      (delta.text.startsWith("-") ? "critical" : delta.text ? "positive" : "neutral")
    : "neutral";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 28, delay }}
      className="group relative"
    >
      <div className={cn("absolute inset-0 rounded-2xl bg-gradient-to-br opacity-90", halo[accent])} />

      <div
        className={cn(
          "relative rounded-2xl border border-sf-stroke/55 bg-gradient-to-b from-sf-chassis via-sf-panel to-sf-deep p-5 shadow-industrial",
          "before:pointer-events-none before:absolute before:inset-0 before:rounded-[0.92rem] before:bg-[linear-gradient(135deg,rgba(255,255,255,0.07),transparent_40%)]",
          "after:pointer-events-none after:absolute after:inset-x-6 after:top-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-cyan-400/35 after:to-transparent"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <SFEyebrow>{label}</SFEyebrow>

            <div className="flex flex-wrap items-baseline gap-2">
              <SFTelemetry className="text-[2rem] leading-none md:text-[2.35rem]">{value}</SFTelemetry>
              {delta ? (
                <SFBody
                  className={cn(
                    "text-xs font-semibold telemetry-text",
                    dTone === "critical" && "text-red-300",
                    dTone === "positive" && "text-emerald-300",
                    dTone === "caution" && "text-amber-200",
                    dTone === "neutral" && "text-sf-muted"
                  )}
                >
                  {delta.text}
                </SFBody>
              ) : null}
            </div>

            {subtitle ? <SFBody className="text-xs text-sf-muted">{subtitle}</SFBody> : null}
          </div>

          <div className="flex flex-col items-end gap-2">
            {badge}
            {Icon ? (
              <Icon className="h-8 w-8 text-cyan-200 transition-colors group-hover:text-sky-100" strokeWidth={1.35} />
            ) : null}
          </div>
        </div>

        {footer ? <div className="relative mt-4 border-t border-sf-hairline pt-3">{footer}</div> : null}
      </div>
    </motion.article>
  );
}
