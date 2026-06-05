"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { AlertTriangle, Layers, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { moldTypeLabels } from "@/features/molds/management/mold-status-ui";
import { moldsApi, MoldsApiError, type MoldStatsJson } from "@/lib/api/molds-client";

export function MoldStatsPanel({ compact }: { compact?: boolean }) {
  const [stats, setStats] = useState<MoldStatsJson | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void moldsApi
      .stats()
      .then((r) => setStats(r.data))
      .catch((e) => setError(e instanceof MoldsApiError ? e.message : "تعذر تحميل إحصائيات القوالب"));
  }, []);

  if (error) return null;
  if (!stats) {
    return (
      <div className={compact ? "h-20 animate-pulse rounded-xl bg-muted/20" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-4"}>
        {!compact && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/20" />
        ))}
      </div>
    );
  }

  if (compact) {
    return (
      <Card className="border-border/60 bg-card/30">
        <CardContent className="flex flex-wrap items-center gap-4 py-4">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{stats.total} قالب</span>
          </div>
          <Badge variant="warning">PE: {stats.byType.polyethylene}</Badge>
          {stats.maintenanceDue > 0 && (
            <Badge variant="destructive">
              <Wrench className="ms-1 h-3 w-3" />
              صيانة مستحقة: {stats.maintenanceDue}
            </Badge>
          )}
          <Link href={"/ar/molds/registry" as Route} className="text-xs text-primary hover:underline">
            سجل القوالب
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="إجمالي القوالب" value={stats.total.toLocaleString("ar")} />
        {(Object.keys(stats.byType) as Array<keyof typeof stats.byType>).map((t) => (
          <StatCard
            key={t}
            label={moldTypeLabels[t]}
            value={stats.byType[t].toLocaleString("ar")}
            highlight={t === "polyethylene"}
          />
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="border-border/60 bg-card/25">
          <CardContent className="pt-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              الصيانة
            </p>
            <p className="text-xs text-muted-foreground">مستحقة: {stats.maintenanceDue}</p>
            <p className="text-xs text-muted-foreground">سجلات 30 يوم: {stats.maintenanceLogsLast30Days}</p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="pt-4">
            <p className="mb-2 text-sm font-medium">PE — حسب المادة</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">HDPE: {stats.polyethylene.byMaterial.hdpe}</Badge>
              <Badge variant="outline">LDPE: {stats.polyethylene.byMaterial.ldpe}</Badge>
              <Badge variant="outline">LLDPE: {stats.polyethylene.byMaterial.lldpe}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="pt-4">
            <p className="mb-2 text-sm font-medium">PE — طريقة الإنتاج</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="secondary">نفخ: {stats.polyethylene.byProductionMethod.blow}</Badge>
              <Badge variant="secondary">دوراني: {stats.polyethylene.byProductionMethod.rotational}</Badge>
              <Badge variant="secondary">بثق: {stats.polyethylene.byProductionMethod.extrusion}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-amber-500/30 bg-amber-500/5" : "border-border/60 bg-card/30"}>
      <CardContent className="pt-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
