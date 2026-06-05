"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WfmField, WfmInput, WfmSelect, WfmTextarea } from "@/components/workforce/atlas";
import { useFactoryAuth } from "@/contexts/factory-auth-context";
import {
  ProductRoutingFlow,
  ProductRoutingSummaryCards
} from "@/features/manufacturing/routing/product-routing-flow";
import {
  manufacturingModeLabels,
  operationTypeLabels
} from "@/features/manufacturing/routing/routing-ui";
import { machinesApi, type MachineJson } from "@/lib/api/machines-client";
import { moldsApi, type MoldJson } from "@/lib/api/molds-client";
import { productsApi, ProductsApiError } from "@/lib/api/products-client";
import {
  routingApi,
  RoutingApiError,
  type OperationType,
  type ProductOperationJson,
  type ProductRoutingJson
} from "@/lib/api/routing-client";

const OPERATION_TYPES = Object.keys(operationTypeLabels) as OperationType[];

type OperationForm = {
  operationCode: string;
  operationName: string;
  operationType: OperationType;
  sequenceOrder: string;
  machineId: string;
  moldId: string;
  cycleTime: string;
  coolingTime: string;
  qcRequired: boolean;
  operationInstructions: string;
};

function emptyOperationForm(): OperationForm {
  return {
    operationCode: "",
    operationName: "",
    operationType: "injection",
    sequenceOrder: "",
    machineId: "",
    moldId: "",
    cycleTime: "",
    coolingTime: "",
    qcRequired: false,
    operationInstructions: ""
  };
}

