"use client";

import type React from "react";
import { motion } from "framer-motion";
import { Activity, Gauge, Thermometer, TimerReset, Zap } from "lucide-react";

import { StatusBeacon } from "@/components/factory/status-beacon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LiveDashboard, MachineSnapshot } from "@/types/factory";

const cardFade = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
};

const machineTypeArabic: Record<MachineSnapshot["type"], string> = {
  injection: "آلة حقن",
  blow: "آلة نفخ",
  blow_molding: "آلة نفخ",
  line: "خط إنتاج"
};

export function OverviewKpis({ dashboard }: { dashboard: LiveDashboard }) {
  const items = [
    {
      label: "إنتاج اليوم",
      value: dashboard.kpis.producedPiecesToday.toLocaleString("ar"),
      unit: "قطعة",
      tone: "sky",
      progress: Math.max(16, Math.min(100, Math.round(dashboard.kpis.producedPiecesToday / 120)))
    },
    {
      label: "الوزن المنتج",
      value: dashboard.kpis.producedWeightKgToday.toLocaleString("ar"),
      unit: "كغ",
      tone: "violet",
      progress: Math.max(14, Math.min(100, Math.round(dashboard.kpis.producedWeightKgToday / 22)))
    },
    {
      label: "معدل الكفاءة",
      value: dashboard.kpis.machineUtilization.toLocaleString("ar"),
      unit: "%",
      tone: "emerald",
      progress: Math.max(10, Math.min(100, dashboard.kpis.machineUtilization))
    },
    {
      label: "نسبة الهدر",
      value: dashboard.kpis.wasteRate.toLocaleString("ar"),
      unit: "%",
      tone: "orange",
      progress: Math.max(8, Math.min(100, dashboard.kpis.wasteRate))
    }
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => (
        <motion.div
          key={item.label}
          variants={cardFade}
          initial="hidden"
          animate="visible"
          transition={{ delay: index * 0.05, duration: 0.35 }}
        >
          <Card className="erp-card h-full rounded-2xl overflow-hidden">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <div className="mt-3 flex items-end gap-1.5">
                <p className="text-3xl font-semibold tracking-tight">{item.value}</p>
                <span className="pb-1 text-xs text-muted-foreground">{item.unit}</span>
              </div>
              <div className="mt-4 h-2 rounded-full bg-muted">
                <div
                  className={cn(
                    "h-2 rounded-full",
                    item.tone === "sky" && "bg-sky-500",
                    item.tone === "violet" && "bg-violet-500",
                    item.tone === "emerald" && "bg-emerald-500",
                    item.tone === "orange" && "bg-orange-500"
                  )}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </section>
  );
}

export function MachineStatusCards({ machines }: { machines: MachineSnapshot[] }) {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      {machines.map((machine, index) => {
        const efficiency = Math.max(40, Math.min(97, Math.round(100 - machine.wasteKgToday * 1.8 - machine.downtimeMinutesToday / 4)));
        const speed = Math.max(22, Math.round(machine.producedPiecesToday / 12));
        const temp = machine.type === "injection" ? 208 : machine.type === "blow_molding" ? 175 : 38;

        return (
          <motion.article
            key={machine.id}
            variants={cardFade}
            initial="hidden"
            animate="visible"
            transition={{ delay: Math.min(index * 0.06, 0.4), duration: 0.35 }}
          >
            <Card className="erp-card overflow-hidden rounded-3xl">
              <div className="relative h-48 border-b border-border bg-gradient-to-br from-slate-200/40 via-transparent to-sky-500/10 p-4 dark:from-slate-900/80">
                <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:24px_24px]" />
                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{machine.code}</p>
                    <h3 className="mt-1 text-xl font-semibold">{machine.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{machineTypeArabic[machine.type]}</p>
                  </div>
                  <StatusBeacon status={machine.status} />
                </div>
                <div className="absolute bottom-8 right-6 h-12 w-24 rounded-xl border border-sky-300/40 bg-sky-500/10 dark:border-sky-300/20" />
                <div className="absolute bottom-6 right-32 h-16 w-28 rounded-[1.25rem] border border-slate-400/40 bg-slate-100/30 dark:border-slate-600/60 dark:bg-slate-800/40" />
                <div
                  className={cn(
                    "status-glow-ring absolute bottom-5 left-5 h-16 w-16 rounded-full border-2",
                    machine.status === "running"
                      ? "border-emerald-400/60 bg-emerald-400/10"
                      : machine.status === "maintenance"
                        ? "border-amber-400/60 bg-amber-400/10"
                        : "border-rose-400/60 bg-rose-400/10"
                  )}
                />
                <div className="absolute bottom-6 right-4 rounded-xl border border-border bg-background/70 px-3 py-1.5 text-xs backdrop-blur">
                  القالب: {machine.currentMold ?? "غير محدد"}
                </div>
              </div>

              <CardContent className="grid gap-3 p-4">
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                  <MiniStat icon={<Activity className="h-4 w-4" />} label="السرعة" value={`${speed} قطعة/س`} />
                  <MiniStat icon={<Thermometer className="h-4 w-4" />} label="الحرارة" value={`${temp}°C`} />
                  <MiniStat icon={<Zap className="h-4 w-4" />} label="الكفاءة" value={`${efficiency}%`} />
                  <MiniStat icon={<TimerReset className="h-4 w-4" />} label="التوقف" value={`${machine.downtimeMinutesToday} د`} />
                </div>
                <div className="rounded-xl border border-border bg-background/60 p-3">
                  <p className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Gauge className="h-4 w-4" />
                    استقرار التشغيل
                  </p>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-2 rounded-full",
                        machine.status === "running" ? "bg-emerald-500" : machine.status === "maintenance" ? "bg-amber-500" : "bg-rose-500"
                      )}
                      style={{ width: `${Math.max(10, Math.min(100, efficiency))}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.article>
        );
      })}
    </section>
  );
}

function MiniStat({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3">
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-2 text-sm font-medium">{value}</p>
    </div>
  );
}

export function SectionCard({
  title,
  children,
  className
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("erp-card rounded-3xl", className)}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
