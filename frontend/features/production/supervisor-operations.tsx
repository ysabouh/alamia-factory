"use client";

import type React from "react";
import { useMemo, useState } from "react";
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

type OperationState = "idle" | "saving" | "saved" | "error";
type WorkspaceTab = "production" | "mold" | "waste" | "maintenance" | "status";

interface MachineData {
  id: number;
  code: string;
  hall: string;
  status: "running" | "idle" | "maintenance";
  mold: string;
  orderId: string;
  efficiency: number;
  operator: string;
  warning?: string;
  telemetry: { temp: number; pressure: number; runtime: number; energy: number; vibration: number; error: string };
}

const machineList: MachineData[] = [
  {
    id: 1,
    code: "INJ-01",
    hall: "صالة الحقن A",
    status: "running",
    mold: "MOLD-CAP-5L",
    orderId: "PO-2026-3041",
    efficiency: 91,
    operator: "محمد خالد",
    telemetry: { temp: 218, pressure: 186, runtime: 12.4, energy: 82, vibration: 2.1, error: "OK-0" }
  },
  {
    id: 2,
    code: "BLW-02",
    hall: "صالة النفخ B",
    status: "idle",
    mold: "MOLD-BTL-1L",
    orderId: "PO-2026-3047",
    efficiency: 73,
    operator: "سامر وليد",
    warning: "تذبذب توريد PET",
    telemetry: { temp: 194, pressure: 164, runtime: 8.1, energy: 64, vibration: 1.8, error: "WARN-12" }
  },
  {
    id: 3,
    code: "INJ-04",
    hall: "صالة الحقن A",
    status: "maintenance",
    mold: "MOLD-HANDLE-PP",
    orderId: "PO-2026-3053",
    efficiency: 51,
    operator: "—",
    warning: "عطل هيدروليك",
    telemetry: { temp: 152, pressure: 118, runtime: 5.9, energy: 39, vibration: 4.2, error: "CRIT-41" }
  }
];

const feedItems = [
  "19:44 — تغيير قالب BLW-02",
  "19:38 — تسجيل دفعة إنتاج 1,200 قطعة على INJ-01",
  "19:31 — تنبيه صيانة حرِج على INJ-04",
  "19:24 — تسجيل هدر 14.2 كغ",
  "19:10 — اعتماد وردية B"
];

export function SupervisorOperations() {
  const [state, setState] = useState<OperationState>("idle");
  const [message, setMessage] = useState<string>("");
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("production");
  const [selectedMachineId, setSelectedMachineId] = useState<number>(machineList[0].id);
  const selectedMachine = useMemo(
    () => machineList.find((m) => m.id === selectedMachineId) ?? machineList[0],
    [selectedMachineId]
  );

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
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "تعذر تنفيذ العملية.");
    }
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
                المشرف: م. عبدالعزيز الغامدي · وردية B · {selectedMachine.hall}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <Badge variant="success" className="gap-1">
                  <Radio className="h-3 w-3" />
                  المصنع متصل
                </Badge>
                <Badge variant="warning">3 تنبيهات مباشرة</Badge>
                <Badge variant="info">إنتاج نشط: 5 أوامر</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <TopMetric title="الإخراج الحالي" value="24,880" suffix="قطعة" />
              <TopMetric title="استخدام الخط" value="86" suffix="%" />
              <TopMetric title="طلبات الصيانة" value="2" suffix="مفتوحة" />
              <TopMetric title="حالة المصنع" value="Stable" suffix="" />
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
              {machineList.map((machine) => (
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
              ))}
            </CardContent>
          </Card>

          <Card className="erp-card rounded-3xl">
            <CardHeader className="space-y-3 border-b border-border pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Active Workspace · {selectedMachine.code}</CardTitle>
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
              {activeTab === "production" ? <ProductionTab machine={selectedMachine} submit={submit} /> : null}
              {activeTab === "mold" ? <MoldTab machine={selectedMachine} submit={submit} /> : null}
              {activeTab === "waste" ? <WasteTab machine={selectedMachine} submit={submit} /> : null}
              {activeTab === "maintenance" ? <MaintenanceTab machine={selectedMachine} submit={submit} /> : null}
              {activeTab === "status" ? <StatusTab machine={selectedMachine} /> : null}
            </CardContent>
          </Card>
        </section>

        <Card className="erp-card rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm">Live Activity Feed</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {feedItems.map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-lg border border-border bg-background/55 p-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 pulse-live" />
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-5 left-5 z-20 flex flex-col gap-2">
        <Button className="h-10 w-10 rounded-full p-0" onClick={() => setActiveTab("production")}><Plus className="h-4 w-4" /></Button>
        <Button className="h-10 w-10 rounded-full p-0" variant="secondary" onClick={() => setActiveTab("maintenance")}><Siren className="h-4 w-4" /></Button>
      </div>
    </main>
  );
}

function TopMetric({ title, value, suffix }: { title: string; value: string; suffix: string }) {
  return <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-xs"><p className="text-cyan-200">{title}</p><p className="mt-1 text-lg font-bold">{value} <span className="text-[10px] text-slate-300">{suffix}</span></p></div>;
}

