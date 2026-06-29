"use client";

import Link from "next/link";
import type { Route } from "next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, UserMinus, Users } from "lucide-react";

import { WfmSearchableSelect, type WfmSearchableOption } from "@/components/workforce/atlas/wfm-searchable-select";
import { WfmSelect } from "@/components/workforce/atlas";
import { Button } from "@/components/ui/button";
import { fetchAllPaged, workforceApi } from "@/lib/api/workforce-client";

import type { DepartmentOrgPositionJson, OrgChartEmployeeNode } from "../org-chart/org-chart-types";
import { parseApiEmployeeDetail } from "../workforce-employee-mapper";

type Props = {
  departmentId: string;
  departmentName: string;
  isLeaf: boolean;
  positions: DepartmentOrgPositionJson[];
  employees: OrgChartEmployeeNode[];
  canAssign: boolean;
  onChanged: () => void | Promise<void>;
};

export function DepartmentEmployeesPanel({
  departmentId,
  departmentName,
  isLeaf,
  positions,
  employees,
  canAssign,
  onChanged
}: Props) {
  const [pickerId, setPickerId] = useState("");
  const [pickerOptions, setPickerOptions] = useState<WfmSearchableOption[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [assignBusy, setAssignBusy] = useState(false);
  const [panelError, setPanelError] = useState<string | null>(null);

  const loadPicker = useCallback(async () => {
    if (!canAssign) return;
    setPickerLoading(true);
    try {
      const rows = await fetchAllPaged<unknown>("/workforce/employees?isActive=true&sortBy=firstName&sortOrder=asc");
      const opts = rows
        .map((row) => parseApiEmployeeDetail(row))
        .filter((e): e is NonNullable<typeof e> => e !== null)
        .filter((e) => e.departmentId !== departmentId)
        .map((e) => ({
          id: e.id,
          label: `${e.fullName} — ${e.employeeNumber}`,
          subtitle: e.department?.name ? `حالياً: ${e.department.name}` : "بلا قسم",
          searchText: `${e.fullName} ${e.employeeNumber} ${e.department?.name ?? ""} ${e.jobRole?.name ?? ""}`
        }));
      setPickerOptions(opts);
    } catch {
      setPickerOptions([]);
    } finally {
      setPickerLoading(false);
    }
  }, [canAssign, departmentId]);

  useEffect(() => {
    void loadPicker();
  }, [loadPicker]);

  async function assignEmployee(employeeId: string) {
    if (!employeeId || !canAssign) return;
    setAssignBusy(true);
    setPanelError(null);
    try {
      await workforceApi.updateEmployee(employeeId, {
        departmentId,
        ...(isLeaf ? {} : { orgPositionId: null })
      });
      setPickerId("");
      await onChanged();
      await loadPicker();
    } catch (e) {
      setPanelError(e instanceof Error ? e.message : "فشل تعيين الموظف");
    } finally {
      setAssignBusy(false);
    }
  }

  async function removeFromDepartment(employee: OrgChartEmployeeNode) {
    if (!canAssign) return;
    setBusyId(employee.id);
    setPanelError(null);
    try {
      await workforceApi.updateEmployee(employee.id, {
        departmentId: null,
        orgPositionId: null
      });
      await onChanged();
      await loadPicker();
    } catch (e) {
      setPanelError(e instanceof Error ? e.message : "تعذّر إزالة الموظف من القسم");
    } finally {
      setBusyId(null);
    }
  }

  async function updatePosition(employee: OrgChartEmployeeNode, orgPositionId: string) {
    if (!canAssign || !isLeaf) return;
    setBusyId(employee.id);
    setPanelError(null);
    try {
      await workforceApi.updateReporting(employee.id, {
        departmentId,
        orgPositionId: orgPositionId || null,
        reportsToId: employee.reportsToId ?? null
      });
      await onChanged();
    } catch (e) {
      setPanelError(e instanceof Error ? e.message : "فشل تحديث المنصب");
    } finally {
      setBusyId(null);
    }
  }

  const newEmployeeHref = useMemo(
    () => `/ar/workforce/employees/new?departmentId=${encodeURIComponent(departmentId)}` as Route,
    [departmentId]
  );

  return (
    <div className="rounded-sm border border-atlas-rule bg-atlas-paper p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-atlas-brand" />
          <h3 className="text-sm font-semibold text-atlas-ink">
            موظفو القسم: {departmentName}
          </h3>
          <span className="rounded bg-atlas-surface px-2 py-0.5 font-mono text-xs text-atlas-muted">
            {employees.length}
          </span>
        </div>
        {canAssign ? (
          <Button asChild type="button" size="sm" variant="atlasOutline" className="h-8 gap-1 rounded-sm text-xs">
            <Link href={newEmployeeHref}>
              <Plus className="h-3.5 w-3.5" />
              موظف جديد
            </Link>
          </Button>
        ) : null}
      </div>

      {panelError ? (
        <div className="mb-3 rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{panelError}</div>
      ) : null}

      {employees.length === 0 ? (
        <p className="mb-4 text-sm text-atlas-muted">لا يوجد موظفون معيَّنون لهذا القسم بعد.</p>
      ) : (
        <ul className="mb-4 space-y-2">
          {employees.map((emp) => (
            <li
              key={emp.id}
              className="flex flex-wrap items-center gap-2 rounded-sm border border-atlas-rule px-3 py-2 text-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-atlas-ink">{emp.fullName}</p>
                <p className="text-xs text-atlas-muted">
                  {emp.employeeNumber}
                  {emp.position ? ` · ${emp.position}` : ""}
                  {emp.managerName ? ` · يتبع: ${emp.managerName}` : ""}
                </p>
              </div>
              {isLeaf && positions.length > 0 && canAssign ? (
                <WfmSelect
                  className="min-w-[140px] text-xs"
                  value={emp.orgPositionId ?? ""}
                  disabled={busyId === emp.id}
                  onChange={(e) => void updatePosition(emp, e.target.value)}
                >
                  <option value="">— بلا منصب —</option>
                  {positions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </WfmSelect>
              ) : emp.orgPositionName ? (
                <span className="text-xs text-atlas-muted">{emp.orgPositionName}</span>
              ) : null}
              {canAssign ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 text-red-600 hover:text-red-800"
                  disabled={busyId === emp.id}
                  title="إزالة من القسم"
                  onClick={() => void removeFromDepartment(emp)}
                >
                  {busyId === emp.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserMinus className="h-4 w-4" />
                  )}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {canAssign ? (
        <div className="border-t border-atlas-rule pt-4">
          <p className="mb-2 text-xs font-medium text-atlas-muted">إضافة موظف موجود إلى هذا القسم</p>
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[240px] flex-1">
              <WfmSearchableSelect
                options={pickerOptions}
                value={pickerId}
                onChange={setPickerId}
                placeholder={pickerLoading ? "جاري التحميل…" : "ابحث عن موظف…"}
                disabled={pickerLoading || assignBusy}
                emptyMessage={pickerLoading ? "جاري التحميل…" : "لا يوجد موظف مطابق"}
              />
            </div>
            <Button
              type="button"
              variant="atlasPrimary"
              className="rounded-sm gap-1"
              disabled={!pickerId || assignBusy}
              onClick={() => void assignEmployee(pickerId)}
            >
              {assignBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              تعيين للقسم
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
