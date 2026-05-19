"use client";

import { WfmField, WfmInput } from "@/components/workforce/atlas";

import type { CurrencyMaster } from "@/lib/api/workforce-masters-client";

export type CurrencyFormValues = {
  code: string;
  name: string;
  symbol: string;
  usdExchangeRate: string;
};

export function emptyCurrencyForm(): CurrencyFormValues {
  return { code: "", name: "", symbol: "", usdExchangeRate: "1" };
}

export function currencyFormFromRow(row: CurrencyMaster): CurrencyFormValues {
  return {
    code: row.code,
    name: row.name,
    symbol: row.symbol,
    usdExchangeRate: String(row.usdExchangeRate)
  };
}

export function currencyFormToPayload(values: CurrencyFormValues): Record<string, unknown> {
  return {
    code: values.code.trim().toUpperCase(),
    name: values.name.trim(),
    symbol: values.symbol.trim(),
    usdExchangeRate: Number(values.usdExchangeRate)
  };
}

export function CurrencyForm({
  values,
  onChange,
  disabled,
  isBase
}: {
  values: CurrencyFormValues;
  onChange: (v: CurrencyFormValues) => void;
  disabled?: boolean;
  isBase?: boolean;
}) {
  return (
    <div className="grid gap-4">
      <WfmField id="currency-code" label="رمز العملة (ISO)" required>
        <WfmInput
          id="currency-code"
          value={values.code}
          maxLength={3}
          disabled={disabled || isBase}
          className="font-mono uppercase"
          onChange={(e) => onChange({ ...values, code: e.target.value.toUpperCase() })}
        />
      </WfmField>
      <WfmField id="currency-name" label="اسم العملة" required>
        <WfmInput
          id="currency-name"
          value={values.name}
          disabled={disabled}
          onChange={(e) => onChange({ ...values, name: e.target.value })}
        />
      </WfmField>
      <WfmField id="currency-symbol" label="الرمز المعروض" required>
        <WfmInput
          id="currency-symbol"
          value={values.symbol}
          disabled={disabled}
          onChange={(e) => onChange({ ...values, symbol: e.target.value })}
        />
      </WfmField>
      <WfmField
        id="currency-rate"
        label="معادل الدولار (وحدات هذه العملة = 1 USD)"
        required
        hint={isBase ? "الدولار الأمريكي ثابت عند 1" : undefined}
      >
        <WfmInput
          id="currency-rate"
          type="number"
          step="0.000001"
          min="0.000001"
          value={values.usdExchangeRate}
          disabled={disabled || isBase}
          monospace
          onChange={(e) => onChange({ ...values, usdExchangeRate: e.target.value })}
        />
      </WfmField>
    </div>
  );
}
