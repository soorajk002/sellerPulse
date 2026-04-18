/**
 * Rainforest API client
 * Docs: https://www.rainforestapi.com/docs
 *
 * Used primarily for:
 *  - Keyword search → top ASINs
 *  - Product page scrape → category, images, description
 *
 * Results are then enriched with Keepa for historical data.
 */

const RAINFOREST_BASE = "https://api.rainforestapi.com/request";
const RAINFOREST_KEY = process.env.RAINFOREST_API_KEY;

function getKey(): string {
  if (!RAINFOREST_KEY) throw new Error("RAINFOREST_API_KEY environment variable is not set");
  return RAINFOREST_KEY;
}

const TIMEOUT_MS = 15000;

function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, { signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface RainforestSearchResult {
  position: number;
  title: string;
  asin: string;
  link?: string;
  image?: string;
  rating?: number;
  ratings_total?: number;
  price?: {
    value: number;
    currency: string;
    raw?: string;
  };
  categories?: { name: string; id?: string }[];
  bestseller_rank?: { rank: number; category: string; link?: string }[];
  is_prime?: boolean;
  sponsored?: boolean;
}

export interface RainforestSearchResponse {
  request_info: { success: boolean; message?: string };
  request_parameters: Record<string, string>;
  search_results?: RainforestSearchResult[];
  pagination?: { total_results?: number };
}

export interface RainforestProductResponse {
  request_info: { success: boolean; message?: string };
  product?: {
    title: string;
    asin: string;
    main_image?: { link: string };
    images?: { link: string }[];
    rating?: number;
    ratings_total?: number;
    price?: { value: number; currency: string };
    categories?: { name: string }[];
    bestsellers_rank?: { rank: number; category: string }[];
    brand?: string;
    feature_bullets?: string[];
    description?: string;
  };
}

// ── API calls ────────────────────────────────────────────────────────────────

/**
 * Search Amazon for a keyword.
 * Returns search result items (with ASINs, titles, prices, ratings).
 * Filters out sponsored/ad results.
 */
export async function rainforestSearch(
  query: string,
  page = 1,
  options?: { minPrice?: number; maxPrice?: number },
  amazonDomain = "amazon.com",
): Promise<RainforestSearchResult[]> {
  const params = new URLSearchParams({
    api_key: getKey(),
    type: "search",
    amazon_domain: amazonDomain,
    search_term: query,
    page: String(page),
    exclude_sponsored: "true",
  });
  if (options?.minPrice && options.minPrice > 0) params.set("min_price", String(options.minPrice));
  if (options?.maxPrice && options.maxPrice > 0) params.set("max_price", String(options.maxPrice));

  const res = await fetchWithTimeout(`${RAINFOREST_BASE}?${params}`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Rainforest search failed (${res.status}): ${text}`);
  }

  const data: RainforestSearchResponse = await res.json();

  if (!data.request_info?.success) {
    throw new Error(
      `Rainforest API error: ${data.request_info?.message || "Unknown error"}`
    );
  }

  return (data.search_results || []).filter((r) => !r.sponsored && r.asin);
}

/**
 * Fetch a single product page from Amazon.
 * Useful for getting category info, bullet points, etc.
 */
export async function rainforestProduct(
  asin: string
): Promise<RainforestProductResponse["product"] | null> {
  const params = new URLSearchParams({
    api_key: getKey(),
    type: "product",
    amazon_domain: "amazon.com",
    asin,
  });

  const res = await fetchWithTimeout(`${RAINFOREST_BASE}?${params}`);

  if (!res.ok) return null;

  const data: RainforestProductResponse = await res.json();
  return data.product || null;
}

export interface RainforestBestsellersResponse {
  request_info: { success: boolean; message?: string };
  bestsellers?: RainforestSearchResult[];
}

/**
 * Fetch Amazon bestsellers for a given category node ID.
 * Returns up to 50 top-ranked products (no sponsored items).
 */
export async function rainforestBestsellers(
  categoryId: string
): Promise<RainforestSearchResult[]> {
  const params = new URLSearchParams({
    api_key: getKey(),
    type: "bestsellers",
    amazon_domain: "amazon.com",
    category_id: categoryId,
  });

  const res = await fetchWithTimeout(`${RAINFOREST_BASE}?${params}`);
  if (!res.ok) return [];

  const data: RainforestBestsellersResponse = await res.json();
  if (!data.request_info?.success) return [];

  return (data.bestsellers || []).filter((r) => r.asin && !r.sponsored);
}

/**
 * Map an Amazon category name to one of our app's category buckets.
 */
export function mapCategory(raw: string | undefined): string {
  if (!raw) return "Other";
  const l = raw.toLowerCase();
  if (l.includes("kitchen") || l.includes("home") || l.includes("garden") || l.includes("plant")) return "Kitchen";
  if (l.includes("pet") || l.includes("dog") || l.includes("cat")) return "Pet";
  if (l.includes("sport") || l.includes("outdoor") || l.includes("fitness") || l.includes("exercise")) return "Sports";
  if (l.includes("beauty") || l.includes("personal") || l.includes("skin") || l.includes("hair")) return "Beauty";
  if (l.includes("office") || l.includes("stationery")) return "Office";
  if (l.includes("baby") || l.includes("toddler") || l.includes("infant") || l.includes("kid") || l.includes("child")) return "Baby";
  if (l.includes("toy") || l.includes("game")) return "Toys";
  if (l.includes("cloth") || l.includes("apparel") || l.includes("fashion")) return "Clothing";
  if (l.includes("electronic") || l.includes("tech") || l.includes("computer") || l.includes("phone")) return "Electronics";
  if (l.includes("book") || l.includes("media")) return "Books";
  return "Other";
}
