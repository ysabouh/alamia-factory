"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { WfmSelect } from "@/components/workforce/atlas";
import { workforceMastersApi } from "@/lib/api/workforce-masters-client";

import type { DepartmentOrgPositionJson, OrgChartEmployeeNode } from "./org-chart-types";

export function OrgChartChangePositionModal({
  employee,
  open,
  onClose,
  onSave
}: {
  employee: OrgChartEmployeeNode | null;
  open: boolean;
  onClose: () => void;
  onSave: (employeeId: string, orgPositionId: string | null) => Promise<void>;
}) {
  const [positions, setPositions] = useState<DepartmentOrgPositionJson[]>([]);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !employee?.departmentId) return;
    setValue(employee.orgPositionId ?? "");
    void (async () => {
      try {
        const res = await workforceMastersApi.listOrgPositions(employee.departmentId!);
        setPositions(res.data);
      } catch {
        setPositions([]);
      }
    })();
  }, [open, employee]);

  if (!open || !employee) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-sm border border-atlas-rule bg-atlas-paper p-4 shadow-atlasCard">
        <h3 className="text-sm font-semibold text-atlas-ink">تعيين المنصب التنظيمي</h3>
        <p className="mt-1 text-xs text-atlas-muted">{employee.fullName}</p>
        {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
        <WfmSelect className="mt-3 w-full" value={value} onChange={(e) => setValue(e.target.value)}>
          <option value="">— بدون منصب —</option>
          {positions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.code})
            </option>
          ))}
        </WfmSelect>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={busy}>
            إلغاء
          </Button>
          <Button
            type="button"
            variant="atlasPrimary"
            size="sm"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              setError(null);
              void onSave(employee.id, value || null)
                .then(onClose)
                .catch((e) => setError(e instanceof Error ? e.message : "فشل الحفظ"))
                .finally(() => setBusy(false));
            }}
          >
            حفظ
          </Button>
        </div>
      </div>
    </div>
  );
}
