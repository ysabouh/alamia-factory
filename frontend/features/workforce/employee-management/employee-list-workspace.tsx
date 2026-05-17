"use client";

import Link from "next/link";
import type { Route } from "next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users
} from "lucide-react";

import {
  WfmInput,
  WfmSelect,
  WfmTable,
  WfmTableBody,
  WfmTableCell,
  WfmTableHead,
  WfmTableHeader,
  WfmTableRow,
  WfmDrawer,
  WfmPageHeader,
  WfmStatusBadge,
  type WfmBadgeTone
} from "@/components/workforce/atlas";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useFactoryAuth } from "@/contexts/factory-auth-context";

import { useEmployeeRegistry } from "./employee-registry-context";
import { ManagedEmployeeDetail } from "./managed-employee-detail";
import type { EmployeeEmploymentStatus, ManagedEmployee } from "./model";
import { mapUiSortKeyToApi, statusIdForUi, type DashboardEmployeeSortKey } from "./workforce-employee-mapper";

const PAGE_SIZE = 20;

type SortKey = keyof Pick<
  ManagedEmployee,
  | "employeeNumber"
  | "fullName"
  | "role"
  | "department"
  | "hall"
  | "shift"
  | "status"
  | "performanceScore"
  | "attendanceStatus"
>;

function employmentTone(s: ManagedEmployee["status"]): WfmBadgeTone {
  if (s === "active") return "active";
  if (s === "probation") return "warning";
  if (s === "suspended") return "danger";
  return "neutral";
}

function attendanceTone(a: ManagedEmployee["attendanceStatus"]): WfmBadgeTone {
  if (a === "present") return "active";
  if (a === "late") return "warning";
  if (a === "absent") return "danger";
  return "info";
}

