export type MoneyCurrency = {
  symbol: string;
  code?: string;
};

export function formatMoney(amount: number, currency?: MoneyCurrency | null): string {
  const formatted = amount.toLocaleString("ar-SA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  if (!currency?.symbol) return formatted;
  return `${formatted} ${currency.symbol}`;
}

export function formatMoneyUsd(amountUsd: number): string {
  return formatMoney(amountUsd, { symbol: "$", code: "USD" });
}
