"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, PauseCircle, PlayCircle, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useFactoryAuth } from "@/contexts/factory-auth-context";
import { ProductionOrderInfoPanel } from "@/features/production/production-order-info-panel";
import { ProductionOrderLogsPanel } from "@/features/production/production-order-logs-panel";
import { ProductionOrderQualityPanel } from "@/features/production/production-order-quality-panel";
import { ProductionOrderDowntimesPanel, ProductionOrderPauseForm } from "@/features/production/production-order-downtimes-panel";
import { productionProgressPercent } from "@/features/production/production-order-progress-card";
import { WorkOrderStatusBadge } from "@/features/production/production-order-status-ui";
import { ProductionOrderWorkersPanel } from "@/features/production/production-order-workers-panel";
import { uploadDowntimePhotos } from "@/features/production/downtime-photo-uploader";
import {
  productionApi,
  ProductionApiError,
  type WorkOrderDetailJson
} from "@/lib/api/production-client";
import { workforceApi } from "@/lib/api/workforce-client";

type Tab = "info" | "workers" | "logs" | "quality" | "downtimes";

const validTabs: Tab[] = ["info", "workers", "logs", "quality", "downtimes"];

function parseTab(value?: string | null): Tab {
  if (value && validTabs.includes(value as Tab)) return value as Tab;
  return "info";
}

type Props = { orderId: string; initialTab?: string | null };

export function ProductionOrderDetailWorkspace({ orderId, initialTab }: Props) {
  const { can } = useFactoryAuth();
  const canExecute = can("production.execute");
  const canManage = can("production.manage");
  const canInspect = can("quality.inspect");

  const [order, setOrder] = useState<WorkOrderDetailJson | null>(null);
  const [tab, setTab] = useState<Tab>(() => parseTab(initialTab));
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pauseFormOpen, setPauseFormOpen] = useState(false);

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

  const runAction = async (action: "start" | "resume" | "complete" | "cancel") => {
    setBusy(true);
    try {
      if (action === "resume") {
        const openDowntime = order?.downtimes.find((d) => !d.endTime);
        if (openDowntime) {
          await productionApi.updateDowntime(openDowntime.id, { endTime: new Date().toISOString() });
        }
      }
      const fn = {
        start: productionApi.startOrder,
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

  const confirmPause = async (payload: {
    downtimeReasonId: string;
    startTime: string;
    notes?: string;
    photos?: File[];
  }) => {
    if (!order?.machineId) {
      setError("يجب ربط ماكينة بأمر الإنتاج قبل الإيقاف.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const downtimeRes = await productionApi.createDowntime(orderId, {
        machineId: order.machineId,
        startTime: payload.startTime,
        downtimeReasonId: payload.downtimeReasonId,
        notes: payload.notes
      });
      if (payload.photos?.length) {
        await uploadDowntimePhotos(downtimeRes.data.id, payload.photos);
      }
      await productionApi.pauseOrder(orderId);
      setPauseFormOpen(false);
      setTab("downtimes");
      await load();
    } catch (e) {
      setError(e instanceof ProductionApiError ? e.message : "فشل إيقاف الأمر");
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

  const progressPct = productionProgressPercent(order.producedQuantity, order.plannedQuantity);
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

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">أمر إنتاج</p>
          <h1 className="text-2xl font-semibold">{order.orderNo}</h1>
          <p className="text-sm text-muted-foreground">
            {order.productCode} — {order.productName}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <WorkOrderStatusBadge status={order.status} />
            <span className="text-xs text-muted-foreground tabular-nums">
              {order.producedQuantity.toLocaleString("ar")} / {order.plannedQuantity.toLocaleString("ar")} (
              {progressPct.toLocaleString("ar")}%)
            </span>
            {order.productionManagerName ? (
              <span className="text-xs text-muted-foreground">· مدير الإنتاج: {order.productionManagerName}</span>
            ) : null}
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {canExecute && order.status === "draft" ? (
            <Button size="sm" className="gap-1.5" disabled={busy} onClick={() => void runAction("start")}>
              <PlayCircle className="h-4 w-4 translate-y-0.5" />
              بدء
            </Button>
          ) : null}
          {canExecute && order.status === "running" ? (
            <Button
              size="sm"
              variant="secondary"
              className="gap-1.5"
              disabled={busy}
              onClick={() => setPauseFormOpen(true)}
            >
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

      <ProductionOrderPauseForm
        order={order}
        open={pauseFormOpen}
        busy={busy}
        onCancel={() => setPauseFormOpen(false)}
        onConfirm={confirmPause}
      />

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
        <ProductionOrderDowntimesPanel
          order={order}
          canExecute={canExecute}
          onChanged={load}
          onError={setError}
        />
      ) : null}
    </div>
  );
}

