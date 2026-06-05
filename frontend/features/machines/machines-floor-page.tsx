"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Boxes,
  Bolt,
  ChevronDown,
  ChevronUp,
  CirclePlus,
  Factory,
  Gauge,
  HardHat,
  Package,
  PlayCircle,
  ScanLine,
  Search,
  Siren,
  Thermometer,
  TriangleAlert,
  Wind,
  Wrench
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MiniFactoryFloorMap } from "@/features/machines/mini-factory-floor-map";
import type { LiveDashboard, MachineSnapshot } from "@/types/factory";

type HallTone = "injection" | "blow" | "packaging" | "maintenance";
type HallId = "inj-1" | "inj-2" | "blow" | "packaging" | "maintenance";
type Hall = { id: HallId; name: string; typeLabel: string; tone: HallTone; machines: MachineSnapshot[] };

const typeLabel: Record<string, string> = {
  injection: "حقن بلاستيك",
  blow: "نفخ",
  blow_molding: "نفخ",
  line: "خط إنتاج"
};

const hallStyles: Record<HallTone, string> = {
  injection: "border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-transparent to-slate-500/10",
  blow: "border-cyan-500/30 bg-gradient-to-br from-cyan-500/12 via-transparent to-teal-500/10",
  packaging: "border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-transparent to-slate-500/10",
  maintenance: "border-amber-500/30 bg-gradient-to-br from-amber-500/12 via-transparent to-zinc-500/10"
};

export function MachinesFloorPage({ dashboard }: { dashboard: LiveDashboard }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | MachineSnapshot["status"]>("all");
  const [hallFilter, setHallFilter] = useState<"all" | HallId>("all");
  const [expandedMachine, setExpandedMachine] = useState<number | null>(null);
  const [collapsedHalls, setCollapsedHalls] = useState<Record<HallId, boolean>>({
    "inj-1": false,
    "inj-2": false,
    blow: false,
    packaging: false,
    maintenance: false
  });

  const machines = dashboard.machines ?? [];
  const filtered = useMemo(() => {
    return machines.filter((m) => {
      const q = `${m.name} ${m.code} ${m.currentMold ?? ""}`.toLowerCase();
      return q.includes(query.toLowerCase()) && (statusFilter === "all" || m.status === statusFilter);
    });
  }, [machines, query, statusFilter]);

  const halls = useMemo<Hall[]>(() => {
    const injection = filtered.filter((m) => m.type === "injection");
    const lines = filtered.filter((m) => m.type === "line");
    const blow = filtered.filter((m) => m.type === "blow" || m.type === "blow_molding");
    return [
      { id: "inj-1", name: "Injection Hall 1", typeLabel: "حقن عالي الضغط", tone: "injection", machines: injection.filter((_, i) => i % 2 === 0).concat(lines.filter((_, i) => i % 2 === 0)) },
      { id: "inj-2", name: "Injection Hall 2", typeLabel: "خلايا قوالب دقيقة", tone: "injection", machines: injection.filter((_, i) => i % 2 !== 0).concat(lines.filter((_, i) => i % 2 !== 0)) },
      { id: "blow", name: "Blow Molding Hall", typeLabel: "خط نفخ العبوات", tone: "blow", machines: blow },
      { id: "packaging", name: "Packaging Hall", typeLabel: "التغليف واللوجستيات", tone: "packaging", machines: filtered.filter((_, i) => i % 3 === 0) },
      { id: "maintenance", name: "Mold Maintenance Hall", typeLabel: "صيانة القوالب", tone: "maintenance", machines: filtered.filter((m) => m.status === "maintenance" || !!m.activeAlert) }
    ];
  }, [filtered]);

  const visibleHalls = hallFilter === "all" ? halls : halls.filter((h) => h.id === hallFilter);
  const stats = useMemo(() => {
    const running = machines.filter((m) => m.status === "running").length;
    const totalOutput = machines.reduce((s, m) => s + m.producedPiecesToday, 0);
    const energy = Math.round(machines.reduce((s, m) => s + m.producedWeightKgToday * 1.7 + calcEfficiency(m), 0));
    const alerts = machines.filter((m) => m.activeAlert).length;
    return { running, totalOutput, energy, alerts, efficiency: avgEfficiency(machines) };
  }, [machines]);

  return (
    <div className="ds-page">
      <FactoryFlowOverview halls={halls} />

      <header className="erp-hero rounded-3xl border border-border p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.2em] text-muted-foreground">SMART FACTORY FLOOR OS</p>
            <h1 className="mt-2 text-2xl font-semibold md:text-3xl">منصة إدارة أرضية المصنع الذكية</h1>
          </div>
          <div className="inline-flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={"/ar/machines/registry" as Route}>سجل الماكينات</Link>
            </Button>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-700 dark:text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-live" />
              المصنع في وضع تشغيل نشط
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_170px_200px_170px]">
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pr-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث عن ماكينة، قالب، أو مشغل..." />
          </div>
          <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | MachineSnapshot["status"])}>
            <option value="all">كل الحالات</option>
            <option value="running">تشغيل</option>
            <option value="stopped">توقف</option>
            <option value="maintenance">صيانة</option>
            <option value="breakdown">عطل</option>
          </select>
          <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={hallFilter} onChange={(e) => setHallFilter(e.target.value as "all" | HallId)}>
            <option value="all">كل القاعات</option>
            <option value="inj-1">Injection Hall 1</option>
            <option value="inj-2">Injection Hall 2</option>
            <option value="blow">Blow Molding Hall</option>
            <option value="packaging">Packaging Hall</option>
            <option value="maintenance">Mold Maintenance Hall</option>
          </select>
          <Button variant="industrial" className="gap-2">
            <CirclePlus className="h-4 w-4" />
            إضافة ماكينة
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <TopStat title="حالة المصنع" value="تشغيلي" icon={<Factory className="h-4 w-4" />} tone="good" />
        <TopStat title="إجمالي القاعات" value={halls.length.toLocaleString("ar")} icon={<Boxes className="h-4 w-4" />} />
        <TopStat title="إجمالي الماكينات" value={machines.length.toLocaleString("ar")} icon={<Gauge className="h-4 w-4" />} />
        <TopStat title="إنتاج نشط" value={stats.running.toLocaleString("ar")} icon={<PlayCircle className="h-4 w-4" />} tone="good" />
        <TopStat title="الاستهلاك kWh" value={stats.energy.toLocaleString("ar")} icon={<Bolt className="h-4 w-4" />} />
        <TopStat title="تنبيهات نشطة" value={stats.alerts.toLocaleString("ar")} icon={<Siren className="h-4 w-4" />} tone="warn" />
      </section>

      <HallNavCards halls={halls} />

      <MiniFactoryFloorMap halls={halls} />

      <section className="space-y-6">
        {visibleHalls.map((hall) => (
          <HallSection
            key={hall.id}
            hall={hall}
            collapsed={collapsedHalls[hall.id]}
            onToggle={() => setCollapsedHalls((prev) => ({ ...prev, [hall.id]: !prev[hall.id] }))}
            expandedMachine={expandedMachine}
            setExpandedMachine={setExpandedMachine}
          />
        ))}
      </section>
    </div>
  );
}

