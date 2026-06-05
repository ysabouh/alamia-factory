"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bolt,
  Calendar,
  Cpu,
  Factory,
  Gauge,
  Layers,
  MapPin,
  Pencil,
  RefreshCw,
  Siren,
  Wind,
  Wrench,
  Zap
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBeacon } from "@/components/factory/status-beacon";
import { getMachineStateVisual } from "@/components/factory/machine-state";
import { useFactoryAuth } from "@/contexts/factory-auth-context";
import { MachineCountersPanel } from "@/features/machines/management/machine-counters-panel";
import { MachineFailuresPanel } from "@/features/machines/management/machine-failures-panel";
import { MachineMaintenancePanel } from "@/features/machines/management/machine-maintenance-panel";
import { formatSpecEntries } from "@/features/machines/management/machine-spec-labels";
import { machineStatusLabels } from "@/features/machines/management/machine-status-ui";
import {
  machinesApi,
  MachinesApiError,
  type MachineDetailJson,
  type MaintenanceTicketJson
} from "@/lib/api/machines-client";
import { cn } from "@/lib/utils";

type TabId = "overview" | "specs" | "counters" | "failures" | "maintenance";

const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "overview", label: "نظرة عامة", icon: Gauge },
  { id: "specs", label: "المواصفات", icon: Cpu },
  { id: "counters", label: "العدادات", icon: BarChart3 },
  { id: "failures", label: "الأعطال", icon: Siren },
  { id: "maintenance", label: "الصيانة", icon: Wrench }
];

const ticketStatusLabels: Record<string, string> = {
  open: "مفتوح",
  in_progress: "قيد المعالجة",
  resolved: "مغلق"
};

function typeTone(type: string | null): string {
  const burgundy = "via-[#5c1a2e] to-[#2a0810]";
  if (type === "injection") return `from-rose-900 ${burgundy}`;
  if (type === "blow" || type === "blow_molding") return `from-[#6b2235] ${burgundy}`;
  return `from-rose-950 ${burgundy}`;
}

