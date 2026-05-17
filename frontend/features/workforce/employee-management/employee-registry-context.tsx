"use client";

import * as React from "react";

import type { LiveDashboard } from "@/types/factory";
import { WorkforceApiError, workforceApi } from "@/lib/api/workforce-client";

import type { InitialEmployeeListPayload } from "@/lib/api/fetch-workforce-employees-ssr";

import type { PaginatedMeta, WorkforceCatalogJson } from "./workforce-api-types";
import type { EmployeeEmploymentStatus, EmployeeFormInput, FullEmployeeEditInput, ManagedEmployee } from "./model";
import { seedManagedFromDashboard } from "./map-from-ops";
import {
  createPayloadFromForm,
  EMPTY_WORKFORCE_CATALOG,
  filterDashboardManagedEmployees,
  listQueryFromFilters,
  managedEmployeeFromApi,
  normalizeWorkforceCatalog,
  parseApiEmployeeDetail,
  patchPayloadFromFullEdit,
  type DashboardEmployeeSortKey
} from "./workforce-employee-mapper";

function safeSeedManagedFromDashboard(dashboard: LiveDashboard | null | undefined): ManagedEmployee[] {
  if (!dashboard) return [];
  try {
    return seedManagedFromDashboard(dashboard);
  } catch {
    return [];
  }
}

export type EmployeeListQuery = {
  page: number;
  pageSize: number;
  search?: string;
  departmentId?: string;
  shiftId?: string;
  jobRoleId?: string;
  statusFilter: "all" | EmployeeEmploymentStatus;
  sortByApi: string;
  sortUiKey: DashboardEmployeeSortKey;
  sortOrder: "asc" | "desc";
};

type Ctx = {
  catalog: WorkforceCatalogJson | null;
  catalogLoading: boolean;
  catalogError: string | null;
  employees: ManagedEmployee[];
  listMeta: { page: number; pageSize: number; total: number; totalPages: number };
  listLoading: boolean;
  listError: string | null;
  /** `dashboard` = عرض احتياطي من لوحة Laravel عند فشل الاتصال أو صيغة غير متوقعة */
  listSource: "laravel" | "dashboard";
  hydrated: boolean;
  refetchList: (opts: EmployeeListQuery) => Promise<void>;
  fetchEmployeeOne: (id: string) => Promise<ManagedEmployee>;
  createEmployee: (data: EmployeeFormInput) => Promise<ManagedEmployee>;
  updateEmployee: (id: string, data: FullEmployeeEditInput) => Promise<ManagedEmployee>;
  deleteEmployee: (id: string) => Promise<void>;
  patchEmployeeFields: (id: string, patch: Record<string, unknown>) => Promise<ManagedEmployee>;
  bulkPatchEmployees: (ids: string[], patch: Record<string, unknown>) => Promise<void>;
  /** Re-runs the last successful list query (e.g. after PATCH from quick actions). */
  refetchCurrentList: () => Promise<void>;
};

const EmployeeRegistryContext = React.createContext<Ctx | null>(null);

