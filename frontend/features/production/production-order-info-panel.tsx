"use client";

import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import {
  Box,
  Calendar,
  Clock,
  Cog,
  Factory,
  Layers,
  Package,
  PackageCheck,
  Pencil,
  Save,
  User,
  X
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WfmField, WfmInput, WfmSelect, WfmTextarea } from "@/components/workforce/atlas";
import { moldTypeLabels } from "@/features/molds/management/mold-status-ui";
import { ProductionOrderProgressCard, productionProgressPercent } from "@/features/production/production-order-progress-card";
import { machinesApi } from "@/lib/api/machines-client";
import { moldsApi, type MoldType } from "@/lib/api/molds-client";
import {
  productionApi,
  ProductionApiError,
  type WorkOrderDetailJson
} from "@/lib/api/production-client";
import { productsApi } from "@/lib/api/products-client";
import { workforceApi } from "@/lib/api/workforce-client";
import { workforceMastersApi, type ShiftMaster } from "@/lib/api/workforce-masters-client";
import { cn } from "@/lib/utils";

type Props = {
  order: WorkOrderDetailJson;
  canManage: boolean;
  onSaved: () => Promise<void>;
};

type FormState = {
  productId: string;
  machineId: string;
  moldId: string;
  shiftId: string;
  productionDate: string;
  plannedQuantity: string;
  supervisorId: string;
  productionManagerId: string;
  notes: string;
};

function moldTypeLabel(type?: string | null) {
  if (!type) return "—";
  return moldTypeLabels[type as MoldType] ?? type;
}