function TypeIcon({ type, className }: { type: string | null; className?: string }) {
  if (type === "injection") return <Bolt className={className} />;
  if (type === "blow" || type === "blow_molding") return <Wind className={className} />;
  return <Factory className={className} />;
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default"
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  const toneClass =
    tone === "good"
      ? "border-emerald-500/25 bg-emerald-500/5"
      : tone === "warn"
        ? "border-amber-500/25 bg-amber-500/5"
        : tone === "bad"
          ? "border-red-500/25 bg-red-500/5"
          : "border-border/60 bg-card/30";

  return (
    <div className={cn("rounded-xl border p-4", toneClass)}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground/70" />
      </div>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
      {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/40 py-2.5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-end">{value}</span>
    </div>
  );
}

function TicketRow({ ticket }: { ticket: MaintenanceTicketJson }) {
  const isBreakdown = ticket.ticketKind === "breakdown";
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border/50 bg-background/40 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{ticket.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {ticket.failureDate ?? ticket.createdAt?.slice(0, 10) ?? "—"}
          {isBreakdown ? " · عطل" : " · صيانة"}
        </p>
      </div>
      <Badge variant={ticket.status === "resolved" ? "secondary" : isBreakdown ? "destructive" : "warning"}>
        {ticketStatusLabels[ticket.status] ?? ticket.status}
      </Badge>
    </div>
  );
}

function SpecPanel({ machine }: { machine: MachineDetailJson }) {
  const entries = formatSpecEntries(machine.type, machine.spec);
  if (entries.length === 0) {
    return (
      <Card className="border-border/60 bg-card/20">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          لا مواصفات فنية مسجّلة لهذا النوع.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map((e) => (
        <Card key={e.label} className="border-border/50 bg-card/25">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">{e.label}</p>
            <p className="mt-1 font-mono text-lg font-semibold">{e.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-36 rounded-2xl bg-gradient-to-br from-rose-900/40 via-[#5c1a2e]/30 to-[#2a0810]/20" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted/20" />
        ))}
      </div>
      <div className="h-10 w-full max-w-xl rounded-lg bg-muted/20" />
      <div className="h-48 rounded-xl bg-muted/15" />
    </div>
  );
}

export function MachineDetailWorkspace({ machineId }: { machineId: string }) {
  const { can } = useFactoryAuth();
  const canManage = can("machines.manage");
  const [tab, setTab] = useState<TabId>("overview");

  const [machine, setMachine] = useState<MachineDetailJson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await machinesApi.show(machineId);
      setMachine(res.data);
    } catch (e) {
      setError(e instanceof MachinesApiError ? e.message : "تعذر تحميل الماكينة");
      setMachine(null);
    } finally {
      setLoading(false);
    }
  }, [machineId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingSkeleton />;

  if (error || !machine) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <p className="text-destructive">{error ?? "الماكينة غير موجودة"}</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void load()}>
              <RefreshCw className="ms-2 h-4 w-4" />
              إعادة المحاولة
            </Button>
            <Button variant="secondary" asChild>
              <Link href={"/ar/machines/registry" as Route}>العودة للسجل</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const visual = getMachineStateVisual(machine.status);
  const openFailures = machine.recentTickets.filter(
    (t) => t.ticketKind === "breakdown" && t.status !== "resolved"
  ).length;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-rose-300/20 bg-gradient-to-br p-6 shadow-lg shadow-rose-950/30",
          typeTone(machine.type)
        )}
      >
        <div
          className="pointer-events-none absolute -start-16 -top-16 h-48 w-48 rounded-full bg-rose-400/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 -end-10 h-56 w-56 rounded-full bg-[#8b2942]/20 blur-3xl"
          aria-hidden
        />

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-rose-200/25 bg-rose-950/35 backdrop-blur-sm">
              <TypeIcon type={machine.type} className="h-7 w-7 text-rose-100" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-rose-200/60">جواز الماكينة</p>
              <h1 className="font-mono text-2xl font-bold text-rose-50 md:text-3xl">
                {machine.code}
                <span className="mx-2 font-normal text-rose-200/40">|</span>
                <span className="font-sans text-xl text-rose-50/95 md:text-2xl">{machine.name}</span>
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-rose-100/75">
                <span>{machine.typeName ?? machine.type ?? "—"}</span>
                {machine.factorySection && (
                  <>
                    <span className="text-rose-200/35">·</span>
                    <MapPin className="inline h-3.5 w-3.5" />
                    {machine.factorySection}
                  </>
                )}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBeacon status={machine.status} />
                {!machine.isActive && (
                  <Badge variant="secondary" className="border-rose-200/20 bg-rose-950/40 text-rose-100">
                    معطّلة
                  </Badge>
                )}
                {openFailures > 0 && (
                  <Badge variant="destructive">{openFailures} عطل نشط</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-rose-200/30 bg-rose-950/30 text-rose-50 hover:bg-rose-900/50 hover:text-white"
              asChild
            >
              <Link href={"/ar/machines/registry" as Route}>السجل</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-rose-200/30 bg-rose-950/30 text-rose-50 hover:bg-rose-900/50 hover:text-white"
              asChild
            >
              <Link href={"/ar/machines" as Route}>الأرضية</Link>
            </Button>
            {canManage && (
              <Button
                size="sm"
                className="border border-rose-200/20 bg-rose-100/95 text-rose-950 hover:bg-white"
                asChild
              >
                <Link href={`/ar/machines/${machineId}/edit` as Route}>
                  <Pencil className="ms-2 h-4 w-4" />
                  تعديل
                </Link>
              </Button>
            )}
          </div>
        </div>

        {machine.statusNote && (
          <p className="relative z-10 mt-4 rounded-lg border border-amber-200/20 bg-rose-950/40 px-3 py-2 text-sm text-amber-100/90 backdrop-blur-sm">
            {machine.statusNote}
          </p>
        )}

        <p className="relative z-10 mt-3 max-w-2xl text-xs text-rose-200/55">{visual.description}</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="إنتاج اليوم"
          value={machine.todayProducedUnits.toLocaleString("ar")}
          sub="وحدة"
          icon={Activity}
          tone={machine.todayProducedUnits > 0 ? "good" : "default"}
        />
        <KpiCard
          label="القدرة الكهربائية"
          value={machine.powerKw != null ? `${machine.powerKw} kW` : "—"}
          sub={
            machine.hourlyEnergyConsumption != null
              ? `${machine.hourlyEnergyConsumption} kWh/h`
              : undefined
          }
          icon={Zap}
        />
        <KpiCard
          label="أعطال مفتوحة"
          value={String(machine.openBreakdownCount)}
          icon={Siren}
          tone={machine.openBreakdownCount > 0 ? "bad" : "good"}
        />
        <KpiCard
          label="الحالة التشغيلية"
          value={machineStatusLabels[machine.status]}
          sub={
            machine.lastStatusChangedAt
              ? `آخر تغيير: ${new Date(machine.lastStatusChangedAt).toLocaleDateString("ar")}`
              : undefined
          }
          icon={Gauge}
          tone={
            machine.status === "running"
              ? "good"
              : machine.status === "breakdown"
                ? "bad"
                : machine.status === "maintenance"
                  ? "warn"
                  : "default"
          }
        />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-border/60 bg-card/20 p-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          const badge =
            t.id === "failures" && machine.openBreakdownCount > 0 ? machine.openBreakdownCount : null;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/15 font-medium text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              {badge != null && (
                <span className="rounded-full bg-destructive/90 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-border/60 bg-card/25">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="h-4 w-4 text-cyan-400" />
                الهوية والموقع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label="العلامة" value={machine.brand ?? "—"} />
              <InfoRow label="الموديل" value={machine.model ?? "—"} />
              <InfoRow label="الرقم التسلسلي" value={machine.serialNumber ?? "—"} />
              <InfoRow label="خط الإنتاج" value={machine.productionLine ?? "—"} />
              <InfoRow label="قسم المصنع" value={machine.factorySection ?? "—"} />
              <InfoRow
                label="تاريخ التركيب"
                value={
                  machine.installationDate
                    ? new Date(machine.installationDate).toLocaleDateString("ar")
                    : "—"
                }
              />
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/25">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Factory className="h-4 w-4 text-emerald-400" />
                التشغيل الحالي
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {machine.activeAssignment?.mold ? (
                <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5">
                  <p className="text-xs text-emerald-300/80">القالب النشط</p>
                  <p className="font-medium">{machine.activeAssignment.mold}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">لا يوجد قالب مُعيَّن حالياً.</p>
              )}

              {machine.notes && (
                <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5">
                  <p className="text-xs text-muted-foreground">ملاحظات</p>
                  <p className="mt-1 text-sm">{machine.notes}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => setTab("counters")}>
                  <BarChart3 className="ms-2 h-4 w-4" />
                  العدادات
                </Button>
                {machine.openBreakdownCount > 0 && (
                  <Button variant="destructive" size="sm" onClick={() => setTab("failures")}>
                    <Siren className="ms-2 h-4 w-4" />
                    الأعطال ({machine.openBreakdownCount})
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {machine.recentTickets.length > 0 && (
            <Card className="border-border/60 bg-card/25 lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4 text-amber-400" />
                  آخر البلاغات
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setTab("failures")}>
                  عرض الكل
                  <ArrowRight className="ms-1 h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {machine.recentTickets.map((t) => (
                  <TicketRow key={t.id} ticket={t} />
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {tab === "specs" && <SpecPanel machine={machine} />}
      {tab === "counters" && <MachineCountersPanel machineId={machineId} />}
      {tab === "failures" && <MachineFailuresPanel machineId={machineId} />}
      {tab === "maintenance" && <MachineMaintenancePanel machineId={machineId} />}
    </div>
  );
}
