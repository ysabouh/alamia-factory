"use client";

import { useMemo, useState } from "react";
import { Clock, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WfmInput } from "@/components/workforce/atlas";
import {
  formatLogDatetime,
  formatProductionLogDuration,
  nowDatetimeLocal,
  todayStartDatetimeLocal
} from "@/features/production/production-log-duration";
import { productionLogSchema } from "@/features/production/schemas/production-log-schema";
import { productionApi, ProductionApiError, type ProductionLogJson } from "@/lib/api/production-client";
import { cn } from "@/lib/utils";

type Props = {
  orderId: string;
  logs: ProductionLogJson[];
  canExecute: boolean;
  onChanged: () => Promise<void>;
  onError?: (message: string | null) => void;
};

export function ProductionOrderLogsPanel({ orderId, logs, canExecute, onChanged, onError }: Props) {
  const [busy, setBusy] = useState(false);
  const [fromTime, setFromTime] = useState(todayStartDatetimeLocal);
  const [toTime, setToTime] = useState(nowDatetimeLocal);
  const [goodQty, setGoodQty] = useState("0");
  const [scrapQty, setScrapQty] = useState("0");
  const [logNotes, setLogNotes] = useState("");

  const elapsedDuration = useMemo(() => formatProductionLogDuration(fromTime, toTime), [fromTime, toTime]);
  const elapsedValid = elapsedDuration !== "—";

  const submitLog = async () => {
    const parsed = productionLogSchema.safeParse({
      fromTime,
      toTime,
      goodQuantity: goodQty,
      scrapQuantity: scrapQty,
      notes: logNotes
    });
    if (!parsed.success) {
      onError?.(parsed.error.issues[0]?.message ?? "بيانات السجل غير صالحة");
      return;
    }
    setBusy(true);
    onError?.(null);
    try {
      await productionApi.createLog(orderId, {
        fromTime: parsed.data.fromTime,
        toTime: parsed.data.toTime,
        goodQuantity: parsed.data.goodQuantity,
        scrapQuantity: parsed.data.scrapQuantity ? Number(parsed.data.scrapQuantity) : 0,
        notes: parsed.data.notes || undefined
      });
      setFromTime(todayStartDatetimeLocal());
      setToTime(nowDatetimeLocal());
      setGoodQty("0");
      setScrapQty("0");
      setLogNotes("");
      await onChanged();
    } catch (e) {
      onError?.(e instanceof ProductionApiError ? e.message : "فشل تسجيل الإنتاج");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {canExecute ? (
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">تسجيل إنتاج (كل ساعتين)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>من</TableHead>
                    <TableHead>إلى</TableHead>
                    <TableHead>الزمن المنقضي</TableHead>
                    <TableHead>كمية جيدة</TableHead>
                    <TableHead>هدر</TableHead>
                    <TableHead>ملاحظات</TableHead>
                    <TableHead className="w-28" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="align-top text-center">
                      <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-dashed border-primary/40 bg-primary/5 px-2 text-xs font-semibold tabular-nums text-primary">
                        {(logs.length + 1).toLocaleString("ar")}
                      </span>
                    </TableCell>
                    <TableCell className="align-top">
                      <WfmInput
                        type="datetime-local"
                        value={fromTime}
                        disabled={busy}
                        onChange={(e) => setFromTime(e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <WfmInput
                        type="datetime-local"
                        value={toTime}
                        disabled={busy}
                        onChange={(e) => setToTime(e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <div
                        className={cn(
                          "flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium tabular-nums",
                          elapsedValid
                            ? "border-sky-200 bg-sky-50 text-sky-800"
                            : "border-border bg-muted/30 text-muted-foreground"
                        )}
                      >
                        <Clock className="h-4 w-4 shrink-0 translate-y-0.5" />
                        {elapsedDuration}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <WfmInput
                        type="number"
                        min={0}
                        value={goodQty}
                        disabled={busy}
                        onChange={(e) => setGoodQty(e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <WfmInput
                        type="number"
                        min={0}
                        value={scrapQty}
                        disabled={busy}
                        onChange={(e) => setScrapQty(e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <WfmInput value={logNotes} disabled={busy} onChange={(e) => setLogNotes(e.target.value)} />
                    </TableCell>
                    <TableCell className="align-top">
                      <Button
                        type="button"
                        size="sm"
                        className="gap-1.5"
                        disabled={busy || !elapsedValid}
                        onClick={() => void submitLog()}
                      >
                        <Plus className="h-4 w-4 translate-y-0.5" />
                        إضافة
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">سجلات الإنتاج ({logs.length.toLocaleString("ar")})</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>من</TableHead>
                    <TableHead>إلى</TableHead>
                    <TableHead>الزمن المنقضي</TableHead>
                    <TableHead>جيد</TableHead>
                    <TableHead>هدر</TableHead>
                    <TableHead>ملاحظات</TableHead>
                    <TableHead>تاريخ الإضافة</TableHead>
                    <TableHead>المسجّل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length ? (
                    logs.map((log, index) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-center">
                          <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-muted px-2 text-xs font-semibold tabular-nums text-muted-foreground">
                            {(logs.length - index).toLocaleString("ar")}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{formatLogDatetime(log.fromTime)}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{formatLogDatetime(log.toTime)}</TableCell>
                      <TableCell>
                        <Badge variant="info" className="gap-1 font-mono tabular-nums">
                          <Clock className="h-3 w-3" />
                          {formatProductionLogDuration(log.fromTime, log.toTime)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-emerald-700 tabular-nums">
                        {log.goodQuantity.toLocaleString("ar")}
                      </TableCell>
                      <TableCell className="font-medium text-amber-700 tabular-nums">
                        {log.scrapQuantity.toLocaleString("ar")}
                      </TableCell>
                      <TableCell className="max-w-[12rem] truncate text-sm text-muted-foreground">
                        {log.notes ?? "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatLogDatetime(log.createdAt)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {log.createdByName ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                      لا توجد سجلات.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
