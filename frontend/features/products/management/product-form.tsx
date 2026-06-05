"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { Controller, useFieldArray, useForm, type Resolver } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WfmField, WfmInput, WfmSelect, WfmTextarea } from "@/components/workforce/atlas";
import {
  emptyProductForm,
  formValuesToPayload,
  productFormSchema,
  type ProductFormValues
} from "@/features/products/management/product-form-schema";
import {
  manufacturingModeLabels,
  manufacturingTypeLabels,
  productStatusLabels,
  productTypeLabels
} from "@/features/products/management/product-status-ui";
import type { MachineJson } from "@/lib/api/machines-client";
import type { MoldJson } from "@/lib/api/molds-client";
import type { ProductMastersJson, ProductPayload } from "@/lib/api/products-client";

const TABS = [
  { id: "basic", label: "أساسي" },
  { id: "manufacturing", label: "تصنيع" },
  { id: "quality", label: "جودة" },
  { id: "bom", label: "BOM" },
  { id: "molds", label: "قوالب" },
  { id: "machines", label: "ماكينات" }
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ProductForm({
  masters,
  materialProducts,
  molds,
  machines,
  initial,
  onSubmit,
  busy,
  submitLabel
}: {
  masters: ProductMastersJson;
  materialProducts: Array<{ id: string; code: string; name: string }>;
  molds: MoldJson[];
  machines: MachineJson[];
  initial?: ProductFormValues;
  onSubmit: (payload: ProductPayload) => Promise<void>;
  busy?: boolean;
  submitLabel: string;
}) {
  const [tab, setTab] = useState<TabId>("basic");

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema) as Resolver<ProductFormValues>,
    defaultValues: initial ?? emptyProductForm()
  });

  useEffect(() => {
    if (initial) form.reset(initial);
  }, [initial, form]);

  const bomFields = useFieldArray({ control: form.control, name: "bom" });
  const moldFields = useFieldArray({ control: form.control, name: "molds" });
  const machineFields = useFieldArray({ control: form.control, name: "machineSettings" });

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit(formValuesToPayload(values));
      })}
    >
      <div className="flex flex-wrap gap-2 border-b border-border/60 pb-3">
        {TABS.map((t) => (
          <Button
            key={t.id}
            type="button"
            size="sm"
            variant={tab === t.id ? "default" : "outline"}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {tab === "basic" && (
        <Card className="border-border/60 bg-card/30">
          <CardHeader>
            <CardTitle className="text-base">البيانات الأساسية</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <WfmField label="رمز المنتج *" error={form.formState.errors.productCode?.message}>
              <WfmInput {...form.register("productCode")} />
            </WfmField>
            <WfmField label="SKU">
              <WfmInput {...form.register("sku")} placeholder="يُنسخ من الرمز إن تُرك فارغاً" />
            </WfmField>
            <WfmField label="الباركود">
              <WfmInput {...form.register("barcode")} />
            </WfmField>
            <WfmField label="اسم المنتج (عربي) *" error={form.formState.errors.productNameAr?.message}>
              <WfmInput {...form.register("productNameAr")} />
            </WfmField>
            <WfmField label="اسم المنتج (إنجليزي)">
              <WfmInput {...form.register("productNameEn")} />
            </WfmField>
            <WfmField label="اسم مختصر">
              <WfmInput {...form.register("shortName")} />
            </WfmField>
            <Controller
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <WfmField label="التصنيف">
                  <WfmSelect {...field}>
                    <option value="">—</option>
                    {masters.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.categoryNameAr}
                      </option>
                    ))}
                  </WfmSelect>
                </WfmField>
              )}
            />
            <Controller
              control={form.control}
              name="productType"
              render={({ field }) => (
                <WfmField label="نوع المنتج">
                  <WfmSelect {...field}>
                    {Object.entries(productTypeLabels).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </WfmSelect>
                </WfmField>
              )}
            />
            <Controller
              control={form.control}
              name="manufacturingMode"
              render={({ field }) => (
                <WfmField label="وضع التصنيع">
                  <WfmSelect {...field}>
                    {Object.entries(manufacturingModeLabels).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </WfmSelect>
                </WfmField>
              )}
            />
            <Controller
              control={form.control}
              name="productStatus"
              render={({ field }) => (
                <WfmField label="الحالة">
                  <WfmSelect {...field}>
                    {Object.entries(productStatusLabels).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </WfmSelect>
                </WfmField>
              )}
            />
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" {...form.register("isActive")} />
              نشط في النظام
            </label>
            <WfmField label="ملاحظات فنية" className="sm:col-span-2">
              <WfmTextarea rows={3} {...form.register("technicalNotes")} />
            </WfmField>
          </CardContent>
        </Card>
      )}

      {tab === "manufacturing" && (
        <Card className="border-border/60 bg-card/30">
          <CardHeader>
            <CardTitle className="text-base">إعدادات التصنيع</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Controller
              control={form.control}
              name="manufacturingType"
              render={({ field }) => (
                <WfmField label="نوع التصنيع">
                  <WfmSelect {...field}>
                    <option value="">—</option>
                    {Object.entries(manufacturingTypeLabels).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </WfmSelect>
                </WfmField>
              )}
            />
            <Controller
              control={form.control}
              name="plasticMaterialId"
              render={({ field }) => (
                <WfmField label="المادة البلاستيكية">
                  <WfmSelect {...field}>
                    <option value="">—</option>
                    {masters.materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.materialCode} — {m.materialName}
                      </option>
                    ))}
                  </WfmSelect>
                </WfmField>
              )}
            />
            <Controller
              control={form.control}
              name="colorId"
              render={({ field }) => (
                <WfmField label="اللون">
                  <WfmSelect {...field}>
                    <option value="">—</option>
                    {masters.colors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.colorName}
                      </option>
                    ))}
                  </WfmSelect>
                </WfmField>
              )}
            />
            <Controller
              control={form.control}
              name="unitId"
              render={({ field }) => (
                <WfmField label="وحدة القياس">
                  <WfmSelect {...field}>
                    <option value="">—</option>
                    {masters.units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.unitNameAr}
                      </option>
                    ))}
                  </WfmSelect>
                </WfmField>
              )}
            />
            <WfmField label="وزن المنتج (غ)">
              <WfmInput type="number" step="0.001" {...form.register("productWeight")} />
            </WfmField>
            <WfmField label="وزن قياسي (غ)">
              <WfmInput type="number" step="0.001" {...form.register("standardWeightGrams")} />
            </WfmField>
            <WfmField label="الحجم">
              <WfmInput type="number" step="0.001" {...form.register("productVolume")} />
            </WfmField>
            <WfmField label="الأبعاد">
              <WfmInput {...form.register("dimensions")} placeholder="L×W×H mm" />
            </WfmField>
            <WfmField label="مخرجات التجاويف">
              <WfmInput type="number" {...form.register("cavityOutput")} />
            </WfmField>
            <WfmField label="زمن الدورة (ث)">
              <WfmInput type="number" {...form.register("standardCycleTime")} />
            </WfmField>
            <WfmField label="الهدف/ساعة">
              <WfmInput type="number" {...form.register("targetOutputPerHour")} />
            </WfmField>
          </CardContent>
        </Card>
      )}

      {tab === "quality" && (
        <Card className="border-border/60 bg-card/30">
          <CardHeader>
            <CardTitle className="text-base">مواصفات الجودة</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <WfmField label="تسامح الوزن ±">
              <WfmInput type="number" step="0.001" {...form.register("qualitySpec.weightTolerance")} />
            </WfmField>
            <WfmField label="تسامح السماكة ±">
              <WfmInput type="number" step="0.001" {...form.register("qualitySpec.thicknessTolerance")} />
            </WfmField>
            <WfmField label="تسامح اللون ±">
              <WfmInput type="number" step="0.001" {...form.register("qualitySpec.colorTolerance")} />
            </WfmField>
            {(
              [
                ["qualitySpec.pressureTestRequired", "اختبار ضغط"],
                ["qualitySpec.leakTestRequired", "اختبار تسرب"],
                ["qualitySpec.dropTestRequired", "اختبار سقوط"],
                ["qualitySpec.visualInspectionRequired", "فحص بصري"]
              ] as const
            ).map(([name, label]) => (
              <label key={name} className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...form.register(name)} />
                {label}
              </label>
            ))}
            <WfmField label="ملاحظات QC" className="sm:col-span-2">
              <WfmTextarea rows={3} {...form.register("qualitySpec.qcNotes")} />
            </WfmField>
          </CardContent>
        </Card>
      )}

      {tab === "bom" && (
        <Card className="border-border/60 bg-card/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">قائمة المواد (BOM)</CardTitle>
            <Button type="button" size="sm" variant="outline" onClick={() => bomFields.append({ materialProductId: "", quantity: 1, unitId: "", wastePercentage: "", notes: "" })}>
              <Plus className="ml-1 h-4 w-4" />
              سطر
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              يمكن للمنتج أن يحتوي BOM وعمليات تصنيع معاً (مثل: غطاء له مواد خام + عملية حقن).
              لتحرير BOM متعدد المستويات استخدم محرّر BOM من صفحة المنتج.
            </p>
            {bomFields.fields.map((field, idx) => (
              <div key={field.id} className="grid gap-2 rounded-lg border border-border/50 p-3 sm:grid-cols-6">
                <Controller
                  control={form.control}
                  name={`bom.${idx}.materialProductId`}
                  render={({ field: f }) => (
                    <WfmField label="المادة" className="sm:col-span-2">
                      <WfmSelect {...f}>
                        <option value="">اختر</option>
                        {materialProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.code} — {p.name}
                          </option>
                        ))}
                      </WfmSelect>
                    </WfmField>
                  )}
                />
                <WfmField label="الكمية">
                  <WfmInput type="number" step="0.0001" {...form.register(`bom.${idx}.quantity`)} />
                </WfmField>
                <WfmField label="هدر %">
                  <WfmInput type="number" {...form.register(`bom.${idx}.wastePercentage`)} />
                </WfmField>
                <WfmField label="ملاحظات" className="sm:col-span-2">
                  <WfmInput {...form.register(`bom.${idx}.notes`)} />
                </WfmField>
                <Button type="button" variant="ghost" size="icon" className="self-end" onClick={() => bomFields.remove(idx)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {!bomFields.fields.length && <p className="text-sm text-muted-foreground">لا توجد مواد في BOM</p>}
          </CardContent>
        </Card>
      )}

      {tab === "molds" && (
        <Card className="border-border/60 bg-card/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">القوالب المرتبطة (قديم)</CardTitle>
            <Button type="button" size="sm" variant="outline" onClick={() => moldFields.append({ moldId: "", priority: 1, isDefault: false, notes: "" })}>
              <Plus className="ml-1 h-4 w-4" />
              قالب
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              يُفضّل ربط القوالب بعمليات التصنيع من صفحة «مسار الإنتاج» بدلاً من ربطها مباشرة بالمنتج.
            </p>
            {moldFields.fields.map((field, idx) => (
              <div key={field.id} className="grid gap-2 rounded-lg border border-border/50 p-3 sm:grid-cols-5">
                <Controller
                  control={form.control}
                  name={`molds.${idx}.moldId`}
                  render={({ field: f }) => (
                    <WfmField label="القالب" className="sm:col-span-2">
                      <WfmSelect {...f}>
                        <option value="">اختر</option>
                        {molds.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.moldCode} — {m.moldName}
                          </option>
                        ))}
                      </WfmSelect>
                    </WfmField>
                  )}
                />
                <WfmField label="أولوية">
                  <WfmInput type="number" {...form.register(`molds.${idx}.priority`)} />
                </WfmField>
                <label className="flex items-center gap-2 self-end pb-2 text-sm">
                  <input type="checkbox" {...form.register(`molds.${idx}.isDefault`)} />
                  افتراضي
                </label>
                <Button type="button" variant="ghost" size="icon" className="self-end" onClick={() => moldFields.remove(idx)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {tab === "machines" && (
        <Card className="border-border/60 bg-card/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">إعدادات الماكينة (قديم)</CardTitle>
            <Button type="button" size="sm" variant="outline" onClick={() => machineFields.append({ machineId: "", cycleTime: "", injectionPressure: "", holdingPressure: "", coolingTime: "", moldTemperature: "", shotWeight: "", clampForce: "", backPressure: "", screwSpeed: "", setupNotes: "" })}>
              <Plus className="ml-1 h-4 w-4" />
              ماكينة
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              يُفضّل تعريف إعدادات الماكينة ضمن عمليات التصنيع (operation_machine_settings) من صفحة «مسار الإنتاج».
            </p>
            {machineFields.fields.map((field, idx) => (
              <div key={field.id} className="space-y-2 rounded-lg border border-border/50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <Controller
                    control={form.control}
                    name={`machineSettings.${idx}.machineId`}
                    render={({ field: f }) => (
                      <WfmField label="الماكينة" className="flex-1">
                        <WfmSelect {...f}>
                          <option value="">اختر</option>
                          {machines.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.code} — {m.name}
                            </option>
                          ))}
                        </WfmSelect>
                      </WfmField>
                    )}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => machineFields.remove(idx)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-4">
                  <WfmField label="زمن الدورة">
                    <WfmInput type="number" {...form.register(`machineSettings.${idx}.cycleTime`)} />
                  </WfmField>
                  <WfmField label="ضغط الحقن">
                    <WfmInput type="number" {...form.register(`machineSettings.${idx}.injectionPressure`)} />
                  </WfmField>
                  <WfmField label="ضغط Holding">
                    <WfmInput type="number" {...form.register(`machineSettings.${idx}.holdingPressure`)} />
                  </WfmField>
                  <WfmField label="التبريد">
                    <WfmInput type="number" {...form.register(`machineSettings.${idx}.coolingTime`)} />
                  </WfmField>
                </div>
                <WfmField label="ملاحظات الإعداد">
                  <WfmInput {...form.register(`machineSettings.${idx}.setupNotes`)} />
                </WfmField>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={busy}>
          {busy ? "جاري الحفظ…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
