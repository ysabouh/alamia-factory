"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  ClipboardList,
  Clock,
  Cog,
  Factory,
  Layers,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WfmField, WfmInput, WfmSelect } from "@/components/workforce/atlas";
import { moldTypeLabels } from "@/features/molds/management/mold-status-ui";
import { ProductionOrderRowEditDialog } from "@/features/production/production-order-row-edit-dialog";
import {
  canEditWorkOrder,
  workOrderStatusLabels,
  workOrderStatusUi,
  WorkOrderProgressBar,
  WorkOrderStatusBadge
} from "@/features/production/production-order-status-ui";
import { useFactoryAuth } from "@/contexts/factory-auth-context";
import { productionApi, ProductionApiError, type WorkOrderJson, type WorkOrderStatus } from "@/lib/api/production-client";
import type { MoldType } from "@/lib/api/molds-client";
import { cn } from "@/lib/utils";

function moldTypeLabel(type?: string | null) {
  if (!type) return "—";
  return moldTypeLabels[type as MoldType] ?? type;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("ar");
  } catch {
    return value;
  }
}

function todayIsoDate() {
  return new Date().toLocaleDateString("en-CA");
}

export function ProductionOrdersRegistryWorkspace() {
  const { can } = useFactoryAuth();
  const canManage = can("production.manage");

  const [rows, setRows] = useState<WorkOrderJson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<WorkOrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [dateFrom, setDateFrom] = useState(todayIsoDate);
  const [dateTo, setDateTo] = useState(todayIsoDate);
  const [editOrder, setEditOrder] = useState<WorkOrderJson | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productionApi.listOrders({
        pageSize: 50,
        status,
        search: search || undefined,
        from: dateFrom || undefined,
        to: dateTo || undefined
      });
      setRows(res.data);
      setError(null);
    } catch (e) {
      setError(e instanceof ProductionApiError ? e.message : "تعذر التحميل");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, search, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = {
    total: rows.length,
    running: rows.filter((r) => r.status === "running").length,
    draft: rows.filter((r) => r.status === "draft").length,
    completed: rows.filter((r) => r.status === "completed").length
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <ClipboardList className="h-7 w-7 text-primary" />
            سجل أوامر الإنتاج
          </h1>
          <p className="text-sm text-muted-foreground">عرض وإدارة أوامر الإنتاج في جدول موحّد</p>
        </div>
        {canManage ? (
          <Button asChild>
            <Link href="/ar/production/orders/new">
              <Plus className="ml-2 h-4 w-4" />
              أمر جديد
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "المعروض", value: summary.total, className: "text-foreground" },
          { label: "قيد التشغيل", value: summary.running, className: "text-emerald-600" },
          { label: "مسودات", value: summary.draft, className: "text-slate-600" },
          { label: "مكتمل", value: summary.completed, className: "text-sky-600" }
        ].map((item) => (
          <Card key={item.label} className="border-border/60">
            <CardContent className="flex items-center justify-between p-4">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className={cn("text-2xl font-bold tabular-nums", item.className)}>
                {item.value.toLocaleString("ar")}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">تصفية وبحث</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <WfmField label="الحالة">
            <WfmSelect value={status} onChange={(e) => setStatus(e.target.value as WorkOrderStatus | "all")}>
              <option value="all">الكل</option>
              {Object.entries(workOrderStatusLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </WfmSelect>
          </WfmField>
          <WfmField label="من تاريخ">
            <WfmInput type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </WfmField>
          <WfmField label="إلى تاريخ">
            <WfmInput type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </WfmField>
          <WfmField label="بحث برقم الأمر" className="sm:col-span-2 lg:col-span-2">
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <WfmInput
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setSearch(searchInput.trim());
                }}
                placeholder="رقم الأمر أو الرمز…"
                className="ps-9"
              />
            </div>
          </WfmField>
          <div className="flex items-end gap-2">
            <Button type="button" variant="default" className="flex-1" onClick={() => setSearch(searchInput.trim())}>
              بحث
            </Button>
            <Button type="button" variant="outline" size="icon" onClick={() => void load()} title="تحديث">
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {error ? <p className="text-destructive">{error}</p> : null}

      <div className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="font-semibold">رقم الأمر</TableHead>
              <TableHead className="font-semibold">المنتج</TableHead>
              <TableHead className="font-semibold">الآلة</TableHead>
              <TableHead className="font-semibold">القالب</TableHead>
              <TableHead className="font-semibold">الوردية</TableHead>
              <TableHead className="font-semibold">التاريخ</TableHead>
              <TableHead className="font-semibold">التقدم</TableHead>
              <TableHead className="font-semibold">الحالة</TableHead>
              <TableHead className="w-[7rem] text-center font-semibold">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                  جاري التحميل…
                </TableCell>
              </TableRow>
            ) : rows.length ? (
              rows.map((wo) => {
                const ui = workOrderStatusUi[wo.status];
                const editable = canManage && canEditWorkOrder(wo.status);
                return (
                  <TableRow
                    key={wo.id}
                    className={cn("border-s-4 transition-colors", ui.rowClass, ui.accentClass)}
                  >
                    <TableCell>
                      <Link
                        href={`/ar/production/orders/${wo.id}`}
                        className="group inline-flex items-center gap-2 font-semibold text-primary hover:underline"
                      >
                        <ClipboardList className="h-4 w-4 text-primary/70 group-hover:text-primary" />
                        {wo.orderNo}
                      </Link>
                      {wo.supervisorName ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">مشرف: {wo.supervisorName}</p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-700">
                          <Package className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{wo.productName ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">{wo.productCode ?? "—"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-violet-100 text-violet-700">
                          <Factory className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{wo.machineName ?? wo.machineCode ?? "—"}</p>
                          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Cog className="h-3 w-3" />
                            {wo.machineTypeName ?? "—"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-orange-100 text-orange-700">
                          <Layers className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{wo.moldName ?? wo.moldCode ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">{moldTypeLabel(wo.moldType)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="inline-flex items-center gap-1.5 text-sm">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {wo.shiftName ?? "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="inline-flex items-center gap-1.5 text-sm">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {formatDate(wo.productionDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <WorkOrderProgressBar
                        produced={wo.producedQuantity}
                        planned={wo.plannedQuantity}
                        status={wo.status}
                      />
                    </TableCell>
                    <TableCell>
                      <WorkOrderStatusBadge status={wo.status} />
                    </TableCell>
                    <TableCell>
                      {canManage ? (
                        <div className="flex items-center justify-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title={editable ? "تعديل" : "لا يمكن تعديل الأوامر المكتملة"}
                            disabled={!editable}
                            onClick={() => setEditOrder(wo)}
                          >
                            <Pencil className={cn("h-4 w-4", editable ? "text-amber-600" : "text-muted-foreground/40")} />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                  لا توجد أوامر مطابقة.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ProductionOrderRowEditDialog
        order={editOrder}
        open={editOrder !== null}
        onOpenChange={(open) => {
          if (!open) setEditOrder(null);
        }}
        onSaved={load}
      />
    </div>
  );
}
