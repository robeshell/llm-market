export function formatUsdPerMillion(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "—";
  if (value === 0) return "0";
  if (value < 0.01) return value.toFixed(4);
  if (value < 1) return value.toFixed(3);
  return value.toFixed(2);
}

export function formatNumber(value: number | null, digits = 1): string {
  if (value === null || Number.isNaN(value)) return "—";
  return value.toFixed(digits);
}

/** AA 单项跑分多为 0–1，展示为百分比 */
export function formatScore(value: number | null, digits = 1): string {
  if (value === null || Number.isNaN(value)) return "—";
  if (value >= 0 && value <= 1) return `${(value * 100).toFixed(digits)}%`;
  return value.toFixed(digits);
}

export function formatUpdatedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm} UTC`;
}
