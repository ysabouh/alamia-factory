import type React from "react";
import { AlertTriangle, Activity, RadioTower, ShieldAlert } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getMachineStateVisual, type IndustrialMachineState } from "@/components/factory/machine-state";

export type IndustrialTone = "cyan" | "green" | "amber" | "red" | "blue" | "neutral";

const toneClasses: Record<IndustrialTone, string> = {
  cyan: "border-cyan-400/20 bg-cyan-400/10 text-cyan-100",
  green: "border-green-400/20 bg-green-400/10 text-green-100",
  amber: "border-amber-400/20 bg-amber-400/10 text-amber-100",
  red: "border-red-500/25 bg-red-500/10 text-red-100",
  blue: "border-sky-400/20 bg-sky-400/10 text-sky-100",
  neutral: "border-white/10 bg-white/[0.03] text-slate-100"
};

export function IndustrialPanel({
  title,
  eyebrow,
  children,
  tone = "cyan",
  critical = false,
  className
}: {
  title?: string;
  eyebrow?: string;
  children: React.ReactNode;
  tone?: IndustrialTone;
  critical?: boolean;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "industrial-module scanlines hover-lift relative overflow-hidden rounded-command p-5",
        critical && "danger-glow border-red-500/25",
        !critical && tone === "cyan" && "cyan-glow",
        className
      )}
    >
      {(title || eyebrow) && (
        <header className="relative mb-5">
          {eyebrow ? <p className="telemetry-text text-[10px] tracking-[0.3em] text-cyan-200">{eyebrow}</p> : null}
          {title ? <h2 className="mt-2 text-xl font-bold">{title}</h2> : null}
        </header>
      )}
      <div className="relative">{children}</div>
    </section>
  );
}

export function RealtimeIndicator({
  label = "LIVE",
  active = true,
  tone = "cyan"
}: {
  label?: string;
  active?: boolean;
  tone?: IndustrialTone;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border px-2.5 py-1 telemetry-text text-[10px]", toneClasses[tone])}>
      <span className={cn("h-1.5 w-1.5 rounded-full", active ? "pulse-live bg-cyan-200" : "bg-slate-500")} />
      {label}
    </span>
  );
}

export function MachineStateBadge({ state }: { state: IndustrialMachineState }) {
  const visual = getMachineStateVisual(state);

  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium", visual.panelClass)}>
      <span className={cn("h-2.5 w-2.5 rounded-full", visual.lightClass, visual.animationClass)} />
      {visual.label}
    </span>
  );
}

export function IndustrialKpiCard({
  label,
  value,
  unit,
  tone = "cyan",
  trend
}: {
  label: string;
  value: string | number;
  unit?: string;
  tone?: IndustrialTone;
  trend?: string;
}) {
  return (
    <div className="industrial-module hover-lift rounded-module p-4">
      <p className="telemetry-text text-[10px] tracking-[0.2em] text-muted-foreground">{label}</p>
      <div className="mt-3 flex items-end gap-2">
        <p className={cn("telemetry-text text-3xl font-black", tone === "red" ? "text-red-100" : "text-cyan-100")}>{value}</p>
        {unit ? <span className="pb-1 text-xs text-muted-foreground">{unit}</span> : null}
      </div>
      {trend ? <p className="mt-2 text-xs text-muted-foreground">{trend}</p> : null}
    </div>
  );
}

export function SensorDisplay({
  label,
  value,
  max,
  unit,
  tone = "cyan"
}: {
  label: string;
  value: number;
  max: number;
  unit?: string;
  tone?: IndustrialTone;
}) {
  const percentage = Math.max(4, Math.min(100, Math.round((value / max) * 100)));

  return (
    <div className="rounded-control border border-white/10 bg-slate-950/70 p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="telemetry-text text-cyan-100">
          {value}
          {unit ?? ""}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className={cn(
            "h-full rounded-full",
            tone === "red" ? "bg-red-400" : tone === "amber" ? "bg-amber-400" : "sensor-bar"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function IndustrialAlertCard({
  title,
  message,
  severity = "red"
}: {
  title: string;
  message: string;
  severity?: "amber" | "red" | "blue";
}) {
  const Icon = severity === "red" ? ShieldAlert : AlertTriangle;

  return (
    <div className={cn("rounded-module border p-4", toneClasses[severity])}>
      <div className="flex items-center gap-3">
        <Icon className={cn("h-5 w-5", severity === "red" && "blink-alarm")} />
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="mt-2 text-sm opacity-85">{message}</p>
    </div>
  );
}

export function ControlPanel({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <IndustrialPanel title={title} eyebrow="CONTROL PANEL" className="grid gap-4">
      {children}
    </IndustrialPanel>
  );
}

export function IndustrialButton({ className, variant = "default", ...props }: ButtonProps) {
  return (
    <Button
      variant={variant}
      className={cn(
        "rounded-control border border-cyan-400/20 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20",
        className
      )}
      {...props}
    />
  );
}

export function ProductionWidget({
  title,
  value,
  subtitle
}: {
  title: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div className="rounded-module border border-cyan-400/15 bg-cyan-400/5 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{title}</p>
        <Activity className="h-4 w-4 text-cyan-200" />
      </div>
      <p className="telemetry-text mt-3 text-3xl font-black text-cyan-100">{value}</p>
      {subtitle ? <p className="mt-2 text-xs text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}

export function SignalStrip({ label, active = true }: { label: string; active?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-control border border-white/10 bg-white/[0.03] px-3 py-2 text-xs">
      <span className="flex items-center gap-2 text-muted-foreground">
        <RadioTower className="h-4 w-4 text-cyan-200" />
        {label}
      </span>
      <RealtimeIndicator label={active ? "ONLINE" : "OFFLINE"} active={active} tone={active ? "green" : "neutral"} />
    </div>
  );
}
