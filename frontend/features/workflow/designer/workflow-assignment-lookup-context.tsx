"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

import { workforceApi } from "@/lib/api/workforce-client";
import { workforceMastersApi, type DepartmentMaster, type JobRoleMaster } from "@/lib/api/workforce-masters-client";

export type AssignmentEmployeeLookup = { id: number; fullName: string; employeeNumber: string };
export type AssignmentDepartmentLookup = { id: number; name: string; managerName?: string | null };
export type AssignmentRoleLookup = { id: number; name: string };

type LookupContextValue = {
  employees: AssignmentEmployeeLookup[];
  departments: AssignmentDepartmentLookup[];
  jobRoles: AssignmentRoleLookup[];
  employeeById: Map<number, AssignmentEmployeeLookup>;
  departmentById: Map<number, AssignmentDepartmentLookup>;
  roleById: Map<number, AssignmentRoleLookup>;
  loading: boolean;
  refresh: () => Promise<void>;
};

const AssignmentLookupContext = createContext<LookupContextValue | null>(null);

export function WorkflowAssignmentLookupProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<AssignmentEmployeeLookup[]>([]);
  const [departments, setDepartments] = useState<AssignmentDepartmentLookup[]>([]);
  const [jobRoles, setJobRoles] = useState<AssignmentRoleLookup[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, deptRes, roleRes] = await Promise.all([
        workforceApi.listEmployees({ isActive: true, pageSize: 200, sortBy: "firstName", sortOrder: "asc" }),
        workforceMastersApi.list<DepartmentMaster>("departments", { isActive: true, pageSize: 100 }),
        workforceMastersApi.list<JobRoleMaster>("job-roles", { isActive: true, pageSize: 100 })
      ]);

      const empRows = (empRes as { data?: unknown[] }).data ?? [];
      setEmployees(
        empRows
          .map((row) => {
            const e = row as {
              id?: string;
              fullName?: string;
              firstName?: string;
              lastName?: string;
              name?: string;
              employeeNumber?: string;
            };
            const id = Number(e.id);
            if (!id) return null;
            const composed = [e.firstName, e.lastName].filter(Boolean).join(" ").trim();
            const fullName =
              e.fullName?.trim() ||
              composed ||
              (typeof e.name === "string" ? e.name.trim() : "") ||
              "";
            return {
              id,
              fullName: fullName || `موظف ${id}`,
              employeeNumber: e.employeeNumber ?? ""
            };
          })
          .filter((e): e is AssignmentEmployeeLookup => e !== null)
      );

      setDepartments(
        deptRes.data
          .filter((d) => d.isActive)
          .map((d) => ({
            id: Number(d.id),
            name: d.name,
            managerName: d.managerName ?? null
          }))
      );

      setJobRoles(
        roleRes.data
          .filter((r) => r.isActive)
          .map((r) => ({ id: Number(r.id), name: r.name }))
      );
    } catch {
      setEmployees([]);
      setDepartments([]);
      setJobRoles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo((): LookupContextValue => {
    const employeeById = new Map(employees.map((e) => [e.id, e]));
    const departmentById = new Map(departments.map((d) => [d.id, d]));
    const roleById = new Map(jobRoles.map((r) => [r.id, r]));
    return { employees, departments, jobRoles, employeeById, departmentById, roleById, loading, refresh };
  }, [employees, departments, jobRoles, loading, refresh]);

  return <AssignmentLookupContext.Provider value={value}>{children}</AssignmentLookupContext.Provider>;
}

export function useWorkflowAssignmentLookup(): LookupContextValue {
  const ctx = useContext(AssignmentLookupContext);
  if (!ctx) {
    return {
      employees: [],
      departments: [],
      jobRoles: [],
      employeeById: new Map(),
      departmentById: new Map(),
      roleById: new Map(),
      loading: false,
      refresh: async () => {}
    };
  }
  return ctx;
}
