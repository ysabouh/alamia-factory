"use client";

import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  CircleGauge,
  HardHat,
  PackageSearch,
  Siren,
  TimerReset,
  Wrench
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const kpis = [
  { label: "الأعطال النشطة", value: "12", icon: AlertTriangle, tone: "warn" },
  { label: "ماكينات متوقفة", value: "4", icon: Siren, tone: "danger" },
  { label: "صحة المصنع", value: "86%", icon: Activity, tone: "good" },
  { label: "MTTR", value: "2.4h", icon: TimerReset, tone: "default" },
  { label: "MTBF", value: "41h", icon: CircleGauge, tone: "default" },
  { label: "صيانة مجدولة", value: "18", icon: Wrench, tone: "warn" }
] as const;

const kanban = {
  reported: ["Leak on INJ-03", "Packaging line sensor fault"],
  diagnosing: ["Hydraulic pressure drift - INJ-04"],
  waiting: ["Bearing replacement - BLW-02"],
  repairing: ["Heater zone replacement - INJ-02"],
  testing: ["Post-fix vibration test - BLW-01"],
  completed: ["Mold cleaning cycle #M-18"]
};

const healthMachines = [
  { id: "INJ-01", temp: 214, pressure: 148, vibration: 0.32, runtime: 18, error: "E-0", prediction: "Low risk" },
  { id: "INJ-04", temp: 238, pressure: 154, vibration: 0.65, runtime: 11, error: "HY-21", prediction: "Hydraulic inspection" },
  { id: "BLW-02", temp: 176, pressure: 11.2, vibration: 0.41, runtime: 16, error: "AR-09", prediction: "Air filter clean" }
];

const predictive = [
  { title: "تغيير زيت وحدة الحقن", severity: "warning", text: "INJ-04 reached 92% oil life threshold." },
  { title: "تنظيف فلتر الهواء", severity: "info", text: "BLW-02 airflow reduced by 11% from baseline." },
  { title: "تنبؤ عطل هيدروليك", severity: "critical", text: "Pressure oscillation pattern detected on INJ-03." },
  { title: "تنبيه صيانة قالب", severity: "warning", text: "Mold M-18 exceeded planned shot cycle limit." }
];

const spareParts = [
  { name: "Hydraulic Seal Kit", stock: 3, min: 6 },
  { name: "Air Filter Cartridge", stock: 14, min: 10 },
  { name: "Nozzle Heater Band", stock: 5, min: 8 },
  { name: "Servo Coupling", stock: 2, min: 4 }
];

const downtimeData = [
  { hall: "Injection 1", downtime: 6.2, cost: 2400, failures: 7 },
  { hall: "Injection 2", downtime: 4.1, cost: 1900, failures: 5 },
  { hall: "Blow", downtime: 3.2, cost: 1200, failures: 3 },
  { hall: "Packaging", downtime: 2.4, cost: 820, failures: 2 }
];

const problematicMachines = [
  { name: "INJ-04", value: 38 },
  { name: "INJ-03", value: 24 },
  { name: "BLW-02", value: 20 },
  { name: "PKG-01", value: 18 }
];

const technicians = [
  { name: "أحمد", shift: "A", task: "Hydraulic fix INJ-04", status: "active" },
  { name: "وليد", shift: "B", task: "Air pressure diagnostics BLW-02", status: "active" },
  { name: "علي", shift: "A", task: "Mold maintenance M-18", status: "scheduled" },
  { name: "سامر", shift: "C", task: "Packaging sensor calibration", status: "scheduled" }
];