export function EmployeeRegistryProvider({
  children,
  fallbackDashboard,
  initialCatalog,
  initialEmployeeList
}: {
  children: React.ReactNode;
  /** لوحة Laravel: عرض احتياطي عند تعذّر تحميل السجل من واجهة الموارد البشرية */
  fallbackDashboard?: LiveDashboard | null;
  /** كتالوج أقسام/ورديات من الخادم (RSC) عند ضبط ‎LARAVEL_SSR_BEARER_TOKEN‎ — يملأ القوائم قبل المتصفح */
  initialCatalog?: WorkforceCatalogJson | null;
  /** أول صفحة موظفين من الخادم (RSC) — يظهر الجدول حتى بدون ‎factory_token‎ في المتصفح */
  initialEmployeeList?: InitialEmployeeListPayload | null;
}) {
  const lastListQueryRef = React.useRef<EmployeeListQuery | null>(null);
  const fallbackDashboardRef = React.useRef<LiveDashboard | null>(fallbackDashboard ?? null);
  React.useEffect(() => {
    fallbackDashboardRef.current = fallbackDashboard ?? null;
  }, [fallbackDashboard]);

  const [catalog, setCatalog] = React.useState<WorkforceCatalogJson | null>(() => initialCatalog ?? null);
  const [catalogLoading, setCatalogLoading] = React.useState(() => initialCatalog == null);
  const [catalogError, setCatalogError] = React.useState<string | null>(null);

  const [employees, setEmployees] = React.useState<ManagedEmployee[]>(() => initialEmployeeList?.employees ?? []);
  const [listMeta, setListMeta] = React.useState(() => ({
    page: initialEmployeeList?.meta.page ?? 1,
    pageSize: initialEmployeeList?.meta.pageSize ?? 20,
    total: initialEmployeeList?.meta.total ?? 0,
    totalPages: initialEmployeeList?.meta.totalPages ?? 1
  }));
  const [listLoading, setListLoading] = React.useState(false);
  const [listError, setListError] = React.useState<string | null>(null);
  const [listSource, setListSource] = React.useState<"laravel" | "dashboard">("laravel");

  /** لا نربط الجاهزية بـ catalogError — السجل يمكن ملؤه من لوحة Laravel عند الحاجة */
  const hydrated = Boolean(catalog !== null && !catalogLoading);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const hadSsrSeed = Boolean(initialCatalog);
      if (!hadSsrSeed) setCatalogLoading(true);
      setCatalogError(null);
      try {
        const raw = await workforceApi.loadCatalog();
        if (cancelled) return;
        setCatalog(normalizeWorkforceCatalog(raw));
      } catch (e) {
        if (cancelled) return;
        setCatalog((prev) =>
          prev && (prev.halls.length > 0 || prev.departments.length > 0 || prev.jobRoles.length > 0 || prev.statuses.length > 0)
            ? prev
            : EMPTY_WORKFORCE_CATALOG
        );
        setCatalogError(e instanceof Error ? e.message : "فشل تحميل المرجعيات");
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialCatalog]);

  const refetchList = React.useCallback(
    async (opts: EmployeeListQuery) => {
      const cat = catalog ?? EMPTY_WORKFORCE_CATALOG;
      lastListQueryRef.current = opts;
      setListLoading(true);
      setListError(null);

      const applyDashboardPage = (dashboardSeed: ManagedEmployee[]) => {
        const filtered = filterDashboardManagedEmployees(
          dashboardSeed,
          {
            search: opts.search,
            departmentId: opts.departmentId,
            shiftId: opts.shiftId,
            jobRoleId: opts.jobRoleId,
            statusFilter: opts.statusFilter,
            sortKey: opts.sortUiKey,
            sortOrder: opts.sortOrder
          },
          cat
        );
        const total = filtered.length;
        const totalPages = Math.max(1, Math.ceil(total / opts.pageSize));
        const pageSafe = Math.min(Math.max(1, opts.page), totalPages);
        const start = (pageSafe - 1) * opts.pageSize;
        setListSource("dashboard");
        setEmployees(filtered.slice(start, start + opts.pageSize));
        setListMeta({ page: pageSafe, pageSize: opts.pageSize, total, totalPages });
        setListError(null);
      };

      const dash = fallbackDashboardRef.current;
      const dashboardSeed = dash ? seedManagedFromDashboard(dash) : [];

      try {
        const q = listQueryFromFilters({
          page: opts.page,
          pageSize: opts.pageSize,
          search: opts.search,
          departmentId: opts.departmentId,
          shiftId: opts.shiftId,
          jobRoleId: opts.jobRoleId,
          statusFilter: opts.statusFilter,
          sortBy: opts.sortByApi,
          sortOrder: opts.sortOrder,
          statuses: cat.statuses
        });
        const res = await workforceApi.listEmployees(q);
        const rawList = Array.isArray(res.data) ? res.data : [];
        const rows = rawList
          .map((raw) => {
            const d = parseApiEmployeeDetail(raw);
            return d ? managedEmployeeFromApi(d) : null;
          })
          .filter((x): x is ManagedEmployee => x !== null);

        const m = res.meta as PaginatedMeta | undefined;
        const meta: PaginatedMeta = {
          page: Math.max(1, Number(m?.page) || opts.page),
          pageSize: Math.max(1, Number(m?.pageSize) || opts.pageSize),
          total: Math.max(0, Number(m?.total) || 0),
          totalPages: Math.max(1, Number(m?.totalPages) || 1)
        };

        /** أي حالة بلا صفوف قابلة للعرض — نعرض احتياط لوحة التحكم إن وُجد */
        const useDashboard = rows.length === 0 && dashboardSeed.length > 0;
        if (useDashboard) {
          applyDashboardPage(dashboardSeed);
          if (rawList.length > 0) {
            setListError("تعذّر قراءة صيغة الموظفين من الخادم — يُعرض احتياط لوحة المصنع.");
          }
          return;
        }

        setListSource("laravel");
        if (rows.length === 0 && meta.total > 0) {
          setListError("الخادم يُبلّغ عن وجود موظفين لكن تعذّر تحليل الصفوف. راجع استجابة واجهة الموارد البشرية.");
        } else if (rows.length === 0 && rawList.length > 0) {
          setListError("استجابة غير متوقعة من الخادم (تعذّر تحويل الصفوف).");
        } else {
          setListError(null);
        }

        setEmployees(rows);
        setListMeta(meta);
      } catch (e) {
        const msg =
          e instanceof WorkforceApiError ? e.message : e instanceof Error ? e.message : "فشل تحميل السجل";
        if (dashboardSeed.length > 0) {
          applyDashboardPage(dashboardSeed);
          setListError(`تعذّر الاتصال بالخادم — عرض بيانات احتياطية: ${msg}`);
        } else {
          setListSource("laravel");
          setListError(
            msg +
              (typeof window !== "undefined" && !window.localStorage.getItem("factory_token")
                ? " — عيّن WORKFORCE_PUBLIC_READ=true في backend/.env (محلي)، أو LARAVEL_SSR_BEARER_TOKEN في frontend/.env.local، أو سجّل دخولاً يضع factory_token."
                : "")
          );
          setEmployees((prev) => (prev.length > 0 ? prev : []));
        }
      } finally {
        setListLoading(false);
      }
    },
    [catalog]
  );

  const refetchCurrentList = React.useCallback(async () => {
    if (!catalog || !lastListQueryRef.current) return;
    await refetchList(lastListQueryRef.current);
  }, [catalog, refetchList]);

  const fetchEmployeeOne = React.useCallback(async (id: string) => {
    const raw = await workforceApi.getEmployee(id);
    const d = parseApiEmployeeDetail(raw);
    if (!d) throw new Error("تعذّر قراءة بيانات الموظف من الخادم");
    return managedEmployeeFromApi(d);
  }, []);

  const createEmployee = React.useCallback(
    async (data: EmployeeFormInput) => {
      if (!catalog) throw new Error("Catalog not loaded");
      const body = createPayloadFromForm(data, catalog);
      const raw = await workforceApi.createEmployee(body);
      const d = parseApiEmployeeDetail(raw);
      if (!d) throw new Error("Create response invalid");
      return managedEmployeeFromApi(d);
    },
    [catalog]
  );

  const updateEmployee = React.useCallback(
    async (id: string, data: FullEmployeeEditInput) => {
      if (!catalog) throw new Error("Catalog not loaded");
      const body = patchPayloadFromFullEdit(data, catalog);
      const raw = await workforceApi.updateEmployee(id, body);
      const d = parseApiEmployeeDetail(raw);
      if (!d) throw new Error("Update response invalid");
      return managedEmployeeFromApi(d);
    },
    [catalog]
  );

  const deleteEmployee = React.useCallback(async (id: string) => {
    await workforceApi.deleteEmployee(id);
  }, []);

  const patchEmployeeFields = React.useCallback(async (id: string, patch: Record<string, unknown>) => {
    const raw = await workforceApi.updateEmployee(id, patch);
    const d = parseApiEmployeeDetail(raw);
    if (!d) throw new Error("Patch response invalid");
    return managedEmployeeFromApi(d);
  }, []);

  const bulkPatchEmployees = React.useCallback(async (ids: string[], patch: Record<string, unknown>) => {
    await Promise.all(ids.map((id) => workforceApi.updateEmployee(id, patch)));
  }, []);

  const value = React.useMemo(
    () => ({
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
      fetchEmployeeOne,
      createEmployee,
      updateEmployee,
      deleteEmployee,
      patchEmployeeFields,
      bulkPatchEmployees,
      refetchCurrentList
    }),
    [
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
      refetchCurrentList,
      fetchEmployeeOne,
      createEmployee,
      updateEmployee,
      deleteEmployee,
      patchEmployeeFields,
      bulkPatchEmployees
    ]
  );

  return <EmployeeRegistryContext.Provider value={value}>{children}</EmployeeRegistryContext.Provider>;
}

export function useEmployeeRegistry() {
  const ctx = React.useContext(EmployeeRegistryContext);
  if (!ctx) throw new Error("useEmployeeRegistry requires EmployeeRegistryProvider");
  return ctx;
}
