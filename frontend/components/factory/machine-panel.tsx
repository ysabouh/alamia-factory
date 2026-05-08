import type React from "react";
import { AlertTriangle, Gauge, RadioTower, Thermometer, TimerReset, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatusBeacon } from "@/components/factory/status-beacon";
import type { MachineSnapshot } from "@/types/factory";

const typeLabels: Record<MachineSnapshot["type"], string> = {
  injection: "حقن",
  blow_molding: "نفخ",
  line: "خط إنتاج"
};

export function MachinePanel({ machine }: { machine: MachineSnapshot }) {
  const efficiency = Math.max(42, Math.min(98, Math.round(100 - machine.wasteKgToday * 2 - machine.downtimeMinutesToday / 3)));
  const pressure = machine.type === "injection" ? 142 : machine.type === "blow_molding" ? 8.4 : 62;
  const temperature = machine.type === "injection" ? 218 : machine.type === "blow_molding" ? 176 : 32;
  const statusTone = machine.status === "running" ? "cyan-glow" : machine.status === "down" ? "danger-glow" : "";

  return (
    <Card className={`scada-panel scanlines neon-border overflow-hidden rounded-3xl ${statusTone}`}>
      <div className="relative border-b border-white/10 bg-slate-950/70 p-4">
        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[10px] text-cyan-100">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 pulse-live" />
          LIVE
        </div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs tracking-[0.25em] text-cyan-200">{machine.code}</p>
            <h3 className="mt-1 text-xl font-semibold">{machine.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{typeLabels[machine.type]} | القالب: {machine.currentMold ?? "غير مركب"}</p>
          </div>
          <StatusBeacon status={machine.status} />
        </div>
      </div>

      <div className="relative grid gap-4 p-4">
        <div className="relative h-44 overflow-hidden rounded-2xl border border-cyan-400/20 bg-slate-950 cyan-glow">
          <div className="absolute inset-0 factory-grid opacity-60" />
          <div className="absolute left-5 top-5 flex gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500/80" />
            <span className="h-3 w-3 rounded-full bg-amber-400/80" />
            <span className={`h-3 w-3 rounded-full ${machine.status === "running" ? "bg-green-300 pulse-live" : "bg-slate-600"}`} />
          </div>

          <div className="machine-vibration absolute bottom-8 right-8 h-20 w-32 rounded-xl border border-cyan-400/35 bg-cyan-400/10">
            <div className="absolute inset-x-4 top-3 h-4 rounded-full border border-cyan-300/30 bg-cyan-200/10" />
            <div className="absolute bottom-3 right-4 h-8 w-8 rounded-full border border-cyan-300/40 bg-slate-950" />
            <div className="absolute bottom-3 left-4 h-8 w-8 rounded-full border border-cyan-300/40 bg-slate-950" />
          </div>

          <div className="absolute bottom-10 right-36 h-16 w-24 rounded-lg border border-slate-500 bg-slate-900">
            <div className="mx-auto mt-3 h-7 w-14 rounded border border-cyan-400/30 bg-cyan-400/10" />
          </div>

          <div className="absolute bottom-10 left-12 h-20 w-20 rounded-full border border-cyan-400/25 bg-cyan-400/10 cyan-glow">
            <div className="absolute inset-3 rounded-full border border-cyan-300/30" />
            <div className="machine-rotor absolute inset-3 rounded-full border border-cyan-300/20">
              <div className="absolute left-1/2 top-1/2 h-1 w-8 origin-right -translate-y-1/2 bg-cyan-200 shadow-glowCyan" />
            </div>
          </div>

          <div className="flow-line absolute bottom-6 left-8 right-8 h-2 rounded-full bg-slate-800" />

          <div className="absolute right-4 top-4">
            <Badge variant="secondary" className="border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
              {typeLabels[machine.type]}
            </Badge>
          </div>

          <div className="absolute bottom-4 right-4 left-4 flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs">
            <span className="text-muted-foreground">عداد الإنتاج</span>
            <span className="font-mono text-lg font-bold text-cyan-100">{machine.producedPiecesToday.toLocaleString("en-US")}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm xl:grid-cols-4">
          <Metric icon={<Gauge className="h-4 w-4" />} label="الكفاءة" value={`${efficiency}%`} />
          <Metric icon={<Thermometer className="h-4 w-4" />} label="حرارة" value={`${temperature}°C`} />
          <Metric icon={<Zap className="h-4 w-4" />} label="ضغط" value={`${pressure} bar`} />
          <Metric icon={<TimerReset className="h-4 w-4" />} label="توقف" value={`${machine.downtimeMinutesToday}د`} />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Sensor label="حرارة القالب" value={temperature} max={260} />
          <Sensor label="ضغط التشغيل" value={typeof pressure === "number" ? pressure : 50} max={160} />
          <Sensor label="استقرار الدورة" value={efficiency} max={100} />
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-muted-foreground">
          المشغل: <span className="text-foreground">{machine.operator ?? "غير محدد"}</span>
          <span className="mx-2">|</span>
          الفني: <span className="text-foreground">{machine.technician ?? "غير محدد"}</span>
          <span className="mx-2">|</span>
          <RadioTower className="inline h-4 w-4 text-cyan-200" /> إشارة مباشرة
        </div>

        {machine.activeAlert ? (
          <div className="danger-glow rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">
            <AlertTriangle className="ml-2 inline h-4 w-4" />
            {machine.activeAlert}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function Metric({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-2 font-mono text-lg font-semibold text-cyan-100">{value}</div>
    </div>
  );
}

function Sensor({ label, value, max }: { label: string; value: number; max: number }) {
  const percentage = Math.max(8, Math.min(100, Math.round((value / max) * 100)));

  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-cyan-100">{percentage}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
        <div className="sensor-bar h-full rounded-full" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
