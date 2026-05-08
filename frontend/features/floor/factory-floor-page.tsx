"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Minus, Move, Plus, RadioTower, Siren, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { LiveDashboard, MachineSnapshot } from "@/types/factory";

type HallKey = "inj1" | "inj2" | "blow" | "packaging";

type PositionedMachine = {
  machine: MachineSnapshot;
  x: number;
  y: number;
};

type HallLayout = {
  key: HallKey;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  tone: string;
  machines: PositionedMachine[];
};

export function FactoryFloorPage({ dashboard }: { dashboard: LiveDashboard }) {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ active: boolean; x: number; y: number }>({ active: false, x: 0, y: 0 });

  const halls = useMemo(() => buildHallLayouts(dashboard.machines), [dashboard.machines]);
  const totalProduction = dashboard.machines.reduce((sum, m) => sum + m.producedPiecesToday, 0);
  const totalAlerts = dashboard.machines.filter((m) => m.activeAlert).length;
  const totalEfficiency = Math.round(
    dashboard.machines.reduce((sum, m) => sum + calcEfficiency(m), 0) / Math.max(1, dashboard.machines.length)
  );

  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    dragRef.current = { active: true, x: e.clientX - pan.x, y: e.clientY - pan.y };
  };
  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!dragRef.current.active) return;
    setPan({ x: e.clientX - dragRef.current.x, y: e.clientY - dragRef.current.y });
  };
  const onPointerUp = () => {
    dragRef.current.active = false;
  };

  return (
    <div className="ds-page" dir="rtl">
      <header className="rounded-3xl border border-border bg-card p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.25em] text-muted-foreground">FACTORY FLOOR VIEW</p>
            <h1 className="mt-2 text-2xl font-semibold md:text-3xl">عرض أرضية المصنع التفاعلي</h1>
            <p className="mt-2 text-sm text-muted-foreground">محاكاة MES/SCADA مباشرة لمواقع القاعات وحالة كل ماكينة.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-700 dark:text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-live" />
            بث حي من شبكة المصنع
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <TopStat label="إجمالي القاعات" value="4" />
        <TopStat label="إجمالي الماكينات" value={dashboard.machines.length.toLocaleString("ar")} />
        <TopStat label="الإنتاج الكلي" value={totalProduction.toLocaleString("ar")} />
        <TopStat label="الكفاءة" value={`${totalEfficiency}%`} />
        <TopStat label="تنبيهات" value={totalAlerts.toLocaleString("ar")} warn />
        <TopStat label="طاقة لحظية" value={`${Math.round(totalProduction / 20).toLocaleString("ar")}kW`} />
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-border bg-slate-950 p-3 md:p-5">
        <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(148,163,184,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.15)_1px,transparent_1px)] [background-size:28px_28px]" />

        <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 p-2 backdrop-blur">
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setScale((v) => Math.min(1.8, v + 0.1))}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setScale((v) => Math.max(0.8, v - 0.1))}>
            <Minus className="h-4 w-4" />
          </Button>
          <div className="inline-flex items-center gap-1 text-xs text-slate-200">
            <Move className="h-3.5 w-3.5" />
            تحريك
          </div>
        </div>

        <Card className="absolute bottom-4 left-4 z-20 w-72 border-white/10 bg-black/45 text-slate-100 backdrop-blur">
          <CardContent className="space-y-2 p-3">
            <p className="text-xs tracking-[0.2em] text-slate-300">LIVE MONITOR</p>
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1"><RadioTower className="h-3.5 w-3.5 text-cyan-300" />اتصال</span>
              <Badge variant="success">ONLINE</Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-amber-300" />تدفق الإنتاج</span>
              <span>{Math.round(totalProduction / 12).toLocaleString("ar")} قطعة/ساعة</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1"><Siren className="h-3.5 w-3.5 text-rose-300" />تنبيهات</span>
              <span>{totalAlerts.toLocaleString("ar")}</span>
            </div>
          </CardContent>
        </Card>

        <div
          className="relative h-[860px] cursor-grab overflow-hidden rounded-2xl border border-white/10 active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <motion.div
            className="relative h-full w-full origin-top-right"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
          >
            {halls.map((hall) => (
              <HallBlock key={hall.key} hall={hall} />
            ))}

            <FlowArrow from={{ x: 260, y: 250 }} to={{ x: 760, y: 250 }} />
            <FlowArrow from={{ x: 260, y: 610 }} to={{ x: 760, y: 610 }} />
            <FlowArrow from={{ x: 980, y: 430 }} to={{ x: 1260, y: 430 }} />
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function HallBlock({ hall }: { hall: HallLayout }) {
  const totalProduction = hall.machines.reduce((sum, m) => sum + m.machine.producedPiecesToday, 0);
  const avgEff = Math.round(
    hall.machines.reduce((sum, m) => sum + calcEfficiency(m.machine), 0) / Math.max(1, hall.machines.length)
  );
  const alerts = hall.machines.filter((m) => !!m.machine.activeAlert).length;

  return (
    <section
      className={`absolute rounded-3xl border p-4 shadow-2xl ${hall.tone}`}
      style={{ right: hall.x, top: hall.y, width: hall.width, height: hall.height }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-white/70">{hall.title}</p>
          <p className="text-xs text-white/60">Machines: {hall.machines.length.toLocaleString("ar")}</p>
        </div>
        <div className="grid grid-cols-2 gap-1 text-[10px] text-white/80">
          <span>Prod: {totalProduction.toLocaleString("ar")}</span>
          <span>Eff: {avgEff}%</span>
          <span>Alerts: {alerts}</span>
          <span>Live</span>
        </div>
      </div>

      {hall.machines.map((item) => (
        <MachineNode key={`${hall.key}-${item.machine.id}`} item={item} />
      ))}
    </section>
  );
}

function MachineNode({ item }: { item: PositionedMachine }) {
  const tone = statusTone(item.machine);
  const isRunning = tone === "running";
  const statusClass =
    tone === "running"
      ? "border-emerald-400/60 bg-emerald-400/20"
      : tone === "stopped"
        ? "border-rose-400/60 bg-rose-400/20"
        : tone === "warning"
          ? "border-amber-400/60 bg-amber-400/20"
          : "border-sky-400/60 bg-sky-400/20";

  return (
    <motion.article
      whileHover={{ scale: 1.05, zIndex: 30 }}
      className={`absolute w-32 rounded-xl border p-2 text-[10px] text-white shadow-xl ${statusClass}`}
      style={{ right: item.x, top: item.y }}
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold">{item.machine.code}</span>
        <span className={`h-2 w-2 rounded-full ${isRunning ? "bg-emerald-300 pulse-live" : "bg-white/70"}`} />
      </div>
      <p className="mt-1 text-white/80">{item.machine.name}</p>
      <div className="mt-1 grid grid-cols-2 gap-1 text-white/75">
        <span>{machineTemp(item.machine)}C</span>
        <span>{calcEfficiency(item.machine)}%</span>
      </div>
    </motion.article>
  );
}

function FlowArrow({ from, to }: { from: { x: number; y: number }; to: { x: number; y: number } }) {
  const width = Math.abs(to.x - from.x);
  const right = Math.min(from.x, to.x);
  const top = from.y;

  return (
    <div className="absolute" style={{ right, top, width, height: 20 }}>
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-cyan-300/50" />
      <motion.div
        className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-cyan-300"
        animate={{ right: [0, width - 8] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

function TopStat({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`mt-1 text-xl font-semibold ${warn ? "text-amber-500" : ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function buildHallLayouts(machines: MachineSnapshot[]): HallLayout[] {
  const inj = machines.filter((m) => m.type === "injection");
  const blow = machines.filter((m) => m.type === "blow_molding");
  const line = machines.filter((m) => m.type === "line");

  return [
    {
      key: "inj1",
      title: "Injection Hall 1",
      x: 880,
      y: 60,
      width: 480,
      height: 320,
      tone: "border-blue-400/40 bg-blue-500/10",
      machines: placeMachines(inj.filter((_, i) => i % 2 === 0), 6)
    },
    {
      key: "inj2",
      title: "Injection Hall 2",
      x: 880,
      y: 430,
      width: 480,
      height: 320,
      tone: "border-blue-400/40 bg-blue-500/10",
      machines: placeMachines(inj.filter((_, i) => i % 2 !== 0), 6)
    },
    {
      key: "blow",
      title: "Blow Molding Hall",
      x: 320,
      y: 60,
      width: 480,
      height: 320,
      tone: "border-cyan-400/40 bg-cyan-500/10",
      machines: placeMachines(blow, 6)
    },
    {
      key: "packaging",
      title: "Packaging Hall",
      x: 320,
      y: 430,
      width: 480,
      height: 320,
      tone: "border-violet-400/40 bg-violet-500/10",
      machines: placeMachines(line.length ? line : machines.filter((_, i) => i % 3 === 0), 6)
    }
  ];
}

function placeMachines(machines: MachineSnapshot[], max: number): PositionedMachine[] {
  const source = machines.length > 0 ? machines : [];
  return source.slice(0, max).map((machine, index) => ({
    machine,
    x: 24 + (index % 3) * 145,
    y: 72 + Math.floor(index / 3) * 115
  }));
}

function calcEfficiency(machine: MachineSnapshot) {
  return Math.max(35, Math.min(99, Math.round(100 - machine.wasteKgToday * 1.7 - machine.downtimeMinutesToday / 5)));
}

function machineTemp(machine: MachineSnapshot) {
  return machine.type === "injection" ? 214 : machine.type === "blow_molding" ? 176 : 42;
}

function statusTone(machine: MachineSnapshot): "running" | "stopped" | "warning" | "maintenance" {
  if (machine.status === "maintenance") return "maintenance";
  if (machine.activeAlert) return "warning";
  if (machine.status === "running") return "running";
  return "stopped";
}
