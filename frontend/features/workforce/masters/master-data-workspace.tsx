"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  Layers,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Search,
  Users
} from "lucide-react";

import {
  WfmInput,
  WfmModal,
  WfmRegistryHeader,
  WfmSelect,
  WfmTable,
  WfmTableBody,
  WfmTableCell,
  WfmTableHead,
  WfmTableHeader,
  WfmTableRow
} from "@/components/workforce/atlas";
import { Button } from "@/components/ui/button";
import { useFactoryAuth } from "@/contexts/factory-auth-context";
import {
  DepartmentForm,
  departmentFormFromRow,
  departmentFormToPayload,
  emptyDepartmentForm,
  type DepartmentFormValues
} from "@/features/workforce/masters/forms/department-form";
import {
  emptyHallForm,
  HallForm,
  hallFormFromRow,
  hallFormToPayload,
  type HallFormValues
} from "@/features/workforce/masters/forms/hall-form";
import {
  emptyJobRoleForm,
  JobRoleForm,
  jobRoleFormFromRow,
  jobRoleFormToPayload,
  type JobRoleFormValues
} from "@/features/workforce/masters/forms/job-role-form";
import {
  emptyShiftForm,
  ShiftForm,
  shiftFormFromRow,
  shiftFormToPayload,
  type ShiftFormValues
} from "@/features/workforce/masters/forms/shift-form";
import {
  CurrencyForm,
  currencyFormFromRow,
  currencyFormToPayload,
  emptyCurrencyForm,
  type CurrencyFormValues
} from "@/features/workforce/masters/forms/currency-form";
import { hallTypeLabel } from "@/features/workforce/masters/hall-types";
import { MasterStatusBadge } from "@/features/workforce/masters/master-status-badge";
import {
  type CurrencyMaster,
  type DepartmentMaster,
  type HallMaster,
  type JobRoleMaster,
  type MasterListMeta,
  type MasterResource,
  type ShiftMaster,
  workforceMastersApi,
  WorkforceApiError
} from "@/lib/api/workforce-masters-client";

const PAGE_SIZE = 20;

type ActiveFilter = "all" | "active" | "inactive";

type MasterColumn<T> = {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
};

type EntityConfig<T, F> = {
  resource: MasterResource;
  title: string;
  subtitle: string;
  monoTag: string;
  titleIcon: ReactNode;
  columns: MasterColumn<T>[];
  emptyForm: () => F;
  formFromRow: (row: T) => F;
  formToPayload: (values: F) => Record<string, unknown>;
  renderForm: (props: {
    values: F;
    onChange: (v: F) => void;
    disabled?: boolean;
    halls: HallMaster[];
    editingRow: T | null;
  }) => ReactNode;
  needsHalls?: boolean;
};

