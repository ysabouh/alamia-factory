"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowRightLeft,
  BarChart3,
  Bolt,
  CirclePlus,
  Droplets,
  Factory,
  Gauge,
  PauseCircle,
  PlayCircle,
  ShieldCheck,
  Search,
  Thermometer,
  TriangleAlert,
  Wrench
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { LiveDashboard, MachineSnapshot } from "@/types/factory";

const typeLabel: Record<MachineSnapshot["type"], string> = {
  injection: "حقن بلاستيك",
  blow_molding: "نفخ",
  line: "خط إنتاج"
};

export function MachinesPage({ dashboard }: { dashboard: LiveDashboard }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | MachineSnapshot["status"]>("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  const machines = dashboard?.machines ?? [];

  const filteredMachines = useMemo(() => {
    return machines.filter((machine) => {
      const matchText = `${machine.name} ${machine.code} ${machine.currentMold ?? ""}`.toLowerCase();
      const queryMatch = matchText.includes(query.toLowerCase());
      const filterMatch = filter === "all" || machine.status === filter;
      return queryMatch && filterMatch;
    });
  }, [machines, query, filter]);

  const injectionMachines = useMemo(
    () => filteredMachines.filter((m) => m.type === "injection" || m.type === "line"),
    [filteredMachines]
  );
  const blowMachines = useMemo(() => filteredMachines.filter((m) => m.type === "blow_molding"), [filteredMachines]);

  const stats = useMemo(() => {
    const running = machines.filter((m) => m.status === "running").length;
    const idle = machines.filter((m) => m.status === "idle").length;
    const maintenance = machines.filter((m) => m.status === "maintenance").length;
    const totalOutput = machines.reduce((sum, m) => sum + m.producedPiecesToday, 0);
    const avgEfficiency = Math.round(
      machines.reduce((sum, m) => sum + calcEfficiency(m), 0) / Math.max(1, machines.length)
    );
    return { running, idle, maintenance, totalOutput, avgEfficiency };
  }, [machines]);

  if (!dashboard) return <MachinesLoadingSkeleton />;

  return (
    <div className="ds-page">
      <FactoryOverviewMap machines={machines} />

      <header className="erp-hero overflow-hidden rounded-3xl border border-border p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.2em] text-muted-foreground">SMART INJECTION CONTROL CENTER</p>
            <h1 className="mt-2 text-2xl font-semibold md:text-3xl">مركز التحكم الذكي للماكينات</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              مراقبة تشغيلية مباشرة للحقن، الحالة الحرارية، الضغط، كفاءة الإنتاج، وحركة الصيانة.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-700 dark:text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-live" />
            اتصال حي بغرفة التحكم
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_180px_170px]">
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pr-9"
              placeholder="ابحث باسم الماكينة، الكود، أو القالب..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value as "all" | MachineSnapshot["status"])}
          >
            <option value="all">كل الحالات</option>
            <option value="running">تشغيل</option>
            <option value="idle">توقف</option>
            <option value="maintenance">صيانة</option>
            <option value="down">عطل</option>
          </select>
          <Button variant="industrial" className="gap-2">
            <CirclePlus className="h-4 w-4" />
            إضافة ماكينة
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatCard title="إجمالي الماكينات" value={machines.length.toLocaleString("ar")} icon={<Gauge className="h-4 w-4" />} />
        <StatCard title="ماكينات تعمل" value={stats.running.toLocaleString("ar")} icon={<PlayCircle className="h-4 w-4" />} tone="good" />
        <StatCard title="ماكينات متوقفة" value={stats.idle.toLocaleString("ar")} icon={<PauseCircle className="h-4 w-4" />} tone="warn" />
        <StatCard title="صيانة" value={stats.maintenance.toLocaleString("ar")} icon={<Wrench className="h-4 w-4" />} tone="warn" />
        <StatCard title="كفاءة الإنتاج" value={`${stats.avgEfficiency}%`} icon={<Activity className="h-4 w-4" />} tone="good" />
        <StatCard title="إجمالي إنتاج اليوم" value={stats.totalOutput.toLocaleString("ar")} icon={<Bolt className="h-4 w-4" />} />
      </section>

      <section className="grid gap-6 2xl:grid-cols-[1fr_360px]">
        {filteredMachines.length > 0 ? (
          <div className="space-y-6">
            <DepartmentZone
              title="قسم الحقن"
              subtitle="تصنيع دقيق عالي الضغط مع مراقبة القوالب وزمن الدورة"
              icon={<Factory className="h-4 w-4" />}
              tone="injection"
              machines={injectionMachines}
              expanded={expanded}
              setExpanded={setExpanded}
            />

            <DepartmentZone
              title="قسم النفخ"
              subtitle="تدفق إنتاج العبوات مع مؤشرات ضغط الهواء ومناطق التسخين"
              icon={<Droplets className="h-4 w-4" />}
              tone="blow"
              machines={blowMachines}
              expanded={expanded}
              setExpanded={setExpanded}
            />
          </div>
        ) : (
          <EmptyMachinesState />
        )}

        <FactoryMiniMap machines={machines} />
      </section>
    </div>
  );
}

