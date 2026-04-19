/** Safely parse a sparkline value that may already be number[] or a JSON string */
export function parseSparkline(value: number[] | string | unknown): number[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function formatRevenue(n: number, currency = "$"): string {
  if (n >= 1000) {
    return `${currency}${(n / 1000).toFixed(1)}k`;
  }
  return `${currency}${n}`;
}

export function formatNumber(n: number): string {
  if (n >= 1000000) {
    return `${(n / 1000000).toFixed(1)}M`;
  }
  if (n >= 1000) {
    return `${(n / 1000).toFixed(1)}k`;
  }
  return n.toString();
}

export function scoreColor(s: number): string {
  if (s >= 8.5) return "#1e7e34";
  if (s >= 7) return "#b45309";
  return "#c0392b";
}

export function scoreRating(s: number): string {
  if (s >= 8.5) return "Excellent";
  if (s >= 7) return "Good";
  if (s >= 5) return "Fair";
  return "Poor";
}

export function competitionClass(c: string): string {
  switch (c.toLowerCase()) {
    case "low":
      return "bg-green-light text-green border border-green-border";
    case "medium":
      return "bg-amber-light text-amber border border-amber-border";
    case "high":
      return "bg-red-light text-red border border-red-border";
    default:
      return "bg-bg-2 text-txt-2 border border-bd";
  }
}
