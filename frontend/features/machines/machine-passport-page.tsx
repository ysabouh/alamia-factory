"use client";

import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Cpu,
  Download,
  Factory,
  FileText,
  Gauge,
  HardHat,
  Radar,
  ShieldAlert,
  Siren,
  Thermometer,
  Waves,
  Wrench
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MachineSnapshot } from "@/types/factory";

type PassportProps = {
  machine: MachineSnapshot;
};

const timeline = [
  { date: "2023-02-11", title: "التركيب", detail: "تم تشغيل الماكينة في صالة الحقن 1." },
  { date: "2023-08-02", title: "استبدال قالب", detail: "تم استبدال القالب M-08 بالقالب M-11." },
  { date: "2024-01-19", title: "صيانة وقائية", detail: "تغيير زيت الهيدروليك وخدمة الفلتر." },
  { date: "2024-07-04", title: "تحديث برمجي", detail: "نشر إصدار المتحكم v3.8." },
  { date: "2025-03-23", title: "إصلاح رئيسي", detail: "معايرة ومحاذاة صمام السيرفو." },
  { date: "2026-04-28", title: "إنجاز إنتاجي", detail: "الوصول إلى 2.5 مليون دورة." }
];

const maintenanceHistory = [
  { issue: "Hydraulic drift", severity: "critical", downtime: "2h 20m", cost: 420, tech: "Ahmed", rootCause: "Valve wear" },
  { issue: "Nozzle overheating", severity: "warning", downtime: "50m", cost: 180, tech: "Waleed", rootCause: "Heater band fatigue" },
  { issue: "Pressure sensor noise", severity: "info", downtime: "25m", cost: 95, tech: "Ali", rootCause: "Connector oxidation" }
] as const;

const predictiveCards = [
  { title: "الحاجة لتغيير الزيت", risk: 74, eta: "12 يوم", urgency: "warning" },
  { title: "انخفاض كفاءة الفلتر", risk: 61, eta: "18 يوم", urgency: "warning" },
  { title: "اتجاه عدم استقرار هيدروليكي", risk: 83, eta: "7 أيام", urgency: "critical" },
  { title: "يوصى بتنظيف القالب", risk: 58, eta: "14 يوم", urgency: "info" }
] as const;

const telemetryTrend = [
  { t: "08:00", temp: 206, pressure: 142, energy: 32, vibration: 0.31 },
  { t: "10:00", temp: 210, pressure: 148, energy: 36, vibration: 0.34 },
  { t: "12:00", temp: 214, pressure: 151, energy: 38, vibration: 0.36 },
  { t: "14:00", temp: 218, pressure: 147, energy: 40, vibration: 0.39 },
  { t: "16:00", temp: 213, pressure: 145, energy: 35, vibration: 0.33 }
];

const docs = [
  { name: "الدليل الفني v4.2", type: "PDF", category: "الأدلة" },
  { name: "مخطط هيدروليك", type: "DWG", category: "هيدروليك" },
  { name: "مخطط كهربائي", type: "PDF", category: "كهرباء" },
  { name: "تعليمات سلامة المشغل", type: "PDF", category: "سلامة" }
];

