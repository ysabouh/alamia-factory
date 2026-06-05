"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, Pencil, Plus, Save, Trash2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WfmField, WfmInput, WfmSelect } from "@/components/workforce/atlas";
import { useFactoryAuth } from "@/contexts/factory-auth-context";
import {
  productionApi,
  ProductionApiError,
  type QualityChecklistItemJson,
  type QualityChecklistJson
} from "@/lib/api/production-client";

const itemTypeLabels: Record<string, string> = {
  numeric: "رقمي",
  boolean: "نعم/لا",
  text: "نص",
  selection: "اختيار"
};

type ItemDraft = {
  itemName: string;
  itemType: QualityChecklistItemJson["itemType"];
  minValue: string;
  maxValue: string;
  unit: string;
  selectionOptions: string;
  isCritical: boolean;
};

const emptyDraft = (): ItemDraft => ({
  itemName: "",
  itemType: "numeric",
  minValue: "",
  maxValue: "",
  unit: "",
  selectionOptions: "",
  isCritical: false
});

function draftFromItem(item: QualityChecklistItemJson): ItemDraft {
  return {
    itemName: item.itemName,
    itemType: item.itemType,
    minValue: item.minValue != null ? String(item.minValue) : "",
    maxValue: item.maxValue != null ? String(item.maxValue) : "",
    unit: item.unit ?? "",
    selectionOptions: item.selectionOptions?.join("، ") ?? "",
    isCritical: item.isCritical
  };
}

function payloadFromDraft(draft: ItemDraft) {
  return {
    itemName: draft.itemName.trim(),
    itemType: draft.itemType,
    minValue: draft.minValue ? Number(draft.minValue) : undefined,
    maxValue: draft.maxValue ? Number(draft.maxValue) : undefined,
    unit: draft.unit || undefined,
    selectionOptions:
      draft.itemType === "selection" && draft.selectionOptions.trim()
        ? draft.selectionOptions.split(/[,،]/).map((s) => s.trim()).filter(Boolean)
        : undefined,
    isCritical: draft.isCritical
  };
}

type Props = {
  productId: string;
  productName?: string;
};