export function ProductionOrderInfoPanel({ order, canManage, onSaved }: Props) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [products, setProducts] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [machines, setMachines] = useState<Array<{ id: string; code: string; name: string; typeName: string | null }>>([]);
  const [molds, setMolds] = useState<Array<{ id: string; code: string; moldType: string | null }>>([]);
  const [shifts, setShifts] = useState<Array<{ id: string; name: string }>>([]);
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([]);

  const canEdit = canManage && order.status !== "completed";

  const [form, setForm] = useState<FormState>({
    productId: order.productId,
    machineId: order.machineId ?? "",
    moldId: order.moldId ?? "",
    shiftId: order.shiftId ?? "",
    productionDate: order.productionDate ?? "",
    plannedQuantity: String(order.plannedQuantity),
    supervisorId: order.supervisorId ?? "",
    productionManagerId: order.productionManagerId ?? "",
    notes: order.notes ?? ""
  });

  useEffect(() => {
    setForm({
      productId: order.productId,
      machineId: order.machineId ?? "",
      moldId: order.moldId ?? "",
      shiftId: order.shiftId ?? "",
      productionDate: order.productionDate ?? "",
      plannedQuantity: String(order.plannedQuantity),
      supervisorId: order.supervisorId ?? "",
      productionManagerId: order.productionManagerId ?? "",
      notes: order.notes ?? ""
    });
  }, [order]);

  useEffect(() => {
    if (!canEdit) return;
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
  }, [canEdit]);

  const selectedMachine = useMemo(
    () => machines.find((m) => m.id === form.machineId),
    [machines, form.machineId]
  );
  const selectedMold = useMemo(() => molds.find((m) => m.id === form.moldId), [molds, form.moldId]);
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === form.productId),
    [products, form.productId]
  );

  const machineTypeDisplay = editing
    ? selectedMachine?.typeName ?? "—"
    : order.machineTypeName ?? "—";
  const moldTypeDisplay = editing
    ? moldTypeLabel(selectedMold?.moldType)
    : moldTypeLabel(order.moldType);

  const pct = productionProgressPercent(order.producedQuantity, order.plannedQuantity);
  const scrapQuantity = useMemo(
    () => order.logs.reduce((sum, log) => sum + (log.scrapQuantity ?? 0), 0),
    [order.logs]
  );

  const save = async () => {
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
        productionManagerId: form.productionManagerId || undefined,
        notes: form.notes || undefined
      });
      setEditing(false);
      await onSaved();
    } catch (e) {
      setError(e instanceof ProductionApiError ? e.message : "فشل الحفظ");
    } finally {
      setBusy(false);
    }
  };

  const cancel = () => {
    setForm({
      productId: order.productId,
      machineId: order.machineId ?? "",
      moldId: order.moldId ?? "",
      shiftId: order.shiftId ?? "",
      productionDate: order.productionDate ?? "",
      plannedQuantity: String(order.plannedQuantity),
      supervisorId: order.supervisorId ?? "",
      productionManagerId: order.productionManagerId ?? "",
      notes: order.notes ?? ""
    });
    setEditing(false);
    setError(null);
  };

  const productName = editing
    ? selectedProduct
      ? `${selectedProduct.code} — ${selectedProduct.name}`
      : order.productName
    : order.productName;
  const productCode = editing ? selectedProduct?.code ?? order.productCode : order.productCode;

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">بيانات التشغيل الأساسية</p>
        {canEdit ? (
          editing ? (
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" className="gap-1.5" disabled={busy} onClick={cancel}>
                <X className="h-4 w-4 translate-y-0.5" />
                إلغاء
              </Button>
              <Button type="button" size="sm" className="gap-1.5" disabled={busy} onClick={() => void save()}>
                <Save className="h-4 w-4 translate-y-0.5" />
                حفظ
              </Button>
            </div>
          ) : (
            <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4 translate-y-0.5" />
              تعديل
            </Button>
          )
        ) : null}
      </div>

      <Card className="overflow-hidden border-orange-200/60 bg-gradient-to-l from-orange-50 via-white to-amber-50/40">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 ring-1 ring-orange-200">
              <Package className="h-7 w-7 translate-y-0.5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-orange-600/80">المنتج</p>
              {editing ? (
                <WfmSelect
                  className="min-w-[260px] border-orange-200 bg-white"
                  value={form.productId}
                  onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}
                >
                  <option value="">اختر المنتج</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.name}
                    </option>
                  ))}
                </WfmSelect>
              ) : (
                <>
                  <p className="text-lg font-semibold text-gray-900">{productName ?? "—"}</p>
                  <p className="font-mono text-xs text-muted-foreground">{productCode ?? "—"}</p>
                </>
              )}
              {!editing && order.productId ? (
                <Link href={`/ar/products/${order.productId}`} className="text-xs text-orange-600 hover:underline">
                  عرض المنتج
                </Link>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <ProductionOrderProgressCard
        produced={order.producedQuantity}
        planned={order.plannedQuantity}
        status={order.status}
        scrapQuantity={scrapQuantity}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <HighlightCard
          title="الماكينة"
          icon={Factory}
          accent="indigo"
          badge={machineTypeDisplay}
          badgeLabel="نوع الماكينة"
        >
          {editing ? (
            <WfmSelect
              className="border-indigo-200 bg-white"
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
          ) : (
            <p className="text-base font-semibold">
              {order.machineCode ?? "—"}
              {order.machineName ? <span className="block text-sm font-normal text-muted-foreground">{order.machineName}</span> : null}
            </p>
          )}
        </HighlightCard>

        <HighlightCard title="القالب" icon={Layers} accent="amber" badge={moldTypeDisplay} badgeLabel="نوع القالب">
          {editing ? (
            <WfmSelect
              className="border-amber-200 bg-white"
              value={form.moldId}
              onChange={(e) => setForm((f) => ({ ...f, moldId: e.target.value }))}
            >
              <option value="">—</option>
              {molds.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.code}
                  {m.moldType ? ` · ${moldTypeLabel(m.moldType)}` : ""}
                </option>
              ))}
            </WfmSelect>
          ) : (
            <p className="text-base font-semibold">
              {order.moldCode ?? "—"}
              {order.moldName ? <span className="block text-sm font-normal text-muted-foreground">{order.moldName}</span> : null}
            </p>
          )}
        </HighlightCard>

        <HighlightCard title="الوردية" icon={Clock} accent="teal" badge={order.shiftName ?? "—"} badgeLabel="الوردية الحالية">
          {editing ? (
            <WfmSelect
              className="border-teal-200 bg-white"
              value={form.shiftId}
              onChange={(e) => setForm((f) => ({ ...f, shiftId: e.target.value }))}
            >
              <option value="">—</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </WfmSelect>
          ) : (
            <p className="text-base font-semibold">{order.shiftName ?? "—"}</p>
          )}
        </HighlightCard>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">تفاصيل إضافية</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem icon={Calendar} label="تاريخ الإنتاج">
            {editing ? (
              <WfmInput
                type="date"
                value={form.productionDate}
                onChange={(e) => setForm((f) => ({ ...f, productionDate: e.target.value }))}
              />
            ) : (
              order.productionDate ?? "—"
            )}
          </DetailItem>
          <DetailItem icon={Box} label="الكمية المخططة">
            {editing ? (
              <WfmInput
                type="number"
                min={1}
                value={form.plannedQuantity}
                onChange={(e) => setForm((f) => ({ ...f, plannedQuantity: e.target.value }))}
              />
            ) : (
              order.plannedQuantity.toLocaleString("ar")
            )}
          </DetailItem>
          <DetailItem icon={PackageCheck} label="الكمية المنجزة">
            <span className={cn("tabular-nums", order.producedQuantity > order.plannedQuantity && "text-amber-700")}>
              {order.producedQuantity.toLocaleString("ar")}
            </span>
            <span className="ms-1 text-xs text-muted-foreground">({pct.toLocaleString("ar")}%)</span>
          </DetailItem>
          <DetailItem icon={User} label="المشرف">
            {editing ? (
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
            ) : (
              order.supervisorName ?? "—"
            )}
          </DetailItem>
          <DetailItem icon={Cog} label="مدير الإنتاج">
            {editing ? (
              <WfmSelect
                value={form.productionManagerId}
                onChange={(e) => setForm((f) => ({ ...f, productionManagerId: e.target.value }))}
              >
                <option value="">— اختر مدير الإنتاج —</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </WfmSelect>
            ) : (
              order.productionManagerName ?? "—"
            )}
          </DetailItem>
          <DetailItem icon={Clock} label="بداية التشغيل">
            {order.startTime ? new Date(order.startTime).toLocaleString("ar") : "—"}
          </DetailItem>
          <DetailItem icon={Clock} label="نهاية التشغيل">
            {order.endTime ? new Date(order.endTime).toLocaleString("ar") : "—"}
          </DetailItem>
          <div className="sm:col-span-2 lg:col-span-3">
            <DetailItem icon={Pencil} label="ملاحظات">
              {editing ? (
                <WfmTextarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              ) : (
                order.notes ?? "—"
              )}
            </DetailItem>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function HighlightCard({
  title,
  icon: Icon,
  accent,
  badge,
  badgeLabel,
  children
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  accent: "indigo" | "amber" | "teal";
  badge: string;
  badgeLabel: string;
  children: ReactNode;
}) {
  const styles = {
    indigo: {
      card: "border-indigo-200/70 bg-gradient-to-b from-indigo-50/80 to-white",
      icon: "bg-indigo-100 text-indigo-600 ring-indigo-200",
      badge: "bg-indigo-100 text-indigo-800 border-indigo-200"
    },
    amber: {
      card: "border-amber-200/70 bg-gradient-to-b from-amber-50/80 to-white",
      icon: "bg-amber-100 text-amber-700 ring-amber-200",
      badge: "bg-amber-100 text-amber-900 border-amber-200"
    },
    teal: {
      card: "border-teal-200/70 bg-gradient-to-b from-teal-50/80 to-white",
      icon: "bg-teal-100 text-teal-700 ring-teal-200",
      badge: "bg-teal-100 text-teal-800 border-teal-200"
    }
  }[accent];

  return (
    <Card className={cn("overflow-hidden", styles.card)}>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1", styles.icon)}>
              <Icon className="h-4 w-4 translate-y-0.5" />
            </div>
            <p className="font-semibold">{title}</p>
          </div>
        </div>
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">{badgeLabel}</p>
          <Badge className={cn("rounded-full border font-medium", styles.badge)}>{badge}</Badge>
        </div>
        <div>{children}</div>
      </CardContent>
    </Card>
  );
}

function DetailItem({
  icon: Icon,
  label,
  children
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5 translate-y-0.5" />
        {label}
      </div>
      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}
