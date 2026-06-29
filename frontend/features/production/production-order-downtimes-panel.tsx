"use client";

import { useEffect, useMemo, useRef, useState, Fragment } from "react";
import { Camera, ChevronDown, ChevronUp, Clock, ImageIcon, Pencil, PauseCircle, Plus, Save, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WfmField, WfmInput, WfmSelect } from "@/components/workforce/atlas";
import {
  DowntimePhotoUploader,
  uploadDowntimePhotos
} from "@/features/production/downtime-photo-uploader";
import { downtimeReasonLabel } from "@/features/production/downtime-reason-labels";
import {
  formatLogDatetime,
  formatProductionLogDuration,
  isoToDatetimeLocal,
  nowDatetimeLocal
} from "@/features/production/production-log-duration";
import { productionDowntimeSchema } from "@/features/production/schemas/production-downtime-schema";
import {
  productionApi,
  ProductionApiError,
  type DowntimeReasonJson,
  type MachineDowntimeJson,
  type MachineDowntimePhotoJson,
  type WorkOrderDetailJson
} from "@/lib/api/production-client";

type Props = {
  order: WorkOrderDetailJson;
  canExecute: boolean;
  onChanged: () => Promise<void>;
  onError?: (message: string | null) => void;
};

type PanelMode = "photos" | "edit" | "close";

type EditDraft = {
  reasonId: string;
  startTime: string;
  endTime: string;
  notes: string;
  faultDescription: string;
  repairMethod: string;
};

type CloseDraft = {
  endTime: string;
  faultDescription: string;
  repairMethod: string;
};

