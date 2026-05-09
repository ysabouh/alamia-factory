"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Bell, CheckCircle2, Info, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const variantConfig = {
  info: {
    icon: Info,
    border: "border-sf-accentCool/35",
    bar: "from-sf-accentCool/90 to-transparent",
    bg: "from-slate-900/10 to-transparent",
    heading: "text-sf-ink"
  },
  success: {
    icon: CheckCircle2,
    border: "border-sf-ok/35",
    bar: "from-sf-ok to-transparent",
    bg: "from-emerald-500/[0.06] to-transparent",
    heading: "text-emerald-100"
  },
  caution: {
    icon: AlertTriangle,
    border: "border-sf-caution/40",
    bar: "from-sf-caution to-transparent",
    bg: "from-amber-500/[0.08] to-transparent",
    heading: "text-amber-100"
  },
  alarm: {
    icon: Bell,
    border: "border-sf-alarm/45",
    bar: "from-sf-alarm to-transparent",
    bg: "from-red-600/[0.12] to-transparent",
    heading: "text-red-100"
  }
} as const;

export type SfAlertVariant = keyof typeof variantConfig;

export function SfAlert({
  variant,
  title,
  children,
  onDismiss,
  className,
  icon: IconOverride
}: {
  variant: SfAlertVariant;
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
  icon?: typeof Info;
}) {
  const cfg = variantConfig[variant];
  const Icon = IconOverride ?? cfg.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
      role={variant === "alarm" ? "alert" : "status"}
      className={cn(
        "relative overflow-hidden rounded-xl border bg-gradient-to-br from-sf-chassis via-sf-panel to-sf-deep shadow-industrial",
        cfg.border,
        className
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute start-0 top-0 bottom-0 w-[3px] bg-gradient-to-b",
          cfg.bar
        )}
        aria-hidden
      />

      <div className={cn("relative bg-gradient-to-r px-4 py-3 ps-6", cfg.bg)}>
        <div className="flex gap-3">
          <Icon
            className={cn(
              "mt-0.5 h-5 w-5 shrink-0 opacity-95",
              variant === "info" && "text-sf-accentCool",
              variant === "success" && "text-sf-ok",
              variant === "caution" && "text-sf-caution",
              variant === "alarm" && "text-sf-alarm"
            )}
          />

          <div className="min-w-0 flex-1 space-y-1 text-sm leading-relaxed text-sf-copy">
            {title ? (
              <p className={cn("font-industrial font-semibold tracking-tight", cfg.heading)}>{title}</p>
            ) : null}
            <div>{children}</div>
          </div>

          {onDismiss ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="-me-2 h-8 w-8 shrink-0 rounded-full text-sf-muted hover:bg-white/[0.07] hover:text-sf-copy"
              aria-label="Dismiss alert"
              onClick={onDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

/** Fixed stack for transient operational messages (MES / SCADA alarms). */
export function SfAlertRail({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed bottom-6 end-6 z-[180] flex w-[min(100vw-1.75rem,22rem)] flex-col gap-2 [&_*]:pointer-events-auto",
        className
      )}
    >
      <AnimatePresence>{children}</AnimatePresence>
    </div>
  );
}