function ProductionTab({ machine, submit }: { machine: MachineData; submit: (path: string, formData: FormData) => Promise<void> }) {
  return (
    <form action={(fd) => submit("/production/entries", fd)} className="grid gap-4">
      <div className="grid gap-3 rounded-xl border border-border bg-background/55 p-4 md:grid-cols-3">
        <TelemetryPill label="الأمر الحالي" value={machine.orderId} icon={ClipboardCheck} />
        <TelemetryPill label="المنتج / الهدف" value="7,400 / 10,000" icon={Activity} />
        <TelemetryPill label="المتبقي" value="2,600 قطعة" icon={Timer} />
        <TelemetryPill label="سرعة الدورة" value="21.4 cyc/min" icon={Waves} />
        <TelemetryPill label="Reject Count" value="84" icon={AlertTriangle} />
        <TelemetryPill label="إخراج الوردية" value="3,180 قطعة" icon={Zap} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <FactoryInput name="machine_id" label="رقم الماكينة" defaultValue={String(machine.id)} />
        <FactoryInput name="mold_id" label="رقم القالب" defaultValue={machine.mold} />
        <FactoryInput name="shift_id" label="رقم الوردية" defaultValue="2" />
        <FactoryInput name="entry_date" label="التاريخ" type="date" />
        <FactoryInput name="produced_pieces" label="دفعة الإنتاج (قطعة)" />
        <FactoryInput name="produced_weight_kg" label="الوزن المنتج (كغ)" optional />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" className="gap-1"><Plus className="h-4 w-4" />تسجيل دفعة إنتاج</Button>
        <Button type="button" variant="secondary" className="gap-1"><PauseCircle className="h-4 w-4" />إيقاف مؤقت</Button>
        <Button type="button" variant="outline" className="gap-1"><CheckCircle2 className="h-4 w-4" />إكمال الأمر</Button>
      </div>
    </form>
  );
}

function MoldTab({ machine, submit }: { machine: MachineData; submit: (path: string, formData: FormData) => Promise<void> }) {
  return (
    <form action={(fd) => submit("/production/assignments", fd)} className="grid gap-4">
      <div className="grid gap-3 rounded-xl border border-border bg-background/55 p-4 md:grid-cols-3">
        <TelemetryPill label="القالب الحالي" value={machine.mold} icon={Layers} />
        <TelemetryPill label="Setup ETA" value="18 دقيقة" icon={Timer} />
        <TelemetryPill label="الفني المسؤول" value="وليد عمران" icon={Hammer} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <FactoryInput name="machine_id" label="رقم الماكينة" defaultValue={String(machine.id)} />
        <FactoryInput name="mold_id" label="القالب الجديد" />
        <FactoryInput name="work_order_id" label="رقم أمر التشغيل" defaultValue={machine.orderId} optional />
        <FactoryInput name="technician_id" label="رقم الفني" optional />
      </div>
      <Button type="submit" className="w-fit">تنفيذ إسناد القالب</Button>
    </form>
  );
}

function WasteTab({ machine, submit }: { machine: MachineData; submit: (path: string, formData: FormData) => Promise<void> }) {
  const data = [{ name: "أبعاد", value: 38, color: "#f97316" }, { name: "لون", value: 23, color: "#a78bfa" }, { name: "تشوه", value: 26, color: "#22d3ee" }, { name: "أخرى", value: 13, color: "#64748b" }];
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
      <form action={(fd) => submit("/production/waste", fd)} className="grid gap-3">
        <div className="grid gap-3 md:grid-cols-2">
          <FactoryInput name="machine_id" label="رقم الماكينة" defaultValue={String(machine.id)} />
          <FactoryInput name="shift_id" label="رقم الوردية" defaultValue="2" />
          <FactoryInput name="entry_date" label="التاريخ" type="date" />
          <FactoryInput name="reason" label="سبب الهدر" />
          <FactoryInput name="quantity" label="كمية الهدر (قطعة)" optional />
          <FactoryInput name="weight_kg" label="وزن الهدر (كغ)" />
        </div>
        <Button type="submit" className="w-fit">تسجيل الهدر</Button>
      </form>
      <Card className="border-border bg-background/55">
        <CardHeader><CardTitle className="text-sm">Waste Analytics</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="h-40"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={34} outerRadius={62} stroke="none">{data.map((d) => <Cell key={d.name} fill={d.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
          <p className="text-xs text-muted-foreground">اقتراح: تقليل ضغط الحقن في بداية الوردية بنسبة 3%.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function MaintenanceTab({ machine, submit }: { machine: MachineData; submit: (path: string, formData: FormData) => Promise<void> }) {
  return (
    <form action={(fd) => submit("/maintenance/tickets", fd)} className="grid gap-3 md:grid-cols-2">
      <FactoryInput name="machine_id" label="رقم الماكينة" defaultValue={String(machine.id)} />
      <FactoryInput name="severity" label="الخطورة (low/medium/high/critical)" />
      <FactoryInput name="title" label="عنوان المشكلة" />
      <FactoryInput name="reported_by_id" label="رقم المبلغ" optional />
      <FactoryInput name="assigned_technician_id" label="رقم الفني" optional />
      <FactoryInput name="impact" label="تأثير الإنتاج" optional />
      <div className="md:col-span-2 flex flex-wrap gap-2">
        <Button type="submit" className="gap-1"><ShieldAlert className="h-4 w-4" />إرسال بلاغ صيانة</Button>
        <Button type="button" variant="destructive" className="gap-1"><Siren className="h-4 w-4" />إيقاف الماكينة</Button>
        <Button type="button" variant="secondary" className="gap-1"><AlertTriangle className="h-4 w-4" />تصعيد الحالة</Button>
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
      <p className="flex items-center gap-1 text-[11px] text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</p>
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
