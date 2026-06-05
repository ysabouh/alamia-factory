"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Activity, Cpu, Layers, ZoomIn, ZoomOut } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { MachineSnapshot } from "@/types/factory";

type HallId = "inj-1" | "inj-2" | "blow" | "packaging" | "maintenance";

export type MiniMapHall = {
  id: HallId;
  name: string;
  typeLabel?: string;
  machines: MachineSnapshot[];
};

type NodeVisualState = "running" | "critical" | "warning" | "maintenance" | "offline";

function calcEfficiency(m: MachineSnapshot) {
  return Math.max(42, Math.min(98, Math.round(100 - m.wasteKgToday * 1.8 - m.downtimeMinutesToday / 4)));
}

function avgEfficiency(ms: MachineSnapshot[]) {
  return Math.round(ms.reduce((s, m) => s + calcEfficiency(m), 0) / Math.max(1, ms.length));
}

function machineTemp(m: MachineSnapshot) {
  if (m.type === "injection") return 214;
  if (m.type === "blow_molding") return 178;
  return 42;
}

function machinePressureBar(m: MachineSnapshot) {
  if (m.type === "injection") return 145;
  if (m.type === "blow_molding") return 11;
  return 75;
}

function nodeVisualState(m: MachineSnapshot): NodeVisualState {
  if (m.status === "breakdown") return "critical";
  if (m.status === "maintenance") return "maintenance";
  if (m.activeAlert) return "warning";
  if (m.status === "running") return "running";
  return "offline";
}

const stateStyles: Record<
  NodeVisualState,
  { fill: string; stroke: string; glow: string; pulse?: boolean; blink?: boolean }
> = {
  running: { fill: "#10b981", stroke: "#6ee7b7", glow: "rgba(16,185,129,0.65)", pulse: true },
  critical: { fill: "#ef4444", stroke: "#fca5a5", glow: "rgba(239,68,68,0.65)", pulse: true },
  warning: { fill: "#f59e0b", stroke: "#fcd34d", glow: "rgba(245,158,11,0.55)", blink: true },
  maintenance: { fill: "#3b82f6", stroke: "#93c5fd", glow: "rgba(59,130,246,0.55)", pulse: true },
  offline: { fill: "#64748b", stroke: "#94a3b8", glow: "rgba(148,163,184,0.25)" }
};

const VB = { w: 920, h: 400 };

/** Fixed industrial layout matching five halls (SCADA topology). */
const hallRects: Record<
  HallId,
  { x: number; y: number; w: number; h: number; accent: string; accentDim: string }
> = {
  "inj-1": { x: 16, y: 28, w: 188, h: 188, accent: "#38bdf8", accentDim: "rgba(56,189,248,0.12)" },
  "inj-2": { x: 216, y: 28, w: 188, h: 188, accent: "#38bdf8", accentDim: "rgba(56,189,248,0.1)" },
  blow: { x: 416, y: 28, w: 188, h: 188, accent: "#22d3ee", accentDim: "rgba(34,211,238,0.12)" },
  packaging: { x: 616, y: 28, w: 188, h: 188, accent: "#a78bfa", accentDim: "rgba(167,139,250,0.12)" },
  maintenance: { x: 260, y: 238, w: 544, h: 146, accent: "#f59e0b", accentDim: "rgba(245,158,11,0.1)" }
};

const flowPaths: Array<{ id: string; d: string }> = [
  { id: "f1", d: "M 204 122 L 216 122" },
  { id: "f2", d: "M 404 122 L 416 122" },
  { id: "f3", d: "M 604 122 L 616 122" },
  { id: "f4", d: "M 710 216 L 710 226 Q 710 238 698 238 L 698 238" },
  { id: "f5", d: "M 538 216 L 538 230 Q 538 238 528 238" },
  { id: "f6", d: "M 360 216 L 360 230 Q 360 238 372 238" }
];

function layoutMachines(rx: number, ry: number, rw: number, rh: number, machines: MachineSnapshot[]) {
  const top = ry + 44;
  const left = rx + 12;
  const innerW = rw - 24;
  const innerH = rh - (top - ry) - 12;
  const n = Math.min(machines.length, 9);
  if (n === 0) return [] as Array<{ machine: MachineSnapshot; cx: number; cy: number; r: number }>;
  const cols = n <= 4 ? 2 : 3;
  const rows = Math.ceil(n / cols);
  const gap = 5;
  const cellW = (innerW - gap * (cols - 1)) / cols;
  const cellH = (innerH - gap * (rows - 1)) / rows;
  const radius = Math.min(9, Math.max(5.5, Math.min(cellW, cellH) / 3.2));
  const out: Array<{ machine: MachineSnapshot; cx: number; cy: number; r: number }> = [];
  for (let i = 0; i < n; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = left + cellW / 2 + col * (cellW + gap);
    const cy = top + cellH / 2 + row * (cellH + gap);
    out.push({ machine: machines[i], cx, cy, r: radius });
  }
  return out;
}