function MasterDataWorkspace<T extends { id: string; isActive: boolean }, F>({
  config
}: {
  config: EntityConfig<T, F>;
}) {
  const { can } = useFactoryAuth();
  const canManage = can("workforce.manage_masters");

  const [rows, setRows] = useState<T[]>([]);
  const [meta, setMeta] = useState<MasterListMeta>({ page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<F>(() => config.emptyForm());
  const [saveBusy, setSaveBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toggleBusy, setToggleBusy] = useState<string | null>(null);
  const [halls, setHalls] = useState<HallMaster[]>([]);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const isActive =
        activeFilter === "all" ? ("all" as const) : activeFilter === "active";
      const res = await workforceMastersApi.list<T>(config.resource, {
        page,
        pageSize: PAGE_SIZE,
        search: search.trim() || undefined,
        isActive
      });
      setRows(res.data);
      setMeta(res.meta);
    } catch (e) {
      const msg = e instanceof WorkforceApiError ? e.message : "تعذّر تحميل البيانات";
      setError(msg);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [config.resource, page, search, activeFilter]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (page > meta.totalPages) setPage(Math.max(1, meta.totalPages));
  }, [meta.totalPages, page]);

  const openCreate = async () => {
    setEditingId(null);
    setFormValues(config.emptyForm());
    setFormError(null);
    if (config.needsHalls) {
      try {
        const list = await workforceMastersApi.listHallsForSelect();
        setHalls(list);
      } catch {
        setHalls([]);
      }
    }
    setModalOpen(true);
  };

  const openEdit = async (row: T) => {
    setEditingId(row.id);
    setFormValues(config.formFromRow(row));
    setFormError(null);
    if (config.needsHalls) {
      try {
        const list = await workforceMastersApi.listHallsForSelect();
        setHalls(list);
      } catch {
        setHalls([]);
      }
    }
    setModalOpen(true);
  };

  const saveForm = async () => {
    if (!canManage) return;
    setSaveBusy(true);
    setFormError(null);
    try {
      const payload = config.formToPayload(formValues);
      if (editingId) {
        await workforceMastersApi.update(config.resource, editingId, payload);
      } else {
        await workforceMastersApi.create(config.resource, payload);
      }
      setModalOpen(false);
      await loadList();
    } catch (e) {
      setFormError(e instanceof WorkforceApiError ? e.message : "تعذّر الحفظ");
    } finally {
      setSaveBusy(false);
    }
  };

  const toggleActive = async (row: T) => {
    if (!canManage) return;
    setToggleBusy(row.id);
    try {
      if (row.isActive) {
        await workforceMastersApi.deactivate(config.resource, row.id);
      } else {
        await workforceMastersApi.activate(config.resource, row.id);
      }
      await loadList();
    } catch (e) {
      setError(e instanceof WorkforceApiError ? e.message : "تعذّر تحديث الحالة");
    } finally {
      setToggleBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <WfmRegistryHeader
        kicker={config.monoTag}
        title={config.title}
        titleIcon={config.titleIcon}
        description={config.subtitle}
        actions={
          <>
            <Button type="button" variant="atlasOutline" className="rounded-sm" asChild>
              <Link href={"/ar/workforce/masters" as Route}>المرجعيات</Link>
            </Button>
            {canManage ? (
              <Button type="button" variant="atlasPrimary" className="rounded-sm gap-2" onClick={() => void openCreate()}>
                <Plus className="h-4 w-4" aria-hidden />
                إضافة
              </Button>
            ) : (
              <Button
                type="button"
                variant="atlasOutline"
                className="rounded-sm opacity-60"
                disabled
                title="تتطلب صلاحية workforce.manage_masters"
              >
                <Plus className="h-4 w-4" aria-hidden />
                إضافة
              </Button>
            )}
          </>
        }
      />

      {error ? (
        <div className="rounded-lg border border-atlas-danger/35 bg-atlas-danger/10 px-4 py-3 text-sm text-atlas-danger">{error}</div>
      ) : null}

      <div className="flex flex-col gap-3 rounded-sm border border-atlas-rule bg-atlas-paper p-4 md:flex-row md:items-end">
        <label className="flex-1 text-xs text-atlas-muted">
          بحث (الاسم أو الرمز)
          <div className="relative mt-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-atlas-muted" aria-hidden />
            <WfmInput
              className="w-full ps-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearch(searchInput);
                  setPage(1);
                }
              }}
            />
          </div>
        </label>
        <label className="w-full text-xs text-atlas-muted md:w-40">
          الحالة
          <WfmSelect
            className="mt-1 w-full"
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value as ActiveFilter);
              setPage(1);
            }}
          >
            <option value="all">الكل</option>
            <option value="active">نشط فقط</option>
            <option value="inactive">معطّل فقط</option>
          </WfmSelect>
        </label>
        <Button
          type="button"
          variant="atlasOutline"
          className="rounded-sm"
          onClick={() => {
            setSearch(searchInput);
            setPage(1);
          }}
        >
          تطبيق
        </Button>
      </div>

      <WfmTable>
          <WfmTableHeader>
            <WfmTableRow>
              {config.columns.map((col) => (
                <WfmTableHead key={col.header} className={col.className}>
                  {col.header}
                </WfmTableHead>
              ))}
              <WfmTableHead className="w-[120px] text-start">الحالة</WfmTableHead>
              {canManage ? <WfmTableHead className="w-[88px] text-center">إجراءات</WfmTableHead> : null}
            </WfmTableRow>
          </WfmTableHeader>
          <WfmTableBody>
            {loading ? (
              <WfmTableRow>
                <WfmTableCell colSpan={config.columns.length + (canManage ? 2 : 1)} className="py-12 text-center text-atlas-muted">
                  جاري التحميل…
                </WfmTableCell>
              </WfmTableRow>
            ) : rows.length === 0 ? (
              <WfmTableRow>
                <WfmTableCell colSpan={config.columns.length + (canManage ? 2 : 1)} className="py-12 text-center text-atlas-muted">
                  لا توجد سجلات
                </WfmTableCell>
              </WfmTableRow>
            ) : (
              rows.map((row) => (
                <WfmTableRow key={row.id}>
                  {config.columns.map((col) => (
                    <WfmTableCell key={col.header} className={col.className}>
                      {col.cell(row)}
                    </WfmTableCell>
                  ))}
                  <WfmTableCell>
                    <MasterStatusBadge active={row.isActive} />
                  </WfmTableCell>
                  {canManage ? (
                    <WfmTableCell className="text-center">
                      <div className="inline-flex items-center justify-center gap-1">
                        <Button
                          type="button"
                          variant="atlasOutline"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          title="تعديل"
                          aria-label="تعديل"
                          onClick={() => void openEdit(row)}
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                        </Button>
                        <Button
                          type="button"
                          variant={row.isActive ? "atlasOutline" : "atlasSecondary"}
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          title={row.isActive ? "تعطيل" : "تفعيل"}
                          aria-label={row.isActive ? "تعطيل" : "تفعيل"}
                          disabled={toggleBusy === row.id}
                          onClick={() => void toggleActive(row)}
                        >
                          {row.isActive ? (
                            <PowerOff className="h-4 w-4" aria-hidden />
                          ) : (
                            <Power className="h-4 w-4" aria-hidden />
                          )}
                        </Button>
                      </div>
                    </WfmTableCell>
                  ) : null}
                </WfmTableRow>
              ))
            )}
          </WfmTableBody>
      </WfmTable>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-atlas-muted">
        <span>
          صفحة {meta.page} من {meta.totalPages} — {meta.total} سجل
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="atlasOutline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronRight className="h-4 w-4" />
            السابق
          </Button>
          <Button
            type="button"
            variant="atlasOutline"
            size="sm"
            disabled={page >= meta.totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            التالي
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <WfmModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingId ? "تعديل السجل" : "إضافة سجل"}
        description={config.title}
        footer={
          <>
            <Button variant="atlasOutline" type="button" onClick={() => setModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="atlasPrimary" type="button" disabled={saveBusy || !canManage} onClick={() => void saveForm()}>
              حفظ
            </Button>
          </>
        }
      >
        {formError ? <p className="mb-3 text-sm text-atlas-danger">{formError}</p> : null}
        {config.renderForm({
          values: formValues,
          onChange: setFormValues,
          disabled: saveBusy,
          halls,
          editingRow: editingId ? (rows.find((r) => r.id === editingId) ?? null) : null
        })}
      </WfmModal>
    </div>
  );
}

