"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WfmField, WfmInput, WfmSelect } from "@/components/workforce/atlas";
import { ProductionWorkersEditor, workersToPayload, type WorkerDraft } from "@/features/production/production-workers-editor";
import { workOrderFormSchema } from "@/features/production/schemas/work-order-form-schema";
import { machinesApi } from "@/lib/api/machines-client";
import { moldsApi } from "@/lib/api/molds-client";
import { productionApi, ProductionApiError } from "@/lib/api/production-client";
import { productsApi } from "@/lib/api/products-client";
import { workforceMastersApi, type ShiftMaster } from "@/lib/api/workforce-masters-client";
import { workforceApi } from "@/lib/api/workforce-client";

export function ProductionOrderFormWorkspace() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [productId, setProductId] = useState("");
  const [productionDate, setProductionDate] = useState(new Date().toISOString().slice(0, 10));
  const [machineId, setMachineId] = useState("");
  const [moldId, setMoldId] = useState("");
  const [shiftId, setShiftId] = useState("");
  const [supervisorId, setSupervisorId] = useState("");
  const [plannedQuantity, setPlannedQuantity] = useState("1000");
  const [notes, setNotes] = useState("");

  const [products, setProducts] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [machines, setMachines] = useState<Array<{ id: string; code: string }>>([]);
  const [molds, setMolds] = useState<Array<{ id: string; code: string }>>([]);
  const [shifts, setShifts] = useState<Array<{ id: string; name: string }>>([]);
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([]);
  const [workers, setWorkers] = useState<WorkerDraft[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const [pRes, mRes, moldRes, shiftRes, empRes] = await Promise.all([
          productsApi.list({ pageSize: 100, isActive: true }),
          machinesApi.list({ pageSize: 100, isActive: true }),
          moldsApi.list({ pageSize: 100 }),
          workforceMastersApi.list<ShiftMaster>("shifts", { pageSize: 50, isActive: true }),
          workforceApi.listEmployees({ pageSize: 100, isActive: true })
        ]);
        setProducts(pRes.data.map((p) => ({ id: p.id, code: p.productCode, name: p.productNameAr })));
        setMachines(mRes.data.map((m) => ({ id: m.id, code: m.code })));
        setMolds(moldRes.data.map((m) => ({ id: m.id, code: m.moldCode })));
        setShifts(shiftRes.data.map((s) => ({ id: s.id, name: s.name })));
        setEmployees(
          (empRes.data as Array<{ id?: string; fullName?: string; firstName?: string; lastName?: string }>)
            .map((e) => ({
              id: String(e.id ?? ""),
              name: e.fullName ?? ([e.firstName, e.lastName].filter(Boolean).join(" ") || String(e.id ?? ""))
            }))
            .filter((e) => e.id)
        );
        if (!pRes.data.length) {
          setError("لا توجد منتجات. شغّل: php artisan factory:seed-demo (أو Seed-Demo-Data.cmd)");
        } else {
          setError(null);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "تعذر تحميل بيانات النموذج");
      }
    })();
  }, []);

  const submit = async () => {
    const parsed = workOrderFormSchema.safeParse({
      productId,
      productionDate,
      machineId,
      moldId,
      shiftId,
      supervisorId,
      plannedQuantity,
      notes
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "بيانات غير صالحة");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const workerPayload = workersToPayload(workers);
      const res = await productionApi.createOrder({
        productId: parsed.data.productId,
        productionDate: parsed.data.productionDate || undefined,
        machineId: parsed.data.machineId || undefined,
        moldId: parsed.data.moldId || undefined,
        shiftId: parsed.data.shiftId || undefined,
        supervisorId: parsed.data.supervisorId || undefined,
        plannedQuantity: parsed.data.plannedQuantity,
        notes: parsed.data.notes || undefined,
        workers: workerPayload.length ? workerPayload : undefined
      });
      router.push(`/ar/production/orders/${res.data.id}`);
    } catch (e) {
      setError(e instanceof ProductionApiError ? e.message : "فشل الإنشاء");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">إنشاء أمر إنتاج</h1>
        <p className="text-sm text-muted-foreground">مدير الإنتاج</p>
      </div>

      {error ? <p className="text-destructive">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">بيانات الأمر</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <WfmField label="المنتج *">
            <WfmSelect value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">اختر</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </WfmSelect>
          </WfmField>
          <WfmField label="تاريخ الإنتاج">
            <WfmInput type="date" value={productionDate} onChange={(e) => setProductionDate(e.target.value)} />
          </WfmField>
          <WfmField label="الكمية المخططة *">
            <WfmInput type="number" min={1} value={plannedQuantity} onChange={(e) => setPlannedQuantity(e.target.value)} />
          </WfmField>
          <WfmField label="الماكينة">
            <WfmSelect value={machineId} onChange={(e) => setMachineId(e.target.value)}>
              <option value="">—</option>
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.code}
                </option>
              ))}
            </WfmSelect>
          </WfmField>
          <WfmField label="القالب">
            <WfmSelect value={moldId} onChange={(e) => setMoldId(e.target.value)}>
              <option value="">—</option>
              {molds.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.code}
                </option>
              ))}
            </WfmSelect>
          </WfmField>
          <WfmField label="الوردية">
            <WfmSelect value={shiftId} onChange={(e) => setShiftId(e.target.value)}>
              <option value="">—</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </WfmSelect>
          </WfmField>
          <WfmField label="المشرف">
            <WfmSelect value={supervisorId} onChange={(e) => setSupervisorId(e.target.value)}>
              <option value="">—</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </WfmSelect>
          </WfmField>
          <WfmField label="ملاحظات" className="sm:col-span-2">
            <WfmInput value={notes} onChange={(e) => setNotes(e.target.value)} />
          </WfmField>
          <Button type="button" disabled={busy} className="sm:col-span-2 w-fit" onClick={() => void submit()}>
            إنشاء الأمر
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">فريق التشغيل</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductionWorkersEditor employees={employees} workers={workers} onChange={setWorkers} disabled={busy} />
        </CardContent>
      </Card>
    </div>
  );
}
