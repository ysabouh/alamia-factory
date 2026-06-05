"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Box,
  ClipboardList,
  Factory,
  Gauge,
  ImageIcon,
  Layers,
  Package,
  PackageOpen,
  PauseCircle,
  PlayCircle,
  Radio,
  ShieldCheck,
  Target,
  Timer,
  TrendingUp,
  User,
  Warehouse,
  Zap
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  productionApi,
  type ProductionDashboardKpisJson,
  type WorkOrderJson,
  type WorkOrderStatus
} from "@/lib/api/production-client";
import type { LiveDashboard, MachineSnapshot } from "@/types/factory";

export type OrderStatus = "planned" | "running" | "paused" | "completed" | "delayed" | "quality_issue";

export interface ProductionOrder {
  id: string;
  productName: string;
  productImage: string;
  targetQty: number;
  producedQty: number;
  hall: string;
  machineCode: string;
  machineId: number;
  mold: string;
  materials: string;
  operator: string;
  shift: string;
  eta: string;
  quality: "pass" | "warning" | "fail";
  status: OrderStatus;
}

const statusConfig: Record<
  OrderStatus,
  { label: string; variant: "secondary" | "success" | "warning" | "destructive" | "info"; pulse?: boolean }
> = {
  planned: { label: "مخطط", variant: "secondary" },
  running: { label: "تشغيل", variant: "success", pulse: true },
  paused: { label: "متوقف مؤقتاً", variant: "warning" },
  completed: { label: "مكتمل", variant: "info" },
  delayed: { label: "متأخر", variant: "destructive" },
  quality_issue: { label: "جودة", variant: "destructive" }
};

const productPlaceholders = [
  { img: "https://images.pexels.com/photos/3735747/pexels-photo-3735747.jpeg?auto=compress&w=400" },
  { img: "https://images.pexels.com/photos/802221/pexels-photo-802221.jpeg?auto=compress&w=400" },
  { img: "https://images.pexels.com/photos/37347/object-macro-tape-37347.jpeg?auto=compress&w=400" }
];

function mapApiStatus(status: WorkOrderStatus): OrderStatus {
  if (status === "running") return "running";
  if (status === "paused") return "paused";
  if (status === "completed") return "completed";
  if (status === "cancelled") return "planned";
  return "planned";
}

function mapWorkOrdersToCards(apiOrders: WorkOrderJson[], dashboard: LiveDashboard): ProductionOrder[] {
  if (!apiOrders.length) return buildOrdersFromDashboard(dashboard);

  return apiOrders.map((order, i) => {
    const placeholder = productPlaceholders[i % productPlaceholders.length];
    const machineId = order.machineId ? Number(order.machineId) : dashboard.machines[i % dashboard.machines.length]?.id ?? 0;
    const machine = dashboard.machines.find((m) => m.id === machineId);
    const produced = order.producedQuantity;
    const target = order.plannedQuantity;
    const pct = produced / Math.max(1, target);
    return {
      id: order.orderNo,
      productName: order.productName ?? order.productCode ?? "—",
      productImage: placeholder.img,
      targetQty: target,
      producedQty: produced,
      hall: machine?.type === "injection" ? "صالة الحقن" : machine?.type === "blow_molding" ? "صالة النفخ" : "خط الإنتاج",
      machineCode: order.machineCode ?? machine?.code ?? "—",
      machineId,
      mold: order.moldCode ?? machine?.currentMold ?? "—",
      materials: machine?.type === "blow_molding" ? "PET" : "PP / Masterbatch",
      operator: order.supervisorName ?? machine?.operator ?? "غير معيّن",
      shift: order.shiftName ?? "—",
      eta: order.endTime ? new Date(order.endTime).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" }) : "—",
      quality: pct >= 0.95 ? "pass" : pct >= 0.8 ? "warning" : "fail",
      status: mapApiStatus(order.status)
    };
  });
}

