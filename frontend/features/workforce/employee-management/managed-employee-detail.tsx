"use client";

import { motion } from "framer-motion";
import {
  Award,
  Calendar,
  Factory,
  Gauge,
  Shield,
  TrendingUp,
  Wallet,
  Wrench
} from "lucide-react";

import { WfmStatusBadge, type WfmBadgeTone } from "@/components/workforce/atlas";

import { EmployeeCertificationsPanel } from "./employee-certifications-panel";
import { Button } from "@/components/ui/button";

import { formatMoney, formatMoneyUsd } from "@/lib/currency/format-money";

import type { ManagedEmployee } from "./model";
import { EmployeeSystemAccessCard } from "@/features/access-control/employee-system-access-card";

import { AttendanceStatusIcon, EmploymentStatusIcon } from "./employee-registry-icons";
import { EmployeeQuickActions } from "./employee-quick-actions";

const cardClass = "rounded-sm border border-atlas-rule bg-atlas-paper p-4 shadow-atlasCard";

function attendanceTone(a: ManagedEmployee["attendanceStatus"]): WfmBadgeTone {
  if (a === "present") return "active";
  if (a === "late") return "warning";
  if (a === "absent") return "danger";
  return "info";
}

function employmentTone(s: ManagedEmployee["status"]): WfmBadgeTone {
  if (s === "active") return "active";
  if (s === "probation") return "warning";
  if (s === "suspended") return "danger";
  return "neutral";
}

function statusLabel(s: ManagedEmployee["status"]) {
  const map: Record<ManagedEmployee["status"], string> = {
    active: "نشط",
    suspended: "موقوف",
    probation: "تحت المراقبة",
    terminated: "منتهي"
  };
  return map[s];
}

