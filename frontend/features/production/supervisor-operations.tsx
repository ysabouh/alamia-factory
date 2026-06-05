"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Droplets,
  Gauge,
  Hammer,
  Layers,
  PauseCircle,
  PlayCircle,
  Plus,
  Radio,
  ShieldAlert,
  Siren,
  Thermometer,
  Timer,
  Waves,
  Zap
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { postOperation } from "@/lib/api/operations";
import { machinesApi, type MachineJson } from "@/lib/api/machines-client";
import { productionApi, ProductionApiError, type WorkOrderJson } from "@/lib/api/production-client";

type OperationState = "idle" | "saving" | "saved" | "error";
type WorkspaceTab = "production" | "mold" | "waste" | "maintenance" | "status";

interface MachineData {
  id: string;
  code: string;
  hall: string;
  status: "running" | "idle" | "maintenance";
  mold: string;
  orderId: string;
  orderDbId: string | null;
  orderStatus: WorkOrderJson["status"] | null;
  plannedQty: number;
  producedQty: number;
  efficiency: number;
  operator: string;
  warning?: string;
  telemetry: { temp: number; pressure: number; runtime: number; energy: number; vibration: number; error: string };
}

function mapMachineStatus(status: MachineJson["status"]): MachineData["status"] {
  if (status === "running") return "running";
  if (status === "maintenance" || status === "breakdown") return "maintenance";
  return "idle";
}

function buildMachineData(machines: MachineJson[], orders: WorkOrderJson[]): MachineData[] {
  return machines.map((m, i) => {
    const order = orders.find((o) => o.machineId === m.id && (o.status === "running" || o.status === "paused"));
    const planned = order?.plannedQuantity ?? 10000;
    const produced = order?.producedQuantity ?? m.todayProducedUnits;
    const efficiency = Math.min(100, Math.round((produced / Math.max(1, planned)) * 100));
    return {
      id: m.id,
      code: m.code,
      hall: m.factorySection ?? m.productionLine ?? "خط الإنتاج",
      status: mapMachineStatus(m.status),
      mold: order?.moldCode ?? "—",
      orderId: order?.orderNo ?? "—",
      orderDbId: order?.id ?? null,
      orderStatus: order?.status ?? null,
      plannedQty: planned,
      producedQty: produced,
      efficiency,
      operator: order?.supervisorName ?? "—",
      warning: m.openBreakdownCount > 0 ? `${m.openBreakdownCount} عطل مفتوح` : undefined,
      telemetry: {
        temp: 180 + (i % 5) * 8,
        pressure: 120 + (i % 4) * 15,
        runtime: 4 + i * 1.2,
        energy: 40 + (i % 6) * 10,
        vibration: 1.5 + (i % 3) * 0.8,
        error: m.status === "breakdown" ? "CRIT" : m.statusNote ?? "OK"
      }
    };
  });
}

