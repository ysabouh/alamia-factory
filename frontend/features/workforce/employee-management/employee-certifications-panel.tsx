"use client";

import { useCallback, useEffect, useState } from "react";
import { Award, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WfmInput } from "@/components/workforce/atlas";
import { useFactoryAuth } from "@/contexts/factory-auth-context";
import { workforceApi, WorkforceApiError } from "@/lib/api/workforce-client";

import type { EmployeeCertificationJson } from "./org-chart/org-chart-types";

export function EmployeeCertificationsPanel({ employeeId }: { employeeId: string }) {
  const { can } = useFactoryAuth();
  const canManage = can("workforce.manage_employees");
  const [rows, setRows] = useState<EmployeeCertificationJson[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [issuer, setIssuer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workforceApi.listCertifications(employeeId);
      setRows(res.data);
      setError(null);
    } catch (e) {
      setError(e instanceof WorkforceApiError ? e.message : "تعذر التحميل");
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await workforceApi.addCertification(employeeId, {
        name: name.trim(),
        issuer: issuer.trim() || null
      });
      setName("");
      setIssuer("");
      await load();
    } catch (e) {
      setError(e instanceof WorkforceApiError ? e.message : "فشل الإضافة");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (certId: string) => {
    if (!window.confirm("حذف هذه الشهادة؟")) return;
    await workforceApi.deleteCertification(employeeId, certId);
    await load();
  };

  return (
    <div className="space-y-3 rounded-sm border border-atlas-rule bg-atlas-paper p-4">
      <div className="flex items-center gap-2">
        <Award className="h-4 w-4 text-atlas-brand" />
        <h3 className="text-sm font-semibold text-atlas-ink">الشهادات والمؤهلات</h3>
      </div>
      {loading ? (
        <p className="text-sm text-atlas-muted">جاري التحميل…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-atlas-muted">لا شهادات مسجّلة.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-2 rounded-sm border border-atlas-rule/60 bg-atlas-surface px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium text-atlas-ink">{c.name}</p>
                {c.issuer && <p className="text-xs text-atlas-muted">{c.issuer}</p>}
              </div>
              {canManage && (
                <Button type="button" variant="ghost" size="sm" onClick={() => void remove(c.id)}>
                  <Trash2 className="h-4 w-4 text-atlas-danger" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {canManage && (
        <div className="flex flex-wrap items-end gap-2 border-t border-atlas-rule pt-3">
          <WfmInput
            className="min-w-[140px] flex-1"
            placeholder="اسم الشهادة"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <WfmInput
            className="min-w-[120px] flex-1"
            placeholder="الجهة المانحة"
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
          />
          <Button type="button" size="sm" disabled={busy || !name.trim()} onClick={() => void add()}>
            <Plus className="ms-1 h-4 w-4" />
            إضافة
          </Button>
        </div>
      )}
      {error && <p className="text-sm text-atlas-danger">{error}</p>}
    </div>
  );
}
