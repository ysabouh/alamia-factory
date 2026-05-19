"use client";

import { useEffect } from "react";
import { ChevronLeft, ChevronRight, FileSpreadsheet } from "lucide-react";

import {
  WfmField,
  WfmInput,
  WfmPageHeader,
  WfmTable,
  WfmTableBody,
  WfmTableCell,
  WfmTableHead,
  WfmTableHeader,
  WfmTableRow
} from "@/components/workforce/atlas";
import { Button } from "@/components/ui/button";
import { useFactoryAuth } from "@/contexts/factory-auth-context";
import { usePayrollStore } from "@/features/workforce/attendance/stores/payroll-store";
import { formatPayrollWeekRange } from "@/lib/attendance/payroll-weeks";

export function PayrollWorkspace() {
  const { can } = useFactoryAuth();
  const canView = can("payroll.view");
  const canGenerate = can("payroll.generate");

  const {
    periodStart,
    periodEnd,
    preview,
    loading,
    generating,
    error,
    success,
    setPeriodStart,
    setPeriodEnd,
    goToPreviousWeek,
    goToNextWeek,
    loadPreview,
    generate
  } = usePayrollStore();

  useEffect(() => {
    if (canView) void loadPreview();
  }, [periodStart, periodEnd, canView, loadPreview]);

  if (!canView) {
    return (
      <p className="rounded-sm border border-atlas-rule bg-atlas-paper p-6 text-sm text-atlas-muted">
        ليس لديك صلاحية عرض الرواتب.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <WfmPageHeader
        kicker="الرواتب"
        title="حساب الراتب من الحضور"
        description="المبالغ مأخوذة من لقطات الحضور المخزنة لكل يوم — لا يُعاد حساب التاريخ ديناميكياً."
      />

      <div className="rounded-sm border border-atlas-warning/30 bg-atlas-warning/10 px-4 py-3 text-sm text-atlas-ink">
        يعتمد التوليد على حقول <span className="font-mono">regular_pay</span> و{" "}
        <span className="font-mono">overtime_pay</span> و{" "}
        <span className="font-mono">friday_overtime_pay</span> في سجلات الحضور اليومية. الأسبوع الافتراضي:
        من السبت إلى الجمعة.
      </div>

      <div className="space-y-3 rounded-sm border border-atlas-rule bg-atlas-canvas/50 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <WfmField label="من">
            <WfmInput
              type="date"
              className="h-10 font-mono text-sm tabular-nums"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
            />
          </WfmField>

          <WfmField label="إلى">
            <WfmInput
              type="date"
              className="h-10 font-mono text-sm tabular-nums"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
            />
          </WfmField>

          <Button
            type="button"
            variant="atlasOutline"
            className="h-10 gap-1 rounded-sm px-2.5"
            title="الأسبوع السابق (سبت–جمعة)"
            disabled={loading}
            onClick={goToPreviousWeek}
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
            الأسبوع السابق
          </Button>

          <Button
            type="button"
            variant="atlasOutline"
            className="h-10 gap-1 rounded-sm px-2.5"
            title="الأسبوع التالي (سبت–جمعة)"
            disabled={loading}
            onClick={goToNextWeek}
          >
            الأسبوع التالي
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Button>

          <Button
            type="button"
            variant="atlasOutline"
            className="h-10 rounded-sm"
            disabled={loading}
            onClick={() => void loadPreview()}
          >
            معاينة
          </Button>

          {canGenerate ? (
            <Button
              type="button"
              variant="atlasPrimary"
              className="h-10 gap-1.5 rounded-sm"
              disabled={generating || loading}
              onClick={() => void generate()}
            >
              <FileSpreadsheet className="h-4 w-4" aria-hidden />
              توليد مسير (مسودة)
            </Button>
          ) : null}
        </div>

        <p className="text-[11px] text-atlas-muted">
          الفترة:{" "}
          <span className="font-mono tabular-nums text-atlas-ink">
            {formatPayrollWeekRange(periodStart, periodEnd)}
          </span>
          {" "}
          (سبت → جمعة)
        </p>
      </div>

      {error ? <p className="text-sm text-atlas-danger">{error}</p> : null}
      {success ? <p className="text-sm text-atlas-success">{success}</p> : null}

      {preview ? (
        <>
          <p className="text-sm text-atlas-muted">
            معاينة الفترة:{" "}
            <span className="font-mono tabular-nums text-atlas-ink">
              {formatPayrollWeekRange(preview.periodStart, preview.periodEnd)}
            </span>
          </p>
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { label: "راتب فعلي (محسوب)", value: preview.totals.actualPay ?? preview.totals.totalPay },
              { label: "من الحضور (أساسي)", value: preview.totals.regularPay },
              { label: "من الحضور (إضافي)", value: preview.totals.overtimePay },
              { label: "من الحضور (جمعة)", value: preview.totals.fridayOvertimePay }
            ].map((t) => (
              <div key={t.label} className="rounded-sm border border-atlas-rule bg-atlas-paper p-4">
                <p className="text-[11px] text-atlas-muted">{t.label}</p>
                <p className="font-mono text-xl font-bold text-atlas-brand">{t.value.toFixed(2)}</p>
              </div>
            ))}
          </div>

          {preview.hourlyRateMeta ? (
            <p className="text-[11px] leading-snug text-atlas-muted">
              ثمن الساعة = الراتب ÷ {preview.hourlyRateMeta.workDaysPerWeek} أيام/أسبوع ÷{" "}
              {preview.hourlyRateMeta.dailyWorkHours} س/يوم ({preview.hourlyRateMeta.checkIn}→
              {preview.hourlyRateMeta.checkOut} = خروج − دخول). جمع الساعات = أساسية +
              (إضافي أسبوع ×{preview.hourlyRateMeta.weekdayOvertimeMultiplier}) + (إضافي جمعة ×
              {preview.hourlyRateMeta.fridayOvertimeMultiplier}). الراتب الفعلي = ثمن الساعة × جمع
              الساعات. النقص = الراتب الأساسي − الراتب الفعلي.
            </p>
          ) : null}

          <div className="overflow-x-auto">
            <WfmTable>
              <WfmTableHeader>
                <WfmTableRow>
                  <WfmTableHead className="w-10 text-center">#</WfmTableHead>
                  <WfmTableHead className="text-center">رقم الموظف</WfmTableHead>
                  <WfmTableHead className="min-w-[8rem]">الموظف</WfmTableHead>
                  <WfmTableHead className="text-center">الراتب الأساسي</WfmTableHead>
                  <WfmTableHead className="text-center">حضور</WfmTableHead>
                  <WfmTableHead className="text-center">غياب</WfmTableHead>
                  <WfmTableHead className="min-w-[4.5rem] text-center">ساعات أساسية</WfmTableHead>
                  <WfmTableHead className="min-w-[4.5rem] text-center">إضافي أسبوع</WfmTableHead>
                  <WfmTableHead className="min-w-[4.5rem] text-center">
                    ×{preview.hourlyRateMeta?.weekdayOvertimeMultiplier ?? "—"}
                  </WfmTableHead>
                  <WfmTableHead className="min-w-[4.5rem] text-center">إضافي جمعة</WfmTableHead>
                  <WfmTableHead className="min-w-[4.5rem] text-center">
                    ×{preview.hourlyRateMeta?.fridayOvertimeMultiplier ?? "—"}
                  </WfmTableHead>
                  <WfmTableHead className="min-w-[4.5rem] text-center">جمع الساعات</WfmTableHead>
                  <WfmTableHead className="text-center">ثمن الساعة</WfmTableHead>
                  <WfmTableHead className="text-center">الراتب الفعلي</WfmTableHead>
                  <WfmTableHead className="text-center">النقص</WfmTableHead>
                  <WfmTableHead className="min-w-[7rem] text-center">ملاحظة</WfmTableHead>
                </WfmTableRow>
              </WfmTableHeader>
              <WfmTableBody>
                {[...preview.items]
                  .sort((a, b) => a.employeeNumber.localeCompare(b.employeeNumber, "ar"))
                  .map((row, index) => (
                    <WfmTableRow key={row.employeeId}>
                      <WfmTableCell className="text-center font-mono text-sm tabular-nums text-atlas-muted">
                        {index + 1}
                      </WfmTableCell>
                      <WfmTableCell className="text-center font-mono text-sm tabular-nums">
                        {row.employeeNumber || "—"}
                      </WfmTableCell>
                      <WfmTableCell>
                        <span className="font-medium">{row.fullName}</span>
                      </WfmTableCell>
                      <WfmTableCell className="text-center font-mono text-sm tabular-nums">
                        {(row.basicSalary ?? 0).toFixed(2)}
                      </WfmTableCell>
                      <WfmTableCell className="text-center font-mono text-sm tabular-nums">
                        {row.daysPresent}
                      </WfmTableCell>
                      <WfmTableCell className="text-center font-mono text-sm tabular-nums">
                        {row.daysAbsent}
                      </WfmTableCell>
                      <WfmTableCell className="text-center font-mono text-sm tabular-nums">
                        {(row.basicWorkHours ?? 0).toFixed(2)}
                      </WfmTableCell>
                      <WfmTableCell className="text-center font-mono text-sm tabular-nums">
                        {(row.weekdayOvertimeRawHours ?? 0).toFixed(2)}
                      </WfmTableCell>
                      <WfmTableCell className="text-center font-mono text-sm tabular-nums">
                        {(row.weekdayOvertimeWeightedHours ?? 0).toFixed(2)}
                      </WfmTableCell>
                      <WfmTableCell className="text-center font-mono text-sm tabular-nums">
                        {(row.fridayOvertimeRawHours ?? 0).toFixed(2)}
                      </WfmTableCell>
                      <WfmTableCell className="text-center font-mono text-sm tabular-nums">
                        {(row.fridayOvertimeWeightedHours ?? 0).toFixed(2)}
                      </WfmTableCell>
                      <WfmTableCell className="text-center font-mono text-sm font-semibold tabular-nums text-atlas-ink">
                        {(row.totalBillableHours ?? 0).toFixed(2)}
                      </WfmTableCell>
                      <WfmTableCell className="text-center font-mono text-sm tabular-nums">
                        {(row.hourlyRate ?? 0).toFixed(4)}
                      </WfmTableCell>
                      <WfmTableCell className="text-center font-mono text-sm font-semibold tabular-nums text-atlas-brand">
                        {(row.actualPay ?? row.netPay ?? row.totalPay ?? 0).toFixed(2)}
                      </WfmTableCell>
                      <WfmTableCell className="text-center font-mono text-sm tabular-nums text-atlas-danger">
                        {(row.deduction ?? 0).toFixed(2)}
                      </WfmTableCell>
                      <WfmTableCell className="text-center text-[11px] leading-snug text-atlas-muted">
                        {row.lastRecordLeaveHint ? (
                          <span className="rounded-sm border border-atlas-warning/30 bg-atlas-warning/10 px-1.5 py-0.5 text-atlas-ink">
                            {row.lastRecordLeaveHint}
                          </span>
                        ) : (
                          "—"
                        )}
                      </WfmTableCell>
                    </WfmTableRow>
                  ))}
              </WfmTableBody>
            </WfmTable>
          </div>
        </>
      ) : null}
    </div>
  );
}