function buildOrdersFromDashboard(dashboard: LiveDashboard): ProductionOrder[] {
  const products = [
    { name: "غطاء 5 لتر HDPE", img: productPlaceholders[0].img },
    { name: "عبوة 1 لتر PET", img: productPlaceholders[1].img },
    { name: "يد بلاستيك PP", img: productPlaceholders[2].img }
  ];
  return dashboard.machines.map((m, i) => {
    const p = products[i % products.length];
    const target = 8000 + i * 500;
    const produced = Math.min(target, Math.round(m.producedPiecesToday * 0.35) + 2000);
    const status: OrderStatus =
      m.status === "running"
        ? "running"
        : m.status === "maintenance"
          ? "paused"
          : m.activeAlert
            ? "quality_issue"
            : m.downtimeMinutesToday > 60
              ? "delayed"
              : produced >= target * 0.98
                ? "completed"
                : "planned";
    return {
      id: `PO-${2026}${String(m.id).padStart(4, "0")}`,
      productName: p.name,
      productImage: p.img,
      targetQty: target,
      producedQty: produced,
      hall: m.type === "injection" ? "صالة الحقن 1" : m.type === "blow_molding" ? "صالة النفخ" : "التغليف",
      machineCode: m.code,
      machineId: m.id,
      mold: m.currentMold ?? "—",
      materials: m.type === "blow_molding" ? "PET حبيبي" : "PP / Masterbatch",
      operator: m.operator ?? "غير معيّن",
      shift: ["أ", "ب"][i % 2],
      eta: `${14 + (i % 3)}:${String(30 + i * 5).padStart(2, "0")}`,
      quality: m.activeAlert ? "warning" : produced / target > 0.95 ? "pass" : "pass",
      status
    };
  });
}

type Props = { dashboard: LiveDashboard };

