"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  assignmentConfigIsComplete,
  parseAssignmentConfig,
  toAssignmentConfigPayload,
  type WorkflowAssignmentConfig
} from "@/features/workflow/designer/workflow-stage-assignment";
import { workforceApi } from "@/lib/api/workforce-client";
import { workforceMastersApi, type DepartmentMaster, type JobRoleMaster } from "@/lib/api/workforce-masters-client";

type EmployeeOption = { id: number; fullName: string; employeeNumber: string };

type Props = {
  assignmentType: string;
  assignmentConfig?: Record<string, unknown>;
  disabled?: boolean;
  onChange: (config: Record<string, unknown>) => void;
};

export function WorkflowStageAssignmentPanel({
  assignmentType,
  assignmentConfig,
  disabled,
  onChange
}: Props) {
  const config = useMemo(() => parseAssignmentConfig(assignmentConfig), [assignmentConfig]);

  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentMaster[]>([]);
  const [jobRoles, setJobRoles] = useState<JobRoleMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeeSearch, setEmployeeSearch] = useState("");

  const loadLookups = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, deptRes, roleRes] = await Promise.all([
        workforceApi.listEmployees({ isActive: true, pageSize: 100, sortBy: "firstName", sortOrder: "asc" }),
        workforceMastersApi.list<DepartmentMaster>("departments", { isActive: true, pageSize: 100 }),
        workforceMastersApi.list<JobRoleMaster>("job-roles", { isActive: true, pageSize: 100 })
      ]);

      const empRows = (empRes as { data?: unknown[] }).data ?? [];
      setEmployees(
        empRows
          .map((row) => {
            const e = row as { id?: string; fullName?: string; employeeNumber?: string };
            const id = Number(e.id);
            if (!id) return null;
            return {
              id,
              fullName: e.fullName ?? `موظف ${id}`,
              employeeNumber: e.employeeNumber ?? ""
            };
          })
          .filter((e): e is EmployeeOption => e !== null)
      );
      setDepartments(deptRes.data.filter((d) => d.isActive));
      setJobRoles(roleRes.data.filter((r) => r.isActive));
    } catch {
      setEmployees([]);
      setDepartments([]);
      setJobRoles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLookups();
  }, [loadLookups]);

  const patch = (next: WorkflowAssignmentConfig) => {
    onChange(toAssignmentConfigPayload(next));
  };

  const filteredEmployees = useMemo(() => {
    const q = employeeSearch.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.fullName.toLowerCase().includes(q) ||
        e.employeeNumber.toLowerCase().includes(q) ||
        String(e.id).includes(q)
    );
  }, [employees, employeeSearch]);

  const selectedDepartment = departments.find((d) => Number(d.id) === config.departmentId);

  const complete = assignmentConfigIsComplete(assignmentType, config);

  if (loading) {
    return <p className="text-xs text-atlas-muted">جاري تحميل الموظفين والأقسام...</p>;
  }

  return (
    <div className="space-y-2 border-t border-atlas-border pt-3 dark:border-zinc-700">
      <p className="text-xs font-semibold text-atlas-ink dark:text-zinc-200">تعيين المنفّذ</p>

      {assignmentType === "single_employee" ? (
        <div>
          <label className="mb-1 block text-xs text-atlas-muted">الموظف</label>
          <select
            className="atlas-input w-full"
            disabled={disabled}
            value={config.employeeId ?? ""}
            onChange={(e) => patch({ employeeId: e.target.value ? Number(e.target.value) : undefined })}
          >
            <option value="">— اختر موظفاً —</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.fullName}
                {e.employeeNumber ? ` (${e.employeeNumber})` : ""}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {assignmentType === "multiple_any" ||
      assignmentType === "multiple_all" ||
      assignmentType === "sequential" ? (
        <div>
          <label className="mb-1 block text-xs text-atlas-muted">
            الموظفون
            {assignmentType === "sequential" ? " (بالترتيب — يُفعَّل الأول ثم التالي)" : null}
          </label>
          <input
            type="search"
            className="atlas-input mb-2 w-full"
            placeholder="بحث بالاسم أو الرقم..."
            disabled={disabled}
            value={employeeSearch}
            onChange={(e) => setEmployeeSearch(e.target.value)}
          />
          <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-atlas-border p-2 dark:border-zinc-700">
            {filteredEmployees.length === 0 ? (
              <p className="text-xs text-atlas-muted">لا يوجد موظفون مطابقون</p>
            ) : (
              filteredEmployees.map((e) => {
                const checked = config.employeeIds?.includes(e.id) ?? false;
                return (
                  <label key={e.id} className="flex cursor-pointer items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      disabled={disabled}
                      checked={checked}
                      onChange={(ev) => {
                        const current = config.employeeIds ?? [];
                        const next = ev.target.checked
                          ? [...current, e.id]
                          : current.filter((id) => id !== e.id);
                        patch({ employeeIds: next.length ? next : undefined });
                      }}
                    />
                    <span>
                      {e.fullName}
                      {e.employeeNumber ? ` · ${e.employeeNumber}` : ""}
                    </span>
                  </label>
                );
              })
            )}
          </div>
          {(config.employeeIds?.length ?? 0) > 0 ? (
            <p className="mt-1 text-[10px] text-atlas-muted">المحدد: {config.employeeIds?.length} موظف</p>
          ) : null}
        </div>
      ) : null}

      {assignmentType === "department" ? (
        <div>
          <label className="mb-1 block text-xs text-atlas-muted">القسم (يُعيَّن مدير القسم)</label>
          <select
            className="atlas-input w-full"
            disabled={disabled}
            value={config.departmentId ?? ""}
            onChange={(e) => patch({ departmentId: e.target.value ? Number(e.target.value) : undefined })}
          >
            <option value="">— اختر قسماً —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
          {selectedDepartment ? (
            <p className="mt-1 text-[10px] text-atlas-muted">
              المدير: {selectedDepartment.managerName ?? "غير معيّن — عيّن مديراً للقسم أولاً"}
            </p>
          ) : null}
        </div>
      ) : null}

      {assignmentType === "role" ? (
        <div className="space-y-2">
          <div>
            <label className="mb-1 block text-xs text-atlas-muted">الدور الوظيفي</label>
            <select
              className="atlas-input w-full"
              disabled={disabled}
              value={config.jobRoleId ?? ""}
              onChange={(e) =>
                patch({
                  jobRoleId: e.target.value ? Number(e.target.value) : undefined,
                  spatieRole: config.spatieRole
                })
              }
            >
              <option value="">— اختر دوراً —</option>
              {jobRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-atlas-muted">أو صلاحية النظام (Spatie) — اختياري</label>
            <input
              className="atlas-input w-full"
              disabled={disabled}
              placeholder="مثال: factory.admin"
              value={config.spatieRole ?? ""}
              onChange={(e) =>
                patch({
                  jobRoleId: config.jobRoleId,
                  spatieRole: e.target.value || undefined
                })
              }
            />
          </div>
        </div>
      ) : null}

      {!complete ? (
        <p className="text-xs text-amber-700 dark:text-amber-300">أكمل التعيين قبل الحفظ والنشر.</p>
      ) : null}
    </div>
  );
}
