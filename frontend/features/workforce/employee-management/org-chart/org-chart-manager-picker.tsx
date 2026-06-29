"use client";

import { useMemo } from "react";

import { WfmSearchableSelect } from "@/components/workforce/atlas/wfm-searchable-select";

import type { OrgChartEmployeeNode } from "./org-chart-types";

function descendantIds(employeeId: string, employees: OrgChartEmployeeNode[]): Set<string> {
  const byManager = new Map<string, string[]>();
  for (const e of employees) {
    if (!e.reportsToId) continue;
    const list = byManager.get(e.reportsToId) ?? [];
    list.push(e.id);
    byManager.set(e.reportsToId, list);
  }
  const out = new Set<string>();
  const walk = (id: string) => {
    for (const childId of byManager.get(id) ?? []) {
      out.add(childId);
      walk(childId);
    }
  };
  walk(employeeId);
  return out;
}

function wouldCreateCycle(
  employeeId: string,
  managerId: string,
  employees: OrgChartEmployeeNode[]
): boolean {
  const reportsTo = new Map(employees.map((e) => [e.id, e.reportsToId ?? null]));
  let current: string | null = managerId;
  while (current) {
    if (current === employeeId) return true;
    current = reportsTo.get(current) ?? null;
  }
  return false;
}

type Props = {
  employees: OrgChartEmployeeNode[];
  value: string;
  onChange: (managerId: string) => void;
  excludeEmployeeId: string;
  disabled?: boolean;
};

export function OrgChartManagerPicker({
  employees,
  value,
  onChange,
  excludeEmployeeId,
  disabled
}: Props) {
  const blocked = useMemo(() => descendantIds(excludeEmployeeId, employees), [excludeEmployeeId, employees]);

  const options = useMemo(
    () =>
      employees
        .filter(
          (e) =>
            e.id !== excludeEmployeeId &&
            !blocked.has(e.id) &&
            !wouldCreateCycle(excludeEmployeeId, e.id, employees)
        )
        .map((e) => ({
          id: e.id,
          label: `${e.fullName} — ${e.employeeNumber}`,
          subtitle: [e.position, e.departmentName].filter(Boolean).join(" · ") || undefined,
          searchText: `${e.fullName} ${e.employeeNumber} ${e.position ?? ""} ${e.departmentName ?? ""}`
        })),
    [employees, excludeEmployeeId, blocked]
  );

  return (
    <WfmSearchableSelect
      options={options}
      value={value}
      onChange={onChange}
      placeholder="ابحث بالاسم أو الرقم أو القسم…"
      disabled={disabled}
      emptyMessage="لا يوجد مدير مطابق"
    />
  );
}

export function isOrgChartGeneralManager(emp: OrgChartEmployeeNode): boolean {
  return emp.roleLevel >= 10 || (emp.positionCode ?? "").toUpperCase() === "GM";
}