function DepartmentZone({
  title,
  subtitle,
  icon,
  tone,
  machines,
  expanded,
  setExpanded
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  tone: "injection" | "blow";
  machines: MachineSnapshot[];
  expanded: number | null;
  setExpanded: (id: number | null) => void;
}) {
  const running = machines.filter((m) => m.status === "running").length;
  const efficiency = Math.round(machines.reduce((sum, m) => sum + calcEfficiency(m), 0) / Math.max(1, machines.length));
  const output = machines.reduce((sum, m) => sum + m.producedPiecesToday, 0);
  const health = Math.max(35, Math.min(100, efficiency - (machines.filter((m) => m.status === "down").length * 12)));
  const toneClass =
    tone === "injection"
      ? "border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-transparent to-slate-500/10"
      : "border-cyan-500/30 bg-gradient-to-br from-cyan-500/12 via-transparent to-teal-500/10";

  return (
    <section className={`rounded-3xl border p-4 md:p-5 ${toneClass}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <span className={`rounded-md p-1.5 ${tone === "injection" ? "bg-blue-500/15 text-blue-500" : "bg-cyan-500/15 text-cyan-500"}`}>
              {icon}
            </span>
            DEPARTMENT ZONE
          </p>
          <h2 className="mt-2 text-xl font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <DeptMiniStat label="ماكينات" value={machines.length.toString()} />
          <DeptMiniStat label="نشطة" value={running.toString()} />
          <DeptMiniStat label="الإنتاج" value={output.toLocaleString("ar")} />
          <DeptMiniStat label="الكفاءة" value={`${efficiency}%`} />
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-border bg-background/60 p-3">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            مؤشر صحة القسم
          </span>
          <span className="font-semibold">{health}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted">
          <motion.div
            className={`h-2 rounded-full ${tone === "injection" ? "bg-blue-500" : "bg-cyan-500"}`}
            initial={{ width: 0 }}
            animate={{ width: `${health}%` }}
            transition={{ duration: 0.7 }}
          />
        </div>
      </div>

      {machines.length > 0 ? (
        <div className={`grid gap-4 ${tone === "injection" ? "lg:grid-cols-2" : "lg:grid-cols-2 xl:grid-cols-3"}`}>
          {machines.map((machine, idx) => (
            <MachineControlCard
              key={machine.id}
              machine={machine}
              expanded={expanded === machine.id}
              onToggleExpand={() => setExpanded(expanded === machine.id ? null : machine.id)}
              index={idx}
              tone={tone}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-background/40 p-5 text-center text-sm text-muted-foreground">
          لا توجد ماكينات في هذا القسم حسب الفلتر الحالي.
        </div>
      )}
    </section>
  );
}

function DeptMiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/70 px-3 py-2 text-center">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  tone = "default"
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  tone?: "default" | "good" | "warn";
}) {
  return (
    <Card className="erp-card rounded-2xl">
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
        </div>
        <div
          className={`rounded-xl p-3 ${
            tone === "good" ? "bg-emerald-500/10 text-emerald-500" : tone === "warn" ? "bg-amber-500/10 text-amber-500" : "bg-sky-500/10 text-sky-500"
          }`}
        >
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function MachineControlCard({
  machine,
  expanded,
  onToggleExpand,
  index,
  tone = "injection"
}: {
  machine: MachineSnapshot;
  expanded: boolean;
  onToggleExpand: () => void;
  index: number;
  tone?: "injection" | "blow";
}) {
  const efficiency = calcEfficiency(machine);
  const cycleSpeed = Math.max(18, Math.round(machine.producedPiecesToday / 11));
  const pressure = machine.type === "injection" ? 145 : machine.type === "blow_molding" ? 10 : 72;
  const temp = machine.type === "injection" ? 214 : machine.type === "blow_molding" ? 178 : 36;
  const materialUsage = Math.round(machine.producedWeightKgToday * 0.92);
  const statusClass =
    machine.status === "running"
      ? "border-emerald-500/30 shadow-[0_0_0_1px_rgba(16,185,129,.25),0_0_35px_rgba(16,185,129,.18)]"
      : machine.status === "down"
        ? "border-rose-500/30"
        : "border-border";
  const departmentVisual =
    tone === "injection"
      ? "rounded-none bg-gradient-to-br from-blue-500/10 via-transparent to-slate-500/15"
      : "rounded-3xl bg-gradient-to-b from-cyan-500/12 via-transparent to-teal-500/15";

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3) }}
      className={`erp-card overflow-hidden border transition-all hover:-translate-y-0.5 ${tone === "injection" ? "rounded-2xl" : "rounded-3xl"} ${statusClass}`}
    >
      <div className={`relative h-44 border-b border-border p-4 dark:from-slate-900/70 ${departmentVisual}`}>
        <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{machine.code}</p>
            <h3 className="mt-1 text-xl font-semibold">{machine.name}</h3>
            <p className="text-xs text-muted-foreground">{typeLabel[machine.type]}</p>
          </div>
          <StatusPill status={machine.status} />
        </div>

        <div className="absolute bottom-8 right-6 h-14 w-24 rounded-xl border border-slate-400/35 bg-slate-100/35 dark:border-slate-700/70 dark:bg-slate-800/45" />
        <div className={`absolute bottom-8 right-32 h-11 w-28 rounded-xl border ${tone === "injection" ? "border-blue-300/30 bg-blue-500/10" : "border-cyan-300/30 bg-cyan-500/10"}`} />
        <div className={`absolute bottom-8 left-8 h-16 w-16 rounded-full border-2 status-glow-ring ${tone === "injection" ? "border-blue-400/50 bg-blue-500/10" : "border-cyan-400/50 bg-cyan-500/10"}`} />

        <div className="absolute bottom-4 right-4 rounded-lg border border-border bg-background/80 px-2.5 py-1 text-xs">
          آخر نشاط: قبل {Math.max(1, Math.round(machine.downtimeMinutesToday / 5))} دقيقة
        </div>
      </div>

      <div className="grid gap-3 p-4">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Metric label="الحرارة" value={`${temp}°C`} icon={<Thermometer className="h-3.5 w-3.5" />} />
          <Metric label="الضغط" value={`${pressure} bar`} icon={<Gauge className="h-3.5 w-3.5" />} />
          <Metric label="سرعة الدورة" value={`${cycleSpeed}/د`} icon={<Activity className="h-3.5 w-3.5" />} />
          <Metric label="استهلاك المادة" value={`${materialUsage} كغ`} icon={<Bolt className="h-3.5 w-3.5" />} />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border bg-background/60 p-3">
          <div>
            <p className="text-xs text-muted-foreground">كفاءة التشغيل</p>
            <p className="mt-1 text-sm font-medium">{efficiency}%</p>
          </div>
          <ProgressRing value={efficiency} tone={machine.status} />
        </div>

        {machine.activeAlert ? (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
            <TriangleAlert className="h-4 w-4" />
            {machine.activeAlert}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-live" />
            لا توجد تحذيرات صيانة نشطة
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <ActionButton icon={<PlayCircle className="h-4 w-4" />} label="تشغيل" />
          <ActionButton icon={<PauseCircle className="h-4 w-4" />} label="إيقاف" />
          <ActionButton icon={<Wrench className="h-4 w-4" />} label="صيانة" />
          <ActionButton icon={<BarChart3 className="h-4 w-4" />} label="تحليلات" />
        </div>

        <Button variant="ghost" className="h-9 justify-center" onClick={onToggleExpand}>
          {expanded ? "إخفاء التفاصيل" : "تفاصيل أكثر"}
        </Button>

        <AnimatePresence initial={false}>
          {expanded ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="grid gap-2 rounded-xl border border-border bg-background/50 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">المشغل</span>
                  <span>{machine.operator ?? "غير محدد"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">الفني</span>
                  <span>{machine.technician ?? "غير محدد"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">القالب الحالي</span>
                  <span>{machine.currentMold ?? "غير مركب"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">الإنتاج اليوم</span>
                  <span>{machine.producedPiecesToday.toLocaleString("ar")} قطعة</span>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-2.5">
      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function ActionButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Button variant="outline" className="h-9 gap-1.5 text-xs">
      {icon}
      {label}
    </Button>
  );
}

function ProgressRing({ value, tone }: { value: number; tone: MachineSnapshot["status"] }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference;
  const stroke = tone === "running" ? "#10b981" : tone === "maintenance" ? "#f59e0b" : tone === "down" ? "#ef4444" : "#0ea5e9";

  return (
    <div className="relative h-14 w-14">
      <svg className="h-14 w-14 -rotate-90">
        <circle cx="28" cy="28" r={radius} stroke="rgba(148,163,184,0.25)" strokeWidth="6" fill="none" />
        <circle
          cx="28"
          cy="28"
          r={radius}
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[11px] font-semibold">{value}%</span>
    </div>
  );
}

function StatusPill({ status }: { status: MachineSnapshot["status"] }) {
  if (status === "running") return <Badge variant="success">تشغيل</Badge>;
  if (status === "maintenance") return <Badge variant="warning">صيانة</Badge>;
  if (status === "down") return <Badge variant="destructive">عطل</Badge>;
  return <Badge variant="secondary">متوقفة</Badge>;
}

function FactoryMiniMap({ machines }: { machines: MachineSnapshot[] }) {
  const positions = machines.map((machine, idx) => ({
    machine,
    x: 18 + (idx % 2) * 44,
    y: 16 + Math.floor(idx / 2) * 24
  }));

  return (
    <Card className="erp-card h-fit rounded-3xl">
      <CardContent className="p-4">
        <div className="mb-3">
          <h3 className="text-base font-semibold">خريطة أرضية المصنع</h3>
          <p className="text-xs text-muted-foreground">عرض لحظي لمواقع الماكينات وحالتها التشغيلية</p>
        </div>
        <div className="relative h-80 overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-slate-200/40 to-slate-100/10 p-3 dark:from-slate-900/80 dark:to-slate-950/40">
          <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(148,163,184,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.14)_1px,transparent_1px)] [background-size:24px_24px]" />
          {positions.map(({ machine, x, y }) => (
            <motion.div
              key={machine.id}
              className="absolute w-24 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-background/85 px-2 py-1 text-center text-[11px]"
              style={{ right: `${x}%`, top: `${y}%` }}
              whileHover={{ scale: 1.06 }}
            >
              <div className="mb-1 flex items-center justify-center gap-1">
                <span
                  className={`h-2 w-2 rounded-full ${
                    machine.status === "running"
                      ? "bg-emerald-400 pulse-live"
                      : machine.status === "maintenance"
                        ? "bg-amber-400"
                        : machine.status === "down"
                          ? "bg-rose-400"
                          : "bg-slate-400"
                  }`}
                />
                <span className="font-medium">{machine.code}</span>
              </div>
              <p className="truncate text-muted-foreground">{machine.name}</p>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function FactoryOverviewMap({ machines }: { machines: MachineSnapshot[] }) {
  const injection = machines.filter((m) => m.type === "injection" || m.type === "line");
  const blow = machines.filter((m) => m.type === "blow_molding");
  const injActive = injection.filter((m) => m.status === "running").length;
  const blowActive = blow.filter((m) => m.status === "running").length;

  return (
    <section className="rounded-3xl border border-border bg-card p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs tracking-[0.2em] text-muted-foreground">FACTORY OVERVIEW MAP</p>
          <h2 className="mt-1 text-lg font-semibold">مخطط تدفق الإنتاج العام</h2>
        </div>
        <Badge variant="info">حي</Badge>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Injection Area</p>
          <p className="mt-1 text-xs text-muted-foreground">ماكينات: {injection.length.toLocaleString("ar")}</p>
          <p className="text-xs text-muted-foreground">نشطة: {injActive.toLocaleString("ar")}</p>
        </div>
        <div className="flex items-center justify-center">
          <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4">
          <p className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">Blow Molding Area</p>
          <p className="mt-1 text-xs text-muted-foreground">ماكينات: {blow.length.toLocaleString("ar")}</p>
          <p className="text-xs text-muted-foreground">نشطة: {blowActive.toLocaleString("ar")}</p>
        </div>
      </div>
    </section>
  );
}

function EmptyMachinesState() {
  return (
    <Card className="erp-card rounded-3xl">
      <CardContent className="grid min-h-72 place-items-center p-8 text-center">
        <div>
          <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-muted grid place-items-center">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">لا توجد نتائج مطابقة</h3>
          <p className="mt-2 text-sm text-muted-foreground">غيّر كلمات البحث أو الفلتر لعرض الماكينات.</p>
        </div>
      </CardContent>
    </Card>
  );
}

function MachinesLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-36 animate-pulse rounded-3xl border border-border bg-muted/50" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-24 animate-pulse rounded-2xl border border-border bg-muted/50" />
        <div className="h-24 animate-pulse rounded-2xl border border-border bg-muted/50" />
        <div className="h-24 animate-pulse rounded-2xl border border-border bg-muted/50" />
      </div>
      <div className="h-72 animate-pulse rounded-3xl border border-border bg-muted/50" />
    </div>
  );
}

function calcEfficiency(machine: MachineSnapshot) {
  return Math.max(42, Math.min(98, Math.round(100 - machine.wasteKgToday * 1.8 - machine.downtimeMinutesToday / 4)));
}
