"use client";

import * as React from "react";

import type { LiveDashboard } from "@/types/factory";
import { WorkforceApiError, workforceApi } from "@/lib/api/workforce-client";

import type { PaginatedMeta, WorkforceCatalogJson } from "./workforce-api-types";
import type { EmployeeEmploymentStatus, EmployeeFormInput, FullEmployeeEditInput, ManagedEmployee } from "./model";
import { seedManagedFromDashboard } from "./map-from-ops";
import {
  createPayloadFromForm,
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
  /** `dashboard` = عرض احتياطي من لوحة Laravel لأن Prisma لا يعيد صفوفًا */
  listSource: "prisma" | "dashboard";
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
  fallbackDashboard
}: {
  children: React.ReactNode;
  /** لوحة Laravel: تُستخدم كعرض احتياطي عندما يكون جدول الموظفين في workforce-api فارغًا */
  fallbackDashboard?: LiveDashboard | null;
}) {
  const lastListQueryRef = React.useRef<EmployeeListQuery | null>(null);
  const fallbackDashboardRef = React.useRef<LiveDashboard | null>(fallbackDashboard ?? null);
  React.useEffect(() => {
    fallbackDashboardRef.current = fallbackDashboard ?? null;
  }, [fallbackDashboard]);

  const [catalog, setCatalog] = React.useState<WorkforceCatalogJson | null>(null);
  const [catalogLoading, setCatalogLoading] = React.useState(true);
  const [catalogError, setCatalogError] = React.useState<string | null>(null);

  const [employees, setEmployees] = React.useState<ManagedEmployee[]>([]);
  const [listMeta, setListMeta] = React.useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [listLoading, setListLoading] = React.useState(false);
  const [listError, setListError] = React.useState<string | null>(null);
  const [listSource, setListSource] = React.useState<"prisma" | "dashboard">("prisma");

  const hydrated = Boolean(catalog && !catalogLoading && !catalogError);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setCatalogLoading(true);
      setCatalogError(null);
      try {
        const raw = await workforceApi.loadCatalog();
        if (cancelled) return;
        setCatalog(normalizeWorkforceCatalog(raw));
      } catch (e) {
        if (cancelled) return;
        setCatalogError(e instanceof Error ? e.message : "فشل تحميل المرجعيات");
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refetchList = React.useCallback(
    async (opts: EmployeeListQuery) => {
      if (!catalog) return;
      lastListQueryRef.current = opts;
      setListLoading(true);
      setListError(null);
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
          statuses: catalog.statuses
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

        const apiEmpty = rows.length === 0 && meta.total === 0;
        const dash = fallbackDashboardRef.current;
        const dashboardSeed = dash ? seedManagedFromDashboard(dash) : [];
        const canUseDashboardFallback = Boolean(apiEmpty && catalog && dashboardSeed.length > 0);

        if (canUseDashboardFallback && catalog) {
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
            catalog
          );
          const total = filtered.length;
          const totalPages = Math.max(1, Math.ceil(total / opts.pageSize));
          const pageSafe = Math.min(Math.max(1, opts.page), totalPages);
          const start = (pageSafe - 1) * opts.pageSize;
          setListSource("dashboard");
          setEmployees(filtered.slice(start, start + opts.pageSize));
          setListMeta({ page: pageSafe, pageSize: opts.pageSize, total, totalPages });
          setListError(null);
          return;
        }

        setListSource("prisma");
        if (rows.length === 0 && meta.total > 0) {
          setListError("الخادم ي report وجود موظفين لكن تعذّر تحليل الصفوف. راجع إصدار workforce-api.");
        } else if (rows.length === 0 && rawList.length > 0) {
          setListError("استجابة غير متوقعة من الخادم (تعذّر تحويل الصفوف).");
        } else {
          setListError(null);
        }

        setEmployees(rows);
        setListMeta(meta);
      } catch (e) {
        setListSource("prisma");
        const msg =
          e instanceof WorkforceApiError ? e.message : e instanceof Error ? e.message : "فشل تحميل السجل";
        setListError(msg);
        setEmployees([]);
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
    if (!d) throw new Error("Employee payload invalid");
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
