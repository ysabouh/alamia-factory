"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, PauseCircle, PlayCircle, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFactoryAuth } from "@/contexts/factory-auth-context";
import { ProductionOrderInfoPanel } from "@/features/production/production-order-info-panel";
import { ProductionOrderLogsPanel } from "@/features/production/production-order-logs-panel";
import { ProductionOrderQualityPanel } from "@/features/production/production-order-quality-panel";
import { ProductionOrderWorkersPanel } from "@/features/production/production-order-workers-panel";
import {
  productionApi,
  ProductionApiError,
  type WorkOrderDetailJson,
  type WorkOrderStatus
} from "@/lib/api/production-client";
import { workforceApi } from "@/lib/api/workforce-client";

const statusLabels: Record<WorkOrderStatus, string> = {
  draft: "مسودة",
  running: "تشغيل",
  paused: "متوقف",
  completed: "مكتمل",
  cancelled: "ملغى"
};

type Tab = "info" | "workers" | "logs" | "quality" | "downtimes";

type Props = { orderId: string };

export function ProductionOrderDetailWorkspace({ orderId }: Props) {
  const { can } = useFactoryAuth();
  const canExecute = can("production.execute");
  const canManage = can("production.manage");
  const canInspect = can("quality.inspect");

  const [order, setOrder] = useState<WorkOrderDetailJson | null>(null);
  const [tab, setTab] = useState<Tab>("info");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await workforceApi.listEmployees({ pageSize: 200, isActive: true });
        setEmployees(
          (res.data as Array<{ id?: string; fullName?: string; firstName?: string; lastName?: string }>)
            .map((e) => ({
              id: String(e.id ?? ""),
              name: e.fullName ?? ([e.firstName, e.lastName].filter(Boolean).join(" ") || String(e.id ?? ""))
            }))
            .filter((e) => e.id)
        );
      } catch {
        /* employees optional for read-only view */
      }
    })();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productionApi.showOrder(orderId);
      setOrder(res.data);
      setError(null);
    } catch (e) {
      setError(e instanceof ProductionApiError ? e.message : "تعذر التحميل");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async (action: "start" | "pause" | "resume" | "complete" | "cancel") => {
    setBusy(true);
    try {
      const fn = {
        start: productionApi.startOrder,
        pause: productionApi.pauseOrder,
        resume: productionApi.resumeOrder,
        complete: productionApi.completeOrder,
        cancel: productionApi.cancelOrder
      }[action];
      await fn(orderId);
      await load();
    } catch (e) {
      setError(e instanceof ProductionApiError ? e.message : "فشلت العملية");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Link
          href="/ar/production/orders"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowRight className="h-4 w-4 translate-y-0.5" />
          العودة إلى سجل الأوامر
        </Link>
        <p className="text-muted-foreground">جاري التحميل…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <Link
          href="/ar/production/orders"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowRight className="h-4 w-4 translate-y-0.5" />
          العودة إلى سجل الأوامر
        </Link>
        <p className="text-destructive">الأمر غير موجود</p>
      </div>
    );
  }

  const pct = Math.min(100, Math.round((order.producedQuantity / Math.max(1, order.plannedQuantity)) * 100));
  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "info", label: "معلومات" },
    { id: "workers", label: "العمال" },
    { id: "logs", label: "سجلات الإنتاج" },
    { id: "quality", label: "الجودة" },
    { id: "downtimes", label: "التوقفات" }
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/ar/production/orders"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowRight className="h-4 w-4 translate-y-0.5" />
        العودة إلى سجل الأوامر
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">أمر إنتاج</p>
          <h1 className="text-2xl font-semibold">{order.orderNo}</h1>
          <p className="text-sm text-muted-foreground">
            {order.productCode} — {order.productName}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge>{statusLabels[order.status]}</Badge>
            <span className="text-xs text-muted-foreground">
              {order.producedQuantity.toLocaleString("ar")} / {order.plannedQuantity.toLocaleString("ar")} ({pct}%)
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canExecute && order.status === "draft" ? (
            <Button size="sm" className="gap-1.5" disabled={busy} onClick={() => void runAction("start")}>
              <PlayCircle className="h-4 w-4 translate-y-0.5" />
              بدء
            </Button>
          ) : null}
          {canExecute && order.status === "running" ? (
            <Button size="sm" variant="secondary" className="gap-1.5" disabled={busy} onClick={() => void runAction("pause")}>
              <PauseCircle className="h-4 w-4 translate-y-0.5" />
              إيقاف
            </Button>
          ) : null}
          {canExecute && order.status === "paused" ? (
            <Button size="sm" disabled={busy} onClick={() => void runAction("resume")}>
              استئناف
            </Button>
          ) : null}
          {canExecute && (order.status === "running" || order.status === "paused") ? (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => void runAction("complete")}>
              إغلاق
            </Button>
          ) : null}
          {canManage && order.status !== "completed" ? (
            <Button size="sm" variant="destructive" disabled={busy} onClick={() => void runAction("cancel")}>
              إلغاء
            </Button>
          ) : null}
          <Button size="sm" variant="outline" className="gap-1.5" asChild>
            <Link href={`/ar/production/orders/${orderId}/inspect`}>
              <ShieldCheck className="h-4 w-4 translate-y-0.5" />
              فحص جودة
            </Link>
          </Button>
        </div>
      </div>

      {error ? <p className="text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full border px-3 py-1.5 text-xs ${tab === t.id ? "border-primary bg-primary/10" : "border-border"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "info" ? (
        <ProductionOrderInfoPanel order={order} canManage={canManage} onSaved={load} />
      ) : null}

      {tab === "workers" ? (
        <ProductionOrderWorkersPanel
          orderId={orderId}
          activeWorkers={order.workers}
          employees={employees}
          canManage={canManage}
          onChanged={load}
        />
      ) : null}

      {tab === "logs" ? (
        <ProductionOrderLogsPanel
          orderId={orderId}
          logs={order.logs}
          canExecute={canExecute}
          onChanged={load}
          onError={setError}
        />
      ) : null}

      {tab === "quality" ? (
        <ProductionOrderQualityPanel
          orderId={orderId}
          inspections={order.inspections}
          canInspect={canInspect}
        />
      ) : null}

      {tab === "downtimes" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">توقفات الماكينة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {order.downtimes.length ? (
              order.downtimes.map((d) => (
                <div key={d.id} className="rounded-lg border border-border p-3 text-sm">
                  <p>{d.reasonName ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.startTime ? new Date(d.startTime).toLocaleString("ar") : "—"}
                    {d.downtimeMinutes != null ? ` · ${d.downtimeMinutes} د` : ""}
                  </p>
                  {d.requestNo ? <p className="text-xs text-amber-600">صيانة: {d.requestNo}</p> : null}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">لا توجد توقفات.</p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