export function MachinePassportPage({ machine }: PassportProps) {
  const healthScore = Math.max(42, Math.min(98, Math.round(100 - machine.wasteKgToday * 1.7 - machine.downtimeMinutesToday / 4)));
  const efficiency = Math.max(45, Math.min(98, Math.round((machine.producedPiecesToday / Math.max(1, machine.producedPiecesToday + machine.wasteKgToday * 50)) * 100)));
  const hall = machine.type === "injection" ? "صالة الحقن 1" : machine.type === "blow_molding" ? "صالة النفخ" : "صالة التغليف";
  const statusTone = machine.status === "running" ? "good" : machine.status === "maintenance" ? "maintenance" : machine.activeAlert ? "warn" : "critical";
  const mttr = "2.1h";
  const mtbf = "47h";
  const machineImage =
    machine.type === "blow_molding"
      ? "https://images.pexels.com/photos/5974326/pexels-photo-5974326.jpeg?auto=compress&cs=tinysrgb&w=1600"
      : "https://images.pexels.com/photos/4483610/pexels-photo-4483610.jpeg?auto=compress&cs=tinysrgb&w=1600";

  return (
    <div className="ds-page">
      <header className="erp-hero relative overflow-hidden rounded-3xl border border-border p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(14,165,233,0.10),transparent_52%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-transparent to-slate-950/40 dark:from-slate-950/40 dark:to-slate-950/55" />
        <div className="relative grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3 rounded-2xl border border-slate-200/70 bg-white/75 p-4 backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-950/45">
            <p className="text-xs font-medium tracking-[0.28em] text-slate-700 dark:text-slate-200">جواز الماكينة الرقمي</p>
            <h1 className="text-3xl font-bold text-slate-950 dark:text-white md:text-4xl">{machine.name}</h1>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="info" className="border-sky-500/35 bg-sky-500/15 text-sky-800 dark:text-sky-100">{machine.code}</Badge>
              <Badge variant="secondary" className="bg-slate-200/80 text-slate-800 dark:bg-slate-800/80 dark:text-slate-100">{machine.type}</Badge>
              <Badge variant="secondary" className="bg-slate-200/80 text-slate-800 dark:bg-slate-800/80 dark:text-slate-100">{hall}</Badge>
              <Badge variant="secondary" className="bg-slate-200/80 text-slate-800 dark:bg-slate-800/80 dark:text-slate-100">المشغل: {machine.operator ?? "غير متاح"}</Badge>
              <Badge variant="secondary" className="bg-slate-200/80 text-slate-800 dark:bg-slate-800/80 dark:text-slate-100">الشيفت A</Badge>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/35 bg-emerald-500/15 px-3 py-1 text-xs text-emerald-800 dark:text-emerald-100">
              <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-live" />
              متصل - قياسات حية
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <ScoreCard label="الصحة" value={`${healthScore}%`} tone={statusTone} />
              <ScoreCard label="الكفاءة" value={`${efficiency}%`} tone="good" />
              <ScoreCard label="الحالة" value={machine.status === "running" ? "تشغيل" : machine.status === "maintenance" ? "صيانة" : machine.status === "stopped" ? "توقف" : "حرج"} tone={statusTone} />
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-background/70 p-4 shadow-sm">
            <div className="relative h-64 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-slate-200/45 via-transparent to-sky-500/10 dark:from-slate-900/80">
              <img
                src={machineImage}
                alt={machine.type === "blow_molding" ? "Industrial blow molding machine" : "Industrial injection machine"}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://images.pexels.com/photos/162568/plastic-bottles-recycling-production-industry-162568.jpeg?auto=compress&cs=tinysrgb&w=1600";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-900/15 to-slate-950/30" />
              <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(148,163,184,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.14)_1px,transparent_1px)] [background-size:24px_24px]" />
              <div className="absolute left-10 top-14 h-24 w-24 rounded-full border border-cyan-400/50 bg-cyan-500/10 status-glow-ring" />
              <div className="absolute bottom-4 left-4 rounded-lg border border-border bg-background/85 px-2 py-1 text-xs text-slate-900 dark:text-slate-100">
                توأم رقمي - {machine.code}
              </div>
              <div className="absolute bottom-4 right-4 rounded-lg border border-sky-500/35 bg-sky-500/20 px-2.5 py-1 text-xs text-sky-900 dark:text-sky-100">
                بث مرئي حي
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <TelemetrySection />
        <MaintenanceAi />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <LifecycleTimeline />
        <MaintenanceHistory />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <DigitalTwinPanel />
        <SpareParts />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <PerformanceSection />
        <DocumentationSection />
      </section>

      <OperatorAccessSection mttr={mttr} mtbf={mtbf} operator={machine.operator ?? "غير محدد"} />
    </div>
  );
}

