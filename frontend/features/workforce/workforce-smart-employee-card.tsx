"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  ClipboardList,
  MessageSquare,
  MoreHorizontal,
  Shield,
  User
} from "lucide-react";

import { cn } from "@/lib/utils";

import type { OpsEmployee } from "./workforce-models";

function attendanceLabel(a: OpsEmployee["attendance"]) {
  switch (a) {
    case "present":
      return "حاضر";
    case "late":
      return "متأخر";
    case "absent":
      return "غائب";
    case "leave":
      return "إجازة";
    default:
      return "—";
  }
}

function attendanceBadgeClass(a: OpsEmployee["attendance"]) {
  switch (a) {
    case "present":
      return "bg-atlas-success/15 text-atlas-success ring-atlas-success/30";
    case "late":
      return "bg-atlas-warning/18 text-amber-950 ring-atlas-warning/35";
    case "absent":
      return "bg-atlas-danger/12 text-atlas-danger ring-atlas-danger/28";
    case "leave":
      return "bg-atlas-info/12 text-atlas-info ring-atlas-info/28";
    default:
      return "bg-atlas-tableHead text-atlas-muted ring-atlas-rule";
  }
}

function reliabilityStroke(reliability: number) {
  if (reliability >= 85) return "text-atlas-success";
  if (reliability >= 65) return "text-atlas-brand";
  return "text-atlas-warning";
}

function LivePulse({ tone }: { tone: "live" | "warn" | "idle" }) {
  const color =
    tone === "live"
      ? "bg-atlas-success"
      : tone === "warn"
        ? "bg-atlas-warning"
        : "bg-atlas-muted";

  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden>
      <span
        className={cn(
          "absolute inline-flex h-full w-full animate-ping rounded-full opacity-40",
          tone === "live" && "bg-atlas-success",
          tone === "warn" && "bg-atlas-warning",
          tone === "idle" && "bg-atlas-muted"
        )}
      />
      <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full ring-2 ring-atlas-paper", color)} />
    </span>
  );
}

