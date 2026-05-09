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
  IndustrialInput,
  IndustrialSelect,
  IndustrialTable,
  IndustrialTableBody,
  IndustrialTableCell,
  IndustrialTableHead,
  IndustrialTableHeader,
  IndustrialTableRow,
  SfDrawer,
  SfStatusBadge
} from "@/components/smart-factory";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

function employmentTone(s: ManagedEmployee["status"]): React.ComponentProps<typeof SfStatusBadge>["tone"] {
  if (s === "active") return "running";
  if (s === "probation") return "idle";
  if (s === "suspended") return "quality_hold";
  return "offline";
}

function attendanceTone(a: ManagedEmployee["attendanceStatus"]): React.ComponentProps<typeof SfStatusBadge>["tone"] {
  if (a === "present") return "running";
  if (a === "late") return "idle";
  if (a === "absent") return "alarm";
  return "maintenance";
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
    <IndustrialTableHead>
      <button type="button" className="inline-flex items-center gap-1 hover:text-sf-accentCool" onClick={() => toggleSort(k)}>
        {children}
        {sortKey === k ? sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" /> : null}
      </button>
    </IndustrialTableHead>
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
        <div className="h-32 animate-pulse rounded-xl border border-sf-hairline bg-sf-panel/40" />
        <div className="h-64 animate-pulse rounded-xl border border-sf-hairline bg-sf-panel/30" />
      </div>
    );
  }

  if (catalogError) {
    return (
      <div className="rounded-xl border border-sf-alarm/40 bg-sf-alarm/10 p-6 text-sf-ink">
        <p className="font-semibold">تعذر الاتصال بخادم القوى العاملة</p>
        <p className="mt-2 text-sm text-sf-muted">
          شغّل Nest workforce-api (افتراضيًا المنفذ 4000) واضبط{" "}
          <code className="rounded bg-sf-deep px-1 font-mono text-xs">NEXT_PUBLIC_WORKFORCE_API_URL</code> مثل{" "}
          <code className="font-mono text-xs">http://localhost:4000/api/v1</code>
        </p>
        <p className="mt-2 text-sm text-sf-alarm">{catalogError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-xl border border-sf-stroke/40 bg-sf-panel/70 p-6 shadow-industrial">
        <div className="pointer-events-none absolute -start-20 top-0 h-40 w-40 rounded-full bg-sf-accent/10 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-sf-muted">WFM · REGISTRY</p>
            <h1 className="mt-2 flex items-center gap-3 text-2xl font-bold text-sf-ink md:text-3xl">
              <Users className="h-8 w-8 text-sf-accentCool" aria-hidden />
              سجل العاملين الصناعي
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-sf-muted">
              متصل بـ Prisma عبر workforce-api — بحث وفلترة وترقيم من الخادم، وإجراءات جماعية عبر PATCH.
            </p>
          </div>
          <Link href={"/ar/workforce/employees/new" as Route}>
            <Button type="button" variant="sfAccent" className="rounded-xl gap-2">
              <Plus className="h-4 w-4" />
              إضافة موظف
            </Button>
          </Link>
        </div>
      </header>

      {listSource === "dashboard" ? (
        <div className="rounded-lg border border-sf-caution/40 bg-sf-caution/10 px-4 py-3 text-sm text-sf-ink">
          <span className="font-semibold">عرض احتياطي من لوحة المصنع</span>
          <span className="text-sf-muted">
            {" "}
            — جدول الموظفين في <span className="font-mono text-xs">workforce-api</span> فارغ أو غير مزروع. شغّل{" "}
            <span className="font-mono text-xs">npx prisma db seed</span> داخل مجلد workforce-api، أو أضف موظفين من «إضافة
            موظف». أثناء العرض الاحتياطي لا تُحفظ التعديلات الجماعية أو الحذف على Prisma.
          </span>
        </div>
      ) : null}

      {listError ? (
        <div className="rounded-lg border border-sf-alarm/35 bg-sf-alarm/10 px-4 py-3 text-sm text-sf-alarm">{listError}</div>
      ) : null}

      <div className="flex flex-col gap-4 rounded-xl border border-sf-hairline bg-sf-chassis/90 p-4 md:flex-row md:flex-wrap md:items-end">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sf-muted" />
          <IndustrialInput
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="بحث: الاسم، الرقم، البريد..."
            className="pe-10"
          />
        </div>
        <IndustrialSelect
          value={dept}
          onChange={(e) => {
            setDept(e.target.value);
            setPage(1);
          }}
          className="min-w-[160px]"
        >
          <option value="all">كل الأقسام</option>
          {(catalog?.departments ?? []).map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </IndustrialSelect>
        <IndustrialSelect
          value={shift}
          onChange={(e) => {
            setShift(e.target.value);
            setPage(1);
          }}
          className="min-w-[140px]"
        >
          <option value="all">كل الورديات</option>
          {(catalog?.shifts ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </IndustrialSelect>
        <IndustrialSelect
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          className="min-w-[180px]"
        >
          <option value="all">كل الأدوار</option>
          {(catalog?.jobRoles ?? []).map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </IndustrialSelect>
        <IndustrialSelect
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as "all" | EmployeeEmploymentStatus);
            setPage(1);
          }}
          className="min-w-[140px]"
        >
          <option value="all">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="suspended">موقوف</option>
          <option value="probation">مراقبة</option>
          <option value="terminated">منتهي</option>
        </IndustrialSelect>
        <Button
          type="button"
          variant="sfGhost"
          className="rounded-lg"
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

      <IndustrialTable>
        <IndustrialTableHeader>
          <IndustrialTableRow>
            <IndustrialTableHead className="w-10">
              <input
                type="checkbox"
                checked={allPageSelected}
                onChange={toggleAllPage}
                className="size-4 rounded border-sf-stroke bg-sf-panel accent-sf-accentCool"
                aria-label="تحديد الصفحة"
              />
            </IndustrialTableHead>
            <IndustrialTableHead className="w-14">صورة</IndustrialTableHead>
            <SortHead k="employeeNumber">الرقم</SortHead>
            <SortHead k="fullName">الاسم</SortHead>
            <SortHead k="role">الدور</SortHead>
            <SortHead k="department">القسم</SortHead>
            <SortHead k="hall">القاعة</SortHead>
            <SortHead k="shift">الوردية</SortHead>
            <SortHead k="status">الحالة</SortHead>
            <SortHead k="performanceScore">الأداء</SortHead>
            <SortHead k="attendanceStatus">الحضور</SortHead>
            <IndustrialTableHead className="text-end">إجراءات</IndustrialTableHead>
          </IndustrialTableRow>
        </IndustrialTableHeader>
        <IndustrialTableBody>
          {listLoading ? (
            <IndustrialTableRow>
              <IndustrialTableCell colSpan={12} className="py-12 text-center text-sf-muted">
                جاري التحميل…
              </IndustrialTableCell>
            </IndustrialTableRow>
          ) : null}
          {!listLoading &&
            pageRows.map((e) => (
              <IndustrialTableRow key={e.id} className={cn(selected.has(e.id) && "bg-sf-accent/5")}>
                <IndustrialTableCell>
                  <input
                    type="checkbox"
                    checked={selected.has(e.id)}
                    onChange={() => toggleOne(e.id)}
                    className="size-4 rounded border-sf-stroke bg-sf-panel accent-sf-accentCool"
                    aria-label={`تحديد ${e.fullName}`}
                  />
                </IndustrialTableCell>
                <IndustrialTableCell>
                  <div
                    className="h-10 w-10 overflow-hidden rounded-lg border border-sf-stroke/50 bg-sf-panel2"
                    style={
                      e.photoUrl
                        ? { backgroundImage: `url(${e.photoUrl})`, backgroundSize: "cover" }
                        : {
                            background: `linear-gradient(135deg, hsl(${e.performanceScore * 3.6} 45% 40%), hsl(${e.performanceScore * 3.6} 35% 20%))`
                          }
                    }
                  >
                    {!e.photoUrl ? (
                      <span className="flex h-full items-center justify-center text-[10px] font-bold text-sf-ink">
                        {(e.firstName[0] ?? "") + (e.lastName[0] ?? "")}
                      </span>
                    ) : null}
                  </div>
                </IndustrialTableCell>
                <IndustrialTableCell className="font-mono text-xs text-sf-accentCool">{e.employeeNumber}</IndustrialTableCell>
                <IndustrialTableCell className="font-medium text-sf-ink">{e.fullName}</IndustrialTableCell>
                <IndustrialTableCell className="max-w-[140px] truncate text-sf-muted">{e.role}</IndustrialTableCell>
                <IndustrialTableCell className="text-sf-copy">{e.department}</IndustrialTableCell>
                <IndustrialTableCell className="text-sf-muted">{e.hall}</IndustrialTableCell>
                <IndustrialTableCell className="text-sf-copy">{e.shift}</IndustrialTableCell>
                <IndustrialTableCell>
                  <SfStatusBadge tone={employmentTone(e.status)} pulse={e.status === "active"}>
                    {e.status === "active" ? "نشط" : e.status === "suspended" ? "موقوف" : e.status === "probation" ? "مراقبة" : "منتهي"}
                  </SfStatusBadge>
                </IndustrialTableCell>
                <IndustrialTableCell className="font-mono text-sf-accent">{e.performanceScore}</IndustrialTableCell>
                <IndustrialTableCell>
                  <SfStatusBadge tone={attendanceTone(e.attendanceStatus)}>
                    {e.attendanceStatus === "present"
                      ? "حاضر"
                      : e.attendanceStatus === "late"
                        ? "متأخر"
                        : e.attendanceStatus === "absent"
                          ? "غائب"
                          : "إجازة"}
                  </SfStatusBadge>
                </IndustrialTableCell>
                <IndustrialTableCell>
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    <Button type="button" variant="sfGhost" size="icon" className="h-8 w-8 rounded-lg" title="تفاصيل" onClick={() => setDrawerId(e.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {listSource === "prisma" ? (
                      <Link href={`/ar/workforce/employees/${encodeURIComponent(e.id)}/edit` as Route}>
                        <Button type="button" variant="sfGhost" size="icon" className="h-8 w-8 rounded-lg" title="تعديل">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                    ) : (
                      <Button type="button" variant="sfGhost" size="icon" className="h-8 w-8 rounded-lg opacity-40" disabled title="التعديل يتطلب سجلاً في Prisma">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="sfGhost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-sf-alarm hover:bg-sf-alarm/10"
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
                </IndustrialTableCell>
              </IndustrialTableRow>
            ))}
        </IndustrialTableBody>
      </IndustrialTable>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sf-hairline pt-4 text-sm text-sf-muted">
        <span>
          إجمالي {listMeta.total} — عرض الصفحة {listMeta.page} من {listMeta.totalPages}
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="sfGhost"
            size="sm"
            className="rounded-lg"
            disabled={page <= 1 || listLoading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="font-mono text-sf-copy">
            {page} / {listMeta.totalPages}
          </span>
          <Button
            type="button"
            variant="sfGhost"
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
            className="fixed bottom-6 start-1/2 z-50 flex w-[min(96vw,840px)] -translate-x-1/2 flex-col gap-3 rounded-2xl border border-sf-stroke/50 bg-sf-chassis/95 px-4 py-3 shadow-industrial backdrop-blur-md rtl:translate-x-1/2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-sf-ink">{selected.size} محدد</span>
              <Button type="button" variant="sfGhost" size="sm" className="rounded-lg" onClick={() => setSelected(new Set())}>
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
              <IndustrialSelect
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
              </IndustrialSelect>
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
              <IndustrialSelect
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
              </IndustrialSelect>
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

      <SfDrawer
        open={!!drawerId}
        onOpenChange={(o) => !o && setDrawerId(null)}
        title={drawerEmployee?.fullName ?? ""}
        description="لوحة تفاصيل تشغيلية"
        widthClassName="w-[min(100vw-0.5rem,420px)] sm:w-[min(100vw-1rem,480px)]"
        footer={
          drawerEmployee ? (
            <div className="flex w-full flex-wrap gap-2">
              {listSource === "prisma" ? (
                <Button asChild variant="sfAccent" className="flex-1 rounded-xl">
                  <Link href={`/ar/workforce/employees/${encodeURIComponent(drawerEmployee.id)}` as Route}>صفحة كاملة</Link>
                </Button>
              ) : (
                <Button type="button" variant="sfAccent" className="flex-1 rounded-xl opacity-45" disabled>
                  صفحة كاملة
                </Button>
              )}
              {listSource === "prisma" ? (
                <Button asChild variant="sfCool" className="flex-1 rounded-xl">
                  <Link href={`/ar/workforce/employees/${encodeURIComponent(drawerEmployee.id)}/edit` as Route}>تعديل</Link>
                </Button>
              ) : (
                <Button type="button" variant="sfCool" className="flex-1 rounded-xl opacity-45" disabled>
                  تعديل
                </Button>
              )}
            </div>
          ) : null
        }
      >
        {drawerEmployee ? <ManagedEmployeeDetail employee={drawerEmployee} onClose={() => setDrawerId(null)} /> : null}
      </SfDrawer>
    </div>
  );
}