export function ProductionOrdersCommandCenter({ dashboard }: Props) {
  const [apiOrders, setApiOrders] = useState<WorkOrderJson[]>([]);
  const [kpis, setKpis] = useState<ProductionDashboardKpisJson | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [ordersRes, kpisRes] = await Promise.all([
          productionApi.listOrders({ pageSize: 50, status: "running" }),
          productionApi.dashboardKpis()
        ]);
        const allOrders =
          ordersRes.data.length > 0
            ? ordersRes.data
            : (await productionApi.listOrders({ pageSize: 12 })).data;
        setApiOrders(allOrders);
        setKpis(kpisRes.data);
      } catch {
        setApiOrders([]);
        setKpis(null);
      }
    })();
  }, []);

  const orders = useMemo(
    () => (apiOrders.length ? mapWorkOrdersToCards(apiOrders, dashboard) : buildOrdersFromDashboard(dashboard)),
    [apiOrders, dashboard]
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => {
    if (!selectedId && orders[0]) setSelectedId(orders[0].id);
  }, [orders, selectedId]);
  const selected = orders.find((o) => o.id === selectedId) ?? null;
  const selectedMachine = dashboard.machines.find((m) => m.id === selected?.machineId);

  const overview = useMemo(() => {
    const active = kpis?.orders.running ?? orders.filter((o) => o.status === "running").length;
    const completed = kpis?.orders.completed ?? orders.filter((o) => o.status === "completed").length;
    const delayed = orders.filter((o) => o.status === "delayed" || o.status === "quality_issue").length;
    const totalOut =
      kpis?.production.daily.reduce((s, d) => s + d.goodQuantity, 0) ?? orders.reduce((s, o) => s + o.producedQty, 0);
    const efficiency = Math.round(
      orders.reduce((s, o) => s + (o.producedQty / Math.max(1, o.targetQty)) * 100, 0) / Math.max(1, orders.length)
    );
    const oee = Math.min(
      96,
      Math.round(dashboard.kpis.machineUtilization * 0.92 + (100 - dashboard.kpis.wasteRate) * 0.08)
    );
    return { active, completed, delayed, efficiency, totalOut, utilization: dashboard.kpis.machineUtilization, oee };
  }, [orders, dashboard.kpis, kpis]);

  const trendData = dashboard.productionTrend.map((t) => ({
    name: t.label,
    produced: t.produced,
    waste: t.waste
  }));

  const utilizationByMachine = dashboard.machines.map((m) => ({
    name: m.code,
    u: Math.min(100, 40 + Math.round(m.producedPiecesToday / 120))
  }));

  return (
    <main className="factory-grid min-h-screen bg-background p-4 md:p-6">
      <div className="ds-page mx-auto max-w-[1920px] text-foreground" dir="rtl">
      <OverviewHeader overview={overview} />

      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <LiveScheduler machines={dashboard.machines} orders={orders} />
        <ProductionFlowDiagram
          activeStage={
            !selectedMachine
              ? 1
              : selectedMachine.type === "injection"
                ? 1
                : selectedMachine.type === "blow_molding"
                  ? 3
                  : selectedMachine.type === "line"
                    ? 4
                    : 2
          }
        />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">أوامر الإنتاج النشطة</h2>
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {orders.map((order, i) => (
            <OrderCard key={order.id} order={order} index={i} onSelect={() => setSelectedId(order.id)} selected={order.id === selectedId} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {selected && selectedMachine ? (
          <MachineTelemetryPanel order={selected} machine={selectedMachine} />
        ) : (
          <Card className="erp-card rounded-3xl border-dashed">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">اختر أمر إنتاج لعرض القياسات الحية</CardContent>
          </Card>
        )}
        <QualityMaterialPanel dashboard={dashboard} orders={orders} kpis={kpis} />
      </section>

      <OperatorShiftSection orders={orders} />
      <AnalyticsSection trendData={trendData} utilizationByMachine={utilizationByMachine} dashboard={dashboard} />
      </div>
    </main>
  );
}

function OverviewHeader({
  overview
}: {
  overview: {
    active: number;
    completed: number;
    delayed: number;
    efficiency: number;
    totalOut: number;
    utilization: number;
    oee: number;
  };
}) {
  const items = [
    { label: "أوامر نشطة", value: overview.active.toString(), icon: PlayCircle, tone: "text-emerald-400" },
    { label: "مكتمل اليوم", value: overview.completed.toString(), icon: PackageOpen, tone: "text-sky-400" },
    { label: "متأخرة / مشاكل", value: overview.delayed.toString(), icon: AlertTriangle, tone: "text-amber-400" },
    { label: "كفاءة الإنتاج", value: `${overview.efficiency}%`, icon: TrendingUp, tone: "text-cyan-400" },
    { label: "إجمالي الإخراج", value: overview.totalOut.toLocaleString("ar"), icon: Target, tone: "text-violet-400" },
    { label: "استخدام المصنع", value: `${overview.utilization}%`, icon: Factory, tone: "text-blue-400" },
    { label: "مؤشر OEE", value: `${overview.oee}%`, icon: Gauge, tone: "text-emerald-300" }
  ];
  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mes-overview-hero relative overflow-hidden rounded-3xl p-6"
    >
      <div className="relative">
        <p className="text-xs tracking-[0.25em] text-muted-foreground">MES · مركز أوامر الإنتاج</p>
        <h1 className="mt-2 text-2xl font-bold md:text-3xl">تشغيل المصنع الذكي</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          مراقبة وتنسيق أوامر التصنيع، الجدولة الحية، والتنفيذ على أرض الصالة في منظومة تشغيل واحدة.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
          <Button variant="outline" size="sm" className="gap-2 rounded-full border-cyan-500/40 bg-background/80" asChild>
            <Link href="/ar/production/orders">
              <ClipboardList className="h-4 w-4" />
              سجل الأوامر
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="gap-2 rounded-full border-cyan-500/40 bg-background/80" asChild>
            <Link href="/ar/production/operations">
              <ClipboardList className="h-4 w-4" />
              إدخال تشغيل المشرف
            </Link>
          </Button>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {items.map((it, i) => (
            <motion.div
              key={it.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl border border-border bg-background/70 p-4 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] text-muted-foreground">{it.label}</p>
                <it.icon className={`h-4 w-4 ${it.tone}`} />
              </div>
              <p className="mt-2 text-xl font-bold tabular-nums">{it.value}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.header>
  );
}

function LiveScheduler({
  machines,
  orders
}: {
  machines: MachineSnapshot[];
  orders: ProductionOrder[];
}) {
  const hours = ["06", "08", "10", "12", "14", "16", "18"];
  return (
    <Card className="erp-card overflow-hidden rounded-3xl">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
        <CardTitle className="text-base">جدول التشغيل الحي</CardTitle>
        <div className="flex flex-wrap gap-2 text-[10px]">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-live" /> تشغيل
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5">مخطط</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5">متأخر</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5">صيانة</span>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto p-4 pt-2">
        <div className="min-w-[720px]">
          <div className="mb-2 grid grid-cols-[100px_repeat(7,1fr)] gap-1 text-center text-[10px] text-muted-foreground">
            <span>المصدر</span>
            {hours.map((h) => (
              <span key={h}>{h}:00</span>
            ))}
          </div>
          {machines.map((m, row) => (
            <div key={m.id} className="mb-2 grid grid-cols-[100px_repeat(7,1fr)] gap-1 items-center">
              <div className="truncate text-xs font-medium">{m.code}</div>
              {hours.map((_, col) => {
                const order = orders.find((o) => o.machineId === m.id);
                const isRunning = order?.status === "running" && col >= 2 && col <= 5;
                const isPlanned = order?.status === "planned" && col <= 2;
                const isDelay = order?.status === "delayed" && col >= 4;
                const isMaint = m.status === "maintenance" && col === 3;
                let cls = "bg-muted/30 border border-border/50";
                if (isMaint) cls = "bg-rose-500/20 border border-rose-500/40";
                else if (isRunning) cls = "bg-emerald-500/25 border border-emerald-500/40";
                else if (isDelay) cls = "bg-amber-500/20 border border-amber-500/40";
                else if (isPlanned) cls = "bg-sky-500/15 border border-sky-500/30";
                return (
                  <div key={col} className={`h-10 rounded-md ${cls} transition-colors`}>
                    {col === 2 && order ? (
                      <div className="flex h-full items-center justify-center px-0.5 text-[9px] font-medium leading-tight">{order.id.slice(-6)}</div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ProductionFlowDiagram({ activeStage }: { activeStage: number }) {
  const stages = [
    { key: "raw", label: "مواد خام", icon: Box },
    { key: "inj", label: "حقن", icon: Factory },
    { key: "cool", label: "تبريد", icon: Layers },
    { key: "blow", label: "نفخ", icon: Package },
    { key: "pack", label: "تغليف", icon: PackageOpen },
    { key: "wh", label: "مستودع", icon: Warehouse }
  ];
  return (
    <Card className="erp-card rounded-3xl">
      <CardHeader>
        <CardTitle className="text-base">تدفق الإنتاج</CardTitle>
        <p className="text-xs text-muted-foreground">مراحل خط الصنع مع مؤشر الحيّة</p>
      </CardHeader>
      <CardContent>
        <div dir="ltr" className="relative flex flex-wrap items-center justify-center gap-1 md:gap-2">
          {/* SVG flow line behind stages */}
          <svg className="pointer-events-none absolute left-1/2 top-1/2 hidden h-24 w-[92%] max-w-3xl -translate-x-1/2 -translate-y-1/2 md:block" aria-hidden>
            <defs>
              <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(34,211,238,0.15)" />
                <stop offset="50%" stopColor="rgba(34,211,238,0.55)" />
                <stop offset="100%" stopColor="rgba(34,211,238,0.15)" />
              </linearGradient>
            </defs>
            <motion.path
              d="M 20 48 Q 200 20 400 48 T 780 48"
              fill="none"
              stroke="url(#flowGrad)"
              strokeWidth="3"
              strokeDasharray="8 6"
              initial={{ strokeDashoffset: 0 }}
              animate={{ strokeDashoffset: -28 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </svg>
          {stages.map((s, i) => (
            <motion.div key={s.key} className="relative z-10 flex items-center gap-1 md:gap-2">
              <motion.div
                animate={activeStage === i ? { scale: [1, 1.05, 1], boxShadow: ["0 0 0 0 rgba(34,211,238,0)", "0 0 20px 2px rgba(34,211,238,0.35)", "0 0 0 0 rgba(34,211,238,0)"] } : {}}
                transition={{ duration: 2, repeat: activeStage === i ? Infinity : 0 }}
                className={`flex min-w-[4.5rem] flex-col items-center rounded-xl border px-2 py-3 text-center md:min-w-[5rem] md:px-3 ${
                  activeStage === i ? "border-cyan-400/50 bg-cyan-500/15" : "border-border bg-background/60"
                }`}
              >
                <s.icon className={`h-5 w-5 ${activeStage === i ? "text-cyan-300" : "text-muted-foreground"}`} />
                <span className="mt-1 text-[10px] font-medium">{s.label}</span>
              </motion.div>
              {i < stages.length - 1 ? (
                <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="hidden sm:block">
                  <ArrowRight className="h-4 w-4 text-cyan-500/60" />
                </motion.div>
              ) : null}
            </motion.div>
          ))}
        </div>
        {activeStage >= 4 ? (
          <p className="mt-3 text-center text-[11px] text-amber-400">تنبيه: اختناار محتمل عند التغليف مراقبة السير</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function OrderCard({
  order,
  index,
  onSelect,
  selected
}: {
  order: ProductionOrder;
  index: number;
  onSelect: () => void;
  selected: boolean;
}) {
  const pct = Math.min(100, Math.round((order.producedQty / order.targetQty) * 100));
  const remaining = order.targetQty - order.producedQty;
  const cfg = statusConfig[order.status];
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect();
      }}
      className={`erp-card cursor-pointer overflow-hidden rounded-2xl border transition-all hover:border-cyan-500/40 ${selected ? "ring-2 ring-cyan-500/40" : ""}`}
    >
      <div className="relative h-36 border-b border-border">
        <img src={order.productImage} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 to-transparent" />
        <Badge className="absolute left-2 top-2" variant={cfg.variant}>
          {cfg.pulse ? <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-live" /> : null}
          {cfg.label}
        </Badge>
        <p className="absolute bottom-2 right-2 left-2 text-sm font-bold">{order.productName}</p>
      </div>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">رقم الأمر</span>
          <span className="font-mono font-semibold">{order.id}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <motion.div className="h-full rounded-full bg-gradient-to-l from-cyan-500 to-emerald-500" initial={{ width: 0 }} animate={{ width: `${pct}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="text-muted-foreground">الهدف</span>
            <p className="font-semibold">{order.targetQty.toLocaleString("ar")}</p>
          </div>
          <div>
            <span className="text-muted-foreground">المُنجز</span>
            <p className="font-semibold">{order.producedQty.toLocaleString("ar")}</p>
          </div>
          <div>
            <span className="text-muted-foreground">متبقي</span>
            <p className="font-semibold">{remaining.toLocaleString("ar")}</p>
          </div>
          <div>
            <span className="text-muted-foreground">الجودة</span>
            <p>{order.quality === "pass" ? "مقبول" : order.quality === "warning" ? "مراجعة" : "مرفوض"}</p>
          </div>
        </div>
        <div className="border-t border-border pt-2 text-[11px] text-muted-foreground">
          <p>
            {order.hall} · {order.machineCode} · قالب: {order.mold}
          </p>
          <p>
            {order.materials} · {order.operator} · شيفت {order.shift} · ETA {order.eta}
          </p>
        </div>
      </CardContent>
    </motion.article>
  );
}

function MachineTelemetryPanel({ order, machine }: { order: ProductionOrder; machine: MachineSnapshot }) {
  const speed = Math.max(20, Math.round(order.producedQty / 14));
  const cycle = (60 / Math.max(1, speed / 10)).toFixed(1);
  return (
    <Card className="erp-card rounded-3xl">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">اتصال الماكينة — {machine.code}</CardTitle>
          <Badge variant="success" className="gap-1">
            <Radio className="h-3 w-3" /> مباشر
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">أمر مرتبط: {order.id}</p>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "سرعة الإنتاج", value: `${speed} قطعة/س`, icon: Activity },
          { label: "زمن الدورة", value: `${cycle} د`, icon: Timer },
          { label: "توقف اليوم", value: `${machine.downtimeMinutesToday} د`, icon: PauseCircle },
          { label: "الطاقة التقديرية", value: `${Math.round(machine.producedWeightKgToday * 2.1)} kW`, icon: Zap },
          { label: "القالب الحالي", value: machine.currentMold ?? "—", icon: Layers },
          { label: "استهلاك مادة", value: `${(machine.producedWeightKgToday * 0.95).toFixed(1)} كغ/س`, icon: Box }
        ].map((row) => (
          <div key={row.label} className="rounded-xl border border-border bg-background/60 p-3">
            <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <row.icon className="h-3.5 w-3.5" />
              {row.label}
            </p>
            <p className="mt-1 text-sm font-semibold">{row.value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function QualityMaterialPanel({
  dashboard,
  orders,
  kpis
}: {
  dashboard: LiveDashboard;
  orders: ProductionOrder[];
  kpis: ProductionDashboardKpisJson | null;
}) {
  const rejectRate = kpis?.quality.failRate ?? dashboard.kpis.wasteRate;
  const avgEff =
    orders.length > 0 ? Math.round(orders.reduce((s, o) => s + (o.producedQty / o.targetQty) * 100, 0) / orders.length) : 0;
  return (
    <div className="grid gap-4">
      <Card className="erp-card rounded-3xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            مراقبة الجودة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-foreground">
          <div className="flex justify-between gap-3">
            <span className="text-foreground/85">نسبة الرفض / الهدر</span>
            <span className="font-bold tabular-nums text-amber-600 dark:text-amber-400">{rejectRate}%</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-foreground/85">فحوصات الفترة</span>
            <span className="text-end font-medium text-foreground">
              {kpis ? `${kpis.quality.totalInspections} فحص · نجاح ${kpis.quality.passRate}%` : "42 مقبول · 3 إعادة فحص"}
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground/90">أكثر العيوب تكراراً</p>
            <div className="flex flex-wrap gap-2">
              {(kpis?.quality.topDefects.length ? kpis.quality.topDefects : [
                { name: "أبعاد", quantity: 34 },
                { name: "قصر حقن", quantity: 28 },
                { name: "تشقق", quantity: 22 }
              ]).map((d) => (
                <span
                  key={d.name}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-foreground"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500/80" />
                  {d.name} {d.quantity}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            {[
              "https://images.pexels.com/photos/3735747/pexels-photo-3735747.jpeg?auto=compress&w=120",
              "https://images.pexels.com/photos/448974/pexels-photo-448974.jpeg?auto=compress&w=120"
            ].map((src, i) => (
              <div key={src} className="relative h-14 w-14 overflow-hidden rounded-lg border border-border">
                <img src={src} alt="" className="h-full w-full object-cover opacity-90" />
                <span className="absolute bottom-0 left-0 right-0 bg-black/70 py-0.5 text-center text-[9px] font-medium text-white">
                  عينة {i + 1}
                </span>
              </div>
            ))}
            <div className="flex h-14 w-14 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-foreground/90">
              <ImageIcon className="h-5 w-5" />
              <span className="text-[9px] font-medium">المزيد</span>
            </div>
          </div>
          {dashboard.alerts.slice(0, 2).map((a) => (
            <div
              key={a.id}
              className={`rounded-lg border p-2 text-[11px] font-medium leading-relaxed ${
                a.severity === "critical"
                  ? "border-rose-500/45 bg-rose-500/[0.12] text-rose-950 dark:text-rose-50"
                  : "border-amber-500/40 bg-amber-500/[0.12] text-amber-950 dark:text-amber-50"
              }`}
            >
              تنبيه جودة / تشغيل: {a.message}
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="erp-card rounded-3xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Box className="h-4 w-4 text-sky-400" />
            استهلاك المواد
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">مادة خام رئيسية:</span> PP / PE حسب أمر التشغيل
          </p>
          <p>
            <span className="text-muted-foreground">نسبة الهدر:</span> {dashboard.kpis.wasteRate}%
          </p>
          <p>
            <span className="text-muted-foreground">كفاءة استخدام مادة:</span> {avgEff}%
          </p>
          <p className="text-xs text-muted-foreground">تأثير المخزون: مستودع رئيسي — حد تنبيه منخفض لـ PP</p>
        </CardContent>
      </Card>
    </div>
  );
}

function OperatorShiftSection({ orders }: { orders: ProductionOrder[] }) {
  return (
    <Card className="erp-card rounded-3xl">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <User className="h-4 w-4" />
          المشغلون والورديات
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {orders.slice(0, 3).map((o) => (
          <div key={o.id} className="rounded-xl border border-border bg-background/60 p-3">
            <p className="font-semibold">{o.operator}</p>
            <p className="text-xs text-muted-foreground">شيفت {o.shift} · {o.machineCode}</p>
            <p className="mt-2 text-[11px] text-muted-foreground">إنتاجية التقدير: {Math.round((o.producedQty / o.targetQty) * 100)}% من الهدف</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AnalyticsSection({
  trendData,
  utilizationByMachine,
  dashboard
}: {
  trendData: { name: string; produced: number; waste: number }[];
  utilizationByMachine: { name: string; u: number }[];
  dashboard: LiveDashboard;
}) {
  return (
    <Card className="erp-card rounded-3xl">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          تحليلات ورؤى
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-8 lg:grid-cols-2">
        <div className="h-52">
          <p className="mb-2 text-xs text-muted-foreground">اتجاه الإنتاج</p>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Area type="monotone" dataKey="produced" stroke="#22d3ee" fill="rgba(34,211,238,0.2)" />
              <Area type="monotone" dataKey="waste" stroke="#f97316" fill="rgba(249,115,22,0.15)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="h-52">
          <p className="mb-2 text-xs text-muted-foreground">استخدام الماكينات</p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={utilizationByMachine}>
              <CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <Tooltip />
              <Bar dataKey="u" fill="#38bdf8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="h-48 lg:col-span-2">
          <p className="mb-2 text-xs text-muted-foreground">توزيع وقت التوقف / الهدر (حسب الماكينة)</p>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={dashboard.machines.map((m) => ({
                name: m.code,
                downtime: m.downtimeMinutesToday,
                waste: Math.round(m.wasteKgToday * 10)
              }))}
            >
              <CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <Tooltip />
              <Line type="monotone" dataKey="downtime" name="توقف (د)" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="waste" name="هدر×10 (كغ)" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="lg:col-span-2 grid gap-4 sm:grid-cols-3 text-center text-sm">
          <div className="rounded-xl border border-border bg-background/60 p-3">
            <p className="text-muted-foreground">وقت التوقف (اليوم)</p>
            <p className="mt-1 font-bold">{dashboard.machines.reduce((s, m) => s + m.downtimeMinutesToday, 0)} دقيقة</p>
          </div>
          <div className="rounded-xl border border-border bg-background/60 p-3">
            <p className="text-muted-foreground">أفضل ماكينة</p>
            <p className="mt-1 font-bold">
              {dashboard.machines.length === 0
                ? "—"
                : dashboard.machines.reduce((best, m) => (m.producedPiecesToday > best.producedPiecesToday ? m : best), dashboard.machines[0]).code}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background/60 p-3">
            <p className="text-muted-foreground">أعلى منتج إخراجاً</p>
            <p className="mt-1 font-bold truncate">غطاء 5 لتر</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
