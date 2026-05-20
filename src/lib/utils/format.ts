export function formatInr(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatNumber(value: number | null | undefined, decimals = 1) {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals
  }).format(value);
}

export function formatPercent(value: number | null | undefined, decimals = 1) {
  if (value == null || Number.isNaN(value)) return "—";
  return `${formatNumber(value * 100, decimals)}%`;
}