function HallSection({
  hall,
  collapsed,
  onToggle,
  expandedMachine,
  setExpandedMachine
}: {
  hall: Hall;
  collapsed: boolean;
  onToggle: () => void;
  expandedMachine: number | null;
  setExpandedMachine: (value: number | null) => void;
}) {
  const running = hall.machines.filter((m) => m.status === "running").length;
  const health = Math.max(32, avgEfficiency(hall.machines) - hall.machines.filter((m) => m.status === "breakdown").length * 12);

  return (
    <section className={`rounded-3xl border p-4 md:p-5 ${hallStyles[hall.tone]}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.18em] text-muted-foreground">HALL ZONE</p>
          <h2 className="mt-1 text-xl font-semibold">{hall.name}</h2>
          <p className="text-sm text-muted-foreground">{hall.typeLabel}</p>
        </div>
        <Button variant="ghost" className="h-9 gap-1.5" onClick={onToggle}>
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          {collapsed ? "فتح القاعة" : "طي القاعة"}
        </Button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-5">
        <MiniStat label="الماكينات" value={hall.machines.length.toString()} />
        <MiniStat label="تشغيل" value={running.toString()} />
        <MiniStat label="الكفاءة" value={`${avgEfficiency(hall.machines)}%`} />
        <MiniStat label="الحرارة" value={`${avgTemperature(hall.machines)}°`} />
        <MiniStat label="الطاقة" value={`${Math.round(hall.machines.reduce((s, m) => s + m.producedWeightKgToday * 1.2, 0))}kWh`} />
      </div>

      <div className="mb-4 rounded-xl border border-border bg-background/60 p-3">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Hall Health Score</span>
          <span className="font-semibold">{health}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted">
          <motion.div className="h-2 rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${Math.max(10, health)}%` }} />
        </div>
      </div>

      {!collapsed ? (
        hall.machines.length > 0 ? (
          <div className={`grid gap-4 ${hall.tone === "packaging" ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
            {hall.machines.map((machine, index) => (
              <MachineCard
                key={`${hall.id}-${machine.id}`}
                machine={machine}
                index={index}
                expanded={expandedMachine === machine.id}
                onToggleExpand={() => setExpandedMachine(expandedMachine === machine.id ? null : machine.id)}
                tone={hall.tone}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-background/40 p-4 text-sm text-muted-foreground">لا توجد ماكينات في هذه القاعة حالياً.</div>
        )
      ) : null}
    </section>
  );
}

function MachineCard({
  machine,
  index,
  expanded,
  onToggleExpand,
  tone
}: {
  machine: MachineSnapshot;
  index: number;
  expanded: boolean;
  onToggleExpand: () => void;
  tone: HallTone;
}) {
  const router = useRouter();
  const temp = machineTemperature(machine);
  const pressure = machinePressure(machine);
  const outputPerHour = Math.max(45, Math.round(machine.producedPiecesToday / 9));
  const runtime = Math.max(2, Math.round((24 * 60 - machine.downtimeMinutesToday) / 60));
  const navigateToPassport = () => router.push(`/ar/machines/${machine.id}`);

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.25) }}
      className="erp-card cursor-pointer overflow-hidden rounded-2xl border"
      onClick={navigateToPassport}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigateToPassport();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Open machine passport for ${machine.name}`}
    >
      <div className="relative h-40 border-b border-border bg-gradient-to-br from-slate-200/50 via-transparent to-sky-500/10 p-4 dark:from-slate-900/75">
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{machine.code}</p>
            <h3 className="mt-1 text-lg font-semibold">{machine.name}</h3>
          </div>
          <MachineStatus status={machine.status} />
        </div>
        <div className={`absolute bottom-7 right-5 h-10 w-24 rounded-xl border ${tone === "blow" ? "border-cyan-300/40 bg-cyan-500/10" : tone === "packaging" ? "border-violet-300/40 bg-violet-500/10" : "border-blue-300/40 bg-blue-500/10"}`} />
        <div className="absolute bottom-7 left-6 h-12 w-12 rounded-full border border-emerald-400/50 bg-emerald-500/10 status-glow-ring" />
      </div>

      <div className="grid gap-3 p-4">
        <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          <Metric label="الحرارة" value={`${temp}°C`} icon={<Thermometer className="h-3.5 w-3.5" />} />
          <Metric label="الضغط" value={`${pressure} bar`} icon={<Gauge className="h-3.5 w-3.5" />} />
          <Metric label="إنتاج/ساعة" value={`${outputPerHour}`} icon={<Activity className="h-3.5 w-3.5" />} />
          <Metric label="استهلاك" value={`${Math.round(machine.producedWeightKgToday * 0.9)} كغ`} icon={<Bolt className="h-3.5 w-3.5" />} />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg border border-border bg-background/60 p-2">المشغل: {machine.operator ?? "غير محدد"}</div>
          <div className="rounded-lg border border-border bg-background/60 p-2">زمن التشغيل: {runtime} ساعة</div>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="outline" className="text-xs">تشغيل</Button>
          <Button size="sm" variant="outline" className="text-xs">إيقاف</Button>
          <Button size="sm" variant="outline" className="text-xs">صيانة</Button>
          <Button size="sm" variant="outline" className="text-xs">تحليل</Button>
        </div>

        <Button
          variant="ghost"
          className="h-8 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
        >
          {expanded ? "إخفاء التفاصيل" : "تفاصيل الماكينة"}
        </Button>

        <AnimatePresence>
          {expanded ? (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden rounded-lg border border-border bg-background/50 p-2.5 text-xs">
              <p>النوع: {typeLabel[machine.type]}</p>
              <p className="mt-1">القالب: {machine.currentMold ?? "غير مركب"}</p>
              <p className="mt-1">الفني: {machine.technician ?? "غير محدد"}</p>
              <p className="mt-1">الصيانة: {machine.status === "maintenance" ? "جارية" : "طبيعية"}</p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {machine.activeAlert ? (
          <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-xs text-rose-700 dark:text-rose-300">
            <TriangleAlert className="h-3.5 w-3.5" />
            {machine.activeAlert}
          </div>
        ) : null}
      </div>
    </motion.article>
  );
}

function HallNavCards({ halls }: { halls: Hall[] }) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {halls.map((hall) => (
        <Card key={hall.id} className="erp-card rounded-2xl">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{hall.name}</p>
            <p className="mt-1 text-sm font-semibold">{hall.typeLabel}</p>
            <p className="mt-2 text-xs text-muted-foreground">ماكينات: {hall.machines.length.toLocaleString("ar")}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

function FactoryFlowOverview({ halls }: { halls: Hall[] }) {
  const inj = halls.filter((h) => h.id === "inj-1" || h.id === "inj-2").flatMap((h) => h.machines).length;
  const blow = halls.find((h) => h.id === "blow")?.machines.length ?? 0;
  const packaging = halls.find((h) => h.id === "packaging")?.machines.length ?? 0;
  const maintenance = halls.find((h) => h.id === "maintenance")?.machines.length ?? 0;

  return (
    <section className="rounded-3xl border border-border bg-card p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs tracking-[0.2em] text-muted-foreground">FACTORY FLOW OVERVIEW</p>
          <h2 className="mt-1 text-lg font-semibold">خريطة تدفق الإنتاج بين القاعات</h2>
        </div>
        <Badge variant="info">Live</Badge>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] md:items-center">
        <FlowNode title="Injection" value={inj} tone="blue" />
        <ScanLine className="mx-auto h-5 w-5 text-muted-foreground" />
        <FlowNode title="Blow" value={blow} tone="cyan" />
        <ScanLine className="mx-auto h-5 w-5 text-muted-foreground" />
        <FlowNode title="Packaging" value={packaging} tone="violet" />
        <ScanLine className="mx-auto h-5 w-5 text-muted-foreground" />
        <FlowNode title="Maintenance" value={maintenance} tone="amber" />
      </div>
    </section>
  );
}

function TopStat({ title, value, icon, tone = "default" }: { title: string; value: string; icon: React.ReactNode; tone?: "default" | "good" | "warn" }) {
  return (
    <Card className="erp-card rounded-2xl">
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="mt-1.5 text-2xl font-semibold">{value}</p>
        </div>
        <div className={`rounded-xl p-3 ${tone === "good" ? "bg-emerald-500/10 text-emerald-500" : tone === "warn" ? "bg-amber-500/10 text-amber-500" : "bg-sky-500/10 text-sky-500"}`}>{icon}</div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/70 px-3 py-2 text-center">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-2.5">
      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">{icon}{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function MachineStatus({ status }: { status: MachineSnapshot["status"] | string }) {
  if (status === "running") return <Badge variant="success">تشغيل</Badge>;
  if (status === "maintenance") return <Badge variant="warning">صيانة</Badge>;
  if (status === "breakdown") return <Badge variant="destructive">عطل</Badge>;
  return <Badge variant="secondary">متوقفة</Badge>;
}

function FlowNode({ title, value, tone }: { title: string; value: number; tone: "blue" | "cyan" | "violet" | "amber" }) {
  const cls = tone === "blue" ? "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300" : tone === "cyan" ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300" : tone === "violet" ? "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300" : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  return (
    <div className={`rounded-2xl border p-3 ${cls}`}>
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs">{value.toLocaleString("ar")} وحدة</p>
    </div>
  );
}

function calcEfficiency(machine: MachineSnapshot) {
  return Math.max(42, Math.min(98, Math.round(100 - machine.wasteKgToday * 1.8 - machine.downtimeMinutesToday / 4)));
}
function avgEfficiency(machines: MachineSnapshot[]) {
  return Math.round(machines.reduce((sum, m) => sum + calcEfficiency(m), 0) / Math.max(1, machines.length));
}
function avgTemperature(machines: MachineSnapshot[]) {
  return Math.round(machines.reduce((sum, m) => sum + machineTemperature(m), 0) / Math.max(1, machines.length));
}
function machineTemperature(machine: MachineSnapshot) {
  if (machine.type === "injection") return 214;
  if (machine.type === "blow_molding") return 178;
  return 42;
}
function machinePressure(machine: MachineSnapshot) {
  if (machine.type === "injection") return 145;
  if (machine.type === "blow_molding") return 11;
  return 75;
}