function GeneratedAvatar({ employee }: { employee: OpsEmployee }) {
  const { avatarHue, initials } = employee;
  return (
    <div
      className="relative flex h-[5.5rem] w-full items-center justify-center overflow-hidden rounded-lg"
      style={{
        background: `linear-gradient(145deg, hsl(${avatarHue} 48% 46%) 0%, hsl(${avatarHue} 38% 22%) 100%)`
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.22]"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 20% 15%, rgba(255,255,255,0.55), transparent 50%)`
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-6 start-1/2 h-16 w-24 -translate-x-1/2 rounded-full bg-black/15 blur-xl"
        aria-hidden
      />
      <span className="relative text-2xl font-bold tracking-tight text-white drop-shadow-sm">{initials}</span>
    </div>
  );
}

function EmployeePhoto({ employee }: { employee: OpsEmployee }) {
  const [broken, setBroken] = useState(false);
  const url = employee.photoUrl?.trim();

  const onError = useCallback(() => setBroken(true), []);

  if (!url || broken) {
    return <GeneratedAvatar employee={employee} />;
  }

  return (
    <div className="relative h-[5.5rem] w-full overflow-hidden rounded-lg bg-atlas-tableHead ring-1 ring-atlas-rule">
      {/* eslint-disable-next-line @next/next/no-img-element -- roster URLs may be arbitrary origins */}
      <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" onError={onError} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-atlas-ink/25 to-transparent" aria-hidden />
    </div>
  );
}

function ReliabilityRing({ value }: { value: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  const circumference = 2 * Math.PI * 18;
  const dash = (clamped / 100) * circumference;

  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center" title={`موثوقية ${clamped}%`}>
      <svg className="-rotate-90 transform" width="48" height="48" viewBox="0 0 48 48" aria-hidden>
        <circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" strokeWidth="4" className="text-atlas-tableHead" />
        <motion.circle
          cx="24"
          cy="24"
          r="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          className={reliabilityStroke(clamped)}
          strokeDasharray={`${dash} ${circumference}`}
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${dash} ${circumference}` }}
          transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.15 }}
        />
      </svg>
      <span className="absolute font-mono text-[10px] font-bold tabular-nums text-atlas-ink">{clamped}</span>
    </div>
  );
}

export function WorkforceSmartEmployeeCard({
  employee,
  index,
  className
}: {
  employee: OpsEmployee;
  index: number;
  className?: string;
}) {
  const liveTone =
    employee.attendance === "present" ? "live" : employee.attendance === "late" ? "warn" : "idle";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 320, damping: 26 }}
      whileHover={{ y: -3, transition: { type: "spring", stiffness: 400, damping: 22 } }}
      className={cn(
        "mb-4 break-inside-avoid overflow-hidden rounded-lg border border-atlas-rule bg-atlas-paper shadow-atlasCard",
        className
      )}
      style={{ borderInlineStartWidth: "4px", borderInlineStartColor: `hsl(${employee.avatarHue} 44% 40%)` }}
    >
      <div className="relative">
        <motion.div
          className="relative overflow-hidden px-3 pt-3"
          initial={false}
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 280, damping: 20 }}
        >
          <EmployeePhoto employee={employee} />
        </motion.div>

        <div className="absolute end-3 top-3 flex items-center gap-1.5 rounded-full border border-atlas-rule/80 bg-atlas-paper/90 px-2 py-1 shadow-atlasBar backdrop-blur-sm">
          <LivePulse tone={liveTone} />
          <span className="text-[9px] font-bold uppercase tracking-wider text-atlas-muted">
            {employee.attendance === "present" ? "نشط" : employee.attendance === "late" ? "تنبيه" : "غير متصل"}
          </span>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-bold text-atlas-ink">{employee.name}</h3>
            <p className="mt-0.5 truncate text-xs font-medium text-atlas-brand">{employee.role}</p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-md px-2 py-1 text-[10px] font-bold ring-1 ring-inset",
              attendanceBadgeClass(employee.attendance)
            )}
          >
            {attendanceLabel(employee.attendance)}
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-x-2 gap-y-2 text-[11px]">
          <div className="rounded-md bg-atlas-canvas px-2 py-1.5 ring-1 ring-atlas-rule/60">
            <dt className="text-[9px] font-bold uppercase tracking-wide text-atlas-muted">الوردية</dt>
            <dd className="mt-0.5 font-semibold text-atlas-ink">{employee.shift}</dd>
          </div>
          <div className="rounded-md bg-atlas-canvas px-2 py-1.5 ring-1 ring-atlas-rule/60">
            <dt className="text-[9px] font-bold uppercase tracking-wide text-atlas-muted">القاعة</dt>
            <dd className="mt-0.5 truncate font-semibold text-atlas-ink" title={employee.hall}>
              {employee.hall}
            </dd>
          </div>
        </dl>

        <div className="flex items-center gap-3 rounded-md border border-atlas-rule bg-gradient-to-l from-atlas-brandSoft/30 to-transparent px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-wide text-atlas-muted">الأداء</p>
            <div className="mt-1 flex items-baseline gap-1">
              <motion.span
                className="font-mono text-2xl font-bold tabular-nums text-atlas-brand"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.06 + index * 0.02 }}
              >
                {employee.performance}
              </motion.span>
              <span className="text-xs text-atlas-muted">/ 100</span>
            </div>
            <motion.div
              className="mt-2 h-0.5 overflow-hidden rounded-full bg-atlas-tableHead"
              initial={false}
            >
              <motion.div
                className="h-full rounded-full bg-atlas-brand"
                initial={{ width: 0 }}
                animate={{ width: `${employee.performance}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.08 + index * 0.02 }}
              />
            </motion.div>
          </div>
          <ReliabilityRing value={employee.reliability} />
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-atlas-rule pt-3">
          <p className="min-w-0 truncate text-[10px] text-atlas-muted">
            {employee.machineCode ? `ماكينة ${employee.machineCode}` : employee.department}
          </p>
          <div className="flex shrink-0 items-center gap-0.5">
            <motion.button
              type="button"
              title="مراسلة سريعة"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-atlas-muted transition hover:border-atlas-rule hover:bg-atlas-canvas hover:text-atlas-brand"
              whileTap={{ scale: 0.94 }}
            >
              <MessageSquare className="h-4 w-4" />
              <span className="sr-only">مراسلة</span>
            </motion.button>
            <motion.button
              type="button"
              title="البطاقة الشخصية"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-atlas-muted transition hover:border-atlas-rule hover:bg-atlas-canvas hover:text-atlas-brand"
              whileTap={{ scale: 0.94 }}
            >
              <User className="h-4 w-4" />
              <span className="sr-only">الملف</span>
            </motion.button>
            <motion.button
              type="button"
              title="مهمة / تسليم وردية"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-atlas-muted transition hover:border-atlas-rule hover:bg-atlas-canvas hover:text-atlas-brand"
              whileTap={{ scale: 0.94 }}
            >
              <ClipboardList className="h-4 w-4" />
              <span className="sr-only">مهمة</span>
            </motion.button>
            <motion.button
              type="button"
              title="مؤشرات الأداء"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-atlas-muted transition hover:border-atlas-rule hover:bg-atlas-canvas hover:text-atlas-brand"
              whileTap={{ scale: 0.94 }}
            >
              <BarChart3 className="h-4 w-4" />
              <span className="sr-only">تحليل</span>
            </motion.button>
            <motion.button
              type="button"
              title="المزيد"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-atlas-muted transition hover:border-atlas-rule hover:bg-atlas-canvas hover:text-atlas-ink"
              whileTap={{ scale: 0.94 }}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">المزيد</span>
            </motion.button>
          </div>
        </div>

        {employee.violations > 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5 rounded-md bg-atlas-danger/8 px-2 py-1.5 text-[10px] font-medium text-atlas-danger"
          >
            <Shield className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {employee.violations} ملاحظة سلوك / سلامة
          </motion.p>
        ) : null}
      </div>
    </motion.article>
  );
}
