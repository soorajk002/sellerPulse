/**
 * Keepa API client
 * Docs: https://keepa.com/api/
 *
 * Keepa quirks:
 *  - Prices are stored as integers in "Keepa cents" (divide by 100).
 *    -1 means not available / out of stock.
 *  - CSV arrays are flat pairs: [timestamp, value, timestamp, value, ...]
 *    Timestamps are "Keepa minutes" since epoch (2011-01-01).
 *  - salesRanks is an object keyed by category ID, value is the same flat pair format.
 *  - reviewRating is stored × 10 (e.g. 47 = 4.7 stars).
 *  - domain=1 → Amazon.com
 */

const KEEPA_BASE = "https://api.keepa.com";
const KEEPA_KEY = process.env.KEEPA_API_KEY;

function getKey(): string {
  if (!KEEPA_KEY) throw new Error("KEEPA_API_KEY environment variable is not set");
  return KEEPA_KEY;
}

const TIMEOUT_MS = 15000;

function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, { signal: controller.signal, next: { revalidate: 0 } })
    .finally(() => clearTimeout(timer));
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface KeepaRawProduct {
  asin: string;
  title: string;
  brand?: string;
  imagesCSV?: string;
  categories?: number[];
  parentCategory?: number;
  salesRanks?: Record<string, number[]>; // categoryId → flat pair array
  csv?: (number[] | null)[];             // index 0 = Amazon price, 1 = MktNew, etc.
  stats?: {
    current?: (number | null)[];         // current prices by type
    avg30?: (number | null)[];
    avg90?: (number | null)[];
  };
  reviewRating?: number;
  reviewCount?: number;
  rootCategory?: number;
  categoryTreeName?: string;
}

export interface KeepaSearchResponse {
  products: KeepaRawProduct[];
  timestamp: number;
  tokensLeft?: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convert Keepa integer price to dollars. Returns null if unavailable. */
export function keepaPrice(raw: number | null | undefined): number | null {
  if (raw == null || raw < 0) return null;
  return raw / 100;
}

/**
 * Parse a flat Keepa CSV pair array into (timestamp, value) tuples,
 * returning only the last `n` data points.
 */
export function keepaLastN(
  csv: number[] | null | undefined,
  n: number
): number[] {
  if (!csv || csv.length < 2) return [];
  const values: number[] = [];
  for (let i = 1; i < csv.length; i += 2) {
    const v = csv[i];
    if (v >= 0) values.push(v);
  }
  return values.slice(-n);
}

/**
 * Get the best current BSR value from a salesRanks object.
 * Returns the lowest (best) rank across all categories.
 */
export function getBSR(salesRanks: Record<string, number[]> | undefined): number {
  if (!salesRanks) return 999999;
  let best = 999999;
  for (const flat of Object.values(salesRanks)) {
    // Last value in the pair array
    for (let i = flat.length - 1; i >= 1; i -= 2) {
      if (flat[i] > 0) {
        best = Math.min(best, flat[i]);
        break;
      }
    }
  }
  return best;
}

/**
 * Extract 15 BSR data points for the sparkline chart.
 * Picks the category with the most data points.
 */
export function getBSRSparkline(
  salesRanks: Record<string, number[]> | undefined
): number[] {
  if (!salesRanks) return [];
  let best: number[] = [];
  for (const flat of Object.values(salesRanks)) {
    const vals: number[] = [];
    for (let i = 1; i < flat.length; i += 2) {
      if (flat[i] > 0) vals.push(flat[i]);
    }
    if (vals.length > best.length) best = vals;
  }
  // Normalise to 0-100 scale for display
  const last15 = best.slice(-15);
  if (last15.length < 2) return last15;
  const mx = Math.max(...last15);
  return last15.map((v) => Math.round((1 - v / mx) * 100)); // invert: lower BSR → higher bar
}

/** Determine BSR trend from sparkline: compare first vs second half. */
export function getBSRTrend(sparkline: number[]): "up" | "down" | "flat" {
  if (sparkline.length < 4) return "flat";
  const mid = Math.floor(sparkline.length / 2);
  const first = sparkline.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
  const second = sparkline.slice(mid).reduce((a, b) => a + b, 0) / (sparkline.length - mid);
  const diff = second - first;
  if (diff > 5) return "up";
  if (diff < -5) return "down";
  return "flat";
}

// ── API calls ────────────────────────────────────────────────────────────────

/**
 * Search Keepa by keyword.
 * Returns up to `limit` enriched raw products.
 */
export async function keepaSearch(
  term: string,
  limit = 20
): Promise<KeepaRawProduct[]> {
  const params = new URLSearchParams({
    key: getKey(),
    domain: "1",
    type: "product",
    term,
    stats: "1",
    history: "1",
  });

  const res = await fetchWithTimeout(`${KEEPA_BASE}/search?${params}`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Keepa search failed (${res.status}): ${text}`);
  }

  const data: KeepaSearchResponse = await res.json();
  return (data.products || []).slice(0, limit);
}

/**
 * Fetch full product details for a list of ASINs from Keepa.
 * Max 100 ASINs per request.
 */
export async function keepaProducts(
  asins: string[]
): Promise<KeepaRawProduct[]> {
  if (asins.length === 0) return [];

  const params = new URLSearchParams({
    key: getKey(),
    domain: "1",
    asin: asins.join(","),
    stats: "1",
    history: "1",
  });

  const res = await fetchWithTimeout(`${KEEPA_BASE}/product?${params}`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Keepa product fetch failed (${res.status}): ${text}`);
  }

  const data: KeepaSearchResponse = await res.json();
  return data.products || [];
}
