"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WfmField, WfmInput, WfmSelect } from "@/components/workforce/atlas";
import {
  workOrderWorkerRoleColors,
  workOrderWorkerRoleLabels,
  workOrderWorkerRoleOptions,
  WorkOrderRoleBadge
} from "@/features/production/production-workers-editor";
import { cn } from "@/lib/utils";
import { WorkerEmployeeHoverLink } from "@/features/production/worker-employee-hover-link";
import {
  productionApi,
  ProductionApiError,
  type WorkOrderWorkerJson,
  type WorkOrderWorkerRole
} from "@/lib/api/production-client";

function formatDt(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("ar");
}

type Props = {
  orderId: string;
  activeWorkers: WorkOrderWorkerJson[];
  employees: Array<{ id: string; name: string }>;
  canManage: boolean;
  onChanged: () => Promise<void>;
};

export function ProductionOrderWorkersPanel({ orderId, activeWorkers, employees, canManage, onChanged }: Props) {
  const [history, setHistory] = useState<WorkOrderWorkerJson[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [employeeId, setEmployeeId] = useState("");
  const [role, setRole] = useState<WorkOrderWorkerRole>("operator");
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 16));

  const loadHistory = useCallback(async () => {
    try {
      const res = await productionApi.listWorkersHistory(orderId);
      setHistory(res.data);
    } catch {
      setHistory([]);
    }
  }, [orderId]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory, activeWorkers]);

  const activeIds = new Set(activeWorkers.map((w) => w.employeeId));

  const addWorker = async () => {
    if (!employeeId) {
      setError("اختر العامل");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await productionApi.addWorker(orderId, {
        employeeId,
        role,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom).toISOString() : undefined
      });
      setEmployeeId("");
      setRole("operator");
      setEffectiveFrom(new Date().toISOString().slice(0, 16));
      await onChanged();
      await loadHistory();
    } catch (e) {
      setError(e instanceof ProductionApiError ? e.message : "فشل إضافة العامل");
    } finally {
      setBusy(false);
    }
  };

  const removeWorker = async (workerId: string) => {
    if (!confirm("إزالة العامل من الأمر؟ (يُحفظ في السجل)")) return;
    setBusy(true);
    setError(null);
    try {
      await productionApi.removeWorker(orderId, workerId);
      await onChanged();
      await loadHistory();
    } catch (e) {
      setError(e instanceof ProductionApiError ? e.message : "فشل الإزالة");
    } finally {
      setBusy(false);
    }
  };

  const removedWorkers = history.filter((w) => w.isActive === false);

  return (
    <div className="space-y-4">
      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {canManage ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">إضافة عامل</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <WfmField label="العامل *">
                <WfmSelect value={employeeId} disabled={busy} onChange={(e) => setEmployeeId(e.target.value)}>
                  <option value="">اختر</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id} disabled={activeIds.has(e.id)}>
                      {e.name}
                    </option>
                  ))}
                </WfmSelect>
              </WfmField>
              <WfmField label="الدور">
                <div className="flex flex-wrap gap-2">
                  {workOrderWorkerRoleOptions.map((r) => {
                    const colors = workOrderWorkerRoleColors[r];
                    const selected = role === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        disabled={busy}
                        onClick={() => setRole(r)}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition",
                          colors.badge,
                          selected ? `ring-2 ring-offset-1 ${colors.ring}` : "opacity-75 hover:opacity-100"
                        )}
                      >
                        <span className={cn("h-3 w-3 shrink-0 rounded-full", colors.dot)} />
                        {workOrderWorkerRoleLabels[r]}
                      </button>
                    );
                  })}
                </div>
              </WfmField>
              <WfmField label="فعال من">
                <WfmInput
                  type="datetime-local"
                  value={effectiveFrom}
                  disabled={busy}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                />
              </WfmField>
              <Button type="button" disabled={busy} onClick={() => void addWorker()}>
                <Plus className="ml-1 h-4 w-4" />
                إضافة للأمر
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <Card className={canManage ? "" : "lg:col-span-2"}>
          <CardHeader>
            <CardTitle className="text-base">العمال النشطون ({activeWorkers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>العامل</TableHead>
                  <TableHead>فعال من</TableHead>
                  <TableHead>تاريخ الإضافة</TableHead>
                  <TableHead>أضافه</TableHead>
                  <TableHead>الدور</TableHead>
                  {canManage ? <TableHead className="w-14" /> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeWorkers.length ? (
                  activeWorkers.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell>
                        <WorkerEmployeeHoverLink worker={w} />
                      </TableCell>
                      <TableCell>{formatDt(w.effectiveFrom)}</TableCell>
                      <TableCell>{formatDt(w.createdAt)}</TableCell>
                      <TableCell>{w.createdByName ?? "—"}</TableCell>
                      <TableCell>
                        <WorkOrderRoleBadge role={w.role} />
                      </TableCell>
                      {canManage ? (
                        <TableCell>
                          <Button type="button" size="icon" variant="ghost" disabled={busy} onClick={() => void removeWorker(w.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={canManage ? 6 : 5} className="text-center text-muted-foreground">
                      لا يوجد عمال نشطون
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {removedWorkers.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">سجل العمال المُزالين</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>العامل</TableHead>
                  <TableHead>فعال من</TableHead>
                  <TableHead>تاريخ الإضافة</TableHead>
                  <TableHead>أضافه</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead>تاريخ الإزالة</TableHead>
                  <TableHead>أزاله</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {removedWorkers.map((w) => (
                  <TableRow key={w.id} className="text-muted-foreground">
                    <TableCell>
                      <WorkerEmployeeHoverLink worker={w} />
                    </TableCell>
                    <TableCell>{formatDt(w.effectiveFrom)}</TableCell>
                    <TableCell>{formatDt(w.createdAt)}</TableCell>
                    <TableCell>{w.createdByName ?? "—"}</TableCell>
                    <TableCell>
                      <WorkOrderRoleBadge role={w.role} />
                    </TableCell>
                    <TableCell>{formatDt(w.removedAt)}</TableCell>
                    <TableCell>{w.removedByName ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
