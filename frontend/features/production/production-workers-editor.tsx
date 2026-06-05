"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WfmField, WfmSelect } from "@/components/workforce/atlas";
import type { WorkOrderWorkerRole } from "@/lib/api/production-client";

export type WorkerDraft = {
  key: string;
  employeeId: string;
  role: WorkOrderWorkerRole;
};

export const workOrderWorkerRoleLabels: Record<WorkOrderWorkerRole, string> = {
  operator: "مشغّل",
  helper: "مساعد",
  packer: "معبّئ",
  shift_leader: "قائد وردية"
};

export const workOrderWorkerRoleOptions: WorkOrderWorkerRole[] = ["operator", "helper", "packer", "shift_leader"];

export const workOrderWorkerRoleColors: Record<
  WorkOrderWorkerRole,
  { dot: string; badge: string; ring: string }
> = {
  operator: {
    dot: "bg-blue-500",
    badge: "bg-blue-100 text-blue-800 border border-blue-200",
    ring: "ring-blue-400"
  },
  helper: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    ring: "ring-emerald-400"
  },
  packer: {
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-900 border border-amber-200",
    ring: "ring-amber-400"
  },
  shift_leader: {
    dot: "bg-red-500",
    badge: "bg-red-100 text-red-800 border border-red-200",
    ring: "ring-red-400"
  }
};

export function WorkOrderRoleBadge({ role }: { role: WorkOrderWorkerRole }) {
  const colors = workOrderWorkerRoleColors[role];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${colors.badge}`}
    >
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${colors.dot}`} />
      {workOrderWorkerRoleLabels[role] ?? role}
    </span>
  );
}

const roleOptions = workOrderWorkerRoleOptions;

let draftKey = 0;
export function newWorkerDraft(employeeId = "", role: WorkOrderWorkerRole = "operator"): WorkerDraft {
  draftKey += 1;
  return { key: `w-${draftKey}`, employeeId, role };
}

type Props = {
  employees: Array<{ id: string; name: string }>;
  workers: WorkerDraft[];
  onChange: (workers: WorkerDraft[]) => void;
  disabled?: boolean;
};

export function ProductionWorkersEditor({ employees, workers, onChange, disabled }: Props) {
  const usedIds = new Set(workers.map((w) => w.employeeId).filter(Boolean));

  const update = (key: string, patch: Partial<WorkerDraft>) => {
    onChange(workers.map((w) => (w.key === key ? { ...w, ...patch } : w)));
  };

  const remove = (key: string) => {
    onChange(workers.filter((w) => w.key !== key));
  };

  const add = () => {
    const next = employees.find((e) => !usedIds.has(e.id));
    onChange([...workers, newWorkerDraft(next?.id ?? "")]);
  };

  return (
    <div className="space-y-3">
      {workers.length ? (
        workers.map((w) => (
          <div key={w.key} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_1fr_auto]">
            <WfmField label="الموظف">
              <WfmSelect
                value={w.employeeId}
                disabled={disabled}
                onChange={(e) => update(w.key, { employeeId: e.target.value })}
              >
                <option value="">اختر موظفاً</option>
                {employees.map((emp) => (
                  <option
                    key={emp.id}
                    value={emp.id}
                    disabled={usedIds.has(emp.id) && emp.id !== w.employeeId}
                  >
                    {emp.name}
                  </option>
                ))}
              </WfmSelect>
            </WfmField>
            <WfmField label="الدور">
              <WfmSelect
                value={w.role}
                disabled={disabled}
                onChange={(e) => update(w.key, { role: e.target.value as WorkOrderWorkerRole })}
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {workOrderWorkerRoleLabels[role]}
                  </option>
                ))}
              </WfmSelect>
            </WfmField>
            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled}
                aria-label="حذف العامل"
                onClick={() => remove(w.key)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">لم يُضف أي عامل بعد.</p>
      )}

      <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={add}>
        <Plus className="ml-1 h-4 w-4" />
        إضافة عامل
      </Button>
    </div>
  );
}

export function workersToPayload(workers: WorkerDraft[]) {
  return workers
    .filter((w) => w.employeeId)
    .map((w) => ({ employeeId: w.employeeId, role: w.role }));
}

export function workersFromApi(
  rows: Array<{ employeeId: string; role: WorkOrderWorkerRole }>
): WorkerDraft[] {
  return rows.map((w) => newWorkerDraft(w.employeeId, w.role));
}