const hallsConfig: EntityConfig<HallMaster, HallFormValues> = {
  resource: "halls",
  title: "قاعات الإنتاج",
  subtitle: "إدارة قاعات المصنع — التعطيل يخفي السجل من نماذج الموظفين دون حذفه.",
  monoTag: "WFM · MASTERS · HALLS",
  titleIcon: <Building2 className="h-8 w-8 text-atlas-brand" aria-hidden />,
  emptyForm: emptyHallForm,
  formFromRow: hallFormFromRow,
  formToPayload: hallFormToPayload,
  renderForm: ({ values, onChange, disabled }) => (
    <HallForm values={values} onChange={onChange} disabled={disabled} />
  ), // editingRow unused
  columns: [
    { header: "الرمز", className: "font-mono text-atlas-brand", cell: (r) => r.code },
    { header: "الاسم", cell: (r) => r.name },
    { header: "النوع", cell: (r) => hallTypeLabel(r.hallType) }
  ]
};

const departmentsConfig: EntityConfig<DepartmentMaster, DepartmentFormValues> = {
  resource: "departments",
  title: "الأقسام",
  subtitle: "ربط كل قسم بقاعة إنتاج — مطلوب لنماذج الموظفين.",
  monoTag: "WFM · MASTERS · DEPTS",
  titleIcon: <Layers className="h-8 w-8 text-atlas-brand" aria-hidden />,
  needsHalls: true,
  emptyForm: emptyDepartmentForm,
  formFromRow: departmentFormFromRow,
  formToPayload: departmentFormToPayload,
  renderForm: ({ values, onChange, disabled, halls }) => (
    <DepartmentForm values={values} onChange={onChange} halls={halls} disabled={disabled} />
  ),
  columns: [
    { header: "الرمز", className: "font-mono text-atlas-brand", cell: (r) => r.code },
    { header: "الاسم", cell: (r) => r.name },
    { header: "القاعة", cell: (r) => r.hallName ?? r.hallCode ?? "—" }
  ]
};