export function SupervisorOperations() {
  const [state, setState] = useState<OperationState>("idle");
  const [message, setMessage] = useState<string>("");
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("production");
  const [machineList, setMachineList] = useState<MachineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMachineId, setSelectedMachineId] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [machinesRes, runningRes] = await Promise.all([
        machinesApi.list({ pageSize: 50 }),
        productionApi.listOrders({ pageSize: 50, status: "running" })
      ]);
      let orders = runningRes.data;
      if (!orders.length) {
        const paused = await productionApi.listOrders({ pageSize: 50, status: "paused" });
        orders = [...orders, ...paused.data];
      }
      const mapped = buildMachineData(machinesRes.data, orders);
      setMachineList(mapped);
      if (!selectedMachineId && mapped[0]) setSelectedMachineId(mapped[0].id);
    } catch {
      setMachineList([]);
    } finally {
      setLoading(false);
    }
  }, [selectedMachineId]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedMachine = useMemo(
    () => machineList.find((m) => m.id === selectedMachineId) ?? machineList[0],
    [machineList, selectedMachineId]
  );

  const activeOrders = machineList.filter((m) => m.orderDbId && m.orderStatus === "running").length;

  async function submit(path: string, formData: FormData) {
    setState("saving");
    setMessage("");

    const payload = Object.fromEntries(
      Array.from(formData.entries()).filter(([, value]) => value !== "")
    );

    try {
      await postOperation(path, payload);
      setState("saved");
      setMessage("تم تنفيذ العملية بنجاح.");
      await load();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "تعذر تنفيذ العملية.");
    }
  }

  const runOrderAction = async (action: "pause" | "resume" | "complete") => {
    if (!selectedMachine?.orderDbId) {
      setMessage("لا يوجد أمر إنتاج نشط على هذه الماكينة.");
      setState("error");
      return;
    }
    setState("saving");
    try {
      const fn = {
        pause: productionApi.pauseOrder,
        resume: productionApi.resumeOrder,
        complete: productionApi.completeOrder
      }[action];
      await fn(selectedMachine.orderDbId);
      setState("saved");
      setMessage("تم تحديث أمر الإنتاج.");
      await load();
    } catch (e) {
      setState("error");
      setMessage(e instanceof ProductionApiError ? e.message : "فشلت العملية");
    }
  };

  const submitProductionLog = async (formData: FormData) => {
    if (!selectedMachine?.orderDbId) {
      setMessage("لا يوجد أمر إنتاج لربط السجل.");
      setState("error");
      return;
    }
    const produced = Number(formData.get("produced_pieces") ?? 0);
    const now = new Date();
    const from = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    setState("saving");
    try {
      await productionApi.createLog(selectedMachine.orderDbId, {
        fromTime: from.toISOString(),
        toTime: now.toISOString(),
        goodQuantity: produced,
        scrapQuantity: Number(formData.get("scrap_pieces") ?? 0) || 0
      });
      setState("saved");
      setMessage("تم تسجيل دفعة الإنتاج على الأمر.");
      await load();
    } catch (e) {
      setState("error");
      setMessage(e instanceof ProductionApiError ? e.message : "فشل التسجيل");
    }
  };

  if (loading) {
    return (
      <main className="factory-grid min-h-screen bg-background p-4 md:p-6" dir="rtl">
        <p className="text-muted-foreground">جاري تحميل بيانات التشغيل…</p>
      </main>
    );
  }

  return (
    <main className="factory-grid min-h-screen bg-background p-4 md:p-6" dir="rtl">
      <div className="mx-auto grid max-w-[1800px] gap-4">
        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-cyan-500/20 bg-[linear-gradient(150deg,rgba(2,8,23,0.94),rgba(7,20,40,0.96))] p-5 text-white"
        >
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="text-xs tracking-[0.22em] text-cyan-300">SUPERVISOR OPS TERMINAL</p>
              <h1 className="mt-1 text-2xl font-bold">مساحة تشغيل المشرف</h1>
              <p className="mt-2 text-sm text-slate-300">
                {selectedMachine ? `${selectedMachine.hall} · ${selectedMachine.code}` : "—"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <Badge variant="success" className="gap-1">
                  <Radio className="h-3 w-3" />
                  المصنع متصل
                </Badge>
                <Badge variant="info">إنتاج نشط: {activeOrders} أوامر</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <TopMetric
                title="الإخراج الحالي"
                value={machineList.reduce((s, m) => s + m.producedQty, 0).toLocaleString("ar")}
                suffix="قطعة"
              />
              <TopMetric
                title="متوسط الكفاءة"
                value={String(
                  machineList.length
                    ? Math.round(machineList.reduce((s, m) => s + m.efficiency, 0) / machineList.length)
                    : 0
                )}
                suffix="%"
              />
              <TopMetric title="ماكينات" value={String(machineList.length)} suffix="" />
              <TopMetric title="أوامر مرتبطة" value={String(machineList.filter((m) => m.orderDbId).length)} suffix="" />
            </div>
          </div>
        </motion.header>

        {message ? (
          <div className="rounded-xl border border-border bg-card/85 p-3 text-sm">
            <span className={state === "error" ? "text-rose-500" : "text-emerald-500"}>{message}</span>
          </div>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[350px_1fr]">
          <Card className="erp-card rounded-3xl">
            <CardHeader>
              <CardTitle className="text-sm">الملاحة الصناعية للماكينات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {machineList.length ? (
                machineList.map((machine) => (
                  <button
                    key={machine.id}
                    type="button"
                    onClick={() => setSelectedMachineId(machine.id)}
                    className={`w-full rounded-2xl border p-3 text-right transition ${
                      selectedMachineId === machine.id ? "border-cyan-500/50 bg-cyan-500/10" : "border-border bg-background/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{machine.code}</p>
                      <span className="text-xs text-muted-foreground">{machine.orderId}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">قالب: {machine.mold}</p>
                    <div className="mt-2 h-1.5 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-gradient-to-l from-cyan-500 to-emerald-500" style={{ width: `${machine.efficiency}%` }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">كفاءة {machine.efficiency}%</span>
                      <span className={machine.status === "running" ? "text-emerald-400" : machine.status === "maintenance" ? "text-rose-400" : "text-amber-400"}>
                        {machine.status === "running" ? "تشغيل" : machine.status === "maintenance" ? "صيانة" : "انتظار"}
                      </span>
                    </div>
                    {machine.warning ? (
                      <p className="mt-2 flex items-center gap-1 text-[11px] text-amber-400">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {machine.warning}
                      </p>
                    ) : null}
                  </button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">لا توجد ماكينات.</p>
              )}
            </CardContent>
          </Card>

          <Card className="erp-card rounded-3xl">
            <CardHeader className="space-y-3 border-b border-border pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Active Workspace · {selectedMachine?.code ?? "—"}</CardTitle>
                <p className="text-xs text-muted-foreground">الحالة: {state === "saving" ? "تنفيذ..." : state === "saved" ? "تم" : state === "error" ? "فشل" : "جاهز"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "production", label: "الإنتاج", icon: PlayCircle },
                  { id: "mold", label: "إسناد القالب", icon: Layers },
                  { id: "waste", label: "الهدر", icon: Droplets },
                  { id: "maintenance", label: "الصيانة", icon: ShieldAlert },
                  { id: "status", label: "حالة الماكينة", icon: Gauge }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as WorkspaceTab)}
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs ${
                      activeTab === tab.id ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-100" : "border-border bg-background/60"
                    }`}
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              {selectedMachine ? (
                <>
                  {activeTab === "production" ? (
                    <ProductionTab machine={selectedMachine} submit={submit} submitLog={submitProductionLog} runAction={runOrderAction} />
                  ) : null}
                  {activeTab === "mold" ? <MoldTab machine={selectedMachine} submit={submit} /> : null}
                  {activeTab === "waste" ? <WasteTab machine={selectedMachine} submit={submit} /> : null}
                  {activeTab === "maintenance" ? <MaintenanceTab machine={selectedMachine} submit={submit} /> : null}
                  {activeTab === "status" ? <StatusTab machine={selectedMachine} /> : null}
                </>
              ) : (
                <p className="text-muted-foreground">اختر ماكينة.</p>
              )}
            </CardContent>
          </Card>
        </section>

        {selectedMachine?.orderDbId ? (
          <Card className="erp-card rounded-2xl">
            <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
              <span>أمر نشط: {selectedMachine.orderId}</span>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/ar/production/orders/${selectedMachine.orderDbId}`}>تفاصيل الأمر</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <div className="fixed bottom-5 left-5 z-20 flex flex-col gap-2">
        <Button className="h-10 w-10 rounded-full p-0" onClick={() => setActiveTab("production")}>
          <Plus className="h-4 w-4" />
        </Button>
        <Button className="h-10 w-10 rounded-full p-0" variant="secondary" onClick={() => setActiveTab("maintenance")}>
          <Siren className="h-4 w-4" />
        </Button>
      </div>
    </main>
  );
}

function TopMetric({ title, value, suffix }: { title: string; value: string; suffix: string }) {
  return (
    <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-xs">
      <p className="text-cyan-200">{title}</p>
      <p className="mt-1 text-lg font-bold">
        {value} <span className="text-[10px] text-slate-300">{suffix}</span>
      </p>
    </div>
  );
}

function ProductionTab({
  machine,
  submit,
  submitLog,
  runAction
}: {
  machine: MachineData;
  submit: (path: string, formData: FormData) => Promise<void>;
  submitLog: (formData: FormData) => Promise<void>;
  runAction: (action: "pause" | "resume" | "complete") => Promise<void>;
}) {
  const remaining = Math.max(0, machine.plannedQty - machine.producedQty);
  return (
    <form
      action={(fd) => void submitLog(fd)}
      className="grid gap-4"
    >
      <div className="grid gap-3 rounded-xl border border-border bg-background/55 p-4 md:grid-cols-3">
        <TelemetryPill label="الأمر الحالي" value={machine.orderId} icon={ClipboardCheck} />
        <TelemetryPill label="المنتج / الهدف" value={`${machine.producedQty.toLocaleString("ar")} / ${machine.plannedQty.toLocaleString("ar")}`} icon={Activity} />
        <TelemetryPill label="المتبقي" value={`${remaining.toLocaleString("ar")} قطعة`} icon={Timer} />
        <TelemetryPill label="حالة الأمر" value={machine.orderStatus ?? "—"} icon={Waves} />
        <TelemetryPill label="المشرف" value={machine.operator} icon={AlertTriangle} />
        <TelemetryPill label="الكفاءة" value={`${machine.efficiency}%`} icon={Zap} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <FactoryInput name="machine_id" label="رقم الماكينة" defaultValue={machine.id} />
        <FactoryInput name="produced_pieces" label="دفعة الإنتاج (قطعة)" />
        <FactoryInput name="scrap_pieces" label="هدر الدفعة (قطعة)" optional />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" className="gap-1">
          <Plus className="h-4 w-4" />
          تسجيل دفعة إنتاج
        </Button>
        {machine.orderStatus === "running" ? (
          <Button type="button" variant="secondary" className="gap-1" onClick={() => void runAction("pause")}>
            <PauseCircle className="h-4 w-4" />
            إيقاف مؤقت
          </Button>
        ) : null}
        {machine.orderStatus === "paused" ? (
          <Button type="button" variant="secondary" className="gap-1" onClick={() => void runAction("resume")}>
            <PlayCircle className="h-4 w-4" />
            استئناف
          </Button>
        ) : null}
        {machine.orderDbId ? (
          <Button type="button" variant="outline" className="gap-1" onClick={() => void runAction("complete")}>
            <CheckCircle2 className="h-4 w-4" />
            إكمال الأمر
          </Button>
        ) : null}
      </div>
      <form action={(fd) => submit("/production/entries", fd)} className="hidden" />
    </form>
  );
}

function MoldTab({ machine, submit }: { machine: MachineData; submit: (path: string, formData: FormData) => Promise<void> }) {
  return (
    <form action={(fd) => submit("/production/assignments", fd)} className="grid gap-4">
      <div className="grid gap-3 rounded-xl border border-border bg-background/55 p-4 md:grid-cols-3">
        <TelemetryPill label="القالب الحالي" value={machine.mold} icon={Layers} />
        <TelemetryPill label="الماكينة" value={machine.code} icon={Timer} />
        <TelemetryPill label="الأمر" value={machine.orderId} icon={Hammer} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <FactoryInput name="machine_id" label="رقم الماكينة" defaultValue={machine.id} />
        <FactoryInput name="mold_id" label="القالب الجديد" />
        <FactoryInput name="work_order_id" label="رقم أمر التشغيل" defaultValue={machine.orderId} optional />
      </div>
      <Button type="submit" className="w-fit">
        تنفيذ إسناد القالب
      </Button>
    </form>
  );
}

function WasteTab({ machine, submit }: { machine: MachineData; submit: (path: string, formData: FormData) => Promise<void> }) {
  const data = [
    { name: "أبعاد", value: 38, color: "#f97316" },
    { name: "لون", value: 23, color: "#a78bfa" },
    { name: "تشوه", value: 26, color: "#22d3ee" },
    { name: "أخرى", value: 13, color: "#64748b" }
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
      <form action={(fd) => submit("/production/waste", fd)} className="grid gap-3">
        <div className="grid gap-3 md:grid-cols-2">
          <FactoryInput name="machine_id" label="رقم الماكينة" defaultValue={machine.id} />
          <FactoryInput name="entry_date" label="التاريخ" type="date" />
          <FactoryInput name="reason" label="سبب الهدر" />
          <FactoryInput name="weight_kg" label="وزن الهدر (كغ)" />
        </div>
        <Button type="submit" className="w-fit">
          تسجيل الهدر
        </Button>
      </form>
      <Card className="border-border bg-background/55">
        <CardHeader>
          <CardTitle className="text-sm">Waste Analytics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={34} outerRadius={62} stroke="none">
                  {data.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MaintenanceTab({ machine, submit }: { machine: MachineData; submit: (path: string, formData: FormData) => Promise<void> }) {
  return (
    <form action={(fd) => submit("/maintenance/tickets", fd)} className="grid gap-3 md:grid-cols-2">
      <FactoryInput name="machine_id" label="رقم الماكينة" defaultValue={machine.id} />
      <FactoryInput name="severity" label="الخطورة (low/medium/high/critical)" />
      <FactoryInput name="title" label="عنوان المشكلة" />
      <div className="md:col-span-2 flex flex-wrap gap-2">
        <Button type="submit" className="gap-1">
          <ShieldAlert className="h-4 w-4" />
          إرسال بلاغ صيانة
        </Button>
      </div>
    </form>
  );
}

function StatusTab({ machine }: { machine: MachineData }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      <TelemetryPill label="Temperature" value={`${machine.telemetry.temp} C`} icon={Thermometer} />
      <TelemetryPill label="Pressure" value={`${machine.telemetry.pressure} bar`} icon={Gauge} />
      <TelemetryPill label="Runtime" value={`${machine.telemetry.runtime} h`} icon={Timer} />
      <TelemetryPill label="Energy" value={`${machine.telemetry.energy} kW`} icon={Zap} />
      <TelemetryPill label="Vibration" value={`${machine.telemetry.vibration} mm/s`} icon={Activity} />
      <TelemetryPill label="Error Code" value={machine.telemetry.error} icon={Siren} />
    </div>
  );
}

function TelemetryPill({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3">
      <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function FactoryInput({
  name,
  label,
  type = "text",
  optional = false,
  defaultValue
}: {
  name: string;
  label: string;
  type?: string;
  optional?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input
        name={name}
        type={type}
        required={!optional}
        defaultValue={defaultValue}
        className="rounded-lg border border-border bg-background/80 px-3 py-2 text-foreground outline-none focus:border-primary"
      />
    </label>
  );
}
