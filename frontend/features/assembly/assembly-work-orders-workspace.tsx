"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WfmField, WfmInput, WfmSelect } from "@/components/workforce/atlas";
import { useFactoryAuth } from "@/contexts/factory-auth-context";
import { assemblyApi, AssemblyApiError, type AssemblyWorkOrderJson } from "@/lib/api/assembly-client";
import { productsApi } from "@/lib/api/products-client";

const statusLabels: Record<string, string> = {
  draft: "مسودة",
  planned: "مخطّط",
  in_progress: "قيد التنفيذ",
  completed: "مكتمل",
  cancelled: "ملغى"
};

export function AssemblyWorkOrdersWorkspace() {
  const { can } = useFactoryAuth();
  const canManage = can("assembly.manage");

  const [rows, setRows] = useState<AssemblyWorkOrderJson[]>([]);
  const [products, setProducts] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [finalProductId, setFinalProductId] = useState("");
  const [plannedQuantity, setPlannedQuantity] = useState("100");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, productsRes] = await Promise.all([
        assemblyApi.listWorkOrders({ pageSize: 50 }),
        productsApi.list({ pageSize: 100 })
      ]);
      setRows(ordersRes.data);
      setProducts(productsRes.data.map((p) => ({ id: p.id, code: p.productCode, name: p.productNameAr })));
      setError(null);
    } catch (e) {
      setError(e instanceof AssemblyApiError ? e.message : "تعذر التحميل");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    setBusy(true);
    try {
      await assemblyApi.createWorkOrder({
        finalProductId,
        plannedQuantity: Number(plannedQuantity) || 1
      });
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e instanceof AssemblyApiError ? e.message : "فشل الإنشاء");
    } finally {
      setBusy(false);
    }
  };

  const recordProduction = async (orderId: string) => {
    const qty = prompt("كمية منتجة؟", "10");
    if (!qty) return;
    setBusy(true);
    try {
      await assemblyApi.recordOperation({
        assemblyWorkOrderId: orderId,
        quantityProduced: Number(qty)
      });
      await load();
    } catch (e) {
      setError(e instanceof AssemblyApiError ? e.message : "فشل التسجيل");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">أوامر التجميع</h1>
          <p className="text-sm text-muted-foreground">Assembly Work Orders</p>
        </div>
        {canManage && (
          <Button onClick={() => setShowForm((v) => !v)}>
            <Plus className="ml-2 h-4 w-4" />
            أمر جديد
          </Button>
        )}
      </div>

      {error && <p className="text-destructive">{error}</p>}

      {showForm && canManage && (
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">إنشاء أمر تجميع</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <WfmField label="المنتج النهائي">
              <WfmSelect value={finalProductId} onChange={(e) => setFinalProductId(e.target.value)}>
                <option value="">اختر</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </WfmSelect>
            </WfmField>
            <WfmField label="الكمية المخططة">
              <WfmInput type="number" min={1} value={plannedQuantity} onChange={(e) => setPlannedQuantity(e.target.value)} />
            </WfmField>
            <Button type="button" disabled={busy} className="self-end" onClick={() => void create()}>
              حفظ
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {loading ? (
          <p className="text-muted-foreground">جاري التحميل…</p>
        ) : rows.length ? (
          rows.map((wo) => (
            <Card key={wo.id} className="border-border/60">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold">{wo.workOrderCode}</p>
                  <p className="text-sm text-muted-foreground">
                    {wo.finalProductCode} — {wo.finalProductName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {wo.completedQuantity} / {wo.plannedQuantity} ({wo.progressPercent}%)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{statusLabels[wo.status] ?? wo.status}</Badge>
                  {canManage && wo.status !== "completed" && (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => void recordProduction(wo.id)}>
                      تسجيل إنتاج
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-muted-foreground">لا توجد أوامر</p>
        )}
      </div>
    </div>
  );
}