function ScoreCard({ label, value, tone }: { label: string; value: string; tone: "good" | "warn" | "critical" | "maintenance" }) {
  const cls =
    tone === "good"
      ? "border-emerald-500/45 bg-emerald-500/20 text-emerald-900 dark:text-emerald-100"
      : tone === "warn"
        ? "border-amber-500/45 bg-amber-500/20 text-amber-900 dark:text-amber-100"
        : tone === "maintenance"
          ? "border-sky-500/45 bg-sky-500/20 text-sky-900 dark:text-sky-100"
          : "border-rose-500/45 bg-rose-500/20 text-rose-900 dark:text-rose-100";
  return (
    <div className={`rounded-xl border p-3 shadow-sm ${cls}`}>
      <p className="text-[11px] font-medium opacity-90">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}

function TelemetrySection() {
  const metrics = [
    { label: "الحرارة", value: "214 C", icon: Thermometer, warn: false },
    { label: "ضغط الهيدروليك", value: "148 bar", icon: Gauge, warn: false },
    { label: "ضغط الحقن", value: "151 bar", icon: Waves, warn: true },
    { label: "ضغط الهواء", value: "8.2 bar", icon: Gauge, warn: false },
    { label: "حمل المحرك", value: "82%", icon: Cpu, warn: false },
    { label: "استهلاك الطاقة", value: "39 kW", icon: BatteryCharging, warn: false },
    { label: "سرعة الدورة", value: "42 دورة/س", icon: Activity, warn: false },
    { label: "استهلاك المادة", value: "14.2 كغ/س", icon: Factory, warn: false },
    { label: "الاهتزاز", value: "0.39 g", icon: Radar, warn: true },
    { label: "ساعات التشغيل", value: "18.4 س", icon: Clock3, warn: false }
  ];
  return (
    <Card className="erp-card rounded-3xl">
      <CardHeader><CardTitle>القياسات الحية للماكينة</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {metrics.map((m) => (
            <div key={m.label} className={`rounded-xl border p-3 ${m.warn ? "border-amber-500/35 bg-amber-500/10" : "border-border bg-background/60"}`}>
              <p className="flex items-center gap-2 text-xs text-muted-foreground"><m.icon className="h-3.5 w-3.5" />{m.label}</p>
              <p className="mt-1 text-sm font-semibold">{m.value}</p>
            </div>
          ))}
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={telemetryTrend}>
              <CartesianGrid stroke="rgba(148,163,184,0.2)" vertical={false} />
              <XAxis dataKey="t" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Area type="monotone" dataKey="temp" stroke="#38bdf8" fill="#38bdf833" />
              <Area type="monotone" dataKey="pressure" stroke="#f59e0b" fill="#f59e0b22" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function LifecycleTimeline() {
  return (
    <Card className="erp-card rounded-3xl">
      <CardHeader><CardTitle>الخط الزمني للماكينة</CardTitle></CardHeader>
      <CardContent>
        <div className="relative space-y-3 pr-1">
          <div className="absolute bottom-2 top-2 right-[0.55rem] w-[2px] bg-gradient-to-b from-sky-500/20 via-sky-500/50 to-sky-500/20" />
          {timeline.map((event) => (
            <div key={event.date} className="relative pr-8">
              <span className="absolute right-0.5 top-2 inline-flex h-4 w-4 items-center justify-center">
                <span className="absolute h-4 w-4 rounded-full border border-sky-500/40 bg-sky-500/15" />
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              </span>
              <div className="rounded-xl border border-border bg-background/60 p-3 shadow-sm">
                <p className="text-[11px] font-medium text-sky-600 dark:text-sky-300">{event.date}</p>
                <p className="mt-1 text-sm font-semibold">{event.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{event.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MaintenanceHistory() {
  return (
    <Card className="erp-card rounded-3xl">
      <CardHeader><CardTitle>سجل الصيانة</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Button variant="outline" className="h-8 text-xs">تصفية حسب الشدة</Button>
          <Button variant="outline" className="h-8 text-xs">بحث في المشاكل</Button>
        </div>
        {maintenanceHistory.map((item) => (
          <div key={item.issue} className="rounded-xl border border-border bg-background/60 p-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">{item.issue}</p>
              <Badge variant={item.severity === "critical" ? "destructive" : item.severity === "warning" ? "warning" : "info"}>{item.severity}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              التوقف: {item.downtime} | التكلفة: ${item.cost} | الفني: {item.tech}
            </p>
            <p className="mt-1 text-xs">السبب الجذري: {item.rootCause}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function MaintenanceAi() {
  return (
    <Card className="erp-card rounded-3xl">
      <CardHeader><CardTitle>الصيانة التنبؤية بالذكاء الاصطناعي</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {predictiveCards.map((p) => (
          <motion.div key={p.title} whileHover={{ y: -2 }} className={`rounded-xl border p-3 ${
            p.urgency === "critical"
              ? "border-rose-500/35 bg-rose-500/10"
              : p.urgency === "warning"
                ? "border-amber-500/35 bg-amber-500/10"
                : "border-sky-500/35 bg-sky-500/10"
          }`}>
            <p className="flex items-center gap-2 text-sm font-semibold">
              <BrainCircuit className="h-4 w-4" />
              {p.title}
            </p>
            <p className="mt-1 text-xs">نسبة المخاطر: {p.risk}% | العمر المتبقي: {p.eta}</p>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}

function DigitalTwinPanel() {
  const sensors = [
    { name: "المحرك", status: "ok" },
    { name: "مضخة هيدروليك", status: "warn" },
    { name: "سخان الفونية", status: "ok" },
    { name: "وحدة الإقفال", status: "critical" }
  ] as const;
  return (
    <Card className="erp-card rounded-3xl">
      <CardHeader><CardTitle>التوأم الرقمي</CardTitle></CardHeader>
      <CardContent className="grid gap-4 xl:grid-cols-[1fr_280px]">
        <div className="relative h-64 overflow-hidden rounded-2xl border border-border bg-slate-950/85">
          <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:22px_22px]" />
          <div className="absolute right-10 top-12 h-20 w-40 rounded-xl border border-sky-400/30 bg-sky-500/10" />
          <div className="absolute right-52 top-20 h-12 w-24 rounded-lg border border-slate-500/60 bg-slate-900/80" />
          <div className="absolute left-12 top-14 h-24 w-24 rounded-full border border-cyan-400/50 bg-cyan-500/10 status-glow-ring" />
        </div>
        <div className="space-y-2">
          {sensors.map((s) => (
            <div key={s.name} className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2 text-xs">
              <span>{s.name}</span>
              <Badge variant={s.status === "ok" ? "success" : s.status === "warn" ? "warning" : "destructive"}>{s.status}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PerformanceSection() {
  const bars = [
    { k: "الإنتاج/ساعة", v: 92 },
    { k: "نسبة الرفض", v: 8 },
    { k: "كفاءة الطاقة", v: 81 },
    { k: "OEE", v: 86 }
  ];
  return (
    <Card className="erp-card rounded-3xl">
      <CardHeader><CardTitle>أداء الإنتاج</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bars}>
              <CartesianGrid stroke="rgba(148,163,184,0.2)" vertical={false} />
              <XAxis dataKey="k" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Bar dataKey="v" radius={[8, 8, 0, 0]}>
                {bars.map((b, i) => (
                  <Cell key={b.k} fill={["#38bdf8", "#f97316", "#10b981", "#6366f1"][i % 4]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={bars} dataKey="v" nameKey="k" outerRadius={70} innerRadius={38}>
                {bars.map((b, i) => (
                  <Cell key={b.k} fill={["#38bdf8", "#f97316", "#10b981", "#6366f1"][i % 4]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function SpareParts() {
  const parts = [
    { name: "Servo Coupling", stock: 2, life: "160h", supplier: "Bosch Rexroth" },
    { name: "Hydraulic Seal", stock: 8, life: "90h", supplier: "Parker" },
    { name: "Nozzle Heater", stock: 5, life: "120h", supplier: "Siemens" }
  ];
  return (
    <Card className="erp-card rounded-3xl">
      <CardHeader><CardTitle>قطع الغيار والمكونات</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {parts.map((p) => (
          <div key={p.name} className="rounded-lg border border-border bg-background/60 p-3 text-xs">
            <p className="font-semibold">{p.name}</p>
            <p className="mt-1 text-muted-foreground">المخزون: {p.stock} | العمر: {p.life} | المورد: {p.supplier}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DocumentationSection() {
  return (
    <Card className="erp-card rounded-3xl">
      <CardHeader><CardTitle>مركز الوثائق الفنية</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {docs.map((d) => (
          <div key={d.name} className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2">
            <div className="text-xs">
              <p className="font-semibold">{d.name}</p>
              <p className="text-muted-foreground">{d.category} - {d.type}</p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              تنزيل
            </Button>
          </div>
        ))}
        <div className="pt-1 text-xs text-muted-foreground">التبويبات: أدلة / مخططات / سلامة / إجراءات تشغيل</div>
      </CardContent>
    </Card>
  );
}

function OperatorAccessSection({ operator, mttr, mtbf }: { operator: string; mttr: string; mtbf: string }) {
  const logs = [
    "08:12 - Operator login (Shift A)",
    "10:33 - Manual override: pressure reset",
    "13:47 - Emergency stop released",
    "15:20 - Technician diagnostic mode"
  ];
  return (
    <Card className="erp-card rounded-3xl">
      <CardHeader><CardTitle>سجل المشغل والوصول</CardTitle></CardHeader>
      <CardContent className="grid gap-4 xl:grid-cols-[300px_1fr]">
        <div className="space-y-2 rounded-xl border border-border bg-background/60 p-3 text-xs">
          <p className="flex items-center gap-2 font-semibold"><HardHat className="h-4 w-4 text-sky-400" />المشغل الحالي: {operator}</p>
          <p className="text-muted-foreground">متوسط وقت الإصلاح (MTTR): {mttr}</p>
          <p className="text-muted-foreground">متوسط الوقت بين الأعطال (MTBF): {mtbf}</p>
          <div className="pt-1">
            <Badge variant="info">الشيفت A نشط</Badge>
          </div>
        </div>
        <div className="space-y-2">
          {logs.map((l) => (
            <div key={l} className="rounded-lg border border-border bg-background/60 p-2.5 text-xs">{l}</div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
