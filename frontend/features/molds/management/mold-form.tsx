"use client";

import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, type Resolver } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WfmField, WfmInput, WfmSelect, WfmTextarea } from "@/components/workforce/atlas";
import {
  CompressionMoldSpecFields,
  InjectionMoldSpecFields,
  PetBlowMoldSpecFields,
  PolyethyleneMoldSpecFields
} from "@/features/molds/management/mold-spec-fields";
import {
  emptyMoldForm,
  formValuesToPayload,
  moldFormSchema,
  type MoldFormValues
} from "@/features/molds/management/mold-form-schema";
import { moldStatusLabels, moldTypeLabels } from "@/features/molds/management/mold-status-ui";
import type { MachineJson } from "@/lib/api/machines-client";
import {
  MOLD_MACHINE_COMPAT,
  type MoldPayload,
  type ProductJson
} from "@/lib/api/molds-client";

export function MoldForm({
  products,
  machines,
  initial,
  onSubmit,
  busy,
  submitLabel
}: {
  products: ProductJson[];
  machines: MachineJson[];
  initial?: MoldFormValues;
  onSubmit: (payload: MoldPayload) => Promise<void>;
  busy?: boolean;
  submitLabel: string;
}) {
  const form = useForm<MoldFormValues>({
    resolver: zodResolver(moldFormSchema) as Resolver<MoldFormValues>,
    defaultValues: initial ?? emptyMoldForm()
  });

  useEffect(() => {
    if (initial) form.reset(initial);
  }, [initial, form]);

  const moldType = form.watch("moldType");

  const compatibleMachines = useMemo(() => {
    const allowed = MOLD_MACHINE_COMPAT[moldType] ?? [];
    return machines.filter((m) => m.type && allowed.includes(m.type));
  }, [machines, moldType]);

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit(formValuesToPayload(values));
      })}
    >
      <Card className="border-border/60 bg-card/30">
        <CardHeader>
          <CardTitle className="text-base">البيانات الأساسية</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={form.control}
            name="productId"
            render={({ field, fieldState }) => (
              <WfmField label="المنتج *" error={fieldState.error?.message}>
                <WfmSelect {...field}>
                  <option value="">اختر المنتج</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.name}
                    </option>
                  ))}
                </WfmSelect>
              </WfmField>
            )}
          />
          <WfmField label="رمز القالب *" error={form.formState.errors.moldCode?.message}>
            <WfmInput {...form.register("moldCode")} />
          </WfmField>
          <WfmField label="اسم القالب *" error={form.formState.errors.moldName?.message}>
            <WfmInput {...form.register("moldName")} />
          </WfmField>
          <Controller
            control={form.control}
            name="moldType"
            render={({ field }) => (
              <WfmField label="نوع القالب *">
                <WfmSelect {...field}>
                  {(Object.keys(moldTypeLabels) as Array<keyof typeof moldTypeLabels>).map((t) => (
                    <option key={t} value={t}>
                      {moldTypeLabels[t]}
                    </option>
                  ))}
                </WfmSelect>
              </WfmField>
            )}
          />
          <Controller
            control={form.control}
            name="status"
            render={({ field }) => (
              <WfmField label="الحالة">
                <WfmSelect {...field}>
                  {(Object.keys(moldStatusLabels) as Array<keyof typeof moldStatusLabels>).map((s) => (
                    <option key={s} value={s}>
                      {moldStatusLabels[s]}
                    </option>
                  ))}
                </WfmSelect>
              </WfmField>
            )}
          />
          <WfmField label="عدد التجاويف">
            <WfmInput type="number" min={1} {...form.register("cavityCount")} />
          </WfmField>
          <WfmField label="اسم المنتج (عرض)">
            <WfmInput {...form.register("productName")} />
          </WfmField>
          <WfmField label="نوع المادة">
            <WfmInput {...form.register("materialType")} />
          </WfmField>
          <Controller
            control={form.control}
            name="machineId"
            render={({ field }) => (
              <WfmField label="الماكينة المتوافقة">
                <WfmSelect {...field} value={field.value ?? ""}>
                  <option value="">— بدون —</option>
                  {compatibleMachines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} — {m.name}
                    </option>
                  ))}
                </WfmSelect>
              </WfmField>
            )}
          />
          <WfmField label="الموقع الحالي">
            <WfmInput {...form.register("currentLocation")} />
          </WfmField>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/30">
        <CardHeader>
          <CardTitle className="text-base">بيانات الشراء والصنع</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <WfmField label="الشركة المصنعة">
            <WfmInput {...form.register("manufacturer")} />
          </WfmField>
          <WfmField label="بلد الصنع">
            <WfmInput {...form.register("manufacturingCountry")} />
          </WfmField>
          <WfmField label="تاريخ الصنع">
            <WfmInput type="date" {...form.register("manufacturingDate")} />
          </WfmField>
          <WfmField label="تاريخ الشراء">
            <WfmInput type="date" {...form.register("purchaseDate")} />
          </WfmField>
          <WfmField label="تكلفة الشراء">
            <WfmInput type="number" step="0.01" {...form.register("purchaseCost")} />
          </WfmField>
          <WfmField label="وزن القالب (kg)">
            <WfmInput type="number" step="0.001" {...form.register("moldWeight")} />
          </WfmField>
          <WfmField label="الأبعاد">
            <WfmInput {...form.register("moldDimensions")} placeholder="L×W×H mm" />
          </WfmField>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/30">
        <CardHeader>
          <CardTitle className="text-base">الدورة والصيانة</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <WfmField label="العمر المتوقع (دورة)">
            <WfmInput type="number" {...form.register("expectedLifeCycles")} />
          </WfmField>
          <WfmField label="إجمالي الدورات">
            <WfmInput type="number" {...form.register("totalCycles")} />
          </WfmField>
          <WfmField label="دورة الصيانة (دورة)">
            <WfmInput type="number" {...form.register("maintenanceCycle")} />
          </WfmField>
          <WfmField label="آخر صيانة">
            <WfmInput type="date" {...form.register("lastMaintenanceDate")} />
          </WfmField>
          <WfmField label="الصيانة القادمة">
            <WfmInput type="date" {...form.register("nextMaintenanceDate")} />
          </WfmField>
          <Controller
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <WfmField label="نشط">
                <WfmSelect value={field.value ? "1" : "0"} onChange={(e) => field.onChange(e.target.value === "1")}>
                  <option value="1">نعم</option>
                  <option value="0">لا</option>
                </WfmSelect>
              </WfmField>
            )}
          />
          <WfmField label="ملاحظات" className="sm:col-span-2">
            <WfmTextarea rows={3} {...form.register("notes")} />
          </WfmField>
        </CardContent>
      </Card>

      {moldType === "injection" && (
        <InjectionMoldSpecFields register={form.register} control={form.control} />
      )}
      {moldType === "pet_blow" && (
        <PetBlowMoldSpecFields register={form.register} control={form.control} />
      )}
      {moldType === "compression" && (
        <CompressionMoldSpecFields register={form.register} />
      )}
      {moldType === "polyethylene" && (
        <PolyethyleneMoldSpecFields register={form.register} control={form.control} />
      )}

      <Button type="submit" disabled={busy}>
        {busy ? "جاري الحفظ…" : submitLabel}
      </Button>
    </form>
  );
}

export { detailToFormValues } from "@/features/molds/management/mold-form-schema";
