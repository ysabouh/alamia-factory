"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { WfmField, WfmInput } from "@/components/workforce/atlas";
import { useFactoryAuth } from "@/contexts/factory-auth-context";
import {
  machinesApi,
  MachinesApiError,
  type MachineCounterJson
} from "@/lib/api/machines-client";

export function MachineCountersPanel({ machineId }: { machineId: string }) {
  const { can } = useFactoryAuth();
  const canRecord = can("machines.record_counters");

  const [rows, setRows] = useState<MachineCounterJson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    counterDate: new Date().toISOString().slice(0, 10),
    producedUnits: "",
    rejectedUnits: "0",
    runningHours: "0"
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await machinesApi.listCounters(machineId);
      setRows(res.data);
      setError(null);
    } catch (e) {
      setError(e instanceof MachinesApiError ? e.message : "تعذر تحميل العدادات");
    } finally {
      setLoading(false);
    }
  }, [machineId]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setBusy(true);
    try {
      await machinesApi.upsertCounter(machineId, {
        counterDate: form.counterDate,
        producedUnits: Number(form.producedUnits) || 0,
        rejectedUnits: Number(form.rejectedUnits) || 0,
        runningHours: Number(form.runningHours) || 0
      });
      await load();
    } catch (e) {
      setError(e instanceof MachinesApiError ? e.message : "فشل الحفظ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {canRecord && (
        <Card className="border-border/60 bg-card/30">
          <CardHeader>
            <CardTitle className="text-base">تسجيل عداد يومي</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <WfmField label="التاريخ">
              <WfmInput
                type="date"
                value={form.counterDate}
                onChange={(e) => setForm((f) => ({ ...f, counterDate: e.target.value }))}
              />
            </WfmField>
            <WfmField label="منتج">
              <WfmInput
                type="number"
                value={form.producedUnits}
                onChange={(e) => setForm((f) => ({ ...f, producedUnits: e.target.value }))}
              />
            </WfmField>
            <WfmField label="مرفوض">
              <WfmInput
                type="number"
                value={form.rejectedUnits}
                onChange={(e) => setForm((f) => ({ ...f, rejectedUnits: e.target.value }))}
              />
            </WfmField>
            <WfmField label="ساعات تشغيل">
              <WfmInput
                type="number"
                step="0.1"
                value={form.runningHours}
                onChange={(e) => setForm((f) => ({ ...f, runningHours: e.target.value }))}
              />
            </WfmField>
            <div className="flex items-end">
              <Button disabled={busy} onClick={() => void save()}>
                حفظ
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>التاريخ</TableHead>
            <TableHead>منتج</TableHead>
            <TableHead>مرفوض</TableHead>
            <TableHead>ساعات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                جاري التحميل…
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                لا سجلات
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.counterDate}</TableCell>
                <TableCell>{r.producedUnits}</TableCell>
                <TableCell>{r.rejectedUnits}</TableCell>
                <TableCell>{r.runningHours}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
