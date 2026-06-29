"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { WfmModal } from "@/components/workforce/atlas";

import { isOrgChartGeneralManager, OrgChartManagerPicker } from "./org-chart-manager-picker";
import type { OrgChartEmployeeNode } from "./org-chart-types";

type Props = {
  employee: OrgChartEmployeeNode | null;
  employees: OrgChartEmployeeNode[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (employeeId: string, managerId: string, departmentId?: string | null) => Promise<void>;
};

export function OrgChartChangeManagerModal({
  employee,
  employees,
  open,
  onOpenChange,
  onSave
}: Props) {
  const [managerId, setManagerId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!employee || !open) return;
    setManagerId(employee.reportsToId ?? "");
    setError(null);
  }, [employee, open]);

  if (!employee) return null;

  const isGm = isOrgChartGeneralManager(employee);

  const handleSave = async () => {
    if (!managerId.trim()) {
      setError("اختر المدير المباشر");
      return;
    }
    const manager = employees.find((e) => e.id === managerId);
    setBusy(true);
    setError(null);
    try {
      await onSave(employee.id, managerId, manager?.departmentId ?? null);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر تحديث المدير المباشر");
    } finally {
      setBusy(false);
    }
  };

  return (
    <WfmModal
      open={open}
      onOpenChange={onOpenChange}
      title="تغيير المدير المباشر"
      description={
        isGm
          ? `${employee.fullName} — دور مدير عام (لا يتطلب مديراً مباشراً)`
          : `${employee.fullName} — المدير الحالي: ${employee.managerName ?? "غير محدد"}`
      }
      contentClassName="w-[min(100vw-1.5rem,28rem)]"
      footer={
        isGm ? (
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
        ) : (
          <>
            <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="button" variant="atlasPrimary" disabled={busy} onClick={() => void handleSave()}>
              {busy ? "جاري الحفظ…" : "حفظ"}
            </Button>
          </>
        )
      }
    >
      {isGm ? (
        <p className="text-sm text-atlas-muted">
          لا يمكن تعيين مدير مباشر لموظف بدور المدير العام. لتعديل التسلسل استخدم نموذج الموظف.
        </p>
      ) : (
        <div className="space-y-3">
          <OrgChartManagerPicker
            employees={employees}
            value={managerId}
            onChange={setManagerId}
            excludeEmployeeId={employee.id}
            disabled={busy}
          />
          {error ? <p className="text-xs text-atlas-danger">{error}</p> : null}
        </div>
      )}
    </WfmModal>
  );
}
