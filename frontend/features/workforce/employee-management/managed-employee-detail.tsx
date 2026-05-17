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

import { SfStatusBadge } from "@/components/smart-factory";
import { Button } from "@/components/ui/button";

import type { ManagedEmployee } from "./model";
import { EmployeeSystemAccessCard } from "@/features/access-control/employee-system-access-card";

import { EmployeeQuickActions } from "./employee-quick-actions";

function attendanceToSfTone(a: ManagedEmployee["attendanceStatus"]) {
  if (a === "present") return "running" as const;
  if (a === "late") return "idle" as const;
  if (a === "absent") return "alarm" as const;
  return "maintenance" as const;
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
    <div className="space-y-6 text-sf-copy">
      <div className="flex flex-col gap-4 border-b border-sf-hairline pb-5 sm:flex-row sm:items-start">
        <div
          className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-sf-stroke/50 bg-sf-panel2 shadow-glowCyan"
          style={{
            backgroundImage: employee.photoUrl
              ? `url(${employee.photoUrl})`
              : `linear-gradient(145deg, hsl(${employee.performanceScore * 3.6} 50% 38%), hsl(${employee.performanceScore * 3.6} 40% 18%))`,
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        >
          {!employee.photoUrl ? (
            <span className="flex h-full items-center justify-center text-2xl font-bold text-sf-ink">
              {(employee.firstName?.[0] ?? employee.fullName?.[0] ?? "?")}
              {(employee.lastName?.[0] ?? "")}
            </span>
          ) : null}
          <span className="absolute bottom-2 start-2 rounded-sm bg-black/55 px-1.5 py-0.5 font-mono text-[10px] text-sf-ink">
            {employee.employeeNumber}
          </span>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-sf-ink">{employee.fullName}</h2>
            <SfStatusBadge tone={attendanceToSfTone(employee.attendanceStatus)} pulse={employee.attendanceStatus === "present"}>
              {employee.attendanceStatus === "present"
                ? "حضور"
                : employee.attendanceStatus === "late"
                  ? "تأخر"
                  : employee.attendanceStatus === "absent"
                    ? "غياب"
                    : "إجازة"}
            </SfStatusBadge>
            <span className="rounded-sm border border-sf-stroke/40 bg-sf-panel px-2 py-0.5 text-[11px] font-semibold text-sf-muted">
              {statusLabel(employee.status)}
            </span>
          </div>
          <p className="text-sm text-sf-muted">{employee.role}</p>
          <p className="text-xs text-sf-muted">
            {employee.department} · {employee.hall} · وردية {employee.shift}
          </p>
          {onClose ? (
            <Button type="button" variant="sfGhost" size="sm" className="mt-2 rounded-lg" onClick={onClose}>
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
          { label: "الأداء", value: employee.performanceScore, icon: Gauge, color: "text-sf-accentCool" },
          { label: "الموثوقية", value: employee.reliabilityScore, icon: Shield, color: "text-sf-ok" },
          { label: "كفاءة الإنتاج", value: employee.productionEff, icon: TrendingUp, color: "text-sf-accent" }
        ].map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-sf-hairline bg-sf-panel/60 p-4"
          >
            <m.icon className={`h-4 w-4 ${m.color}`} aria-hidden />
            <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-sf-ink">{m.value}</p>
            <p className="text-[11px] uppercase tracking-wide text-sf-muted">{m.label}</p>
          </motion.div>
        ))}
      </div>

      <section className="rounded-xl border border-sf-hairline bg-sf-chassis/80 p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-sf-ink">
          <Calendar className="h-4 w-4 text-sf-accentCool" aria-hidden />
          ملخص الحضور
        </h3>
        <div className="grid grid-cols-3 gap-3 text-center font-mono text-sm">
          <div>
            <p className="text-sf-ok">{employee.attendancePresentDays}</p>
            <p className="text-[10px] text-sf-muted">حضور</p>
          </div>
          <div>
            <p className="text-sf-caution">{employee.attendanceLateDays}</p>
            <p className="text-[10px] text-sf-muted">تأخر</p>
          </div>
          <div>
            <p className="text-sf-alarm">{employee.attendanceAbsentDays}</p>
            <p className="text-[10px] text-sf-muted">غياب</p>
          </div>
        </div>
      </section>

      {!compact ? (
        <>
          <section className="rounded-xl border border-sf-hairline bg-sf-panel/50 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-sf-ink">
              <Wallet className="h-4 w-4 text-sf-accent" aria-hidden />
              الراتب والاستحقاق
            </h3>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex justify-between border-b border-sf-hairline py-2">
                <dt className="text-sf-muted">الأساسي</dt>
                <dd className="font-mono text-sf-ink">{employee.salary.toLocaleString("ar-SA")} ﷼</dd>
              </div>
              <div className="flex justify-between border-b border-sf-hairline py-2">
                <dt className="text-sf-muted">ساعة إضافي — أيام عادية</dt>
                <dd className="font-mono text-sf-ink">{employee.overtimeRate} ﷼</dd>
              </div>
              <div className="flex justify-between border-b border-sf-hairline py-2">
                <dt className="text-sf-muted">ساعة إضافي — الجمعة</dt>
                <dd className="font-mono text-sf-ink">{employee.overtimeFridayRate} ﷼</dd>
              </div>
              <div className="flex justify-between py-2 sm:col-span-2">
                <dt className="text-sf-muted">رصيد الإجازة السنوية</dt>
                <dd className="font-mono text-sf-accentCool">{employee.annualLeaveBalance} يوم</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-sf-hairline bg-sf-panel/50 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-sf-ink">
              <Factory className="h-4 w-4 text-sf-accentCool" aria-hidden />
              الماكينات المعيّنة
            </h3>
            {employee.assignedMachines.length ? (
              <ul className="flex flex-wrap gap-2">
                {employee.assignedMachines.map((m) => (
                  <li
                    key={m}
                    className="rounded-lg border border-sf-stroke/40 bg-sf-deep px-3 py-1 font-mono text-xs text-sf-copy"
                  >
                    {m}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-sf-muted">لا توجد ماكينات مباشرة في السجل.</p>
            )}
          </section>

          <section className="rounded-xl border border-sf-hairline bg-sf-panel/50 p-4">
            <h3 className="mb-3 text-sm font-bold text-sf-ink">سجل الورديات</h3>
            <ul className="space-y-2 text-sm">
              {employee.shiftHistory.map((h) => (
                <li key={h.id} className="flex justify-between border-b border-sf-hairline/80 py-2 last:border-0">
                  <span className="text-sf-muted">{h.label}</span>
                  <span className="font-mono text-xs text-sf-copy">
                    {h.from} → {h.to}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-xl border border-sf-hairline bg-sf-panel/50 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-sf-ok">
                <Award className="h-4 w-4" aria-hidden />
                المكافآت
              </h3>
              <ul className="space-y-2 text-sm">
                {employee.rewards.map((r) => (
                  <li key={r.id} className="flex justify-between">
                    <span>{r.label}</span>
                    <span className="font-mono text-sf-ok">+{r.amount}</span>
                  </li>
                ))}
                {!employee.rewards.length ? <li className="text-sf-muted">لا سجلات</li> : null}
              </ul>
            </section>
            <section className="rounded-xl border border-sf-hairline bg-sf-panel/50 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-sf-alarm">
                <Wrench className="h-4 w-4" aria-hidden />
                الجزاءات
              </h3>
              <ul className="space-y-2 text-sm">
                {employee.penalties.map((p) => (
                  <li key={p.id} className="flex justify-between">
                    <span>{p.label}</span>
                    <span className="text-xs text-sf-muted">{p.severity}</span>
                  </li>
                ))}
                {!employee.penalties.length ? <li className="text-sf-muted">لا سجلات</li> : null}
              </ul>
            </section>
          </div>

          <section className="rounded-xl border border-sf-hairline bg-sf-deep/80 p-4">
            <h3 className="mb-2 text-sm font-bold text-sf-ink">إحصاءات إنتاجية (مركّبة)</h3>
            <p className="text-xs text-sf-muted">
              نقاط المكافأة: <span className="font-mono text-sf-accent">{employee.bonusPoints}</span> · مخالفات:{" "}
              <span className="font-mono text-sf-alarm">{employee.violations}</span>
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-sf-panel">
              <motion.div
                className="h-full bg-gradient-to-l from-sf-accent to-sf-accentCool"
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
