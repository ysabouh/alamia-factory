"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calculator, Check, Trash2, X } from "lucide-react";

import {
  WfmField,
  WfmInput,
  WfmPageHeader,
  WfmSelect,
  WfmTable,
  WfmTableBody,
  WfmTableCell,
  WfmTableHead,
  WfmTableHeader,
  WfmTableRow
} from "@/components/workforce/atlas";
import { Button } from "@/components/ui/button";
import { WfmStatusBadge } from "@/components/workforce/atlas";
import { useFactoryAuth } from "@/contexts/factory-auth-context";
import { workforceApi } from "@/lib/api/workforce-client";
import {
  workforceAttendanceApi,
  type OvertimePolicyJson,
  type OvertimeRequestJson,
  type OvertimeStatusLogJson
} from "@/lib/api/workforce-attendance-client";
import {
  computeOvertimeHours,
  DEFAULT_OVERTIME_POLICY,
  formatHours,
  type OvertimeHoursComputed
} from "@/lib/attendance/overtime-hours";
import { OvertimeEmployeePicker } from "@/features/workforce/attendance/components/overtime-employee-picker";
import { OvertimeTimeSelect } from "@/features/workforce/attendance/components/overtime-time-select";
import { clampOvertimeTimeString } from "@/lib/attendance/overtime-time";

const inputClass = "h-10 text-sm";
const timeInputClass = "h-8 font-mono text-sm tabular-nums";
const cellText = "text-sm text-atlas-ink";
const cellMono = "font-mono text-sm tabular-nums text-atlas-ink";
const cellMuted = "text-xs text-atlas-muted";

const statusLabels: Record<OvertimeRequestJson["status"], string> = {
  pending: "قيد الانتظار",
  approved: "معتمد",
  rejected: "مرفوض",
  completed: "مكتمل"
};

const actionLabels: Record<string, string> = {
  created: "إنشاء",
  updated: "تعديل",
  recalculated: "إعادة حساب",
  deleted: "حذف",
  approved: "اعتماد",
  rejected: "رفض",
  completed: "إغلاق"
};

const ACTIVE_OVERTIME_STATUSES = new Set<OvertimeRequestJson["status"]>([
  "pending",
  "approved",
  "completed"
]);

const statusTone = (s: OvertimeRequestJson["status"]) => {
  if (s === "approved" || s === "completed") return "active" as const;
  if (s === "rejected") return "danger" as const;
  if (s === "pending") return "warning" as const;
  return "neutral" as const;
};

type TimeDraft = { startTime: string; endTime: string };

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("ar-SA", {
      dateStyle: "short",
      timeStyle: "short"
    });
  } catch {
    return iso;
  }
}