function numOrUndef(v: string): number | undefined {
  if (!v.trim()) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function ProductRoutingWorkspace({ productId }: { productId: string }) {
  const { can } = useFactoryAuth();
  const canManage = can("products.manage");

  const [productName, setProductName] = useState("");
  const [routing, setRouting] = useState<ProductRoutingJson | null>(null);
  const [operations, setOperations] = useState<ProductOperationJson[]>([]);
  const [machines, setMachines] = useState<MachineJson[]>([]);
  const [molds, setMolds] = useState<MoldJson[]>([]);
  const [form, setForm] = useState<OperationForm>(emptyOperationForm());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [productRes, routingRes, opsRes, machinesRes, moldsRes] = await Promise.all([
      productsApi.show(productId),
      routingApi.routing(productId),
      routingApi.operations(productId),
      machinesApi.list({ pageSize: 100 }),
      moldsApi.list({ pageSize: 100 })
    ]);
    setProductName(productRes.data.productNameAr);
    setRouting(routingRes.data);
    setOperations(opsRes.data);
    setMachines(machinesRes.data);
    setMolds(moldsRes.data);
  }, [productId]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        await reload();
        setError(null);
      } catch (e) {
        setError(
          e instanceof RoutingApiError || e instanceof ProductsApiError
            ? e.message
            : "تعذر التحميل"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [reload]);

  async function handleCreate() {
    setBusy(true);
    try {
      await routingApi.createOperation(productId, {
        operationCode: form.operationCode,
        operationName: form.operationName,
        operationType: form.operationType,
        sequenceOrder: numOrUndef(form.sequenceOrder),
        machineId: form.machineId || undefined,
        moldId: form.moldId || undefined,
        cycleTime: numOrUndef(form.cycleTime),
        coolingTime: numOrUndef(form.coolingTime),
        qcRequired: form.qcRequired,
        operationInstructions: form.operationInstructions || undefined,
        machineSettings:
          form.machineId && (form.operationType === "injection" || form.operationType === "blow")
            ? [{ machineId: form.machineId }]
            : undefined
      });
      setForm(emptyOperationForm());
      await reload();
      setError(null);
    } catch (e) {
      setError(e instanceof RoutingApiError ? e.message : "فشل الحفظ");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(operationId: string) {
    if (!confirm("حذف هذه العملية؟")) return;
    setBusy(true);
    try {
      await routingApi.deleteOperation(operationId);
      await reload();
    } catch (e) {
      setError(e instanceof RoutingApiError ? e.message : "فشل الحذف");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-muted-foreground">جاري التحميل…</p>;
  if (error && !routing) return <p className="text-destructive">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">مسار الإنتاج — {productName}</h1>
          <p className="text-muted-foreground">
            BOM + عمليات التصنيع —{" "}
            {routing && (
              <Badge variant="secondary">
                {manufacturingModeLabels[routing.manufacturingMode] ?? routing.manufacturingMode}
              </Badge>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/ar/products/${productId}` as Route}>تفاصيل المنتج</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/ar/products/${productId}/bom` as Route}>محرّر BOM</Link>
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {routing && (
        <>
          <ProductRoutingSummaryCards routing={routing} />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base">مخطط المسار</CardTitle>
              </CardHeader>
              <CardContent>
                <ProductRoutingFlow routing={routing} />
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base">عمليات التصنيع</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {operations.length ? (
                  operations.map((op) => (
                    <div key={op.id} className="rounded border border-border/50 p-3 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">
                            {op.sequenceOrder}. {op.operationName}
                          </p>
                          <p className="text-xs text-muted-foreground">{op.operationCode}</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            <Badge variant="outline">{operationTypeLabels[op.operationType]}</Badge>
                            {op.machineCode && <Badge variant="secondary">{op.machineCode}</Badge>}
                            {op.moldCode && <Badge variant="secondary">{op.moldCode}</Badge>}
                            {op.qcRequired && <Badge>QC</Badge>}
                          </div>
                        </div>
                        {canManage && (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            disabled={busy}
                            onClick={() => void handleDelete(op.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {op.machineSettings?.length ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          إعدادات: ضغط {op.machineSettings[0].injectionPressure ?? "—"} · دورة{" "}
                          {op.cycleTime ?? "—"}ث
                        </p>
                      ) : null}
                      {op.qualitySpecs?.length ? (
                        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                          {op.qualitySpecs.map((q) => (
                            <li key={q.id ?? q.inspectionType}>
                              QC: {q.inspectionType} ({q.toleranceMin ?? "—"} – {q.toleranceMax ?? "—"})
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">لا توجد عمليات بعد</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base">الماكينات المخصصة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {routing.assignedMachines.length ? (
                  routing.assignedMachines.map((m) => (
                    <div key={m.machineId} className="flex justify-between border-b border-border/40 py-2">
                      <span>{m.machineCode} — {m.machineName}</span>
                      <span className="text-muted-foreground">{m.operationIds.length} عملية</span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">—</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base">القوالب المخصصة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {routing.assignedMolds.length ? (
                  routing.assignedMolds.map((m) => (
                    <div key={m.moldId} className="flex justify-between border-b border-border/40 py-2">
                      <span>{m.moldCode} — {m.moldName}</span>
                      <span className="text-muted-foreground">{m.operationIds.length} عملية</span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">—</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {canManage && (
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">إضافة عملية</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <WfmField label="رمز العملية *">
              <WfmInput
                value={form.operationCode}
                onChange={(e) => setForm((f) => ({ ...f, operationCode: e.target.value }))}
              />
            </WfmField>
            <WfmField label="اسم العملية *">
              <WfmInput
                value={form.operationName}
                onChange={(e) => setForm((f) => ({ ...f, operationName: e.target.value }))}
              />
            </WfmField>
            <WfmField label="نوع العملية">
              <WfmSelect
                value={form.operationType}
                onChange={(e) => setForm((f) => ({ ...f, operationType: e.target.value as OperationType }))}
              >
                {OPERATION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {operationTypeLabels[t]}
                  </option>
                ))}
              </WfmSelect>
            </WfmField>
            <WfmField label="ترتيب التسلسل">
              <WfmInput
                type="number"
                value={form.sequenceOrder}
                onChange={(e) => setForm((f) => ({ ...f, sequenceOrder: e.target.value }))}
                placeholder="تلقائي"
              />
            </WfmField>
            <WfmField label="الماكينة">
              <WfmSelect
                value={form.machineId}
                onChange={(e) => setForm((f) => ({ ...f, machineId: e.target.value }))}
              >
                <option value="">—</option>
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.code} — {m.name}
                  </option>
                ))}
              </WfmSelect>
            </WfmField>
            <WfmField label="القالب">
              <WfmSelect
                value={form.moldId}
                onChange={(e) => setForm((f) => ({ ...f, moldId: e.target.value }))}
              >
                <option value="">—</option>
                {molds.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.moldCode} — {m.moldName}
                  </option>
                ))}
              </WfmSelect>
            </WfmField>
            <WfmField label="زمن الدورة (ث)">
              <WfmInput
                type="number"
                value={form.cycleTime}
                onChange={(e) => setForm((f) => ({ ...f, cycleTime: e.target.value }))}
              />
            </WfmField>
            <WfmField label="زمن التبريد (ث)">
              <WfmInput
                type="number"
                value={form.coolingTime}
                onChange={(e) => setForm((f) => ({ ...f, coolingTime: e.target.value }))}
              />
            </WfmField>
            <WfmField label="تعليمات" className="sm:col-span-2">
              <WfmTextarea
                value={form.operationInstructions}
                onChange={(e) => setForm((f) => ({ ...f, operationInstructions: e.target.value }))}
              />
            </WfmField>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={form.qcRequired}
                onChange={(e) => setForm((f) => ({ ...f, qcRequired: e.target.checked }))}
              />
              يتطلب فحص جودة
            </label>
            <div className="sm:col-span-2">
              <Button type="button" disabled={busy || !form.operationCode || !form.operationName} onClick={() => void handleCreate()}>
                <Plus className="ml-2 h-4 w-4" />
                إضافة عملية
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