export function QualityChecklistForm({ productId, productName }: Props) {
  const { can } = useFactoryAuth();
  const canManage = can("quality.manage_checklists");

  const [checklists, setChecklists] = useState<QualityChecklistJson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("قائمة فحص المنتج");
  const [description, setDescription] = useState("");
  const [newItem, setNewItem] = useState<ItemDraft>(emptyDraft);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<ItemDraft>(emptyDraft);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productionApi.listChecklists(productId);
      setChecklists(res.data);
      setError(null);
    } catch (e) {
      setError(e instanceof ProductionApiError ? e.message : "تعذر التحميل");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeChecklist = checklists.find((c) => c.isActive) ?? checklists[0];

  const createChecklist = async () => {
    setBusy(true);
    try {
      await productionApi.createChecklist(productId, { name, description, isActive: true });
      await load();
    } catch (e) {
      setError(e instanceof ProductionApiError ? e.message : "فشل الإنشاء");
    } finally {
      setBusy(false);
    }
  };

  const addItem = async () => {
    if (!activeChecklist) return;
    if (!newItem.itemName.trim()) {
      setError("أدخل اسم عنصر الفحص");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await productionApi.addChecklistItem(activeChecklist.id, payloadFromDraft(newItem));
      setNewItem(emptyDraft());
      await load();
    } catch (e) {
      setError(e instanceof ProductionApiError ? e.message : "فشل إضافة العنصر");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (item: QualityChecklistItemJson) => {
    setEditingItemId(item.id);
    setEditDraft(draftFromItem(item));
    setError(null);
  };

  const cancelEdit = () => {
    setEditingItemId(null);
    setEditDraft(emptyDraft());
  };

  const saveEdit = async (itemId: string) => {
    if (!editDraft.itemName.trim()) {
      setError("أدخل اسم عنصر الفحص");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await productionApi.updateChecklistItem(itemId, payloadFromDraft(editDraft));
      cancelEdit();
      await load();
    } catch (e) {
      setError(e instanceof ProductionApiError ? e.message : "فشل حفظ التعديل");
    } finally {
      setBusy(false);
    }
  };

  const removeChecklist = async (id: string) => {
    if (!confirm("حذف قالب الفحص؟")) return;
    setBusy(true);
    try {
      await productionApi.deleteChecklist(id);
      await load();
    } catch (e) {
      setError(e instanceof ProductionApiError ? e.message : "فشل الحذف");
    } finally {
      setBusy(false);
    }
  };

  const formatRange = (item: QualityChecklistItemJson) => {
    if (item.itemType === "numeric" && item.minValue != null && item.maxValue != null) {
      return `${item.minValue} – ${item.maxValue}${item.unit ? ` ${item.unit}` : ""}`;
    }
    if (item.itemType === "selection" && item.selectionOptions?.length) {
      return item.selectionOptions.join("، ");
    }
    return "—";
  };

  const renderRangeInputs = (
    draft: ItemDraft,
    onChange: (patch: Partial<ItemDraft>) => void,
    disabled: boolean
  ) => {
    if (draft.itemType === "numeric") {
      return (
        <div className="flex flex-wrap gap-1">
          <WfmInput
            className="w-20"
            type="number"
            placeholder="من"
            value={draft.minValue}
            disabled={disabled}
            onChange={(e) => onChange({ minValue: e.target.value })}
          />
          <WfmInput
            className="w-20"
            type="number"
            placeholder="إلى"
            value={draft.maxValue}
            disabled={disabled}
            onChange={(e) => onChange({ maxValue: e.target.value })}
          />
          <WfmInput
            className="w-16"
            placeholder="وحدة"
            value={draft.unit}
            disabled={disabled}
            onChange={(e) => onChange({ unit: e.target.value })}
          />
        </div>
      );
    }
    if (draft.itemType === "selection") {
      return (
        <WfmInput
          placeholder="خيار1، خيار2"
          value={draft.selectionOptions}
          disabled={disabled}
          onChange={(e) => onChange({ selectionOptions: e.target.value })}
        />
      );
    }
    return <span className="text-xs text-muted-foreground">—</span>;
  };

  if (!canManage) {
    return (
      <div className="space-y-4">
        <Link
          href={`/ar/products/${productId}` as Route}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowRight className="h-4 w-4 translate-y-0.5" />
          العودة إلى تفاصيل المنتج
        </Link>
        <p className="text-muted-foreground">لا تملك صلاحية إدارة قوالب الفحص.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/ar/products/${productId}` as Route}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowRight className="h-4 w-4 translate-y-0.5" />
        العودة إلى تفاصيل المنتج
      </Link>

      <div>
        <h1 className="text-2xl font-semibold">قالب فحص الجودة</h1>
        {productName ? <p className="text-sm text-muted-foreground">{productName}</p> : null}
      </div>

      {error ? <p className="text-destructive">{error}</p> : null}

      {loading ? (
        <p className="text-muted-foreground">جاري التحميل…</p>
      ) : !activeChecklist ? (
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">إنشاء قالب جديد</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <WfmField label="اسم القالب">
              <WfmInput value={name} onChange={(e) => setName(e.target.value)} />
            </WfmField>
            <WfmField label="الوصف">
              <WfmInput value={description} onChange={(e) => setDescription(e.target.value)} />
            </WfmField>
            <Button type="button" disabled={busy} onClick={() => void createChecklist()}>
              إنشاء القالب
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">{activeChecklist.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{activeChecklist.description ?? "—"}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant={activeChecklist.isActive ? "success" : "secondary"}>
                {activeChecklist.isActive ? "نشط" : "غير نشط"}
              </Badge>
              <Button type="button" size="sm" variant="destructive" disabled={busy} onClick={() => void removeChecklist(activeChecklist.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>اسم العنصر</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>المدى / الخيارات</TableHead>
                  <TableHead>حرج</TableHead>
                  <TableHead className="w-28 text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeChecklist.items.length ? (
                  activeChecklist.items.map((item, idx) => {
                    const isEditing = editingItemId === item.id;
                    return (
                      <TableRow key={item.id} className={isEditing ? "bg-amber-50/50" : undefined}>
                        <TableCell>{idx + 1}</TableCell>
                        {isEditing ? (
                          <>
                            <TableCell>
                              <WfmInput
                                value={editDraft.itemName}
                                disabled={busy}
                                onChange={(e) => setEditDraft((d) => ({ ...d, itemName: e.target.value }))}
                              />
                            </TableCell>
                            <TableCell>
                              <WfmSelect
                                value={editDraft.itemType}
                                disabled={busy}
                                onChange={(e) =>
                                  setEditDraft((d) => ({
                                    ...d,
                                    itemType: e.target.value as QualityChecklistItemJson["itemType"]
                                  }))
                                }
                              >
                                <option value="numeric">رقمي</option>
                                <option value="boolean">نعم/لا</option>
                                <option value="text">نص</option>
                                <option value="selection">اختيار</option>
                              </WfmSelect>
                            </TableCell>
                            <TableCell>{renderRangeInputs(editDraft, (patch) => setEditDraft((d) => ({ ...d, ...patch })), busy)}</TableCell>
                            <TableCell>
                              <label className="flex items-center gap-1 text-xs">
                                <input
                                  type="checkbox"
                                  checked={editDraft.isCritical}
                                  disabled={busy}
                                  onChange={(e) => setEditDraft((d) => ({ ...d, isCritical: e.target.checked }))}
                                />
                                حرج
                              </label>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  disabled={busy}
                                  title="حفظ"
                                  onClick={() => void saveEdit(item.id)}
                                >
                                  <Save className="h-4 w-4 text-emerald-600" />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  disabled={busy}
                                  title="إلغاء"
                                  onClick={cancelEdit}
                                >
                                  <X className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="font-medium">{item.itemName}</TableCell>
                            <TableCell>{itemTypeLabels[item.itemType] ?? item.itemType}</TableCell>
                            <TableCell className="text-muted-foreground">{formatRange(item)}</TableCell>
                            <TableCell>{item.isCritical ? <Badge variant="destructive">حرج</Badge> : "—"}</TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  disabled={busy || editingItemId !== null}
                                  title="تعديل"
                                  onClick={() => startEdit(item)}
                                >
                                  <Pencil className="h-4 w-4 text-amber-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      لا توجد عناصر بعد — أضف سطراً من الأسفل
                    </TableCell>
                  </TableRow>
                )}
                <TableRow className="bg-muted/20">
                  <TableCell>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell>
                    <WfmInput
                      placeholder="اسم العنصر"
                      value={newItem.itemName}
                      disabled={busy || editingItemId !== null}
                      onChange={(e) => setNewItem((d) => ({ ...d, itemName: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && void addItem()}
                    />
                  </TableCell>
                  <TableCell>
                    <WfmSelect
                      value={newItem.itemType}
                      disabled={busy || editingItemId !== null}
                      onChange={(e) => setNewItem((d) => ({ ...d, itemType: e.target.value as QualityChecklistItemJson["itemType"] }))}
                    >
                      <option value="numeric">رقمي</option>
                      <option value="boolean">نعم/لا</option>
                      <option value="text">نص</option>
                      <option value="selection">اختيار</option>
                    </WfmSelect>
                  </TableCell>
                  <TableCell>
                    {renderRangeInputs(newItem, (patch) => setNewItem((d) => ({ ...d, ...patch })), busy || editingItemId !== null)}
                  </TableCell>
                  <TableCell>
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={newItem.isCritical}
                        disabled={busy || editingItemId !== null}
                        onChange={(e) => setNewItem((d) => ({ ...d, isCritical: e.target.checked }))}
                      />
                      حرج
                    </label>
                  </TableCell>
                  <TableCell>
                    <Button type="button" size="sm" disabled={busy || editingItemId !== null} onClick={() => void addItem()}>
                      إضافة
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