export function OvertimeWorkspace() {
  const { can } = useFactoryAuth();
  const canRequest = can("overtime.request");
  const canApprove = can("overtime.approve");
  const canDelete = can("overtime.delete");

  const [rows, setRows] = useState<OvertimeRequestJson[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [listDate, setListDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [recordScopeFilter, setRecordScopeFilter] = useState<"active" | "inactive" | "all">("active");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Array<{ id: string; label: string }>>([]);
  const [drafts, setDrafts] = useState<Record<string, TimeDraft>>({});
  const [recalcEditIds, setRecalcEditIds] = useState<Set<string>>(() => new Set());
  const [overtimePolicy, setOvertimePolicy] = useState<OvertimePolicyJson>(DEFAULT_OVERTIME_POLICY);
  const [formResetKey, setFormResetKey] = useState(0);

  const todayIso = () => new Date().toISOString().slice(0, 10);

  const fetchDefaultForm = useCallback(async (overtimeDate = todayIso()) => {
    try {
      const daily = await workforceAttendanceApi.dailyRoster({ date: overtimeDate });
      return {
        employeeId: "",
        overtimeDate,
        startTime: clampOvertimeTimeString(daily.defaults.overtimeFrom),
        endTime: clampOvertimeTimeString(daily.defaults.overtimeTo ?? daily.defaults.checkOut),
        assignmentReason: ""
      };
    } catch {
      return {
        employeeId: "",
        overtimeDate,
        startTime: "19:00",
        endTime: "24:00",
        assignmentReason: ""
      };
    }
  }, []);

  const [form, setForm] = useState({
    employeeId: "",
    overtimeDate: todayIso(),
    startTime: "19:00",
    endTime: "24:00",
    assignmentReason: ""
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await workforceAttendanceApi.listOvertime({
        status: statusFilter !== "all" ? statusFilter : undefined,
        recordScope: canDelete ? recordScopeFilter : "active",
        from: listDate,
        to: listDate,
        page: 1,
        pageSize: 50
      });
      if (res.meta.overtimePolicy) {
        setOvertimePolicy(res.meta.overtimePolicy);
      }
      setRows(
        res.data.map((r) => ({
          ...r,
          isActive: r.isActive ?? true,
          deletedAt: r.deletedAt ?? null,
          statusLogs: r.statusLogs ?? [],
          assignmentReason: r.assignmentReason ?? null
        }))
      );
      const nextDrafts: Record<string, TimeDraft> = {};
      if (canRequest && !canApprove) {
        for (const r of res.data) {
          if (r.status === "pending") {
            nextDrafts[r.id] = {
              startTime: clampOvertimeTimeString(r.startTime),
              endTime: clampOvertimeTimeString(r.endTime)
            };
          }
        }
      }
      setDrafts(nextDrafts);
      setRecalcEditIds(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل التحميل");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, listDate, recordScopeFilter, canDelete, canRequest, canApprove]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setForm((f) => (f.overtimeDate === listDate ? f : { ...f, overtimeDate: listDate }));
  }, [listDate]);

  useEffect(() => {
    void (async () => {
      const res = await workforceApi.listEmployees({ page: 1, pageSize: 100, isActive: true });
      setEmployees(
        (res.data as Array<{ id?: string; fullName?: string; employeeNumber?: string }>)
          .map((e) => ({
            id: String(e.id ?? ""),
            label: `${e.employeeNumber ?? ""} — ${e.fullName ?? ""}`
          }))
          .filter((o) => o.id)
      );
    })();
  }, []);

  useEffect(() => {
    void workforceAttendanceApi
      .dailyRoster({ date: form.overtimeDate })
      .then((daily) => {
        setForm((f) => ({
          ...f,
          startTime: clampOvertimeTimeString(daily.defaults.overtimeFrom),
          endTime: clampOvertimeTimeString(daily.defaults.overtimeTo ?? daily.defaults.checkOut)
        }));
      })
      .catch(() => {});
  }, [form.overtimeDate]);

  const selectedRow = useMemo(
    () => rows.find((r) => r.id === selectedId) ?? null,
    [rows, selectedId]
  );

  const formHoursPreview = useMemo(
    () =>
      computeOvertimeHours(form.overtimeDate, form.startTime, form.endTime, overtimePolicy),
    [form.overtimeDate, form.startTime, form.endTime, overtimePolicy]
  );

  const listedEmployeeIdsForDay = useMemo(() => {
    const ids = new Set<string>();
    const day = form.overtimeDate;
    for (const r of rows) {
      if (r.overtimeDate !== day) continue;
      if (r.isActive !== false && ACTIVE_OVERTIME_STATUSES.has(r.status)) ids.add(r.employeeId);
    }
    return ids;
  }, [rows, form.overtimeDate]);

  const resolveRowHours = (
    row: OvertimeRequestJson,
    draft?: TimeDraft
  ): OvertimeHoursComputed & { fromApi: boolean } => {
    const start = draft?.startTime ?? row.startTime;
    const end = draft?.endTime ?? row.endTime;
    if (row.durationHours > 0 && row.weightedHours > 0 && !draft) {
      return {
        durationHours: row.durationHours,
        weightedHours: row.weightedHours,
        rateMultiplier: row.rateMultiplier,
        multiplierLabel: row.multiplierLabel,
        isFriday: row.rateMultiplier >= overtimePolicy.fridayMultiplier - 0.001,
        fromApi: true
      };
    }
    const computed = computeOvertimeHours(row.overtimeDate, start, end, overtimePolicy);
    return { ...computed, fromApi: false };
  };

  const submit = async () => {
    if (!form.employeeId) {
      setError("اختر الموظف أولاً");
      return;
    }
    if (formHoursPreview.durationHours <= 0) {
      setError("وقت النهاية يجب أن يكون بعد وقت البداية");
      return;
    }
    if (listedEmployeeIdsForDay.has(form.employeeId)) {
      setError("هذا الموظف لديه طلب إضافي في هذا اليوم مسبقاً");
      return;
    }
    setError(null);
    try {
      const created = await workforceAttendanceApi.createOvertime({
        employeeId: form.employeeId,
        overtimeDate: form.overtimeDate,
        startTime: clampOvertimeTimeString(form.startTime),
        endTime: clampOvertimeTimeString(form.endTime),
        assignmentReason: form.assignmentReason || undefined
      });
      setForm(await fetchDefaultForm(listDate));
      setFormResetKey((k) => k + 1);
      setSelectedId(created.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الإنشاء");
    }
  };

  const startRecalcEdit = (row: OvertimeRequestJson) => {
    setDrafts((d) => ({
      ...d,
      [row.id]: {
        startTime: clampOvertimeTimeString(row.startTime),
        endTime: clampOvertimeTimeString(row.endTime)
      }
    }));
    setRecalcEditIds((s) => new Set(s).add(row.id));
    setSelectedId(row.id);
    setError(null);
  };

  const cancelRecalcEdit = (rowId: string) => {
    setRecalcEditIds((s) => {
      const next = new Set(s);
      next.delete(rowId);
      return next;
    });
    setDrafts((d) => {
      const { [rowId]: _removed, ...rest } = d;
      return rest;
    });
  };

  const applyRecalcEdit = async (row: OvertimeRequestJson) => {
    const draft = drafts[row.id];
    if (!draft || !recalcEditIds.has(row.id)) return;
    const preview = computeOvertimeHours(row.overtimeDate, draft.startTime, draft.endTime, overtimePolicy);
    if (preview.durationHours <= 0) {
      setError("وقت النهاية يجب أن يكون بعد وقت البداية");
      return;
    }
    setSavingId(row.id);
    setError(null);
    try {
      await workforceAttendanceApi.updateOvertime(row.id, {
        startTime: clampOvertimeTimeString(draft.startTime),
        endTime: clampOvertimeTimeString(draft.endTime),
        assignmentReason: row.assignmentReason
      });
      setRecalcEditIds((s) => {
        const next = new Set(s);
        next.delete(row.id);
        return next;
      });
      await load();
      setSelectedId(row.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل تعديل الحساب");
    } finally {
      setSavingId(null);
    }
  };

  const saveRowTimes = async (row: OvertimeRequestJson) => {
    const draft = drafts[row.id];
    if (!draft) return;
    const preview = computeOvertimeHours(row.overtimeDate, draft.startTime, draft.endTime, overtimePolicy);
    if (preview.durationHours <= 0) {
      setError("وقت النهاية يجب أن يكون بعد وقت البداية");
      return;
    }
    setSavingId(row.id);
    setError(null);
    try {
      await workforceAttendanceApi.updateOvertime(row.id, {
        startTime: clampOvertimeTimeString(draft.startTime),
        endTime: clampOvertimeTimeString(draft.endTime),
        assignmentReason: row.assignmentReason
      });
      await load();
      setSelectedId(row.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الحفظ");
    } finally {
      setSavingId(null);
    }
  };

  const deleteRow = async (row: OvertimeRequestJson) => {
    const ok = window.confirm(
      `حذف طلب الإضافي لـ ${row.fullName} بتاريخ ${row.overtimeDate}؟\n(إلغاء تنشيط — يمكن استرجاعه من قاعدة البيانات فقط)`
    );
    if (!ok) return;
    setSavingId(row.id);
    setError(null);
    try {
      await workforceAttendanceApi.deleteOvertime(row.id);
      if (selectedId === row.id) setSelectedId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الحذف");
    } finally {
      setSavingId(null);
    }
  };

  const mainColSpan = 11;

  return (
    <div className="space-y-6">
      <WfmPageHeader
        kicker="الإضافي"
        title="طلبات العمل الإضافي"
        description={`تسجيل واعتماد الإضافي. المعامل: ${overtimePolicy.weekdayLabel} لأيام الأسبوع، ${overtimePolicy.fridayLabel} ليوم الجمعة.`}
      />

      {canRequest ? (
        <div className="rounded-sm border border-atlas-rule bg-atlas-paper p-4 shadow-atlasCard">
          <p className="mb-3 text-sm font-semibold text-atlas-ink">طلب إضافي جديد</p>
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-12">
              <WfmField label="الموظف" className="md:col-span-4">
                <OvertimeEmployeePicker
                  key={formResetKey}
                  employees={employees}
                  excludedIds={listedEmployeeIdsForDay}
                  value={form.employeeId}
                  inputClassName={inputClass}
                  onChange={(employeeId) => setForm((f) => ({ ...f, employeeId }))}
                />
              </WfmField>
              <WfmField label="سبب الإسناد" className="md:col-span-8">
                <WfmInput
                  className={inputClass}
                  placeholder="سبب الإسناد"
                  value={form.assignmentReason}
                  onChange={(e) => setForm((f) => ({ ...f, assignmentReason: e.target.value }))}
                />
              </WfmField>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <WfmField label="التاريخ">
                <WfmInput
                  type="date"
                  className={inputClass}
                  value={form.overtimeDate}
                  onChange={(e) => setForm((f) => ({ ...f, overtimeDate: e.target.value }))}
                />
              </WfmField>
              <WfmField label="من">
                <OvertimeTimeSelect
                  value={form.startTime}
                  selectClassName={timeInputClass}
                  onChange={(startTime) => setForm((f) => ({ ...f, startTime }))}
                />
              </WfmField>
              <WfmField label="إلى">
                <OvertimeTimeSelect
                  value={form.endTime}
                  selectClassName={timeInputClass}
                  onChange={(endTime) => setForm((f) => ({ ...f, endTime }))}
                />
              </WfmField>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button type="button" variant="atlasPrimary" className="rounded-sm" onClick={() => void submit()}>
              إرسال الطلب
            </Button>
            <WfmStatusBadge tone="warning">قيد الانتظار</WfmStatusBadge>
          </div>
          <div
            className={`mt-4 rounded-sm border border-atlas-rule bg-atlas-canvas/40 px-3 py-2 ${cellText}`}
            aria-live="polite"
          >
            <p className="font-medium text-atlas-ink">معاينة الساعات قبل الإرسال</p>
            <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1">
              <span>
                <span className="text-atlas-muted">المعامل: </span>
                {formHoursPreview.multiplierLabel}
              </span>
              <span>
                <span className="text-atlas-muted">ساعات فعلية: </span>
                <span className={cellMono}>{formatHours(formHoursPreview.durationHours)}</span>
              </span>
              <span>
                <span className="text-atlas-muted">ساعات الإضافي النهائية: </span>
                <span className={`font-semibold text-atlas-brand ${cellMono}`}>
                  {formatHours(formHoursPreview.weightedHours)}
                </span>
              </span>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-end gap-3 rounded-sm border border-atlas-rule bg-atlas-paper/80 px-3 py-3">
        <WfmField label="يوم الإضافي" className="min-w-[10.5rem]">
          <WfmInput
            type="date"
            className={inputClass}
            value={listDate}
            onChange={(e) => {
              const next = e.target.value;
              if (next) setListDate(next);
            }}
          />
        </WfmField>
        <WfmSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-[12rem]">
          <option value="all">كل الحالات</option>
          <option value="pending">قيد الانتظار</option>
          <option value="approved">معتمد</option>
          <option value="rejected">مرفوض</option>
          <option value="completed">مكتمل</option>
        </WfmSelect>
        {canDelete ? (
          <WfmSelect
            value={recordScopeFilter}
            onChange={(e) => setRecordScopeFilter(e.target.value as "active" | "inactive" | "all")}
            className="max-w-[11rem]"
          >
            <option value="active">نشطة</option>
            <option value="inactive">غير نشطة</option>
            <option value="all">الكل</option>
          </WfmSelect>
        ) : null}
        <Button type="button" variant="atlasOutline" className="rounded-sm" disabled={loading} onClick={() => void load()}>
          تحديث
        </Button>
        <span className="pb-2 text-xs text-atlas-muted">
          {loading ? "جاري التحميل…" : `${rows.length} طلب في هذا اليوم`}
        </span>
      </div>

      {error ? <p className="text-sm text-atlas-danger">{error}</p> : null}

      <WfmTable>
        <WfmTableHeader>
          <WfmTableRow>
            <WfmTableHead className="w-10 text-center">#</WfmTableHead>
            <WfmTableHead className="text-center">رقم الموظف</WfmTableHead>
            <WfmTableHead className="text-center">الموظف</WfmTableHead>
            <WfmTableHead className="text-center">التاريخ</WfmTableHead>
            <WfmTableHead className="min-w-[7.5rem] text-center">من</WfmTableHead>
            <WfmTableHead className="min-w-[7.5rem] text-center">إلى</WfmTableHead>
            <WfmTableHead className="min-w-[6.5rem] text-center">المعامل</WfmTableHead>
            <WfmTableHead className="min-w-[5rem] text-center">ساعات فعلية</WfmTableHead>
            <WfmTableHead className="min-w-[5.5rem] text-center">ساعات الإضافي</WfmTableHead>
            <WfmTableHead className="text-center">الحالة</WfmTableHead>
            <WfmTableHead className="text-center">إجراء</WfmTableHead>
          </WfmTableRow>
        </WfmTableHeader>
        <WfmTableBody>
          {loading && rows.length === 0 ? (
            <WfmTableRow>
              <WfmTableCell colSpan={mainColSpan} className={`py-8 text-center ${cellMuted}`}>
                جاري التحميل…
              </WfmTableCell>
            </WfmTableRow>
          ) : rows.length === 0 && !canRequest ? (
            <WfmTableRow>
              <WfmTableCell colSpan={mainColSpan} className={`py-8 text-center ${cellMuted}`}>
                لا توجد طلبات إضافي.
              </WfmTableCell>
            </WfmTableRow>
          ) : (
            rows.map((r, index) => {
              const isActive = r.isActive !== false;
              const pending = isActive && r.status === "pending";
              const inRecalcEdit = recalcEditIds.has(r.id);
              const requesterPendingEdit = pending && canRequest && !canApprove;
              const showTimeEditors = requesterPendingEdit || (inRecalcEdit && canApprove);
              const draft = drafts[r.id] ?? { startTime: r.startTime, endTime: r.endTime };
              const dirty =
                requesterPendingEdit &&
                (draft.startTime !== r.startTime || draft.endTime !== r.endTime);
              const hours = resolveRowHours(r, showTimeEditors ? draft : undefined);

              return (
                <WfmTableRow
                  key={r.id}
                  className={
                    !isActive
                      ? "bg-atlas-canvas/50 opacity-80"
                      : selectedId === r.id
                        ? "bg-atlas-brand/10"
                        : undefined
                  }
                  onClick={() => setSelectedId(r.id)}
                >
                  <WfmTableCell className={`w-10 text-center ${cellMuted}`}>{index + 1}</WfmTableCell>
                  <WfmTableCell className={`text-center ${cellMono}`}>{r.employeeNumber || "—"}</WfmTableCell>
                  <WfmTableCell className={`font-medium ${cellText}`}>{r.fullName}</WfmTableCell>
                  <WfmTableCell className={`text-center ${cellMono}`}>{r.overtimeDate}</WfmTableCell>
                  <WfmTableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    {showTimeEditors ? (
                      <OvertimeTimeSelect
                        value={draft.startTime}
                        selectClassName={timeInputClass}
                        onChange={(startTime) =>
                          setDrafts((d) => ({
                            ...d,
                            [r.id]: { ...draft, startTime }
                          }))
                        }
                      />
                    ) : (
                      <span className={cellMono}>{r.startTime}</span>
                    )}
                  </WfmTableCell>
                  <WfmTableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    {showTimeEditors ? (
                      <OvertimeTimeSelect
                        value={draft.endTime}
                        selectClassName={timeInputClass}
                        onChange={(endTime) =>
                          setDrafts((d) => ({
                            ...d,
                            [r.id]: { ...draft, endTime }
                          }))
                        }
                      />
                    ) : (
                      <span className={cellMono}>{r.endTime}</span>
                    )}
                  </WfmTableCell>
                  <WfmTableCell className={`text-center ${cellText}`}>{hours.multiplierLabel}</WfmTableCell>
                  <WfmTableCell className={`text-center ${cellMono}`}>
                    {formatHours(hours.durationHours)}
                  </WfmTableCell>
                  <WfmTableCell className={`text-center font-semibold text-atlas-brand ${cellMono}`}>
                    {formatHours(
                      r.status === "approved" || r.status === "completed"
                        ? r.approvedHours > 0
                          ? r.approvedHours
                          : hours.weightedHours
                        : hours.weightedHours
                    )}
                  </WfmTableCell>
                  <WfmTableCell className="text-center">
                    <div className="flex flex-wrap items-center justify-center gap-1">
                      <WfmStatusBadge tone={statusTone(r.status)}>{statusLabels[r.status]}</WfmStatusBadge>
                      {!isActive ? <WfmStatusBadge tone="neutral">غير نشط</WfmStatusBadge> : null}
                    </div>
                  </WfmTableCell>
                  <WfmTableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-wrap justify-center gap-1">
                      {pending && canRequest && !canApprove && dirty ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="atlasOutline"
                          className="h-7 rounded-sm px-2 text-[10px]"
                          disabled={savingId === r.id}
                          onClick={() => void saveRowTimes(r)}
                        >
                          حفظ
                        </Button>
                      ) : null}
                      {isActive && canApprove && !inRecalcEdit ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="atlasOutline"
                          title="تعديل أوقات من/إلى ثم إعادة حساب الساعات"
                          className="h-7 gap-1 rounded-sm border-atlas-info bg-atlas-info px-2 text-[10px] text-white hover:border-atlas-info hover:bg-atlas-info/90"
                          disabled={savingId === r.id}
                          onClick={() => startRecalcEdit(r)}
                        >
                          <Calculator className="h-3 w-3" aria-hidden />
                          إعادة حساب
                        </Button>
                      ) : null}
                      {isActive && canApprove && inRecalcEdit ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="atlasPrimary"
                            title="حفظ الأوقات وإعادة حساب ساعات الإضافي"
                            className="h-7 gap-1 rounded-sm px-2 text-[10px]"
                            disabled={savingId === r.id}
                            onClick={() => void applyRecalcEdit(r)}
                          >
                            <Calculator className="h-3 w-3" aria-hidden />
                            تعديل الحساب
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="atlasOutline"
                            className="h-7 rounded-sm px-2 text-[10px]"
                            disabled={savingId === r.id}
                            onClick={() => cancelRecalcEdit(r.id)}
                          >
                            إلغاء
                          </Button>
                        </>
                      ) : null}
                      {isActive && canApprove && r.status === "pending" ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="atlasPrimary"
                            className="h-7 rounded-sm"
                            onClick={() => void workforceAttendanceApi.approveOvertime(r.id).then(load)}
                          >
                            <Check className="h-3.5 w-3.5" aria-hidden />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="atlasOutline"
                            className="h-7 rounded-sm text-atlas-danger"
                            onClick={() => {
                              const reason = window.prompt("سبب الرفض (يُسجَّل في الطلب وسجل التتبع)");
                              if (reason) void workforceAttendanceApi.rejectOvertime(r.id, reason).then(load);
                            }}
                          >
                            <X className="h-3.5 w-3.5" aria-hidden />
                          </Button>
                        </>
                      ) : null}
                      {isActive && canApprove && r.status === "approved" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="atlasOutline"
                          className="h-7 rounded-sm px-2 text-[10px]"
                          onClick={() => void workforceAttendanceApi.completeOvertime(r.id).then(load)}
                        >
                          إغلاق
                        </Button>
                      ) : null}
                      {isActive && canDelete ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="atlasOutline"
                          title="حذف الطلب (إلغاء تنشيط)"
                          className="h-7 rounded-sm text-atlas-danger hover:bg-atlas-danger/10"
                          disabled={savingId === r.id}
                          onClick={() => void deleteRow(r)}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </Button>
                      ) : null}
                    </div>
                  </WfmTableCell>
                </WfmTableRow>
              );
            })
          )}
        </WfmTableBody>
      </WfmTable>

      {selectedRow ? (
        <div className="space-y-3 rounded-sm border border-atlas-rule bg-atlas-paper p-4 shadow-atlasCard">
          <p className="text-sm font-semibold text-atlas-ink">
            سجل تتبع الطلب — {selectedRow.fullName} ({selectedRow.overtimeDate})
          </p>
          <div className={`flex flex-wrap gap-x-6 gap-y-1 border-b border-atlas-rule pb-3 ${cellText}`}>
            <span>
              <span className="text-atlas-muted">آخر تحديث: </span>
              {formatDateTime(selectedRow.updatedAt)}
            </span>
            <span>
              <span className="text-atlas-muted">من عدّل: </span>
              {selectedRow.updatedByName ?? "—"}
            </span>
            {selectedRow.isActive === false && selectedRow.deletedAt ? (
              <span className="text-atlas-danger">
                <span className="text-atlas-muted">تاريخ الإلغاء: </span>
                {formatDateTime(selectedRow.deletedAt)}
              </span>
            ) : null}
          </div>
          {(() => {
            const h = resolveRowHours(selectedRow);
            return (
              <div className={`flex flex-wrap gap-x-6 gap-y-1 ${cellText}`}>
                <span>
                  <span className="text-atlas-muted">المعامل: </span>
                  {h.multiplierLabel}
                </span>
                <span>
                  <span className="text-atlas-muted">ساعات فعلية: </span>
                  <span className={cellMono}>{formatHours(h.durationHours)}</span>
                </span>
                <span>
                  <span className="text-atlas-muted">ساعات الإضافي: </span>
                  <span className={`font-semibold text-atlas-brand ${cellMono}`}>
                    {formatHours(
                      selectedRow.approvedHours > 0 ? selectedRow.approvedHours : h.weightedHours
                    )}
                  </span>
                </span>
              </div>
            );
          })()}
          {(selectedRow.assignmentReason || selectedRow.rejectionReason) && (
            <div className={`grid gap-2 md:grid-cols-2 ${cellText}`}>
              {selectedRow.assignmentReason ? (
                <p>
                  <span className="text-atlas-muted">سبب الإسناد: </span>
                  {selectedRow.assignmentReason}
                </p>
              ) : null}
              {selectedRow.rejectionReason ? (
                <p className="text-atlas-danger">
                  <span className="font-medium">سبب الرفض: </span>
                  {selectedRow.rejectionReason}
                </p>
              ) : null}
            </div>
          )}
          <WfmTable>
            <WfmTableHeader>
              <WfmTableRow>
                <WfmTableHead className="w-10 text-center">#</WfmTableHead>
                <WfmTableHead className="text-center">الإجراء</WfmTableHead>
                <WfmTableHead className="text-center">من حالة</WfmTableHead>
                <WfmTableHead className="text-center">إلى حالة</WfmTableHead>
                <WfmTableHead className="text-center">منفّذ</WfmTableHead>
                <WfmTableHead className="text-center">التاريخ</WfmTableHead>
                <WfmTableHead className="text-center">سبب الإسناد</WfmTableHead>
                <WfmTableHead className="text-center">سبب الرفض</WfmTableHead>
                <WfmTableHead className="text-center">ملاحظة</WfmTableHead>
              </WfmTableRow>
            </WfmTableHeader>
            <WfmTableBody>
              {selectedRow.statusLogs.length === 0 ? (
                <WfmTableRow>
                  <WfmTableCell colSpan={9} className={`py-6 text-center ${cellMuted}`}>
                    لا يوجد سجل بعد.
                  </WfmTableCell>
                </WfmTableRow>
              ) : (
                selectedRow.statusLogs.map((log: OvertimeStatusLogJson, i) => (
                  <WfmTableRow key={log.id}>
                    <WfmTableCell className={`text-center ${cellMuted}`}>{i + 1}</WfmTableCell>
                    <WfmTableCell className={`text-center font-medium ${cellText}`}>
                      {actionLabels[log.action] ?? log.action}
                    </WfmTableCell>
                    <WfmTableCell className={`text-center ${cellText}`}>
                      {log.fromStatus ? statusLabels[log.fromStatus as OvertimeRequestJson["status"]] ?? log.fromStatus : "—"}
                    </WfmTableCell>
                    <WfmTableCell className={`text-center ${cellText}`}>
                      {statusLabels[log.toStatus as OvertimeRequestJson["status"]] ?? log.toStatus}
                    </WfmTableCell>
                    <WfmTableCell className={`text-center ${cellText}`}>{log.actorName ?? "—"}</WfmTableCell>
                    <WfmTableCell className={`text-center ${cellMuted}`}>{formatDateTime(log.createdAt)}</WfmTableCell>
                    <WfmTableCell className={`max-w-[10rem] text-center ${cellText}`}>
                      {log.assignmentReason ?? "—"}
                    </WfmTableCell>
                    <WfmTableCell className={`max-w-[10rem] text-center text-atlas-danger ${cellText}`}>
                      {log.rejectionReason ?? "—"}
                    </WfmTableCell>
                    <WfmTableCell className={`max-w-[10rem] text-center ${cellText}`}>{log.note ?? "—"}</WfmTableCell>
                  </WfmTableRow>
                ))
              )}
            </WfmTableBody>
          </WfmTable>
        </div>
      ) : null}
    </div>
  );
}