export function ManagedEmployeeDetail({
  employee,
  onClose,
  compact,
  onEmployeePatched
}: {
  employee: ManagedEmployee;
  onClose?: () => void;
  compact?: boolean;
  /** Full-page detail: refresh local state after API quick actions */
  onEmployeePatched?: (e: ManagedEmployee) => void;
}) {
  return (
    <div className="space-y-6 text-atlas-slate">
      <div className="flex flex-col gap-4 border-b border-atlas-rule pb-5 sm:flex-row sm:items-start">
        <div
          className="relative h-28 w-28 shrink-0 overflow-hidden rounded-sm border border-atlas-rule bg-atlas-canvas shadow-atlasCard"
          style={{
            backgroundImage: employee.photoUrl
              ? `url(${employee.photoUrl})`
              : `linear-gradient(145deg, hsl(${employee.performanceScore * 3.6} 50% 38%), hsl(${employee.performanceScore * 3.6} 40% 18%))`,
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        >
          {!employee.photoUrl ? (
            <span className="flex h-full items-center justify-center text-2xl font-bold text-atlas-ink">
              {(employee.firstName?.[0] ?? employee.fullName?.[0] ?? "?")}
              {(employee.lastName?.[0] ?? "")}
            </span>
          ) : null}
          <span className="absolute bottom-2 start-2 rounded-sm bg-atlas-ink/70 px-1.5 py-0.5 font-mono text-[10px] text-white">
            {employee.employeeNumber}
          </span>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-atlas-ink">{employee.fullName}</h2>
            <WfmStatusBadge tone={attendanceTone(employee.attendanceStatus)} className="gap-1.5">
              <AttendanceStatusIcon state={employee.attendanceStatus} />
              {employee.attendanceStatus === "present"
                ? "حضور"
                : employee.attendanceStatus === "late"
                  ? "تأخر"
                  : employee.attendanceStatus === "absent"
                    ? "غياب"
                    : "إجازة"}
            </WfmStatusBadge>
            <WfmStatusBadge tone={employmentTone(employee.status)} className="gap-1.5">
              <EmploymentStatusIcon status={employee.status} />
              {statusLabel(employee.status)}
            </WfmStatusBadge>
          </div>
          <p className="text-sm text-atlas-muted">{employee.role}</p>
          <p className="text-xs text-atlas-muted">
            {employee.department} · {employee.hall} · وردية {employee.shift}
          </p>
          {onClose ? (
            <Button type="button" variant="atlasOutline" size="sm" className="mt-2" onClick={onClose}>
              إغلاق اللوحة
            </Button>
          ) : null}
        </div>
      </div>

      <EmployeeQuickActions employee={employee} variant="detail" onPatched={onEmployeePatched} />

      <EmployeeSystemAccessCard
        employee={employee}
        onUpdated={(patch) => onEmployeePatched?.({ ...employee, ...patch })}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "الأداء", value: employee.performanceScore, icon: Gauge, color: "text-atlas-brand" },
          { label: "الموثوقية", value: employee.reliabilityScore, icon: Shield, color: "text-atlas-success" },
          { label: "كفاءة الإنتاج", value: employee.productionEff, icon: TrendingUp, color: "text-atlas-accent" }
        ].map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cardClass}
          >
            <m.icon className={`h-4 w-4 ${m.color}`} aria-hidden />
            <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-atlas-ink">{m.value}</p>
            <p className="text-[11px] font-medium uppercase tracking-wide text-atlas-muted">{m.label}</p>
          </motion.div>
        ))}
      </div>

      <section className={`${cardClass} bg-atlas-canvas/80`}>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-atlas-ink">
          <Calendar className="h-4 w-4 text-atlas-brand" aria-hidden />
          ملخص الحضور
        </h3>
        <div className="grid grid-cols-3 gap-3 text-center font-mono text-sm">
          <div>
            <p className="text-atlas-success">{employee.attendancePresentDays}</p>
            <p className="text-[10px] text-atlas-muted">حضور</p>
          </div>
          <div>
            <p className="text-atlas-warning">{employee.attendanceLateDays}</p>
            <p className="text-[10px] text-atlas-muted">تأخر</p>
          </div>
          <div>
            <p className="text-atlas-danger">{employee.attendanceAbsentDays}</p>
            <p className="text-[10px] text-atlas-muted">غياب</p>
          </div>
        </div>
      </section>

      {!compact ? (
        <>
          <section className={cardClass}>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-atlas-ink">
              <Wallet className="h-4 w-4 text-atlas-brand" aria-hidden />
              الراتب والاستحقاق
            </h3>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex justify-between border-b border-atlas-rule py-2">
                <dt className="text-atlas-muted">الأساسي</dt>
                <dd className="font-mono text-atlas-ink">
                  {formatMoney(employee.salary, { symbol: employee.currencySymbol, code: employee.currencyCode })}
                </dd>
              </div>
              <div className="flex justify-between border-b border-atlas-rule py-2">
                <dt className="text-atlas-muted">بالدولار (USD)</dt>
                <dd className="font-mono text-atlas-ink">{formatMoneyUsd(employee.salaryUsd)}</dd>
              </div>
              <div className="flex justify-between py-2 sm:col-span-2">
                <dt className="text-atlas-muted">رصيد الإجازة السنوية</dt>
                <dd className="font-mono text-atlas-brand">{employee.annualLeaveBalance} يوم</dd>
              </div>
            </dl>
          </section>

          <section className={cardClass}>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-atlas-ink">
              <Factory className="h-4 w-4 text-atlas-brand" aria-hidden />
              الماكينات المعيّنة
            </h3>
            {employee.assignedMachines.length ? (
              <ul className="flex flex-wrap gap-2">
                {employee.assignedMachines.map((m) => (
                  <li
                    key={m}
                    className="rounded-lg border border-atlas-rule bg-atlas-canvas px-3 py-1 font-mono text-xs text-atlas-slate"
                  >
                    {m}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-atlas-muted">لا توجد ماكينات مباشرة في السجل.</p>
            )}
          </section>

          {!compact && <EmployeeCertificationsPanel employeeId={employee.id} />}

          <section className={cardClass}>
            <h3 className="mb-3 text-sm font-bold text-atlas-ink">سجل الورديات</h3>
            <ul className="space-y-2 text-sm">
              {employee.shiftHistory.map((h) => (
                <li key={h.id} className="flex justify-between border-b border-atlas-rule/80 py-2 last:border-0">
                  <span className="text-atlas-muted">{h.label}</span>
                  <span className="font-mono text-xs text-atlas-slate">
                    {h.from} → {h.to}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <section className={cardClass}>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-atlas-success">
                <Award className="h-4 w-4" aria-hidden />
                المكافآت
              </h3>
              <ul className="space-y-2 text-sm">
                {employee.rewards.map((r) => (
                  <li key={r.id} className="flex justify-between">
                    <span>{r.label}</span>
                    <span className="font-mono text-atlas-success">+{r.amount}</span>
                  </li>
                ))}
                {!employee.rewards.length ? <li className="text-atlas-muted">لا سجلات</li> : null}
              </ul>
            </section>
            <section className={cardClass}>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-atlas-danger">
                <Wrench className="h-4 w-4" aria-hidden />
                الجزاءات
              </h3>
              <ul className="space-y-2 text-sm">
                {employee.penalties.map((p) => (
                  <li key={p.id} className="flex justify-between">
                    <span>{p.label}</span>
                    <span className="text-xs text-atlas-muted">{p.severity}</span>
                  </li>
                ))}
                {!employee.penalties.length ? <li className="text-atlas-muted">لا سجلات</li> : null}
              </ul>
            </section>
          </div>

          <section className={`${cardClass} bg-atlas-canvas`}>
            <h3 className="mb-2 text-sm font-bold text-atlas-ink">إحصاءات إنتاجية (مركّبة)</h3>
            <p className="text-xs text-atlas-muted">
              نقاط المكافأة: <span className="font-mono text-atlas-brand">{employee.bonusPoints}</span> · مخالفات:{" "}
              <span className="font-mono text-atlas-danger">{employee.violations}</span>
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-atlas-rule">
              <motion.div
                className="h-full bg-gradient-to-l from-atlas-brand to-atlas-accent"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, employee.productionEff)}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 18 }}
              />
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
