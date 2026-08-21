export type CurrencyCode = "USD" | "CNY";

export const DEFAULT_CURRENCY: CurrencyCode = "USD";

/** 近似汇率，仅用于展示换算 */
export const USD_TO_CNY = 7.25;

export function convertFromUsd(
  usd: number,
  currency: CurrencyCode,
): number {
  if (currency === "CNY") return usd * USD_TO_CNY;
  return usd;
}

export function formatMoneyAmount(value: number): string {
  if (value === 0) return "0";
  if (value < 0.01) return value.toFixed(4);
  if (value < 1) return value.toFixed(3);
  if (value < 100) return value.toFixed(2);
  return value.toFixed(2);
}

export function currencySymbol(currency: CurrencyCode): string {
  return currency === "CNY" ? "¥" : "$";
}

/** 展示带币种符号的百万 token 单价，默认 USD */
export function formatPricePerMillion(
  usdPerMillion: number | null,
  currency: CurrencyCode = DEFAULT_CURRENCY,
): string {
  if (usdPerMillion === null || Number.isNaN(usdPerMillion)) return "—";
  const amount = convertFromUsd(usdPerMillion, currency);
  return `${currencySymbol(currency)}${formatMoneyAmount(amount)}`;
}
