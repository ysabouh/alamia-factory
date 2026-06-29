"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Pencil, Save, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WfmField, WfmInput, WfmSelect } from "@/components/workforce/atlas";
import { useFactoryAuth } from "@/contexts/factory-auth-context";
import { workforceApi } from "@/lib/api/workforce-client";
import { QualityPhotoUploader } from "@/features/production/quality-photo-uploader";
import {
  booleanOptions,
  checklistItemTypeLabels,
  formatMeasuredDisplay,
  InspectionResultBadge,
  InspectionStatusBadge,
  inspectionStatusLabels,
  QualityOptionPills,
  resultStatusOptions,
  selectionOptionsFromList
} from "@/features/production/quality-inspection-ui";
import {
  productionApi,
  ProductionApiError,
  type QualityChecklistItemJson,
  type QualityInspectionJson,
  type WorkOrderDetailJson
} from "@/lib/api/production-client";

type InspectionMode = "create" | "view" | "edit";

type Props = {
  orderId: string;
  inspectionId?: string;
  mode?: InspectionMode;
};

type ResultDraft = {
  checklistItemId: string;
  measuredValue: string;
  resultStatus: "pass" | "fail" | "warning";
};

function measuredToString(value: string | number | boolean | null | undefined) {
  if (value === true) return "true";
  if (value === false) return "false";
  if (value == null) return "";
  return String(value);
}

