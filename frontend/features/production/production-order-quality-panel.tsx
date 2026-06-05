"use client";

import Link from "next/link";
import { ClipboardCheck, Eye, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  formatInspectionDatetime,
  InspectionStatusBadge,
  QualityPanelIcon
} from "@/features/production/quality-inspection-ui";
import type { QualityInspectionJson } from "@/lib/api/production-client";

type Props = {
  orderId: string;
  inspections: QualityInspectionJson[];
  canInspect: boolean;
};

export function ProductionOrderQualityPanel({ orderId, inspections, canInspect }: Props) {
  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <QualityPanelIcon />
          فحوصات الجودة ({inspections.length.toLocaleString("ar")})
        </CardTitle>
        {canInspect ? (
          <Button size="sm" variant="outline" className="gap-1.5" asChild>
            <Link href={`/ar/production/orders/${orderId}/inspect`}>
              <ClipboardCheck className="h-4 w-4 translate-y-0.5" />
              فحص جديد
            </Link>
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="p-0 sm:p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>وقت الفحص</TableHead>
                <TableHead>المفتش</TableHead>
                <TableHead>العينة</TableHead>
                <TableHead>النتيجة</TableHead>
                <TableHead>نهائي</TableHead>
                <TableHead className="w-28 text-center">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inspections.length ? (
                inspections.map((insp, index) => (
                  <TableRow key={insp.id}>
                    <TableCell className="text-center">
                      <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-muted px-2 text-xs font-semibold tabular-nums">
                        {(inspections.length - index).toLocaleString("ar")}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatInspectionDatetime(insp.inspectionTime ?? insp.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm">{insp.qualityEmployeeName ?? "—"}</TableCell>
                    <TableCell className="tabular-nums text-sm">
                      {insp.sampleSize != null ? insp.sampleSize.toLocaleString("ar") : "—"}
                    </TableCell>
                    <TableCell>
                      <InspectionStatusBadge status={insp.status} />
                    </TableCell>
                    <TableCell>
                      {insp.isFinal ? (
                        <Badge variant="info">نهائي</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="عرض الفحص">
                          <Link href={`/ar/production/orders/${orderId}/inspect/${insp.id}`}>
                            <Eye className="h-4 w-4 text-sky-600" />
                          </Link>
                        </Button>
                        {canInspect ? (
                          <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="تعديل الفحص">
                            <Link href={`/ar/production/orders/${orderId}/inspect/${insp.id}/edit`}>
                              <Pencil className="h-4 w-4 text-amber-600" />
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    لا توجد فحوصات.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