export function AdminPage() {
  return (
    <div className="ds-page">
      <header className="erp-hero relative overflow-hidden rounded-3xl border border-border p-6 shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(14,165,233,0.14),transparent_46%)]" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.3em] text-muted-foreground">MAINTENANCE COMMAND CENTER</p>
            <h1 className="mt-3 text-3xl font-semibold md:text-4xl">مركز التحكم الهندسي للصيانة</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              منصة مراقبة صيانة ذكية للمصنع مع رؤية لحظية للأعطال، التنبؤات، والموارد الفنية.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-700 dark:text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-live" />
            Live Maintenance Network
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <KpiCard {...kpi} />
          </motion.div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <LiveHealthMap />
        <MaintenanceKanban />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <MachineHealthGrid />
        <PredictiveCards />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SparePartsSection />
        <AnalyticsSection />
      </section>

      <TechnicianSection />
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  tone
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "good" | "warn" | "danger" | "default";
}) {
  const toneClass =
    tone === "good"
      ? "bg-emerald-500/10 text-emerald-400"
      : tone === "warn"
        ? "bg-amber-500/10 text-amber-400"
        : tone === "danger"
          ? "bg-rose-500/10 text-rose-400"
          : "bg-sky-500/10 text-sky-400";

  return (
    <Card className="erp-card rounded-2xl">
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
        <div className={`rounded-xl p-3 ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function LiveHealthMap() {
  const halls = [
    { name: "Injection Hall 1", status: "healthy", kpi: "92%", output: "6.2k" },
    { name: "Injection Hall 2", status: "warning", kpi: "78%", output: "4.9k" },
    { name: "Blow Molding Hall", status: "healthy", kpi: "88%", output: "4.1k" },
    { name: "Packaging Hall", status: "critical", kpi: "63%", output: "3.2k" }
  ];
  return (
    <Card className="erp-card rounded-3xl">
      <CardHeader>
        <CardTitle>خريطة صحة المصنع الحية</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-[430px] overflow-hidden rounded-2xl border border-border bg-background/70 p-5">
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:28px_28px]" />

          <div className="absolute inset-x-14 top-1/2 z-0 h-[2px] -translate-y-1/2 bg-gradient-to-r from-sky-500/20 via-sky-400/50 to-sky-500/20" />
          <div className="absolute left-1/2 top-14 z-0 h-[calc(100%-7rem)] w-[2px] -translate-x-1/2 bg-gradient-to-b from-sky-500/20 via-sky-400/50 to-sky-500/20" />

          <div className="relative z-10 grid h-full grid-cols-2 grid-rows-2 gap-4">
            {halls.map((hall) => (
              <div
                key={hall.name}
                className={`mx-auto flex w-full max-w-[240px] flex-col justify-center rounded-xl border p-4 text-xs transition-all hover:-translate-y-0.5 ${
                  hall.status === "critical"
                    ? "border-rose-500/30 bg-rose-500/10"
                    : hall.status === "warning"
                      ? "border-amber-500/30 bg-amber-500/10"
                      : "border-emerald-500/30 bg-emerald-500/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{hall.name}</p>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      hall.status === "critical"
                        ? "bg-rose-400"
                        : hall.status === "warning"
                          ? "bg-amber-400"
                          : "bg-emerald-400 pulse-live"
                    }`}
                  />
                </div>
                <p className="mt-2 text-muted-foreground">الحالة: {hall.status}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="rounded-md border border-border bg-background/50 px-2 py-1">
                    <p className="text-[10px] text-muted-foreground">Health</p>
                    <p className="text-xs font-semibold">{hall.kpi}</p>
                  </div>
                  <div className="rounded-md border border-border bg-background/50 px-2 py-1">
                    <p className="text-[10px] text-muted-foreground">Output/h</p>
                    <p className="text-xs font-semibold">{hall.output}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="absolute bottom-3 right-3 z-20 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background/75 px-3 py-1.5 text-[11px]">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" />سليم</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" />تحذير</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-400" />حرج</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MaintenanceKanban() {
  const columns: Array<{ title: string; items: string[] }> = [
    { title: "Reported", items: kanban.reported },
    { title: "Diagnosing", items: kanban.diagnosing },
    { title: "Waiting Parts", items: kanban.waiting },
    { title: "Repairing", items: kanban.repairing },
    { title: "Testing", items: kanban.testing },
    { title: "Completed", items: kanban.completed }
  ];
  return (
    <Card className="erp-card rounded-3xl">
      <CardHeader>
        <CardTitle>لوحة الصيانة (Kanban)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {columns.map((column) => (
            <div key={column.title} className="rounded-xl border border-border bg-background/60 p-3">
              <p className="text-sm font-semibold">{column.title}</p>
              <div className="mt-2 space-y-2">
                {column.items.map((item) => (
                  <div key={item} className="rounded-lg border border-border bg-card px-2.5 py-2 text-xs">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MachineHealthGrid() {
  return (
    <Card className="erp-card rounded-3xl">
      <CardHeader>
        <CardTitle>بطاقات صحة الماكينات</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {healthMachines.map((machine) => (
          <div key={machine.id} className="rounded-xl border border-border bg-background/60 p-3">
            <p className="font-semibold">{machine.id}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <Metric label="Temp" value={`${machine.temp}C`} />
              <Metric label="Pressure" value={`${machine.pressure} bar`} />
              <Metric label="Vibration" value={`${machine.vibration} g`} />
              <Metric label="Runtime" value={`${machine.runtime} h`} />
              <Metric label="Error" value={machine.error} />
              <Metric label="Prediction" value={machine.prediction} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function PredictiveCards() {
  return (
    <Card className="erp-card rounded-3xl">
      <CardHeader>
        <CardTitle>الصيانة التنبؤية</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {predictive.map((card) => (
          <div
            key={card.title}
            className={`rounded-xl border p-3 text-sm ${
              card.severity === "critical"
                ? "border-rose-500/45 bg-rose-950/60 text-rose-100"
                : card.severity === "warning"
                  ? "border-amber-500/45 bg-amber-950/55 text-amber-100"
                  : "border-sky-500/45 bg-sky-950/55 text-sky-100"
            }`}
          >
            <p className="flex items-center gap-2 font-medium">
              <BrainCircuit className="h-4 w-4" />
              {card.title}
            </p>
            <p className="mt-1 text-xs opacity-90">{card.text}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SparePartsSection() {
  return (
    <Card className="erp-card rounded-3xl">
      <CardHeader>
        <CardTitle>مخزون قطع الغيار</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {spareParts.map((part) => {
          const low = part.stock < part.min;
          return (
            <div
              key={part.name}
              className={`rounded-xl border p-3 ${low ? "border-rose-500/30 bg-rose-500/10" : "border-emerald-500/30 bg-emerald-500/10"}`}
            >
              <p className="flex items-center gap-2 text-sm font-medium">
                <PackageSearch className="h-4 w-4" />
                {part.name}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Stock: {part.stock} | Min: {part.min}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function AnalyticsSection() {
  return (
    <Card className="erp-card rounded-3xl">
      <CardHeader>
        <CardTitle>تحليلات الأعطال والتكلفة</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={downtimeData}>
              <CartesianGrid stroke="rgba(148,163,184,0.2)" vertical={false} />
              <XAxis dataKey="hall" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(148,163,184,0.35)", color: "#f1f5f9" }} />
              <Bar dataKey="downtime" fill="#38bdf8" radius={[6, 6, 0, 0]} />
              <Bar dataKey="failures" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={problematicMachines} dataKey="value" nameKey="name" outerRadius={70} innerRadius={36}>
                {problematicMachines.map((item, i) => (
                  <Cell key={item.name} fill={["#38bdf8", "#0ea5e9", "#f97316", "#ef4444"][i % 4]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function TechnicianSection() {
  return (
    <Card className="erp-card rounded-3xl">
      <CardHeader>
        <CardTitle>إدارة الفنيين والمهام</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {technicians.map((tech) => (
          <div key={tech.name} className="rounded-xl border border-border bg-background/60 p-3">
            <p className="flex items-center gap-2 font-semibold">
              <HardHat className="h-4 w-4 text-sky-400" />
              {tech.name}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Shift: {tech.shift}</p>
            <p className="mt-1 text-xs">{tech.task}</p>
            <div className="mt-2">
              {tech.status === "active" ? <Badge variant="success">نشط</Badge> : <Badge variant="secondary">مجدول</Badge>}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-xs font-semibold">{value}</p>
    </div>
  );
}