export function ProductionOrderDowntimesPanel({ order, canExecute, onChanged, onError }: Props) {
  const [busy, setBusy] = useState(false);
  const [reasons, setReasons] = useState<DowntimeReasonJson[]>([]);
  const [reasonId, setReasonId] = useState("");
  const [startTime, setStartTime] = useState(nowDatetimeLocal);
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([]);
  const [activePanel, setActivePanel] = useState<{ downtimeId: string; mode: PanelMode } | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [closeDraft, setCloseDraft] = useState<CloseDraft | null>(null);
  const [localPhotos, setLocalPhotos] = useState<Record<string, MachineDowntimePhotoJson[]>>({});
  const formPhotoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await productionApi.downtimeReasons();
        setReasons(res.data);
        setReasonId((prev) => prev || res.data[0]?.id || "");
      } catch {
        /* reasons optional for read-only */
      }
    })();
  }, []);

  useEffect(() => {
    const map: Record<string, MachineDowntimePhotoJson[]> = {};
    for (const d of order.downtimes) {
      map[d.id] = d.photos ?? [];
    }
    setLocalPhotos(map);
  }, [order.downtimes]);

  const openDowntime = useMemo(
    () => order.downtimes.find((d) => !d.endTime) ?? null,
    [order.downtimes]
  );

  const durationPreview = useMemo(
    () => (endTime ? formatProductionLogDuration(startTime, endTime) : "مفتوح"),
    [startTime, endTime]
  );

  const submitDowntime = async () => {
    const parsed = productionDowntimeSchema.safeParse({
      downtimeReasonId: reasonId,
      startTime,
      endTime: endTime || undefined,
      notes: notes || undefined
    });
    if (!parsed.success) {
      onError?.(parsed.error.issues[0]?.message ?? "بيانات التوقف غير صالحة");
      return;
    }
    if (!order.machineId) {
      onError?.("يجب ربط ماكينة بأمر الإنتاج قبل تسجيل التوقف.");
      return;
    }

    setBusy(true);
    onError?.(null);
    try {
      const res = await productionApi.createDowntime(order.id, {
        machineId: order.machineId,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        downtimeReasonId: parsed.data.downtimeReasonId,
        notes: parsed.data.notes
      });
      if (pendingPhotos.length) {
        await uploadDowntimePhotos(res.data.id, pendingPhotos);
      }
      const isOpenDowntime = !parsed.data.endTime;
      if (isOpenDowntime && order.status === "running") {
        await productionApi.pauseOrder(order.id);
      }
      setStartTime(nowDatetimeLocal());
      setEndTime("");
      setNotes("");
      setPendingPhotos([]);
      if (formPhotoInputRef.current) formPhotoInputRef.current.value = "";
      setActivePanel({ downtimeId: res.data.id, mode: "photos" });
      await onChanged();
    } catch (e) {
      onError?.(e instanceof ProductionApiError ? e.message : "فشل تسجيل التوقف");
    } finally {
      setBusy(false);
    }
  };

  const openPhotos = (downtimeId: string) => {
    setActivePanel((prev) =>
      prev?.downtimeId === downtimeId && prev.mode === "photos" ? null : { downtimeId, mode: "photos" }
    );
    setEditDraft(null);
    setCloseDraft(null);
  };

  const openEdit = (d: MachineDowntimeJson) => {
    setActivePanel({ downtimeId: d.id, mode: "edit" });
    setCloseDraft(null);
    setEditDraft({
      reasonId: d.downtimeReasonId ?? "",
      startTime: isoToDatetimeLocal(d.startTime) || nowDatetimeLocal(),
      endTime: isoToDatetimeLocal(d.endTime),
      notes: d.notes ?? "",
      faultDescription: d.faultDescription ?? "",
      repairMethod: d.repairMethod ?? ""
    });
  };

  const openClose = (d: MachineDowntimeJson) => {
    setActivePanel({ downtimeId: d.id, mode: "close" });
    setEditDraft(null);
    setCloseDraft({
      endTime: nowDatetimeLocal(),
      faultDescription: d.faultDescription ?? d.notes ?? "",
      repairMethod: d.repairMethod ?? ""
    });
  };

  const cancelPanel = () => {
    setActivePanel(null);
    setEditDraft(null);
    setCloseDraft(null);
  };

  const saveEdit = async (downtimeId: string) => {
    if (!editDraft?.reasonId) {
      onError?.("سبب التوقف مطلوب");
      return;
    }
    setBusy(true);
    onError?.(null);
    try {
      await productionApi.updateDowntime(downtimeId, {
        downtimeReasonId: editDraft.reasonId,
        startTime: editDraft.startTime,
        endTime: editDraft.endTime || undefined,
        notes: editDraft.notes || undefined,
        faultDescription: editDraft.faultDescription || undefined,
        repairMethod: editDraft.repairMethod || undefined
      });
      cancelPanel();
      await onChanged();
    } catch (e) {
      onError?.(e instanceof ProductionApiError ? e.message : "فشل تعديل التوقف");
    } finally {
      setBusy(false);
    }
  };

  const submitClose = async (downtime: MachineDowntimeJson) => {
    if (!closeDraft) return;
    setBusy(true);
    onError?.(null);
    try {
      await productionApi.updateDowntime(downtime.id, {
        endTime: closeDraft.endTime,
        faultDescription: closeDraft.faultDescription || undefined,
        repairMethod: closeDraft.repairMethod || undefined
      });
      const hasOtherOpen = order.downtimes.some((d) => d.id !== downtime.id && !d.endTime);
      if (order.status === "paused" && !hasOtherOpen) {
        await productionApi.resumeOrder(order.id);
      }
      cancelPanel();
      await onChanged();
    } catch (e) {
      onError?.(e instanceof ProductionApiError ? e.message : "فشل إغلاق التوقف");
    } finally {
      setBusy(false);
    }
  };

  const handlePhotosChange = (downtimeId: string, photos: MachineDowntimePhotoJson[]) => {
    setLocalPhotos((prev) => ({ ...prev, [downtimeId]: photos }));
  };

  const colSpan = canExecute ? 7 : 6;

  return (
    <div className="space-y-4">
      {canExecute && (order.status === "running" || order.status === "paused") ? (
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">تسجيل توقف</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <WfmField label="سبب التوقف">
                <WfmSelect value={reasonId} onChange={(e) => setReasonId(e.target.value)}>
                  <option value="">—</option>
                  {reasons.map((r) => (
                    <option key={r.id} value={r.id}>
                      {downtimeReasonLabel(r.code, r.name)}
                    </option>
                  ))}
                </WfmSelect>
              </WfmField>
              <WfmField label="وقت البداية">
                <WfmInput type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </WfmField>
              <WfmField label="وقت النهاية (اختياري)">
                <WfmInput type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </WfmField>
              <WfmField label="المدة">
                <p className="flex h-10 items-center text-sm text-muted-foreground">{durationPreview}</p>
              </WfmField>
            </div>
            <WfmField label="ملاحظات">
              <WfmInput value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="تفاصيل إضافية…" />
            </WfmField>
            {!endTime && order.status === "running" ? (
              <p className="text-xs text-muted-foreground">
                توقف بدون وقت نهاية يُوقف أمر الإنتاج تلقائياً (مثل زر «إيقاف»).
              </p>
            ) : null}
            <WfmField label="صور العطل (اختياري)">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => formPhotoInputRef.current?.click()}
                >
                  <ImageIcon className="ml-1 h-4 w-4" />
                  اختيار صور
                </Button>
                {pendingPhotos.length ? (
                  <span className="text-sm text-muted-foreground">
                    {pendingPhotos.length.toLocaleString("ar")} صورة محددة
                  </span>
                ) : null}
              </div>
              <input
                ref={formPhotoInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => setPendingPhotos(Array.from(e.target.files ?? []))}
              />
            </WfmField>
            <Button size="sm" className="gap-1.5" disabled={busy} onClick={() => void submitDowntime()}>
              <Plus className="h-4 w-4" />
              تسجيل التوقف
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">سجل التوقفات</CardTitle>
          {openDowntime ? (
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />
              توقف مفتوح
            </Badge>
          ) : null}
        </CardHeader>
        <CardContent>
          {order.downtimes.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>السبب</TableHead>
                  <TableHead>البداية</TableHead>
                  <TableHead>النهاية</TableHead>
                  <TableHead>المدة</TableHead>
                  <TableHead>ملاحظات</TableHead>
                  <TableHead className="w-16 text-center">صور</TableHead>
                  {canExecute ? <TableHead /> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.downtimes.map((d) => {
                  const photos = localPhotos[d.id] ?? d.photos ?? [];
                  const panel = activePanel?.downtimeId === d.id ? activePanel.mode : null;
                  return (
                    <Fragment key={d.id}>
                      <TableRow>
                        <TableCell>{downtimeReasonLabel(d.reasonCode, d.reasonName)}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{formatLogDatetime(d.startTime)}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {d.endTime ? formatLogDatetime(d.endTime) : "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {d.endTime
                            ? formatProductionLogDuration(d.startTime, d.endTime)
                            : d.downtimeMinutes != null
                              ? `${d.downtimeMinutes.toLocaleString("ar")} د`
                              : "مفتوح"}
                        </TableCell>
                        <TableCell className="max-w-[200px] text-sm text-muted-foreground">
                          <p className="truncate">{d.notes ?? "—"}</p>
                          {d.faultDescription ? (
                            <p className="truncate text-xs">عطل: {d.faultDescription}</p>
                          ) : null}
                          {d.repairMethod ? (
                            <p className="truncate text-xs">إصلاح: {d.repairMethod}</p>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="gap-1"
                            onClick={() => openPhotos(d.id)}
                          >
                            <Camera className="h-4 w-4" />
                            {photos.length ? photos.length.toLocaleString("ar") : null}
                            {panel === "photos" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </Button>
                        </TableCell>
                        {canExecute ? (
                          <TableCell>
                            <div className="flex flex-wrap items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={busy}
                                title="تعديل"
                                onClick={() => openEdit(d)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {!d.endTime ? (
                                <Button size="sm" variant="outline" disabled={busy} onClick={() => openClose(d)}>
                                  إغلاق
                                </Button>
                              ) : null}
                            </div>
                            {d.requestNo ? (
                              <span className="text-xs text-amber-600">{d.requestNo}</span>
                            ) : null}
                          </TableCell>
                        ) : null}
                      </TableRow>
                      {panel === "edit" && editDraft ? (
                        <TableRow>
                          <TableCell colSpan={colSpan} className="bg-muted/30">
                            <div className="space-y-4 p-2">
                              <p className="text-sm font-medium">تعديل التوقف</p>
                              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <WfmField label="سبب التوقف">
                                  <WfmSelect
                                    value={editDraft.reasonId}
                                    onChange={(e) => setEditDraft({ ...editDraft, reasonId: e.target.value })}
                                  >
                                    <option value="">—</option>
                                    {reasons.map((r) => (
                                      <option key={r.id} value={r.id}>
                                        {downtimeReasonLabel(r.code, r.name)}
                                      </option>
                                    ))}
                                  </WfmSelect>
                                </WfmField>
                                <WfmField label="وقت البداية">
                                  <WfmInput
                                    type="datetime-local"
                                    value={editDraft.startTime}
                                    onChange={(e) => setEditDraft({ ...editDraft, startTime: e.target.value })}
                                  />
                                </WfmField>
                                <WfmField label="وقت النهاية">
                                  <WfmInput
                                    type="datetime-local"
                                    value={editDraft.endTime}
                                    onChange={(e) => setEditDraft({ ...editDraft, endTime: e.target.value })}
                                  />
                                </WfmField>
                                <WfmField label="ملاحظات">
                                  <WfmInput
                                    value={editDraft.notes}
                                    onChange={(e) => setEditDraft({ ...editDraft, notes: e.target.value })}
                                  />
                                </WfmField>
                                <WfmField label="سبب العطل">
                                  <WfmInput
                                    value={editDraft.faultDescription}
                                    onChange={(e) => setEditDraft({ ...editDraft, faultDescription: e.target.value })}
                                    placeholder="وصف العطل…"
                                  />
                                </WfmField>
                                <WfmField label="طريقة الإصلاح">
                                  <WfmInput
                                    value={editDraft.repairMethod}
                                    onChange={(e) => setEditDraft({ ...editDraft, repairMethod: e.target.value })}
                                    placeholder="ما تم عمله للإصلاح…"
                                  />
                                </WfmField>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Button size="sm" className="gap-1.5" disabled={busy} onClick={() => void saveEdit(d.id)}>
                                  <Save className="h-4 w-4" />
                                  حفظ التعديل
                                </Button>
                                <Button size="sm" variant="outline" disabled={busy} onClick={cancelPanel}>
                                  <X className="h-4 w-4" />
                                  إلغاء
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : null}
                      {panel === "close" && closeDraft ? (
                        <TableRow>
                          <TableCell colSpan={colSpan} className="bg-amber-500/5">
                            <div className="space-y-4 p-2">
                              <p className="text-sm font-medium">إغلاق التوقف</p>
                              <div className="grid gap-4 sm:grid-cols-2">
                                <WfmField label="وقت النهاية">
                                  <WfmInput
                                    type="datetime-local"
                                    value={closeDraft.endTime}
                                    onChange={(e) => setCloseDraft({ ...closeDraft, endTime: e.target.value })}
                                  />
                                </WfmField>
                                <WfmField label="سبب العطل">
                                  <WfmInput
                                    value={closeDraft.faultDescription}
                                    onChange={(e) => setCloseDraft({ ...closeDraft, faultDescription: e.target.value })}
                                    placeholder="ما الذي حدث؟"
                                  />
                                </WfmField>
                                <WfmField label="طريقة الإصلاح" className="sm:col-span-2">
                                  <WfmInput
                                    value={closeDraft.repairMethod}
                                    onChange={(e) => setCloseDraft({ ...closeDraft, repairMethod: e.target.value })}
                                    placeholder="كيف تم حل المشكلة؟"
                                  />
                                </WfmField>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Button size="sm" disabled={busy} onClick={() => void submitClose(d)}>
                                  تأكيد الإغلاق
                                </Button>
                                <Button size="sm" variant="outline" disabled={busy} onClick={cancelPanel}>
                                  إلغاء
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : null}
                      {panel === "photos" ? (
                        <TableRow>
                          <TableCell colSpan={colSpan} className="bg-muted/30">
                            <DowntimePhotoUploader
                              downtimeId={d.id}
                              photos={photos}
                              disabled={!canExecute}
                              onChange={(next) => handlePhotosChange(d.id, next)}
                            />
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">لا توجد توقفات مسجّلة.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type PauseFormProps = {
  order: WorkOrderDetailJson;
  open: boolean;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (payload: {
    downtimeReasonId: string;
    startTime: string;
    notes?: string;
    photos?: File[];
  }) => Promise<void>;
};

export function ProductionOrderPauseForm({ order, open, busy, onCancel, onConfirm }: PauseFormProps) {
  const [reasons, setReasons] = useState<DowntimeReasonJson[]>([]);
  const [reasonId, setReasonId] = useState("");
  const [startTime, setStartTime] = useState(nowDatetimeLocal);
  const [notes, setNotes] = useState("");
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setStartTime(nowDatetimeLocal());
    setNotes("");
    setPendingPhotos([]);
    setLocalError(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
    void (async () => {
      try {
        const res = await productionApi.downtimeReasons();
        setReasons(res.data);
        if (res.data[0]) setReasonId(res.data[0].id);
      } catch {
        setLocalError("تعذر تحميل أسباب التوقف");
      }
    })();
  }, [open]);

  if (!open) return null;

  const submit = async () => {
    if (!reasonId) {
      setLocalError("اختر سبب التوقف");
      return;
    }
    if (!order.machineId) {
      setLocalError("يجب ربط ماكينة بأمر الإنتاج.");
      return;
    }
    setLocalError(null);
    await onConfirm({
      downtimeReasonId: reasonId,
      startTime,
      notes: notes || undefined,
      photos: pendingPhotos.length ? pendingPhotos : undefined
    });
  };

  return (
    <Card className="border-amber-500/40 bg-amber-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PauseCircle className="h-5 w-5 text-amber-600" />
          إيقاف الإنتاج وتسجيل التوقف
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          سيتم إيقاف أمر الإنتاج وتسجيل توقف الماكينة {order.machineName ?? order.machineCode ?? ""}.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <WfmField label="سبب التوقف">
            <WfmSelect value={reasonId} onChange={(e) => setReasonId(e.target.value)}>
              <option value="">—</option>
              {reasons.map((r) => (
                <option key={r.id} value={r.id}>
                  {downtimeReasonLabel(r.code, r.name)}
                </option>
              ))}
            </WfmSelect>
          </WfmField>
          <WfmField label="وقت البداية">
            <WfmInput type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </WfmField>
        </div>
        <WfmField label="ملاحظات">
          <WfmInput value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="وصف المشكلة…" />
        </WfmField>
        <WfmField label="صور العطل (اختياري)">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => photoInputRef.current?.click()}>
              <ImageIcon className="ml-1 h-4 w-4" />
              اختيار صور
            </Button>
            {pendingPhotos.length ? (
              <span className="text-sm text-muted-foreground">
                {pendingPhotos.length.toLocaleString("ar")} صورة محددة
              </span>
            ) : null}
          </div>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => setPendingPhotos(Array.from(e.target.files ?? []))}
          />
        </WfmField>
        {localError ? <p className="text-sm text-destructive">{localError}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={busy} onClick={() => void submit()}>
            تأكيد الإيقاف
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={onCancel}>
            إلغاء
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
