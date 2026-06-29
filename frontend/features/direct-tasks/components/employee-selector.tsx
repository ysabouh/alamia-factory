"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, User, Users, Building2, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import type { CreateDirectTaskFormValues } from "@/features/direct-tasks/create/create-direct-task-schema";
import { workforceApi } from "@/lib/api/workforce-client";
import { workforceMastersApi, type DepartmentMaster } from "@/lib/api/workforce-masters-client";

type EmployeeOption = { id: number; fullName: string; employeeNumber: string };

type Props = {
  mode: CreateDirectTaskFormValues["assignmentMode"];
  onModeChange: (mode: CreateDirectTaskFormValues["assignmentMode"]) => void;
  assignments: CreateDirectTaskFormValues["assignments"];
  onChange: (assignments: CreateDirectTaskFormValues["assignments"]) => void;
};

export function EmployeeSelector({ mode, onModeChange, assignments, onChange }: Props) {
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentMaster[]>([]);
  const [search, setSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const load = useCallback(async () => {
    const [empRes, deptRes] = await Promise.all([
      workforceApi.listEmployees({ isActive: true, pageSize: 200, sortBy: "firstName", sortOrder: "asc" }),
      workforceMastersApi.list<DepartmentMaster>("departments", { isActive: true, pageSize: 100 })
    ]);
    const rows = (empRes as { data?: unknown[] }).data ?? [];
    setEmployees(
      rows
        .map((row) => {
          const e = row as { id?: string; fullName?: string; employeeNumber?: string };
          const id = Number(e.id);
          if (!id) return null;
          return { id, fullName: e.fullName ?? `موظف ${id}`, employeeNumber: e.employeeNumber ?? "" };
        })
        .filter((e): e is EmployeeOption => e !== null)
    );
    setDepartments(deptRes.data.filter((d) => d.isActive));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    const selected = new Set(assignments.map((a) => a.assigneeId));
    return employees.filter((e) => {
      if (mode === "employee" && selected.has(e.id)) return false;
      if (!q) return true;
      return `${e.fullName} ${e.employeeNumber}`.toLowerCase().includes(q);
    });
  }, [assignments, employees, mode, search]);

  const addEmployee = (emp: EmployeeOption) => {
    onChange([
      ...assignments,
      { type: "employee", assigneeId: emp.id, label: emp.fullName }
    ]);
    setPickerOpen(false);
    setSearch("");
  };

  const addDepartment = (dept: DepartmentMaster) => {
    if (assignments.some((a) => a.type === "department" && a.assigneeId === Number(dept.id))) return;
    onChange([...assignments, { type: "department", assigneeId: Number(dept.id), label: dept.name }]);
    setPickerOpen(false);
  };

  const remove = (assigneeId: number, type: string) => {
    onChange(assignments.filter((a) => !(a.assigneeId === assigneeId && a.type === type)));
  };

  const tabs = [
    { id: "employee" as const, label: "أشخاص محددون", icon: User },
    { id: "team" as const, label: "فريق عمل", icon: Users },
    { id: "department" as const, label: "قسم", icon: Building2 }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-atlas-rule pb-3 dark:border-zinc-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onModeChange(tab.id)}
              className={`inline-flex items-center gap-1.5 border-b-2 px-2 py-1 text-sm font-medium ${
                mode === tab.id ? "border-atlas-brand text-atlas-brand" : "border-transparent text-atlas-muted"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {assignments.map((a) => (
          <span
            key={`${a.type}-${a.assigneeId}`}
            className="inline-flex items-center gap-2 rounded-full border border-atlas-rule bg-atlas-canvas px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-atlas-brand/15 text-xs font-bold text-atlas-brand">
              {(a.label ?? "?").slice(0, 2)}
            </span>
            <span>{a.label}</span>
            <button type="button" onClick={() => remove(a.assigneeId, a.type)} className="text-atlas-muted hover:text-red-500">
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          className="inline-flex items-center gap-1 rounded-lg border border-dashed border-atlas-brand/50 px-3 py-2 text-sm font-medium text-atlas-brand hover:bg-atlas-brand/5"
        >
          <Plus className="h-4 w-4" />
          إضافة مسؤول
        </button>
      </div>

      <p className="text-xs text-atlas-muted">المحددون: {assignments.length}</p>

      {pickerOpen ? (
        <div className="rounded-lg border border-atlas-rule bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          {(mode === "employee" || mode === "team") && (
            <>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم أو الرقم الوظيفي..."
                className="mb-2"
              />
              <ul className="max-h-48 space-y-1 overflow-auto">
                {filteredEmployees.map((emp) => (
                  <li key={emp.id}>
                    <button
                      type="button"
                      onClick={() => addEmployee(emp)}
                      className="flex w-full items-center justify-between rounded-md px-2 py-2 text-start text-sm hover:bg-atlas-canvas dark:hover:bg-zinc-800"
                    >
                      <span>{emp.fullName}</span>
                      <span className="font-mono text-xs text-atlas-muted">{emp.employeeNumber}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
          {mode === "department" && (
            <ul className="max-h-48 space-y-1 overflow-auto">
              {departments.map((dept) => (
                <li key={dept.id}>
                  <button
                    type="button"
                    onClick={() => addDepartment(dept)}
                    className="w-full rounded-md px-2 py-2 text-start text-sm hover:bg-atlas-canvas dark:hover:bg-zinc-800"
                  >
                    {dept.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
