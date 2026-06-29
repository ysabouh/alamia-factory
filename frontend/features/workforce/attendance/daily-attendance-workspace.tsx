"use client";



import dynamic from "next/dynamic";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { CalendarCheck, Clock, Search, UserCheck, UserX } from "lucide-react";



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

import { DailyAttendanceRow } from "@/features/workforce/attendance/components/daily-attendance-row";
import { EmployeeAttendanceReportPanel } from "@/features/workforce/attendance/components/employee-attendance-report-panel";

import { useAttendanceStore } from "@/features/workforce/attendance/stores/attendance-store";

import { formatAttendanceDayLabel, formatMoney } from "@/features/workforce/attendance/utils/format";

import {
  workforceAttendanceApi,
  type DailyAttendanceAction
} from "@/lib/api/workforce-attendance-client";



const AttendanceStatusChart = dynamic(

  () =>

    import("@/features/workforce/attendance/components/attendance-status-chart").then(

      (m) => m.AttendanceStatusChart

    ),

  { ssr: false, loading: () => <p className="text-sm text-atlas-muted">جاري تحميل الرسم…</p> }

);



export function DailyAttendanceWorkspace() {

  const searchParams = useSearchParams();
  const reportEmployeeId = searchParams.get("employeeId") ?? undefined;
  const reportFrom = searchParams.get("from") ?? undefined;
  const reportTo = searchParams.get("to") ?? undefined;
  const reportAutoLoad = searchParams.get("autoLoad") === "1";
  const initialTab = searchParams.get("tab") === "report" ? "report" : "daily";

  const { can, loading: authLoading, isAuthenticated } = useFactoryAuth();

  const canView = can("attendance.view");

  const canEdit = can("attendance.manage") || can("attendance.record");



  const {

    selectedDate,

    search,

    dashboard,

    defaults,

    rows,

    loading,

    error,

    setSelectedDate,

    setSearch,

    refresh

  } = useAttendanceStore();



  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"daily" | "report">(initialTab);



  useEffect(() => {

    if (authLoading || !canView) return;

    void refresh();

  }, [authLoading, canView, selectedDate, search, refresh]);



  const chartData = dashboard

    ? [

        { name: "حاضر", value: Number(dashboard.present) || 0 },

        { name: "متأخر", value: Number(dashboard.late) || 0 },

        { name: "غائب", value: Number(dashboard.absent) || 0 },

        { name: "إجازة", value: Number(dashboard.leave) || 0 }

      ]

    : [];



  const runAction = useCallback(

    async (key: string, fn: () => Promise<unknown>) => {

      setActionBusy(key);

      try {

        await fn();

        await refresh();

      } catch (e) {

        const msg = e instanceof Error ? e.message : "فشل تنفيذ الإجراء";

        useAttendanceStore.setState({ error: msg });

      } finally {

        setActionBusy(null);

      }

    },

    [refresh]

  );



  const upsertRow = useCallback(
    async (
      employeeId: string,
      action: DailyAttendanceAction,
      times?: { checkIn: string; checkOut: string }
    ) => {
      if (!defaults) return;
      const payload: Parameters<typeof workforceAttendanceApi.manualEntry>[0] = {
        employeeId: String(employeeId),
        attendanceDate: selectedDate,
        action
      };
      if (action === "present" || action === "recalculate") {
        payload.checkIn = times?.checkIn?.trim() || defaults.checkIn;
        payload.checkOut = times?.checkOut?.trim() || defaults.checkOut;
        payload.overtimeFrom = defaults.overtimeFrom;
      }
      await workforceAttendanceApi.manualEntry(payload);
    },
    [defaults, selectedDate]
  );



  if (authLoading) {

    return <p className="text-sm text-atlas-muted">جاري التحقق من الجلسة…</p>;

  }



  if (!isAuthenticated) {

    return (

      <p className="rounded-sm border border-atlas-rule bg-atlas-paper p-6 text-sm text-atlas-muted">

        يرجى تسجيل الدخول أولاً.

      </p>

    );

  }



  if (!canView) {

    return (

      <div className="space-y-4 rounded-sm border border-atlas-warning/40 bg-atlas-warning/10 p-6">

        <p className="font-semibold text-atlas-ink">لا توجد صلاحية عرض الحضور</p>

        <p className="text-sm text-atlas-muted">

          تحتاج صلاحية <span className="font-mono">attendance.view</span>.

        </p>

      </div>

    );

  }



  return (

    <div className="space-y-6">

      <WfmPageHeader

        kicker="الحضور"

        title="الحضور اليومي"

        description="كل يوم له سجل حضور مستقل. اختر التاريخ أعلاه ثم سجّل الحضور أو الغياب — تُحفظ البيانات لذلك اليوم فقط."

      />

      <div className="flex flex-wrap gap-2 border-b border-atlas-rule pb-1">
        <button
          type="button"
          className={`rounded-sm px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === "daily"
              ? "bg-atlas-brand text-white"
              : "bg-atlas-paper text-atlas-muted hover:text-atlas-ink"
          }`}
          onClick={() => setActiveTab("daily")}
        >
          السجل اليومي
        </button>
        <button
          type="button"
          className={`rounded-sm px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === "report"
              ? "bg-atlas-brand text-white"
              : "bg-atlas-paper text-atlas-muted hover:text-atlas-ink"
          }`}
          onClick={() => setActiveTab("report")}
        >
          تقرير الموظف
        </button>
      </div>

      {activeTab === "report" ? (
        <EmployeeAttendanceReportPanel
          initialEmployeeId={reportEmployeeId}
          initialFromDate={reportFrom}
          initialToDate={reportTo}
          autoLoad={reportAutoLoad}
        />
      ) : null}

      {activeTab === "daily" ? (
      <>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">

        {[

          {
            label: "إجمالي الموظفين",
            value: dashboard?.totalEmployees ?? rows.length,
            icon: CalendarCheck,
            tone: "text-atlas-ink"
          },
          { label: "حاضر", value: dashboard?.present ?? 0, icon: UserCheck, tone: "text-atlas-success" },
          { label: "متأخر", value: dashboard?.late ?? 0, icon: Clock, tone: "text-atlas-warning" },
          { label: "غائب", value: dashboard?.absent ?? 0, icon: UserX, tone: "text-atlas-danger" },
          {
            label: "إجازة",
            value: dashboard?.leave ?? 0,
            icon: CalendarCheck,
            tone: "text-atlas-muted",
            leaveBreakdown: true
          },
          {
            label: "ساعات الدوام",
            value: dashboard?.totalWorkedHours?.toFixed(2) ?? "0.00",
            icon: Clock,
            tone: "text-atlas-brand"
          },
          {
            label: "تكلفة اليوم (ر.س)",
            value: formatMoney(dashboard?.payrollCostToday),
            icon: CalendarCheck,
            tone: "text-atlas-ink"
          }
        ].map((k) => (

          <div key={k.label} className="rounded-sm border border-atlas-rule bg-atlas-paper p-4 shadow-atlasCard">

            <k.icon className={`mb-2 h-5 w-5 ${k.tone}`} aria-hidden />

            <p className="font-mono text-2xl font-bold tabular-nums text-atlas-ink">{k.value}</p>

            {"leaveBreakdown" in k && k.leaveBreakdown ? (
              <p className="mt-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[10px] font-medium">
                <span className="text-teal-700 dark:text-teal-400">
                  مدفوعة: {dashboard?.paidLeave ?? 0}
                </span>
                <span className="text-atlas-muted" aria-hidden>
                  ·
                </span>
                <span className="text-amber-700 dark:text-amber-400">
                  غير مدفوعة: {dashboard?.unpaidLeave ?? 0}
                </span>
              </p>
            ) : null}

            <p className="text-[11px] text-atlas-muted">{k.label}</p>

          </div>

        ))}

      </div>



      <div className="h-56 rounded-sm border border-atlas-rule bg-atlas-paper p-4">

        <p className="mb-2 text-sm font-semibold text-atlas-ink">توزيع الحالات</p>

        <AttendanceStatusChart data={chartData} />

      </div>



      {defaults ? (

        <p className="text-xs text-atlas-muted">

          الأوقات الافتراضية (قابلة للتعديل لاحقاً من الإعدادات): دخول{" "}

          <span className="font-mono">{defaults.checkIn}</span> — خروج{" "}

          <span className="font-mono">{defaults.checkOut}</span>

        </p>

      ) : null}

      <div className="rounded-sm border border-atlas-info/35 bg-atlas-info/10 px-4 py-3 text-sm text-atlas-ink" role="note">
        <p className="font-semibold">ملاحظة مهمة</p>
        <p className="mt-1 text-atlas-muted">
          جميع التسجيلات (حضور، غياب، إعادة حساب) تُحفظ لليوم المحدد في حقل التاريخ فقط:{" "}
          <span className="font-medium text-atlas-ink">{formatAttendanceDayLabel(selectedDate)}</span>
          <span className="font-mono text-atlas-brand"> ({selectedDate})</span>. كل يوم له بيانات منفصلة في
          قاعدة البيانات — غيّر التاريخ لعرض يوم آخر أو تعديله.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-sm border border-atlas-rule bg-atlas-canvas/50 p-4">

        <WfmField label="تاريخ اليوم" className="min-w-[10rem]">

          <WfmInput type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />

        </WfmField>

        <WfmField label="بحث" className="min-w-[12rem] flex-1">

          <div className="relative">

            <Search className="absolute start-2 top-2.5 h-4 w-4 text-atlas-muted" aria-hidden />

            <WfmInput

              className="ps-8"

              placeholder="اسم أو رقم موظف"

              value={search}

              onChange={(e) => setSearch(e.target.value)}

            />

          </div>

        </WfmField>

        <Button type="button" variant="atlasOutline" className="rounded-sm" disabled={loading} onClick={() => void refresh()}>

          تحديث

        </Button>

        <span className="text-xs text-atlas-muted">
          {dashboard
            ? `المجموع: ${dashboard.totalEmployees} — حاضر ${dashboard.present} · غائب ${dashboard.absent}`
            : `${rows.length} موظف`}
        </span>

      </div>



      {error ? (

        <div className="rounded-sm border border-atlas-danger/30 bg-atlas-danger/10 px-4 py-3 text-sm text-atlas-danger" role="alert">

          {error}

        </div>

      ) : null}



      <WfmTable>

        <WfmTableHeader>

          <WfmTableRow>

            <WfmTableHead className="w-10 text-center">#</WfmTableHead>
            <WfmTableHead className="text-center">رقم الموظف</WfmTableHead>
            <WfmTableHead className="text-center">الاسم الكامل</WfmTableHead>
            <WfmTableHead className="text-center">دخول</WfmTableHead>
            <WfmTableHead className="text-center">خروج</WfmTableHead>
            <WfmTableHead className="text-center">ساعات الدوام</WfmTableHead>
            <WfmTableHead className="text-center">حالة الدوام</WfmTableHead>
            <WfmTableHead className="text-center">إجراءات</WfmTableHead>

          </WfmTableRow>

        </WfmTableHeader>

        <WfmTableBody>

          {loading && rows.length === 0 ? (

            <WfmTableRow>

              <WfmTableCell colSpan={8} className="py-8 text-center text-atlas-muted">

                جاري التحميل…

              </WfmTableCell>

            </WfmTableRow>

          ) : rows.length === 0 ? (

            <WfmTableRow>

              <WfmTableCell colSpan={8} className="py-8 text-center text-atlas-muted">

                لا يوجد موظفون نشطون مطابقون للبحث.

              </WfmTableCell>

            </WfmTableRow>

          ) : defaults ? (

            rows.map((row, index) => (

              <DailyAttendanceRow

                key={`${selectedDate}-${row.employeeId}`}

                serialNumber={index + 1}

                row={row}

                defaults={defaults}

                canEdit={canEdit}

                busy={actionBusy === row.employeeId}
                onMarkPresent={(employeeId, times) =>
                  runAction(employeeId, () => upsertRow(employeeId, "present", times))
                }
                onMarkAbsent={(employeeId) => runAction(employeeId, () => upsertRow(employeeId, "absent"))}
                onPaidLeave={(employeeId) => runAction(employeeId, () => upsertRow(employeeId, "paid_leave"))}
                onUnpaidLeave={(employeeId) =>
                  runAction(employeeId, () => upsertRow(employeeId, "unpaid_leave"))
                }
                onRecalculate={(employeeId, times) =>
                  runAction(employeeId, () => upsertRow(employeeId, "recalculate", times))
                }

              />

            ))

          ) : null}

        </WfmTableBody>

      </WfmTable>
      </>
      ) : null}

    </div>

  );

}