export function QualityInspectionWorkspace({ orderId, inspectionId, mode = inspectionId ? "view" : "create" }: Props) {
  const router = useRouter();
  const { can, user } = useFactoryAuth();
  const canInspect = can("quality.inspect");

  const [order, setOrder] = useState<WorkOrderDetailJson | null>(null);
  const [checklistItems, setChecklistItems] = useState<QualityChecklistItemJson[]>([]);
  const [inspection, setInspection] = useState<QualityInspectionJson | null>(null);
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qualityEmployeeId, setQualityEmployeeId] = useState("");
  const [isFinal, setIsFinal] = useState(false);
  const [sampleSize, setSampleSize] = useState("5");
  const [notes, setNotes] = useState("");
  const [results, setResults] = useState<ResultDraft[]>([]);

  const readOnly = mode === "view";
  const isEditForm = mode === "edit";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [orderRes, empRes] = await Promise.all([
        productionApi.showOrder(orderId),
        workforceApi.listEmployees({ pageSize: 200, isActive: true })
      ]);
      setOrder(orderRes.data);
      setEmployees(
        (empRes.data as Array<{ id?: string; fullName?: string; firstName?: string; lastName?: string }>)
          .map((e) => ({
            id: String(e.id ?? ""),
            name: e.fullName ?? ([e.firstName, e.lastName].filter(Boolean).join(" ") || String(e.id ?? ""))
          }))
          .filter((e) => e.id)
      );

      const checklistRes = await productionApi.listChecklists(orderRes.data.productId);
      const active = checklistRes.data.find((c) => c.isActive) ?? checklistRes.data[0];
      const items = active?.items ?? [];
      setChecklistItems(items);

      let existing: QualityInspectionJson | null = null;
      if (inspectionId) {
        const inspRes = await productionApi.showInspection(inspectionId);
        existing = inspRes.data;
        setInspection(existing);
        setQualityEmployeeId(existing.qualityEmployeeId ?? "");
        setIsFinal(existing.isFinal);
        setSampleSize(existing.sampleSize != null ? String(existing.sampleSize) : "5");
        setNotes(existing.notes ?? "");
        setResults(
          items.map((item) => {
            const row = existing?.results.find((r) => r.checklistItemId === item.id);
            return {
              checklistItemId: item.id,
              measuredValue: row
                ? measuredToString(row.measuredValue)
                : item.itemType === "boolean"
                  ? "true"
                  : "",
              resultStatus: row?.resultStatus ?? "pass"
            };
          })
        );
      } else {
        setInspection(null);
        setQualityEmployeeId(user?.employeeId ?? orderRes.data.supervisorId ?? "");
        setIsFinal(false);
        setSampleSize("5");
        setNotes("");
        setResults(
          items.map((item) => ({
            checklistItemId: item.id,
            measuredValue: item.itemType === "boolean" ? "true" : "",
            resultStatus: "pass" as const
          }))
        );
      }

      setError(null);
    } catch (e) {
      setError(e instanceof ProductionApiError ? e.message : "تعذر التحميل");
    } finally {
      setLoading(false);
    }
  }, [inspectionId, orderId, user?.employeeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const evaluateNumeric = useCallback((item: QualityChecklistItemJson, value: string): "pass" | "fail" | "warning" => {
    const num = Number(value);
    if (Number.isNaN(num)) return item.isCritical ? "fail" : "warning";
    if (item.minValue != null && num < item.minValue) return item.isCritical ? "fail" : "warning";
    if (item.maxValue != null && num > item.maxValue) return item.isCritical ? "fail" : "warning";
    return "pass";
  }, []);

  const updateResult = (itemId: string, patch: Partial<ResultDraft>) => {
    setResults((prev) =>
      prev.map((r) => {
        if (r.checklistItemId !== itemId) return r;
        const next = { ...r, ...patch };
        const item = checklistItems.find((i) => i.id === itemId);
        if (item?.itemType === "numeric" && patch.measuredValue !== undefined) {
          next.resultStatus = evaluateNumeric(item, patch.measuredValue);
        }
        if (item?.itemType === "boolean" && patch.measuredValue !== undefined) {
          next.resultStatus = patch.measuredValue === "true" ? "pass" : "fail";
        }
        return next;
      })
    );
  };

  const predictedStatus = useMemo(() => {
    const hasCriticalFail = results.some((r) => {
      const item = checklistItems.find((i) => i.id === r.checklistItemId);
      return item?.isCritical && r.resultStatus === "fail";
    });
    if (hasCriticalFail) return "failed";
    const hasFail = results.some((r) => r.resultStatus === "fail");
    const hasWarn = results.some((r) => r.resultStatus === "warning");
    if (hasFail) return "failed";
    if (hasWarn) return "warning";
    return "passed";
  }, [checklistItems, results]);

  const inspectorName = useMemo(() => {
    if (inspection?.qualityEmployeeName) return inspection.qualityEmployeeName;
    return employees.find((e) => e.id === qualityEmployeeId)?.name ?? null;
  }, [employees, inspection?.qualityEmployeeName, qualityEmployeeId]);

  const buildPayload = () => ({
    qualityEmployeeId: qualityEmployeeId || undefined,
    sampleSize: Number(sampleSize) || 0,
    notes: notes || undefined,
    isFinal,
    results: results.map((r) => ({
      checklistItemId: r.checklistItemId,
      measuredValue: r.measuredValue === "true" ? true : r.measuredValue === "false" ? false : r.measuredValue,
      resultStatus: r.resultStatus
    }))
  });

  const submit = async () => {
    if (!order || !canInspect) return;
    setBusy(true);
    setError(null);
    try {
      if (isEditForm && inspectionId) {
        await productionApi.updateInspection(inspectionId, buildPayload());
        router.push(`/ar/production/orders/${orderId}/inspect/${inspectionId}`);
      } else {
        const res = await productionApi.createInspection(orderId, buildPayload());
        router.push(`/ar/production/orders/${orderId}/inspect/${res.data.id}`);
      }
    } catch (e) {
      setError(e instanceof ProductionApiError ? e.message : "فشل حفظ الفحص");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="text-muted-foreground">جاري التحميل…</p>;
  if (!order) return <p className="text-destructive">الأمر غير موجود</p>;

  return (
    <div className="space-y-6">
      <Link
        href={`/ar/production/orders/${orderId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowRight className="h-4 w-4 translate-y-0.5" />
        العودة إلى أمر الإنتاج
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">
            {readOnly ? "عرض فحص جودة" : isEditForm ? "تعديل فحص جودة" : "فحص جودة جديد"}
          </p>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <ShieldCheck className="h-6 w-6 text-sky-600" />
            {order.orderNo}
          </h1>
          <p className="text-sm text-muted-foreground">
            {order.productCode} — {order.productName}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {inspection ? <InspectionStatusBadge status={inspection.status} /> : null}
          {readOnly && canInspect && inspectionId ? (
            <Button size="sm" variant="outline" className="gap-1.5" asChild>
              <Link href={`/ar/production/orders/${orderId}/inspect/${inspectionId}/edit`}>
                <Pencil className="h-4 w-4 translate-y-0.5" />
                تعديل
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      {error ? <p className="text-destructive">{error}</p> : null}

      {!checklistItems.length ? (
        <Card className="border-dashed">
          <CardContent className="p-6 text-sm text-muted-foreground">
            لا يوجد قالب فحص لهذا المنتج.{" "}
            <Link href={`/ar/products/${order.productId}/quality-checklist`} className="text-primary underline">
              إنشاء قالب
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {readOnly && inspectionId ? (
            <Link
              href={`/ar/production/orders/${orderId}?tab=quality`}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowRight className="h-4 w-4 translate-y-0.5" />
              العودة إلى فحوصات الجودة
            </Link>
          ) : null}
          <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">
              {readOnly ? "نتائج الفحص" : isEditForm ? "تعديل نتائج الفحص" : "قائمة الفحص"}
            </CardTitle>
            {!readOnly ? (
              <p className="text-xs text-muted-foreground">
                الحالة المتوقعة: <strong>{inspectionStatusLabels[predictedStatus]}</strong>
              </p>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">
            {readOnly ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">المفتش</p>
                  <p className="font-medium">{inspectorName || "—"}</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">حجم العينة</p>
                  <p className="font-medium tabular-nums">{sampleSize || "—"}</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">ملاحظات</p>
                  <p className="font-medium">{notes || "—"}</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">فحص نهائي</p>
                  <p className="font-medium">{isFinal ? "نعم" : "لا"}</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <WfmField label="المفتش">
                  <WfmSelect
                    value={qualityEmployeeId}
                    disabled={!canInspect || busy}
                    onChange={(e) => setQualityEmployeeId(e.target.value)}
                  >
                    <option value="">— اختر المفتش —</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </WfmSelect>
                </WfmField>
                <WfmField label="حجم العينة">
                  <WfmInput
                    type="number"
                    min={0}
                    value={sampleSize}
                    disabled={!canInspect || busy}
                    onChange={(e) => setSampleSize(e.target.value)}
                  />
                </WfmField>
                <WfmField label="ملاحظات">
                  <WfmInput value={notes} disabled={!canInspect || busy} onChange={(e) => setNotes(e.target.value)} />
                </WfmField>
                <label className="flex items-center gap-2 self-end rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isFinal}
                    disabled={!canInspect || busy}
                    onChange={(e) => setIsFinal(e.target.checked)}
                  />
                  فحص نهائي (لإغلاق الأمر)
                </label>
              </div>
            )}

            <div className="overflow-hidden rounded-lg border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>العنصر</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>المدى</TableHead>
                    <TableHead>القيمة المقاسة</TableHead>
                    <TableHead>النتيجة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checklistItems.map((item, idx) => {
                    const draft = results.find((r) => r.checklistItemId === item.id);
                    const range =
                      item.itemType === "numeric" && item.minValue != null && item.maxValue != null
                        ? `${item.minValue} – ${item.maxValue}${item.unit ? ` ${item.unit}` : ""}`
                        : item.itemType === "selection" && item.selectionOptions?.length
                          ? item.selectionOptions.join("، ")
                          : "—";

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="text-center text-sm text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.itemName}</span>
                            {item.isCritical ? <Badge variant="destructive">حرج</Badge> : null}
                          </div>
                        </TableCell>
                        <TableCell>{checklistItemTypeLabels[item.itemType] ?? item.itemType}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{range}</TableCell>
                        <TableCell>
                          {readOnly ? (
                            <span className="font-medium">
                              {formatMeasuredDisplay(draft?.measuredValue, item.itemType)}
                            </span>
                          ) : item.itemType === "numeric" ? (
                            <WfmInput
                              type="number"
                              value={draft?.measuredValue ?? ""}
                              disabled={!canInspect || busy}
                              onChange={(e) => updateResult(item.id, { measuredValue: e.target.value })}
                            />
                          ) : item.itemType === "boolean" ? (
                            <QualityOptionPills
                              options={booleanOptions}
                              value={draft?.measuredValue ?? "true"}
                              disabled={!canInspect || busy}
                              onChange={(v) => updateResult(item.id, { measuredValue: v })}
                            />
                          ) : item.itemType === "selection" && item.selectionOptions?.length ? (
                            <QualityOptionPills
                              options={selectionOptionsFromList(item.selectionOptions)}
                              value={draft?.measuredValue ?? ""}
                              disabled={!canInspect || busy}
                              onChange={(v) => updateResult(item.id, { measuredValue: v })}
                            />
                          ) : (
                            <WfmInput
                              value={draft?.measuredValue ?? ""}
                              disabled={!canInspect || busy}
                              onChange={(e) => updateResult(item.id, { measuredValue: e.target.value })}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {readOnly || (item.itemType !== "text" && item.itemType !== "selection") ? (
                            draft ? <InspectionResultBadge status={draft.resultStatus} /> : null
                          ) : (
                            <QualityOptionPills
                              options={resultStatusOptions}
                              value={draft?.resultStatus ?? "pass"}
                              disabled={!canInspect || busy}
                              onChange={(v) =>
                                updateResult(item.id, { resultStatus: v as ResultDraft["resultStatus"] })
                              }
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {!readOnly && canInspect ? (
              <Button type="button" className="gap-1.5" disabled={busy} onClick={() => void submit()}>
                <Save className="h-4 w-4 translate-y-0.5" />
                {isEditForm ? "حفظ التعديلات" : "حفظ الفحص"}
              </Button>
            ) : null}

            {inspection ? (
              <QualityPhotoUploader
                inspectionId={inspection.id}
                photos={inspection.photos}
                disabled={!canInspect}
                onChange={(photos) => setInspection({ ...inspection, photos })}
              />
            ) : null}
          </CardContent>
        </Card>
        </div>
      )}
    </div>
  );
}
