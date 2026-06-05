"use client";

import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, type Resolver } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WfmField, WfmInput, WfmSelect } from "@/components/workforce/atlas";
import { BlowSpecFields } from "@/features/machines/management/blow-spec-fields";
import { InjectionSpecFields } from "@/features/machines/management/injection-spec-fields";
import {
  emptyMachineForm,
  machineFormSchema,
  type MachineFormValues
} from "@/features/machines/management/machine-form-schema";
import { machineStatusLabels } from "@/features/machines/management/machine-status-ui";
import type { MachineDetailJson, MachinePayload, MachineTypeJson } from "@/lib/api/machines-client";

function stripEmpty(obj: Record<string, unknown> | undefined) {
  if (!obj) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== "" && !Number.isNaN(v)) out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

export function formValuesToPayload(values: MachineFormValues, typeCode: string | undefined): MachinePayload {
  const spec =
    typeCode === "injection"
      ? stripEmpty(values.injectionSpec as Record<string, unknown>)
      : typeCode === "blow" || typeCode === "blow_molding"
        ? stripEmpty(values.blowSpec as Record<string, unknown>)
        : undefined;

  return {
    machineTypeId: values.machineTypeId,
    code: values.code.trim(),
    name: values.name.trim(),
    brand: values.brand || null,
    model: values.model || null,
    serialNumber: values.serialNumber || null,
    factorySection: values.factorySection || null,
    productionLine: values.productionLine || null,
    powerKw: values.powerKw,
    hourlyEnergyConsumption: values.hourlyEnergyConsumption,
    installationDate: values.installationDate || null,
    notes: values.notes || null,
    isActive: values.isActive,
    status: values.status,
    spec: spec ?? null
  };
}

export function detailToFormValues(machine: MachineDetailJson): MachineFormValues {
  const base: MachineFormValues = {
    machineTypeId: machine.machineTypeId,
    code: machine.code,
    name: machine.name,
    brand: machine.brand ?? "",
    model: machine.model ?? "",
    serialNumber: machine.serialNumber ?? "",
    factorySection: machine.factorySection ?? "",
    productionLine: machine.productionLine ?? "",
    powerKw: machine.powerKw ?? undefined,
    hourlyEnergyConsumption: machine.hourlyEnergyConsumption ?? undefined,
    installationDate: machine.installationDate ?? "",
    notes: machine.notes ?? "",
    isActive: machine.isActive,
    status: machine.status,
    injectionSpec: {},
    blowSpec: {}
  };
  if (machine.type === "injection" && machine.spec) {
    base.injectionSpec = machine.spec as MachineFormValues["injectionSpec"];
  }
  if ((machine.type === "blow" || machine.type === "blow_molding") && machine.spec) {
    base.blowSpec = machine.spec as MachineFormValues["blowSpec"];
  }
  return base;
}

export function MachineForm({
  types,
  initial,
  onSubmit,
  busy,
  submitLabel
}: {
  types: MachineTypeJson[];
  initial?: MachineFormValues;
  onSubmit: (payload: MachinePayload) => Promise<void>;
  busy?: boolean;
  submitLabel: string;
}) {
  const form = useForm<MachineFormValues>({
    resolver: zodResolver(machineFormSchema) as Resolver<MachineFormValues>,
    defaultValues: initial ?? emptyMachineForm()
  });

  useEffect(() => {
    if (initial) form.reset(initial);
  }, [initial, form]);

  const machineTypeId = form.watch("machineTypeId");
  const typeCode = useMemo(
    () => types.find((t) => t.id === machineTypeId)?.code,
    [types, machineTypeId]
  );

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(formValuesToPayload(values, typeCode));
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-border/60 bg-card/40">
        <CardHeader>
          <CardTitle>البيانات الأساسية</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <WfmField label="نوع الماكينة" required error={form.formState.errors.machineTypeId?.message}>
            <Controller
              control={form.control}
              name="machineTypeId"
              render={({ field }) => (
                <WfmSelect disabled={busy} value={field.value} onChange={field.onChange}>
                  <option value="">اختر النوع</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </WfmSelect>
              )}
            />
          </WfmField>
          <WfmField label="الرمز" required error={form.formState.errors.code?.message}>
            <WfmInput disabled={busy} {...form.register("code")} />
          </WfmField>
          <WfmField label="الاسم" required error={form.formState.errors.name?.message}>
            <WfmInput disabled={busy} {...form.register("name")} />
          </WfmField>
          <WfmField label="الحالة">
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <WfmSelect disabled={busy} value={field.value} onChange={field.onChange}>
                  {(Object.keys(machineStatusLabels) as Array<keyof typeof machineStatusLabels>).map((s) => (
                    <option key={s} value={s}>
                      {machineStatusLabels[s]}
                    </option>
                  ))}
                </WfmSelect>
              )}
            />
          </WfmField>
          <WfmField label="العلامة">
            <WfmInput disabled={busy} {...form.register("brand")} />
          </WfmField>
          <WfmField label="الموديل">
            <WfmInput disabled={busy} {...form.register("model")} />
          </WfmField>
          <WfmField label="الرقم التسلسلي">
            <WfmInput disabled={busy} {...form.register("serialNumber")} />
          </WfmField>
          <WfmField label="قسم المصنع">
            <WfmInput disabled={busy} {...form.register("factorySection")} />
          </WfmField>
          <WfmField label="خط الإنتاج">
            <WfmInput disabled={busy} {...form.register("productionLine")} />
          </WfmField>
          <WfmField label="القدرة (ك.و)">
            <WfmInput type="number" step="any" disabled={busy} {...form.register("powerKw")} />
          </WfmField>
          <WfmField label="استهلاك الطاقة/ساعة">
            <WfmInput type="number" step="any" disabled={busy} {...form.register("hourlyEnergyConsumption")} />
          </WfmField>
          <WfmField label="تاريخ التركيب">
            <WfmInput type="date" disabled={busy} {...form.register("installationDate")} />
          </WfmField>
          <WfmField label="ملاحظات" className="sm:col-span-2">
            <WfmInput disabled={busy} {...form.register("notes")} />
          </WfmField>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" disabled={busy} {...form.register("isActive")} />
            نشطة في السجل
          </label>
        </CardContent>
      </Card>

      {(typeCode === "injection" || typeCode === "blow" || typeCode === "blow_molding") && (
        <Card className="border-border/60 bg-card/40">
          <CardHeader>
            <CardTitle>المواصفات الفنية ({typeCode === "injection" ? "حقن" : "نفخ"})</CardTitle>
          </CardHeader>
          <CardContent>
            {typeCode === "injection" ? (
              <InjectionSpecFields register={form.register} disabled={busy} />
            ) : (
              <BlowSpecFields register={form.register} disabled={busy} />
            )}
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
