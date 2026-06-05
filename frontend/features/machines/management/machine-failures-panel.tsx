"use client";

import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
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
  type MaintenanceTicketJson
} from "@/lib/api/machines-client";

export function MachineFailuresPanel({ machineId }: { machineId: string }) {
  const { can } = useFactoryAuth();
  const canManage = can("machines.manage_maintenance");

  const [rows, setRows] = useState<MaintenanceTicketJson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await machinesApi.listTickets(machineId, { kind: "breakdown" });
      setRows(res.data);
      setError(null);
    } catch (e) {
      setError(e instanceof MachinesApiError ? e.message : "تعذر تحميل الأعطال");
    } finally {
      setLoading(false);
    }
  }, [machineId]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try {
      await machinesApi.createTicket(machineId, {
        ticketKind: "breakdown",
        title: title.trim(),
        description: description.trim() || undefined
      });
      setTitle("");
      setDescription("");
      await load();
    } catch (e) {
      setError(e instanceof MachinesApiError ? e.message : "فشل التسجيل");
    } finally {
      setBusy(false);
    }
  };

  const resolve = async (ticketId: string) => {
    setBusy(true);
    try {
      await machinesApi.updateTicket(machineId, ticketId, { status: "resolved" });
      await load();
    } catch (e) {
      setError(e instanceof MachinesApiError ? e.message : "فشل التحديث");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {canManage && (
        <Card className="border-border/60 bg-card/30">
          <CardHeader>
            <CardTitle className="text-base">تسجيل عطل</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <WfmField label="العنوان">
              <WfmInput value={title} onChange={(e) => setTitle(e.target.value)} />
            </WfmField>
            <WfmField label="الوصف" className="sm:col-span-2">
              <WfmInput value={description} onChange={(e) => setDescription(e.target.value)} />
            </WfmField>
            <Button disabled={busy} onClick={() => void create()}>
              فتح بلاغ عطل
            </Button>
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>العنوان</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>التاريخ</TableHead>
            <TableHead />
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
                لا أعطال مسجّلة
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.title}</TableCell>
                <TableCell>
                  <Badge variant="outline">{r.status}</Badge>
                </TableCell>
                <TableCell>{r.failureDate ?? r.createdAt?.slice(0, 10) ?? "—"}</TableCell>
                <TableCell>
                  {canManage && r.status !== "resolved" && (
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => void resolve(r.id)}>
                      إغلاق
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
