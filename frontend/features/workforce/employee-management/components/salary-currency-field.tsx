"use client";

import { useEffect } from "react";
import type { Control, FieldValues } from "react-hook-form";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import { WfmField, WfmInput } from "@/components/workforce/atlas";
import { formatMoney } from "@/lib/currency/format-money";

import type { WorkforceCatalogJson } from "../workforce-api-types";
import { defaultCurrencyId } from "../workforce-employee-mapper";

type Props = {
  control: Control<FieldValues>;
  catalog: WorkforceCatalogJson;
  salaryError?: string;
  currencyError?: string;
};

export function SalaryCurrencyField({ control, catalog, salaryError, currencyError }: Props) {
  const salary = useWatch({ control, name: "salary" });
  const { setValue } = useFormContext<FieldValues>();
  const usd = catalog.currencies.find((c) => c.code === "USD") ?? catalog.currencies.find((c) => c.isBase);

  useEffect(() => {
    const id = defaultCurrencyId(catalog);
    if (id) setValue("currencyId", id, { shouldValidate: true });
  }, [catalog, setValue]);

  const salaryPreview =
    usd && typeof salary === "number" && !Number.isNaN(salary)
      ? formatMoney(salary, { symbol: usd.symbol, code: usd.code })
      : null;

  return (
    <div className="contents">
      <WfmField id="currencyId" label="عملة الراتب" hint="الرواتب تُسجّل بالدولار الأمريكي (USD) فقط" error={currencyError}>
        <WfmInput
          id="currencyId-display"
          value={usd ? `${usd.name} (${usd.code}) — ${usd.symbol}` : "دولار أمريكي (USD) — $"}
          readOnly
          disabled
          className="bg-atlas-canvas/60"
        />
      </WfmField>

      {usd ? (
        <div className="md:col-span-2 rounded-sm border border-atlas-rule/60 bg-atlas-canvas/50 p-3 text-xs text-atlas-muted">
          <p className="mb-2 font-semibold text-atlas-ink">بيانات العملة</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <span>
              <span className="text-atlas-muted">الرمز: </span>
              <span className="font-mono font-medium text-atlas-ink">USD</span>
            </span>
            <span>
              <span className="text-atlas-muted">الاسم: </span>
              <span className="text-atlas-ink">{usd.name}</span>
            </span>
            <span>
              <span className="text-atlas-muted">الرمز المعروض: </span>
              <span className="font-medium text-atlas-ink">{usd.symbol}</span>
            </span>
          </div>
          {salaryPreview ? (
            <p className="mt-2 border-t border-atlas-rule/40 pt-2 text-atlas-ink">
              معاينة الراتب: <strong>{salaryPreview}</strong>
            </p>
          ) : null}
        </div>
      ) : (
        <div className="md:col-span-2 rounded-sm border border-amber-500/35 bg-amber-500/10 p-3 text-xs text-amber-800">
          لم تُعثر على عملة USD في النظام — راجع إعدادات العملات أو شغّل الـ seed.
        </div>
      )}

      <WfmField id="salary" label="الراتب الأساسي (USD)" required error={salaryError}>
        <Controller
          name="salary"
          control={control}
          render={({ field }) => (
            <WfmInput
              id="salary"
              type="number"
              step="0.01"
              min={0}
              monospace
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
            />
          )}
        />
      </WfmField>
    </div>
  );
}