type Props = { halls: MiniMapHall[] };

export function MiniFactoryFloorMap({ halls }: Props) {
  const router = useRouter();
  const hallMap = useMemo(() => Object.fromEntries(halls.map((h) => [h.id, h])) as Record<HallId | string, MiniMapHall>, [halls]);
  const [zoom, setZoom] = useState(1);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const onMachineMove = useCallback((e: React.MouseEvent, key: string) => {
    setHoverKey(key);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  }, []);

  const hoveredParts = hoverKey?.split(":") ?? null;
  const hoveredMachine =
    hoveredParts && hoveredParts[0]
      ? hallMap[hoveredParts[0]]?.machines.find((m) => String(m.id) === hoveredParts[1])
      : undefined;

  const tooltipStyle = useMemo(() => {
    if (!tooltipPos || typeof window === "undefined") return undefined;
    const left = Math.min(window.innerWidth - 276, tooltipPos.x + 14);
    const top = Math.min(window.innerHeight - 184, tooltipPos.y + 14);
    return { left, top };
  }, [tooltipPos]);

  return (
    <Card className="erp-card overflow-hidden rounded-3xl border-cyan-500/15 bg-[linear-gradient(175deg,hsl(var(--card)),rgba(15,23,42,0.92))] shadow-[0_0_0_1px_rgba(34,211,238,0.08),0_28px_80px_rgba(2,8,23,0.35)]">
      <CardContent className="p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-cyan-500/10 pb-4">
          <div>
            <p className="text-[10px] tracking-[0.28em] text-cyan-300/90">DIGITAL TWIN · SCADA VIEW</p>
            <h3 className="mt-1 text-lg font-semibold text-white">خرطة أرضية تفاعلية — Mini Factory Floor</h3>
            <p className="mt-1 text-xs text-slate-400">فهم الحالة خلال ثوانٍ — تفاعل مباشر مع جواز الماكينة</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success" className="gap-1 border-emerald-500/40 bg-emerald-950/60 text-emerald-200">
              <Activity className="h-3 w-3 pulse-live" />
              LIVE
            </Badge>
            <div className="flex rounded-lg border border-white/10 bg-slate-950/80 p-0.5">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-xs text-slate-200 hover:bg-white/10"
                aria-label="تصغير"
                onClick={() => setZoom((z) => Math.max(0.65, +(z - 0.15).toFixed(2)))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-xs text-slate-200 hover:bg-white/10"
                aria-label="تكبير"
                onClick={() => setZoom((z) => Math.min(1.45, +(z + 0.15).toFixed(2)))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            <Button size="sm" variant="outline" className="h-8 border-white/15 bg-transparent text-xs text-slate-200" onClick={() => setZoom(1)}>
              إعادة ضبط
            </Button>
          </div>
        </div>

        <div
          ref={wrapRef}
          className="relative mt-4 min-h-[320px] overflow-auto rounded-2xl border border-white/10 bg-[radial-gradient(ellipse_at_50%_-20%,rgba(34,211,238,0.15),transparent_52%),linear-gradient(180deg,rgba(2,6,23,0.98),rgba(15,23,42,0.96))]"
          dir="ltr"
          onMouseMove={(e) => {
            if (hoverKey)
              setTooltipPos({
                x: e.clientX,
                y: e.clientY
              });
          }}
          onMouseLeave={() => {
            setHoverKey(null);
            setTooltipPos(null);
          }}
        >
          {/* Scanline ambience */}
          <div className="pointer-events-none absolute inset-0 z-10 rounded-2xl opacity-[0.12] mix-blend-screen [background:repeating-linear-gradient(0deg,rgba(255,255,255,0.04)_0,rgba(255,255,255,0.04)_1px,transparent_1px,transparent_6px)]" />

          <motion.div
            className="relative mx-auto p-3"
            style={{ transformOrigin: "center top" }}
            animate={{ scale: zoom }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
          >
            <svg
              role="img"
              aria-label="Factory mini map"
              viewBox={`0 0 ${VB.w} ${VB.h}`}
              className="h-[min(58vh,420px)] w-full min-w-[640px]"
            >
              <defs>
                <filter id="glow-soft" x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur stdDeviation="3" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="flow-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(34,211,238,0.05)" />
                  <stop offset="50%" stopColor="rgba(34,211,238,0.45)" />
                  <stop offset="100%" stopColor="rgba(34,211,238,0.05)" />
                </linearGradient>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="0.5" />
                </pattern>
              </defs>

              <rect width={VB.w} height={VB.h} fill="url(#grid)" opacity={0.45} />

              {/* Flow lines */}
              <g filter="url(#glow-soft)">
                {flowPaths.map((fp) => (
                  <motion.path
                    key={fp.id}
                    d={fp.d}
                    fill="none"
                    stroke="url(#flow-grad)"
                    strokeWidth={2.25}
                    strokeLinecap="round"
                    strokeDasharray="10 9"
                    initial={{ strokeDashoffset: 0 }}
                    animate={{ strokeDashoffset: -38 }}
                    transition={{ repeat: Infinity, duration: 2.8, ease: "linear" }}
                  />
                ))}
              </g>

              {(Object.keys(hallRects) as HallId[]).map((hid) => {
                const r = hallRects[hid];
                const hallData = hallMap[hid];
                const ms = hallData?.machines ?? [];
                const running = ms.filter((m) => m.status === "running").length;
                const alerts = ms.filter((m) => !!m.activeAlert || m.status === "breakdown").length;
                const eff = avgEfficiency(ms);
                const heat = ms.length === 0 ? 0 : running / ms.length;

                const layout = layoutMachines(r.x, r.y, r.w, r.h, ms);
                const overflow = ms.length > 9 ? ms.length - 9 : 0;

                return (
                  <g key={hid}>
                    {/* Heat map wash */}
                    <motion.rect
                      x={r.x}
                      y={r.y}
                      width={r.w}
                      height={r.h}
                      rx={14}
                      fill="rgba(16,185,129,0.22)"
                      stroke="none"
                      animate={{ opacity: 0.12 + heat * 0.52 }}
                      transition={{ duration: 0.6 }}
                    />

                    {/* Hall chassis */}
                    <motion.rect
                      x={r.x}
                      y={r.y}
                      width={r.w}
                      height={r.h}
                      rx={14}
                      fill={`${r.accentDim}`}
                      stroke={alerts ? "rgba(245,158,11,0.55)" : r.accent}
                      strokeWidth={alerts ? 2 : 1.15}
                      filter="url(#glow-soft)"
                      animate={{
                        strokeOpacity: alerts ? [1, 0.45, 1] : [0.85, 1, 0.85]
                      }}
                      transition={{ repeat: Infinity, duration: alerts ? 1.1 : 3.8 }}
                    />

                    {/* Hall label bar */}
                    <rect x={r.x + 6} y={r.y + 6} width={r.w - 12} height={22} rx={6} fill="rgba(2,8,23,0.78)" stroke="rgba(255,255,255,0.06)" />

                    <text x={r.x + 14} y={r.y + 21} fill="#e2e8f0" fontSize={11} fontWeight={600}>
                      {hallData?.name ?? hid}
                    </text>

                    {/* Metrics strip */}
                    <text x={r.x + 14} y={r.y + 36} fill="#94a3b8" fontSize={8.5} fontFamily="inherit">
                      {`M:${ms.length} RUN:${running} EFF:${eff}% AL:${alerts}`}
                    </text>

                    {/* Production strip bar */}
                    <rect x={r.x + 10} y={r.y + 42} width={r.w - 20} height={4} rx={2} fill="rgba(148,163,184,0.15)" />
                    <motion.rect
                      x={r.x + 10}
                      y={r.y + 42}
                      width={Math.max(6, ((r.w - 20) * eff) / 100)}
                      height={4}
                      rx={2}
                      fill={r.accent}
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />

                    {layout.map(({ machine: m, cx, cy, r: rad }) => {
                      const st = nodeVisualState(m);
                      const style = stateStyles[st];
                      const mk = `${hid}:${m.id}`;

                      return (
                        <g key={mk}>
                          <motion.circle
                            cx={cx}
                            cy={cy}
                            r={rad + 2}
                            fill={style.glow}
                            opacity={style.pulse ? 0.45 : 0.25}
                            animate={
                              style.pulse
                                ? { r: rad + 2 + 3.5, opacity: [0.25, 0.55, 0.25] }
                                : style.blink
                                  ? { opacity: [0.85, 0.25, 0.85] }
                                  : {}
                            }
                            transition={{ repeat: Infinity, duration: style.blink ? 0.95 : 1.8 }}
                          />
                          <circle
                            cx={cx}
                            cy={cy}
                            r={rad}
                            fill={style.fill}
                            stroke={style.stroke}
                            strokeWidth={st === "critical" ? 2 : 1.35}
                            onMouseEnter={(e) => {
                              setHoverKey(mk);
                              setTooltipPos({ x: e.clientX, y: e.clientY });
                            }}
                            onMouseMove={(e) => onMachineMove(e as unknown as React.MouseEvent, mk)}
                            onMouseLeave={() => setHoverKey(null)}
                            onClick={() => router.push(`/ar/machines/${m.id}`)}
                            style={{
                              cursor: "pointer",
                              filter: hoverKey === mk ? "brightness(1.15)" : undefined
                            }}
                          />
                          <text x={cx} y={cy + 4} textAnchor="middle" fill="#f8fafc" fontSize={rad > 7 ? 7.8 : 6.9} fontWeight={700} style={{ pointerEvents: "none" }}>
                            {m.code.length > 10 ? `${m.code.slice(0, 8)}…` : m.code}
                          </text>
                        </g>
                      );
                    })}

                    {overflow > 0 ? (
                      <text x={r.x + r.w - 14} y={r.y + r.h - 12} textAnchor="end" fill="#fbbf24" fontSize={11} fontWeight={700}>{`+${overflow}`}</text>
                    ) : null}

                    {ms.length === 0 ? (
                      <text x={r.x + r.w / 2} y={r.y + r.h / 2} textAnchor="middle" fill="#64748b" fontSize={10}>
                        Idle zone
                      </text>
                    ) : null}
                  </g>
                );
              })}
            </svg>
          </motion.div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-slate-950/85 px-3 py-2 text-[11px] text-slate-300 backdrop-blur-sm">
            <div className="flex flex-wrap gap-3">
              <LegendDot color="bg-emerald-500" label="تشغيل Running" pulse />
              <LegendDot color="bg-rose-500" label="حرِج Critical" pulse />
              <LegendDot color="bg-amber-500" label="تحذير Warning" blink />
              <LegendDot color="bg-blue-500" label="صيانة Maint." pulse />
              <LegendDot color="bg-slate-500" label="غير نشط Offline" />
            </div>
            <p className="text-[10px] text-slate-500">Heat wash = نشاط تشغيلي نسبي داخل القاعة</p>
          </div>
        </div>
      </CardContent>

      <AnimatePresence>
        {hoveredMachine && tooltipStyle ? (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed z-50 w-[260px] rounded-xl border border-cyan-500/35 bg-slate-950/95 p-3 text-xs text-slate-100 shadow-2xl shadow-cyan-500/15 backdrop-blur-md"
            style={tooltipStyle}
          >
            <div className="flex items-center gap-2 font-semibold text-white">
              <Cpu className="h-3.5 w-3.5 text-cyan-300" />
              {hoveredMachine.code}
              <Badge variant="secondary" className="mr-auto scale-90 text-[9px]">
                {hoveredMachine.status}
              </Badge>
            </div>
            <p className="mt-1 flex items-center gap-1 text-slate-400">
              <Layers className="h-3 w-3" />
              {hoveredMachine.currentMold ?? "—"}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              <span className="text-slate-500">Temp.</span>
              <span>{machineTemp(hoveredMachine)}°C</span>
              <span className="text-slate-500">Press.</span>
              <span>{machinePressureBar(hoveredMachine)} bar</span>
              <span className="text-slate-500">Output</span>
              <span>{hoveredMachine.producedPiecesToday.toLocaleString("ar")}</span>
              <span className="text-slate-500">Eff.</span>
              <span>{calcEfficiency(hoveredMachine)}%</span>
            </div>
            {hoveredMachine.activeAlert ? (
              <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-amber-200">{hoveredMachine.activeAlert}</p>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Card>
  );
}

function LegendDot({
  color,
  label,
  pulse,
  blink
}: {
  color: string;
  label: string;
  pulse?: boolean;
  blink?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${color} ${pulse ? "pulse-live" : ""} ${blink ? "blink-alarm" : ""}`} />
      {label}
    </span>
  );
}
