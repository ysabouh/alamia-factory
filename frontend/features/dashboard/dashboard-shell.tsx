"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, ClipboardList, ShieldAlert, Sparkles, Wrench } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { MachineStatusCards, OverviewKpis, SectionCard } from "@/components/factory/dashboard-components";
import { useLiveDashboardEvents } from "@/lib/realtime/use-live-dashboard-events";
import type { LiveDashboard } from "@/types/factory";

export function DashboardShell({ dashboard }: { dashboard: LiveDashboard }) {
  const router = useRouter();
  const refreshDashboard = useCallback(() => router.refresh(), [router]);
  useLiveDashboardEvents(refreshDashboard);
  const runningCount = dashboard.machines.filter((m) => m.status === "running").length;
  const downCount = dashboard.machines.filter((m) => m.status === "down").length;
  const maintenanceCount = dashboard.machines.filter((m) => m.status === "maintenance").length;

  return (
    <div className="space-y-6 pb-6">
      <header className="erp-hero relative overflow-hidden rounded-3xl border border-border p-6 md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(14,165,233,0.22),transparent_45%)]" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="flex items-center gap-2 text-xs tracking-[0.2em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              FACTORY CONTROL SUITE
            </p>
            <h1 className="mt-3 text-3xl font-semibold md:text-4xl">لوحة القيادة التنفيذية للمصنع</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
              منصة متابعة الإنتاج اللحظي، أداء الماكينات، أوامر التشغيل، وتنبيهات الصيانة.
            </p>
          </div>
          <div className="grid min-w-64 grid-cols-2 gap-3">
            <HeroPill label="ماكينات تعمل" value={runningCount.toString()} tone="good" />
            <HeroPill label="أعطال نشطة" value={downCount.toString()} tone="bad" />
            <HeroPill label="قيد الصيانة" value={maintenanceCount.toString()} tone="warn" />
            <HeroPill label="معدل الجاهزية" value={`${Math.max(0, Math.round((runningCount / Math.max(1, dashboard.machines.length)) * 100))}%`} tone="primary" />
          </div>
        </div>
      </header>

      <OverviewKpis dashboard={dashboard} />

      <section className="grid gap-6 2xl:grid-cols-[1fr_390px]">
        <MachineStatusCards machines={dashboard.machines} />

        <div className="space-y-6">
          <SectionCard title="إحصائيات الإنتاج الحي">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboard.productionTrend}>
                  <CartesianGrid stroke="rgba(148,163,184,0.22)" vertical={false} />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                  <Line type="monotone" dataKey="produced" stroke="#0ea5e9" strokeWidth={2.6} dot={false} />
                  <Line type="monotone" dataKey="waste" stroke="#f97316" strokeWidth={2.2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="تنبيهات الصيانة">
            <div className="space-y-3">
              {dashboard.alerts.slice(0, 4).map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3"
                >
                  <p className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-200">
                    <Wrench className="h-4 w-4" />
                    {alert.message}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{alert.createdAt}</p>
                </motion.div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="مؤشرات غرفة التحكم">
            <div className="space-y-3">
              <OpsSignal label="سلامة التشغيل" value={downCount === 0 ? "مستقر" : "مخاطر مرتفعة"} tone={downCount === 0 ? "good" : "bad"} />
              <OpsSignal label="طاقة الصالة" value={`${dashboard.kpis.machineUtilization}%`} tone="primary" />
              <OpsSignal label="تذاكر الصيانة" value={dashboard.kpis.openMaintenanceTickets.toString()} tone="warn" />
              <OpsSignal label="مواد منخفضة" value={dashboard.kpis.lowStockItems.toString()} tone={dashboard.kpis.lowStockItems > 2 ? "bad" : "good"} />
            </div>
          </SectionCard>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="إجمالي الإنتاج مقابل الخسائر">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboard.productionTrend}>
                <CartesianGrid stroke="rgba(148,163,184,0.22)" vertical={false} />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                <Bar dataKey="produced" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                <Bar dataKey="waste" fill="#fb923c" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="أحدث أوامر الإنتاج">
          <div className="space-y-3">
            {dashboard.machines.slice(0, 5).map((machine) => (
              <div key={machine.id} className="flex items-center justify-between rounded-xl border border-border bg-background/60 px-4 py-3">
                <div className="flex items-center gap-3">
                  <ClipboardList className="h-4 w-4 text-sky-500" />
                  <div>
                    <p className="text-sm font-medium">{machine.name}</p>
                    <p className="text-xs text-muted-foreground">
                      أمر #{String(2000 + machine.id).padStart(4, "0")} - {machine.code}
                    </p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">{machine.producedPiecesToday.toLocaleString("ar")} قطعة</p>
                  <p className="text-xs text-muted-foreground">المشغل: {machine.operator ?? "غير متاح"}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <SectionCard title="تنبيهات حرجة">
        <div className="grid gap-3 md:grid-cols-2">
          {dashboard.alerts.map((alert) => (
            <div key={alert.id} className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm">
              <p className="flex items-center gap-2 font-medium text-red-700 dark:text-red-200">
                <AlertTriangle className="h-4 w-4" />
                {alert.message}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{alert.createdAt}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function HeroPill({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "primary" | "good" | "warn" | "bad";
}) {
  return (
    <div
      className={`rounded-xl border p-3 shadow-sm ${
        tone === "good"
          ? "border-emerald-500/30 bg-emerald-500/10"
          : tone === "bad"
            ? "border-rose-500/30 bg-rose-500/10"
            : tone === "warn"
              ? "border-amber-500/30 bg-amber-500/10"
              : "border-sky-500/30 bg-sky-500/10"
      }`}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function OpsSignal({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "primary" | "good" | "warn" | "bad";
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-background/60 px-4 py-3">
      <div className="flex items-center gap-2 text-sm">
        {tone === "bad" ? <ShieldAlert className="h-4 w-4 text-rose-500" /> : <Wrench className="h-4 w-4 text-sky-500" />}
        <span>{label}</span>
      </div>
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
          tone === "good"
            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
            : tone === "bad"
              ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
              : tone === "warn"
                ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                : "bg-sky-500/15 text-sky-700 dark:text-sky-300"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
