"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Package } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { assemblyApi, AssemblyApiError, type AssemblyDashboardJson } from "@/lib/api/assembly-client";

export function AssemblyDashboardWorkspace() {
  const [stats, setStats] = useState<AssemblyDashboardJson | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await assemblyApi.dashboard();
        setStats(res.data);
      } catch (e) {
        setError(e instanceof AssemblyApiError ? e.message : "تعذر التحميل");
      }
    })();
  }, []);

  if (error) return <p className="text-destructive">{error}</p>;
  if (!stats) return <p className="text-muted-foreground">جاري التحميل…</p>;

  const tiles = [
    { label: "أوامر نشطة", value: stats.activeOrders, icon: Activity },
    { label: "مكتمل اليوم", value: stats.completedToday, icon: CheckCircle2 },
    { label: "تقدم الإنتاج %", value: stats.progressPercent, icon: Package },
    { label: "نقص مواد", value: stats.ordersWithShortages, icon: AlertTriangle }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">لوحة التجميع</h1>
        <p className="text-sm text-muted-foreground">Assembly Dashboard — MES</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <Card key={t.label} className="border-border/60">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{t.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Throughput</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{stats.throughputUnits} وحدة</p>
          <p className="text-sm text-muted-foreground">إجمالي الوحدات المجمّعة في الأوامر الجارية</p>
        </CardContent>
      </Card>
    </div>
  );
}
