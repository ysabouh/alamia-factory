"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Layers, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFactoryAuth } from "@/contexts/factory-auth-context";
import { MoldImageUploader } from "@/features/molds/management/mold-image-uploader";
import {
  moldStatusBadgeVariant,
  moldStatusLabels,
  moldTypeLabels,
  moldTypeShortLabels
} from "@/features/molds/management/mold-status-ui";
import {
  formatSpecValue,
  moldSpecFieldLabels,
  specSectionTitle
} from "@/features/molds/management/mold-spec-labels";
import { moldsApi, MoldsApiError, type MoldDetailJson, type MoldType } from "@/lib/api/molds-client";
import { cn } from "@/lib/utils";

type Tab = "overview" | "specs" | "maintenance" | "installations" | "gallery";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/40 py-2.5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-end">{value}</span>
    </div>
  );
}

function SpecGrid({ spec, moldType }: { spec: Record<string, unknown> | null; moldType: MoldType }) {
  if (!spec) {
    return <p className="text-sm text-muted-foreground">لا مواصفات فنية مسجّلة.</p>;
  }

  const peSpec = moldType === "polyethylene" ? spec : null;

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium">{specSectionTitle(moldType)}</p>

      {peSpec && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="border-amber-500/25 bg-amber-500/5">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">نوع PE</p>
              <p className="mt-1 font-semibold">{formatSpecValue("polyethyleneType", peSpec.polyethyleneType)}</p>
            </CardContent>
          </Card>
          <Card className="border-amber-500/25 bg-amber-500/5">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">طريقة الإنتاج</p>
              <p className="mt-1 font-semibold">{formatSpecValue("productionMethod", peSpec.productionMethod)}</p>
            </CardContent>
          </Card>
          <Card className="border-amber-500/25 bg-amber-500/5">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">نطاق الحرارة</p>
              <p className="mt-1 font-mono text-sm font-semibold">
                {formatSpecValue("minTemperature", peSpec.minTemperature)} — {formatSpecValue("maxTemperature", peSpec.maxTemperature)} °C
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(spec).map(([k, v]) => (
          <Card key={k} className="border-border/50 bg-card/25">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{moldSpecFieldLabels[k] ?? k}</p>
              <p className="mt-1 font-mono text-sm font-semibold">{formatSpecValue(k, v)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function MoldDetailWorkspace({ moldId }: { moldId: string }) {
  const router = useRouter();
  const { can } = useFactoryAuth();
  const canManage = can("molds.manage");

  const [mold, setMold] = useState<MoldDetailJson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await moldsApi.show(moldId);
      setMold(res.data);
      setError(null);
    } catch (e) {
      setError(e instanceof MoldsApiError ? e.message : "تعذر تحميل القالب");
    } finally {
      setLoading(false);
    }
  }, [moldId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onDelete = async () => {
    if (!window.confirm("حذف هذا القالب؟")) return;
    try {
      await moldsApi.remove(moldId);
      router.push("/ar/molds/registry" as Route);
    } catch (e) {
      setError(e instanceof MoldsApiError ? e.message : "فشل الحذف");
    }
  };

  if (loading) {
    return <div className="h-48 animate-pulse rounded-2xl bg-muted/20" />;
  }

  if (error || !mold) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-destructive">{error ?? "القالب غير موجود"}</p>
          <Button className="mt-4" variant="outline" asChild>
            <Link href={"/ar/molds/registry" as Route}>العودة للسجل</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const lifePct =
    mold.expectedLifeCycles && mold.expectedLifeCycles > 0
      ? Math.min(100, Math.round((mold.totalCycles / mold.expectedLifeCycles) * 100))
      : null;

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "نظرة عامة" },
    { id: "specs", label: "المواصفات" },
    { id: "gallery", label: "الصور" },
    { id: "maintenance", label: "الصيانة" },
    { id: "installations", label: "التركيب" }
  ];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-rose-300/20 bg-gradient-to-br from-rose-900 via-[#5c1a2e] to-[#2a0810] p-6 shadow-lg shadow-rose-950/30">
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-4">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-rose-200/25 bg-rose-950/35">
              {mold.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mold.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <Layers className="h-7 w-7 text-rose-100" />
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-rose-200/60">جواز القالب</p>
              <h1 className="font-mono text-2xl font-bold text-rose-50 md:text-3xl">
                {mold.moldCode}
                <span className="mx-2 font-normal text-rose-200/40">|</span>
                <span className="font-sans text-xl md:text-2xl">{mold.moldName}</span>
              </h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant={moldStatusBadgeVariant(mold.status)}>{moldStatusLabels[mold.status]}</Badge>
                <Badge variant={mold.moldType === "polyethylene" ? "warning" : "outline"}>
                  {mold.moldType === "polyethylene" ? `PE · ${moldTypeShortLabels.polyethylene}` : moldTypeLabels[mold.moldType]}
                </Badge>
                {!mold.isActive && <Badge variant="secondary">معطّل</Badge>}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="border-rose-200/30 bg-rose-950/30 text-rose-50" asChild>
              <Link href={"/ar/molds/registry" as Route}>السجل</Link>
            </Button>
            {canManage && (
              <>
                <Button size="sm" className="bg-rose-100/95 text-rose-950 hover:bg-white" asChild>
                  <Link href={`/ar/molds/${moldId}/edit` as Route}>
                    <Pencil className="ms-2 h-4 w-4" />
                    تعديل
                  </Link>
                </Button>
                <Button size="sm" variant="destructive" onClick={() => void onDelete()}>
                  <Trash2 className="ms-2 h-4 w-4" />
                  حذف
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 bg-card/30">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">التجاويف</p>
            <p className="text-xl font-semibold">{mold.cavityCount}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/30">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">إجمالي الدورات</p>
            <p className="text-xl font-semibold tabular-nums">{mold.totalCycles.toLocaleString("ar")}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/30">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">الماكينة الحالية</p>
            <p className="text-sm font-semibold">{mold.machineCode ?? "—"}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/30">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">عمر القالب</p>
            <p className="text-xl font-semibold">{lifePct !== null ? `${lifePct}%` : "—"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border/50 pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              tab === t.id ? "bg-primary/15 font-medium text-primary" : "text-muted-foreground hover:bg-muted/30"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <Card className="border-border/60 bg-card/20">
          <CardHeader>
            <CardTitle className="text-base">البيانات العامة</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="المنتج" value={mold.productName ?? "—"} />
            <InfoRow label="نوع المادة" value={mold.materialType ?? "—"} />
            <InfoRow label="الموقع" value={mold.currentLocation ?? "—"} />
            <InfoRow label="الشركة المصنعة" value={mold.manufacturer ?? "—"} />
            <InfoRow label="بلد الصنع" value={mold.manufacturingCountry ?? "—"} />
            <InfoRow label="تاريخ الشراء" value={mold.purchaseDate ?? "—"} />
            <InfoRow label="الصيانة القادمة" value={mold.nextMaintenanceDate ?? "—"} />
            <InfoRow label="ملاحظات" value={mold.notes ?? "—"} />
          </CardContent>
        </Card>
      )}

      {tab === "specs" && <SpecGrid spec={mold.spec as Record<string, unknown> | null} moldType={mold.moldType} />}

      {tab === "gallery" && (
        <MoldImageUploader moldId={moldId} images={mold.images} onChange={load} canManage={canManage} />
      )}

      {tab === "maintenance" && (
        <div className="space-y-2">
          {mold.maintenanceLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا سجلات صيانة.</p>
          ) : (
            mold.maintenanceLogs.map((log) => (
              <Card key={log.id} className="border-border/50 bg-card/20">
                <CardContent className="flex flex-wrap items-start justify-between gap-2 py-3">
                  <div>
                    <p className="font-medium">{log.maintenanceType}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.maintenanceDate} · {log.technician ?? "—"}
                    </p>
                    {log.description && <p className="mt-1 text-sm text-muted-foreground">{log.description}</p>}
                  </div>
                  {log.cost !== null && (
                    <span className="text-sm font-mono">{log.cost.toLocaleString("ar")} ر.س</span>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === "installations" && (
        <div className="space-y-2">
          {mold.installations.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا سجل تركيب.</p>
          ) : (
            mold.installations.map((inst) => (
              <Card key={inst.id} className="border-border/50 bg-card/20">
                <CardContent className="py-3">
                  <p className="font-medium">
                    {inst.machineCode} — {inst.machineName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {inst.installedAt?.slice(0, 10)}
                    {inst.removedAt ? ` → ${inst.removedAt.slice(0, 10)}` : " · نشط"}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
