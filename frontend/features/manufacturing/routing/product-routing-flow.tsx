"use client";

import { ArrowDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProductRoutingJson } from "@/lib/api/routing-client";

import { flowStepLabel, operationTypeBadgeColor } from "./routing-ui";

export function ProductRoutingFlow({ routing }: { routing: ProductRoutingJson }) {
  if (!routing.flow.length) {
    return (
      <p className="text-sm text-muted-foreground">
        لا يوجد مسار إنتاج — أضف عمليات تصنيع أو مكوّنات BOM.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 py-2">
      {routing.flow.map((step, idx) => (
        <div key={`${step.kind}-${idx}`} className="flex w-full max-w-md flex-col items-center gap-2">
          <Card className="w-full border-border/60 bg-card/40">
            <CardContent className="flex flex-col gap-2 p-4">
              {step.kind === "materials" ? (
                <>
                  <p className="text-sm font-medium">{step.label}</p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {step.items.map((item) => (
                      <li key={item.productId} className="flex justify-between gap-2">
                        <span>{item.productCode} — {item.productName}</span>
                        <span>{item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{step.label}</p>
                    <Badge className={operationTypeBadgeColor(step.operationType)}>
                      {flowStepLabel(step)}
                    </Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          {idx < routing.flow.length - 1 && (
            <ArrowDown className="h-5 w-5 text-muted-foreground" aria-hidden />
          )}
        </div>
      ))}
    </div>
  );
}

export function ProductRoutingSummaryCards({ routing }: { routing: ProductRoutingJson }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">العمليات</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{routing.operationCount}</p>
        </CardContent>
      </Card>
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">مكوّنات BOM</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{routing.bomComponentCount}</p>
        </CardContent>
      </Card>
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">الماكينات</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{routing.assignedMachines.length}</p>
        </CardContent>
      </Card>
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">القوالب</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{routing.assignedMolds.length}</p>
        </CardContent>
      </Card>
    </div>
  );
}