export function EmployeeListWorkspace() {
  const {
    catalog,
    catalogLoading,
    catalogError,
    employees,
    listMeta,
    listLoading,
    listError,
    listSource,
    hydrated,
    refetchList,
    deleteEmployee,
    bulkPatchEmployees
  } = useEmployeeRegistry();

  const { can } = useFactoryAuth();
  const canManageEmployees = can("workforce.manage_employees");

  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("all");
  const [shift, setShift] = useState("all");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState<"all" | EmployeeEmploymentStatus>("all");
  const [sortKey, setSortKey] = useState<SortKey>("performanceScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [bulkShiftId, setBulkShiftId] = useState("");
  const [bulkDeptId, setBulkDeptId] = useState("");
  const [deleteBusy, setDeleteBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!catalog) return;
    if (!bulkShiftId && catalog.shifts[0]) setBulkShiftId(catalog.shifts[0].id);
    if (!bulkDeptId && catalog.departments[0]) setBulkDeptId(catalog.departments[0].id);
  }, [catalog, bulkShiftId, bulkDeptId]);

  const runQuery = useCallback(() => {
    if (!hydrated || !catalog) return;
    void refetchList({
      page,
      pageSize: PAGE_SIZE,
      search: search.trim() || undefined,
      departmentId: dept,
      shiftId: shift,
      jobRoleId: role,
      statusFilter: status,
      sortByApi: mapUiSortKeyToApi(sortKey),
      sortUiKey: sortKey as DashboardEmployeeSortKey,
      sortOrder: sortDir
    });
  }, [hydrated, catalog, refetchList, page, search, dept, shift, role, status, sortKey, sortDir]);

  useEffect(() => {
    runQuery();
  }, [runQuery]);

  useEffect(() => {
    if (page > listMeta.totalPages) setPage(Math.max(1, listMeta.totalPages));
  }, [listMeta.totalPages, page]);

  const drawerEmployee = drawerId ? employees.find((e) => e.id === drawerId) : null;

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir(k === "fullName" || k === "employeeNumber" ? "asc" : "desc");
    }
    setPage(1);
  };

  const SortHead = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <WfmTableHead>
      <button type="button" className="inline-flex items-center gap-1 hover:text-atlas-brand" onClick={() => toggleSort(k)}>
        {children}
        {sortKey === k ? sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" /> : null}
      </button>
    </WfmTableHead>
  );

  const pageRows = employees;
  const allPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));
  const toggleAllPage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageRows.forEach((r) => next.delete(r.id));
      else pageRows.forEach((r) => next.add(r.id));
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedList = useMemo(() => employees.filter((e) => selected.has(e.id)), [employees, selected]);

  const bulkSuspend = async () => {
    if (listSource === "dashboard") return;
    if (!catalog) return;
    const sid = statusIdForUi("suspended", catalog.statuses);
    if (!sid) return;
    await bulkPatchEmployees(
      selectedList.map((e) => e.id),
      { statusId: sid, isActive: true }
    );
    setSelected(new Set());
    runQuery();
  };

  const bulkShiftApply = async () => {
    if (listSource === "dashboard") return;
    if (!bulkShiftId) return;
    await bulkPatchEmployees(selectedList.map((e) => e.id), { shiftId: bulkShiftId });
    setSelected(new Set());
    runQuery();
  };

  const bulkDeptApply = async () => {
    if (listSource === "dashboard") return;
    if (!bulkDeptId) return;
    await bulkPatchEmployees(selectedList.map((e) => e.id), { departmentId: bulkDeptId });
    setSelected(new Set());
    runQuery();
  };

  if (catalogLoading || !hydrated) {
    return (
      <div className="space-y-6">
        <div className="h-32 animate-pulse rounded-sm border border-atlas-rule bg-atlas-paper" />
        <div className="h-64 animate-pulse rounded-sm border border-atlas-rule bg-atlas-canvas" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {catalogError ? (
        <div className="rounded-sm border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-atlas-ink">
          <p className="font-semibold text-amber-200">تنبيه: مرجعيات الأقسام/الورديات غير كاملة أو تعذّر تحميلها</p>
          <p className="mt-1 text-atlas-muted">
            السجل أدناه قد يعمل من لوحة المصنع الاحتياطية أو بمرجعيات جزئية. تأكد أن Laravel يعمل وأن المستخدم لديه صلاحية{" "}
            <code className="rounded bg-atlas-canvas px-1 font-mono text-xs">workforce.view</code>.
          </p>
          <p className="mt-2 font-mono text-xs text-amber-100/90">{catalogError}</p>
        </div>
      ) : null}
      <header className="relative overflow-hidden rounded-sm border border-atlas-rule bg-atlas-paper p-6 shadow-atlasCard">
        <div className="pointer-events-none absolute -start-20 top-0 h-40 w-40 rounded-full bg-sf-accent/10 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-atlas-muted">WFM · REGISTRY</p>
            <h1 className="mt-2 flex items-center gap-3 text-2xl font-bold text-atlas-ink md:text-3xl">
              <Users className="h-8 w-8 text-atlas-brand" aria-hidden />
              سجل العاملين الصناعي
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-atlas-muted">
              متصل بـ Laravel — بحث وفلترة وترقيم من الخادم، وإجراءات جماعية عبر PATCH.
            </p>
          </div>
          {canManageEmployees ? (
            <Link href={"/ar/workforce/employees/new" as Route}>
              <Button type="button" variant="atlasPrimary" className="rounded-sm gap-2">
                <Plus className="h-4 w-4" />
                إضافة موظف
              </Button>
            </Link>
          ) : (
            <Button type="button" variant="atlasOutline" className="rounded-sm opacity-60" disabled title="تتطلب صلاحية workforce.manage_employees">
              <Plus className="h-4 w-4" />
              إضافة موظف
            </Button>
          )}
        </div>
      </header>

      {listSource === "dashboard" ? (
        <div className="rounded-lg border border-atlas-warning/40 bg-atlas-warning/10 px-4 py-3 text-sm text-atlas-ink">
          <span className="font-semibold">عرض احتياطي من لوحة المصنع</span>
          <span className="text-atlas-muted">
            {" "}
            — تعذّر تحميل السجل من الخادم أو لا يوجد موظفون في قاعدة البيانات. نفّذ{" "}
            <span className="font-mono text-xs">php artisan migrate --seed</span> في مجلد backend أو أضف موظفين من «إضافة
            موظف». أثناء العرض الاحتياطي لا تُحفظ التعديلات الجماعية أو الحذف على قاعدة البيانات.
          </span>
        </div>
      ) : null}

      {listError ? (
        <div className="rounded-lg border border-atlas-danger/35 bg-atlas-danger/10 px-4 py-3 text-sm text-atlas-danger">{listError}</div>
      ) : null}

      <div className="flex flex-wrap items-end gap-3 rounded-sm border border-atlas-rule bg-atlas-paper p-4">
        <label className="min-w-[12rem] flex-1 basis-[14rem] space-y-1">
          <span className="text-[11px] font-medium text-atlas-muted">بحث</span>
          <div className="relative">
          <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-atlas-muted" />
          <WfmInput
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="الاسم، الرقم، البريد…"
            className="pe-10"
          />
          </div>
        </label>
        <label className="min-w-[9.5rem] shrink-0 space-y-1">
          <span className="text-[11px] font-medium text-atlas-muted">القسم</span>
          <WfmSelect
          value={dept}
          onChange={(e) => {
            setDept(e.target.value);
            setPage(1);
          }}
          className="w-full min-w-[9.5rem]"
        >
          <option value="all">كل الأقسام</option>
          {(catalog?.departments ?? []).map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </WfmSelect>
        </label>
        <label className="min-w-[8.5rem] shrink-0 space-y-1">
          <span className="text-[11px] font-medium text-atlas-muted">الوردية</span>
          <WfmSelect
          value={shift}
          onChange={(e) => {
            setShift(e.target.value);
            setPage(1);
          }}
          className="w-full min-w-[8.5rem]"
        >
          <option value="all">كل الورديات</option>
          {(catalog?.shifts ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </WfmSelect>
        </label>
        <label className="min-w-[9.5rem] shrink-0 space-y-1">
          <span className="text-[11px] font-medium text-atlas-muted">الدور</span>
          <WfmSelect
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          className="w-full min-w-[9.5rem]"
        >
          <option value="all">كل الأدوار</option>
          {(catalog?.jobRoles ?? []).map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </WfmSelect>
        </label>
        <label className="min-w-[8.5rem] shrink-0 space-y-1">
          <span className="text-[11px] font-medium text-atlas-muted">الحالة</span>
          <WfmSelect
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as "all" | EmployeeEmploymentStatus);
            setPage(1);
          }}
          className="w-full min-w-[8.5rem]"
        >
          <option value="all">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="suspended">موقوف</option>
          <option value="probation">مراقبة</option>
          <option value="terminated">منتهي</option>
        </WfmSelect>
        </label>
        <Button
          type="button"
          variant="atlasOutline"
          className="shrink-0"
          onClick={() => {
            setSearch("");
            setDept("all");
            setShift("all");
            setRole("all");
            setStatus("all");
            setPage(1);
          }}
        >
          تصفية الصفر
        </Button>
      </div>

      <WfmTable>
        <WfmTableHeader>
          <WfmTableRow>
            <WfmTableHead className="w-10">
              <input
                type="checkbox"
                checked={allPageSelected}
                onChange={toggleAllPage}
                className="size-4 rounded border-sf-stroke bg-sf-panel accent-sf-accentCool"
                aria-label="تحديد الصفحة"
              />
            </WfmTableHead>
            <WfmTableHead className="w-14">صورة</WfmTableHead>
            <SortHead k="employeeNumber">الرقم</SortHead>
            <SortHead k="fullName">الاسم</SortHead>
            <SortHead k="role">الدور</SortHead>
            <SortHead k="department">القسم</SortHead>
            <SortHead k="hall">القاعة</SortHead>
            <SortHead k="shift">الوردية</SortHead>
            <SortHead k="status">الحالة</SortHead>
            <SortHead k="performanceScore">الأداء</SortHead>
            <SortHead k="attendanceStatus">الحضور</SortHead>
            <WfmTableHead className="text-end">إجراءات</WfmTableHead>
          </WfmTableRow>
        </WfmTableHeader>
        <WfmTableBody>
          {listLoading ? (
            <WfmTableRow>
              <WfmTableCell colSpan={12} className="py-12 text-center text-atlas-muted">
                جاري التحميل…
              </WfmTableCell>
            </WfmTableRow>
          ) : null}
          {!listLoading &&
            pageRows.map((e) => (
              <WfmTableRow key={e.id} className={cn(selected.has(e.id) && "bg-sf-accent/5")}>
                <WfmTableCell>
                  <input
                    type="checkbox"
                    checked={selected.has(e.id)}
                    onChange={() => toggleOne(e.id)}
                    className="size-4 rounded border-sf-stroke bg-sf-panel accent-sf-accentCool"
                    aria-label={`تحديد ${e.fullName}`}
                  />
                </WfmTableCell>
                <WfmTableCell>
                  <div
                    className="h-10 w-10 overflow-hidden rounded-lg border border-atlas-rule bg-sf-panel2"
                    style={
                      e.photoUrl
                        ? { backgroundImage: `url(${e.photoUrl})`, backgroundSize: "cover" }
                        : {
                            background: `linear-gradient(135deg, hsl(${e.performanceScore * 3.6} 45% 40%), hsl(${e.performanceScore * 3.6} 35% 20%))`
                          }
                    }
                  >
                    {!e.photoUrl ? (
                      <span className="flex h-full items-center justify-center text-[10px] font-bold text-atlas-ink">
                        {(e.firstName[0] ?? "") + (e.lastName[0] ?? "")}
                      </span>
                    ) : null}
                  </div>
                </WfmTableCell>
                <WfmTableCell className="font-mono text-xs text-atlas-brand">{e.employeeNumber}</WfmTableCell>
                <WfmTableCell className="font-medium text-atlas-ink">{e.fullName}</WfmTableCell>
                <WfmTableCell className="max-w-[140px] truncate text-atlas-muted">{e.role}</WfmTableCell>
                <WfmTableCell className="text-atlas-slate">{e.department}</WfmTableCell>
                <WfmTableCell className="text-atlas-muted">{e.hall}</WfmTableCell>
                <WfmTableCell className="text-atlas-slate">{e.shift}</WfmTableCell>
                <WfmTableCell>
                  <WfmStatusBadge tone={employmentTone(e.status)}>
                    {e.status === "active" ? "نشط" : e.status === "suspended" ? "موقوف" : e.status === "probation" ? "مراقبة" : "منتهي"}
                  </WfmStatusBadge>
                </WfmTableCell>
                <WfmTableCell className="font-mono text-atlas-brand">{e.performanceScore}</WfmTableCell>
                <WfmTableCell>
                  <WfmStatusBadge tone={attendanceTone(e.attendanceStatus)}>
                    {e.attendanceStatus === "present"
                      ? "حاضر"
                      : e.attendanceStatus === "late"
                        ? "متأخر"
                        : e.attendanceStatus === "absent"
                          ? "غائب"
                          : "إجازة"}
                  </WfmStatusBadge>
                </WfmTableCell>
                <WfmTableCell>
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    <Button
                      type="button"
                      variant="atlasOutline"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      title="عرض التفاصيل"
                      onClick={() => setDrawerId(e.id)}
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">عرض</span>
                    </Button>
                    {listSource === "laravel" ? (
                      <Link href={`/ar/workforce/employees/${encodeURIComponent(e.id)}/edit` as Route}>
                        <Button type="button" variant="atlasOutline" size="icon" className="h-8 w-8 rounded-lg" title="تعديل">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                    ) : (
                      <Button type="button" variant="atlasOutline" size="icon" className="h-8 w-8 rounded-lg opacity-40" disabled title="التعديل يتطلب السجل من الخادم">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="atlasOutline"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-atlas-danger hover:bg-sf-alarm/10"
                      title={listSource === "dashboard" ? "غير متاح في العرض الاحتياطي" : "حذف من قاعدة البيانات"}
                      disabled={listSource === "dashboard" || deleteBusy === e.id}
                      onClick={async () => {
                        setDeleteBusy(e.id);
                        try {
                          await deleteEmployee(e.id);
                          setSelected((s) => {
                            const n = new Set(s);
                            n.delete(e.id);
                            return n;
                          });
                          runQuery();
                        } finally {
                          setDeleteBusy(null);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </WfmTableCell>
              </WfmTableRow>
            ))}
        </WfmTableBody>
      </WfmTable>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-atlas-rule pt-4 text-sm text-atlas-muted">
        <span>
          إجمالي {listMeta.total} — عرض الصفحة {listMeta.page} من {listMeta.totalPages}
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="atlasOutline"
            size="sm"
            className="rounded-lg"
            disabled={page <= 1 || listLoading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="font-mono text-atlas-slate">
            {page} / {listMeta.totalPages}
          </span>
          <Button
            type="button"
            variant="atlasOutline"
            size="sm"
            className="rounded-lg"
            disabled={page >= listMeta.totalPages || listLoading}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {selected.size > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 start-1/2 z-50 flex w-[min(96vw,840px)] -translate-x-1/2 flex-col gap-3 rounded-2xl border border-atlas-rule bg-sf-chassis/95 px-4 py-3 shadow-atlasCard backdrop-blur-md rtl:translate-x-1/2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-atlas-ink">{selected.size} محدد</span>
              <Button type="button" variant="atlasOutline" size="sm" className="rounded-lg" onClick={() => setSelected(new Set())}>
                إلغاء التحديد
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="sfMuted"
                size="sm"
                className="rounded-lg"
                disabled={listSource === "dashboard"}
                onClick={bulkSuspend}
              >
                تعليق الجماعي
              </Button>
              <WfmSelect
                value={bulkShiftId}
                onChange={(e) => setBulkShiftId(e.target.value)}
                className="min-w-[160px]"
                disabled={listSource === "dashboard"}
              >
                {(catalog?.shifts ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </WfmSelect>
              <Button
                type="button"
                variant="sfMuted"
                size="sm"
                className="rounded-lg"
                disabled={listSource === "dashboard"}
                onClick={bulkShiftApply}
              >
                تعيين وردية
              </Button>
              <WfmSelect
                value={bulkDeptId}
                onChange={(e) => setBulkDeptId(e.target.value)}
                className="min-w-[180px]"
                disabled={listSource === "dashboard"}
              >
                {(catalog?.departments ?? []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </WfmSelect>
              <Button
                type="button"
                variant="sfMuted"
                size="sm"
                className="rounded-lg"
                disabled={listSource === "dashboard"}
                onClick={bulkDeptApply}
              >
                نقل قسم
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <WfmDrawer
        open={!!drawerId}
        onOpenChange={(o) => !o && setDrawerId(null)}
        title={drawerEmployee?.fullName ?? ""}
        description="لوحة تفاصيل تشغيلية"
        widthClassName="w-[min(100vw-0.5rem,420px)] sm:w-[min(100vw-1rem,480px)]"
        footer={
          drawerEmployee ? (
            <div className="flex w-full flex-wrap gap-2">
              {listSource === "laravel" ? (
                <Button asChild variant="atlasPrimary" className="flex-1 rounded-sm">
                  <Link href={`/ar/workforce/employees/${encodeURIComponent(drawerEmployee.id)}` as Route}>صفحة كاملة</Link>
                </Button>
              ) : (
                <Button type="button" variant="atlasPrimary" className="flex-1 rounded-sm opacity-45" disabled>
                  صفحة كاملة
                </Button>
              )}
              {listSource === "laravel" ? (
                <Button asChild variant="sfCool" className="flex-1 rounded-sm">
                  <Link href={`/ar/workforce/employees/${encodeURIComponent(drawerEmployee.id)}/edit` as Route}>تعديل</Link>
                </Button>
              ) : (
                <Button type="button" variant="sfCool" className="flex-1 rounded-sm opacity-45" disabled>
                  تعديل
                </Button>
              )}
            </div>
          ) : null
        }
      >
        {drawerEmployee ? <ManagedEmployeeDetail employee={drawerEmployee} onClose={() => setDrawerId(null)} /> : null}
      </WfmDrawer>
    </div>
  );
}