const jobRolesConfig: EntityConfig<JobRoleMaster, JobRoleFormValues> = {
  resource: "job-roles",
  title: "الأدوار الوظيفية",
  subtitle: "مستوى الدور من 1 (أدنى) إلى 10 (أعلى).",
  monoTag: "WFM · MASTERS · ROLES",
  titleIcon: <Users className="h-8 w-8 text-atlas-brand" aria-hidden />,
  emptyForm: emptyJobRoleForm,
  formFromRow: jobRoleFormFromRow,
  formToPayload: jobRoleFormToPayload,
  renderForm: ({ values, onChange, disabled }) => (
    <JobRoleForm values={values} onChange={onChange} disabled={disabled} />
  ),
  columns: [
    { header: "الرمز", className: "font-mono text-atlas-brand", cell: (r) => r.code },
    { header: "الاسم", cell: (r) => r.name },
    { header: "المستوى", className: "font-mono", cell: (r) => r.roleLevel }
  ]
};

const currenciesConfig: EntityConfig<CurrencyMaster, CurrencyFormValues> = {
  resource: "currencies",
  title: "العملات",
  subtitle: "الدولار الأمريكي (USD) عملة مرجعية — المعادل = عدد وحدات العملة مقابل 1 دولار.",
  monoTag: "WFM · MASTERS · FX",
  titleIcon: <Coins className="h-8 w-8 text-atlas-brand" aria-hidden />,
  emptyForm: emptyCurrencyForm,
  formFromRow: currencyFormFromRow,
  formToPayload: currencyFormToPayload,
  renderForm: ({ values, onChange, disabled, editingRow }) => (
    <CurrencyForm
      values={values}
      onChange={onChange}
      disabled={disabled}
      isBase={(editingRow as CurrencyMaster | null)?.isBase}
    />
  ),
  columns: [
    { header: "الرمز", className: "font-mono text-atlas-brand", cell: (r) => r.code },
    { header: "الاسم", cell: (r) => r.name },
    { header: "الاختصار", cell: (r) => r.symbol },
    {
      header: "معادل USD",
      className: "font-mono text-sm",
      cell: (r) => (r.isBase ? "1 (أساس)" : r.usdExchangeRate.toLocaleString("ar"))
    }
  ]
};

const shiftsConfig: EntityConfig<ShiftMaster, ShiftFormValues> = {
  resource: "shifts",
  title: "الورديات",
  subtitle: "أوقات البداية والنهاية بصيغة 24 ساعة.",
  monoTag: "WFM · MASTERS · SHIFTS",
  titleIcon: <Clock className="h-8 w-8 text-atlas-brand" aria-hidden />,
  emptyForm: emptyShiftForm,
  formFromRow: shiftFormFromRow,
  formToPayload: shiftFormToPayload,
  renderForm: ({ values, onChange, disabled }) => (
    <ShiftForm values={values} onChange={onChange} disabled={disabled} />
  ),
  columns: [
    { header: "الرمز", className: "font-mono text-atlas-brand", cell: (r) => r.code },
    { header: "الاسم", cell: (r) => r.name },
    {
      header: "الوقت",
      className: "font-mono text-sm",
      cell: (r) => `${r.startTime} – ${r.endTime}`
    }
  ]
};

export function HallsMasterWorkspace() {
  return <MasterDataWorkspace config={hallsConfig} />;
}

export function DepartmentsMasterWorkspace() {
  return <MasterDataWorkspace config={departmentsConfig} />;
}

export function JobRolesMasterWorkspace() {
  return <MasterDataWorkspace config={jobRolesConfig} />;
}

export function ShiftsMasterWorkspace() {
  return <MasterDataWorkspace config={shiftsConfig} />;
}

export function CurrenciesMasterWorkspace() {
  return <MasterDataWorkspace config={currenciesConfig} />;
}
