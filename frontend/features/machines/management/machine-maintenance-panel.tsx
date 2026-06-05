"use client";

import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  machinesApi,
  MachinesApiError,
  type MaintenanceActionJson,
  type PreventiveLogJson
} from "@/lib/api/machines-client";

export function MachineMaintenancePanel({ machineId }: { machineId: string }) {
  const [actions, setActions] = useState<MaintenanceActionJson[]>([]);
  const [logs, setLogs] = useState<PreventiveLogJson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, p] = await Promise.all([
        machinesApi.listActions(machineId),
        machinesApi.listPreventiveLogs(machineId)
      ]);
      setActions(a.data);
      setLogs(p.data);
      setError(null);
    } catch (e) {
      setError(e instanceof MachinesApiError ? e.message : "تعذر تحميل الصيانة");
    } finally {
      setLoading(false);
    }
  }, [machineId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">جاري التحميل…</p>;
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card className="border-border/60 bg-card/30">
        <CardHeader>
          <CardTitle className="text-base">إجراءات الصيانة</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>النوع</TableHead>
                <TableHead>الإجراء</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>الفني</TableHead>
                <TableHead>التكلفة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    لا إجراءات
                  </TableCell>
                </TableRow>
              ) : (
                actions.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <Badge variant="outline">{a.maintenanceType}</Badge>
                    </TableCell>
                    <TableCell>{a.actionTaken}</TableCell>
                    <TableCell>{a.maintenanceDate ?? "—"}</TableCell>
                    <TableCell>{a.technicianName ?? "—"}</TableCell>
                    <TableCell>{a.cost != null ? a.cost.toLocaleString("ar") : "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/30">
        <CardHeader>
          <CardTitle className="text-base">صيانة وقائية (مجدولة)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الخطة</TableHead>
                <TableHead>تاريخ التنفيذ</TableHead>
                <TableHead>الفني</TableHead>
                <TableHead>ملاحظات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    لا سجلات وقائية
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>{l.planName ?? "—"}</TableCell>
                    <TableCell>{l.performedAt?.slice(0, 10) ?? "—"}</TableCell>
                    <TableCell>{l.technicianName ?? "—"}</TableCell>
                    <TableCell>{l.notes ?? "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
