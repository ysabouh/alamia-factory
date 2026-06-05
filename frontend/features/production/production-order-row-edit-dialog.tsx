"use client";

import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WfmField, WfmInput, WfmModal, WfmSelect, WfmTextarea } from "@/components/workforce/atlas";
import { moldTypeLabels } from "@/features/molds/management/mold-status-ui";
import { machinesApi } from "@/lib/api/machines-client";
import { moldsApi, type MoldType } from "@/lib/api/molds-client";
import {
  productionApi,
  ProductionApiError,
  type WorkOrderJson
} from "@/lib/api/production-client";
import { productsApi } from "@/lib/api/products-client";
import { workforceApi } from "@/lib/api/workforce-client";
import { workforceMastersApi, type ShiftMaster } from "@/lib/api/workforce-masters-client";

type Props = {
  order: WorkOrderJson | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => Promise<void>;
};

function moldTypeLabel(type?: string | null) {
  if (!type) return "—";
  return moldTypeLabels[type as MoldType] ?? type;
}

export function ProductionOrderRowEditDialog({ order, open, onOpenChange, onSaved }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [products, setProducts] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [machines, setMachines] = useState<Array<{ id: string; code: string; name: string; typeName: string | null }>>([]);
  const [molds, setMolds] = useState<Array<{ id: string; code: string; moldType: string | null }>>([]);
  const [shifts, setShifts] = useState<Array<{ id: string; name: string }>>([]);
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([]);

  const [form, setForm] = useState({
    productId: "",
    machineId: "",
    moldId: "",
    shiftId: "",
    productionDate: "",
    plannedQuantity: "",
    supervisorId: "",
    notes: ""
  });

  useEffect(() => {
    if (!order) return;
    setForm({
      productId: order.productId,
      machineId: order.machineId ?? "",
      moldId: order.moldId ?? "",
      shiftId: order.shiftId ?? "",
      productionDate: order.productionDate ?? "",
      plannedQuantity: String(order.plannedQuantity),
      supervisorId: order.supervisorId ?? "",
      notes: order.notes ?? ""
    });
    setError(null);
  }, [order]);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      try {
        const [pRes, mRes, moldRes, shiftRes, empRes] = await Promise.all([
          productsApi.list({ pageSize: 100, isActive: true }),
          machinesApi.list({ pageSize: 100, isActive: true }),
          moldsApi.list({ pageSize: 100 }),
          workforceMastersApi.list<ShiftMaster>("shifts", { pageSize: 50, isActive: true }),
          workforceApi.listEmployees({ pageSize: 200, isActive: true })
        ]);
        setProducts(pRes.data.map((p) => ({ id: p.id, code: p.productCode, name: p.productNameAr })));
        setMachines(
          mRes.data.map((m) => ({ id: m.id, code: m.code, name: m.name, typeName: m.typeName ?? m.type }))
        );
        setMolds(moldRes.data.map((m) => ({ id: m.id, code: m.moldCode, moldType: m.moldType })));
        setShifts(shiftRes.data.map((s) => ({ id: s.id, name: s.name })));
        setEmployees(
          (empRes.data as Array<{ id?: string; fullName?: string; firstName?: string; lastName?: string }>)
            .map((e) => ({
              id: String(e.id ?? ""),
              name: e.fullName ?? ([e.firstName, e.lastName].filter(Boolean).join(" ") || String(e.id ?? ""))
            }))
            .filter((e) => e.id)
        );
      } catch {
        /* optional */
      }
    })();
  }, [open]);

  const selectedMachine = useMemo(
    () => machines.find((m) => m.id === form.machineId),
    [machines, form.machineId]
  );
  const selectedMold = useMemo(() => molds.find((m) => m.id === form.moldId), [molds, form.moldId]);

  const save = async () => {
    if (!order) return;
    setBusy(true);
    setError(null);
    try {
      await productionApi.updateOrder(order.id, {
        productId: form.productId,
        machineId: form.machineId || undefined,
        moldId: form.moldId || undefined,
        shiftId: form.shiftId || undefined,
        productionDate: form.productionDate || undefined,
        plannedQuantity: Number(form.plannedQuantity) || order.plannedQuantity,
        supervisorId: form.supervisorId || undefined,
        notes: form.notes || undefined
      });
      onOpenChange(false);
      await onSaved();
    } catch (e) {
      setError(e instanceof ProductionApiError ? e.message : "فشل الحفظ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <WfmModal
      open={open}
      onOpenChange={onOpenChange}
      title={order ? `تعديل ${order.orderNo}` : "تعديل أمر الإنتاج"}
      description="لا يمكن تعديل الأوامر المكتملة."
      contentClassName="w-[min(100vw-1.5rem,40rem)]"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            إلغاء
          </Button>
          <Button type="button" onClick={() => void save()} disabled={busy || !order}>
            <Save className="ml-2 h-4 w-4" />
            حفظ
          </Button>
        </>
      }
    >
      {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <WfmField label="المنتج">
          <WfmSelect
            value={form.productId}
            onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}
          >
            <option value="">—</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </WfmSelect>
        </WfmField>
        <WfmField label="الكمية المخططة">
          <WfmInput
            type="number"
            min={1}
            value={form.plannedQuantity}
            onChange={(e) => setForm((f) => ({ ...f, plannedQuantity: e.target.value }))}
          />
        </WfmField>
        <WfmField label="الآلة">
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
        <WfmField label="نوع الآلة">
          <WfmInput value={selectedMachine?.typeName ?? "—"} readOnly className="bg-muted/30" />
        </WfmField>
        <WfmField label="القالب">
          <WfmSelect value={form.moldId} onChange={(e) => setForm((f) => ({ ...f, moldId: e.target.value }))}>
            <option value="">—</option>
            {molds.map((m) => (
              <option key={m.id} value={m.id}>
                {m.code} ({moldTypeLabel(m.moldType)})
              </option>
            ))}
          </WfmSelect>
        </WfmField>
        <WfmField label="نوع القالب">
          <WfmInput value={moldTypeLabel(selectedMold?.moldType)} readOnly className="bg-muted/30" />
        </WfmField>
        <WfmField label="الوردية">
          <WfmSelect value={form.shiftId} onChange={(e) => setForm((f) => ({ ...f, shiftId: e.target.value }))}>
            <option value="">—</option>
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </WfmSelect>
        </WfmField>
        <WfmField label="تاريخ الإنتاج">
          <WfmInput
            type="date"
            value={form.productionDate}
            onChange={(e) => setForm((f) => ({ ...f, productionDate: e.target.value }))}
          />
        </WfmField>
        <WfmField label="المشرف" className="sm:col-span-2">
          <WfmSelect
            value={form.supervisorId}
            onChange={(e) => setForm((f) => ({ ...f, supervisorId: e.target.value }))}
          >
            <option value="">—</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </WfmSelect>
        </WfmField>
        <WfmField label="ملاحظات" className="sm:col-span-2">
          <WfmTextarea
            rows={3}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </WfmField>
      </div>
    </WfmModal>
  );
}
