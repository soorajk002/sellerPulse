/**
 * GET /api/products
 *
 * Flow when `category` is provided:
 *  1. Check SearchCache for "search:{category}:{minPrice}-{maxPrice}" (24h TTL)
 *  2. Cache miss → fetch 3 pages of Rainforest search results (with price
 *     filters if set) → Keepa enrichment → upsert into Product table → cache
 *  3. Query Product table with all remaining filter params → return
 *
 * Flow when no `category`:
 *  - Query Product table directly
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rainforestSearch } from "@/lib/rainforest";
import { keepaProducts } from "@/lib/keepa";
import { buildProduct, sellerScore, competitionLevel, estimateMargin, bsrToMonthlyUnits } from "@/lib/scoring";
import { mapCategory, type RainforestSearchResult } from "@/lib/rainforest";
import { parseSparkline } from "@/lib/utils";
import type { ProductInsert } from "@/types";
import type { Prisma } from "@prisma/client";

export const maxDuration = 60;

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const SEARCH_PAGES = 3;

// Category-specific search terms that yield broad, relevant Amazon results
const CATEGORY_SEARCH: Record<string, string> = {
  Kitchen:     "kitchen home cooking accessories gadgets",
  Pet:         "pet supplies dog cat accessories",
  Sports:      "sports fitness outdoor exercise equipment",
  Beauty:      "beauty skincare personal care cosmetics",
  Office:      "office supplies desk organization stationery",
  Baby:        "baby products infant toddler accessories",
  Toys:        "toys games children educational",
  Clothing:    "clothing apparel fashion accessories",
  Electronics: "electronics smart home gadgets tech accessories",
  Books:       "books bestsellers nonfiction self help",
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const s = new URL(request.url).searchParams;

    const category    = s.get("category") || "";
    const competition = s.get("competition") || "";
    const trend       = s.get("trend") || "";
    const minScore    = parseFloat(s.get("minScore") || "0");
    const maxScore    = parseFloat(s.get("maxScore") || "0");
    const minRevenue  = parseInt(s.get("minRevenue") || "0");
    const maxRevenue  = parseInt(s.get("maxRevenue") || "0");
    const minBSR      = parseInt(s.get("minBSR") || "0");
    const maxBSR      = parseInt(s.get("maxBSR") || "0");
    const minPrice    = parseFloat(s.get("minPrice") || "0");
    const maxPrice    = parseFloat(s.get("maxPrice") || "0");
    const maxReviews  = parseInt(s.get("maxReviews") || "0");
    const minMargin   = parseInt(s.get("minMargin") || "0");
    const sortBy      = s.get("sortBy") || "score";
    const sortDir     = (s.get("sortDir") || "desc") as "asc" | "desc";
    const limit       = Math.min(parseInt(s.get("limit") || "100"), 200);

    const allowedSort = ["score", "revenue", "bsr", "price", "reviews", "margin", "createdAt"];
    const safeSort    = allowedSort.includes(sortBy) ? sortBy : "score";

    // ── 1. Fetch & cache search results for this category + price range ────────
    if (category && CATEGORY_SEARCH[category]) {
      const cacheKey = `search:${category.toLowerCase()}:${minPrice}-${maxPrice}`;
      const cached = await prisma.searchCache.findUnique({ where: { query: cacheKey } });
      const isStale = !cached || cached.expiresAt < new Date();

      if (isStale) {
        await seedFromSearch(
          category,
          CATEGORY_SEARCH[category],
          cacheKey,
          minPrice,
          maxPrice,
        );
      }
    }

    // ── 2. Query DB with all filters ────────────────────────────────────────
    const where: Prisma.ProductWhereInput = {
      AND: [
        category    ? { category }    : {},
        competition ? { competition } : {},
        trend       ? { trend }       : {},
        minScore  > 0 ? { score:   { gte: minScore } }   : {},
        maxScore  > 0 ? { score:   { lte: maxScore } }   : {},
        minRevenue > 0 ? { revenue: { gte: minRevenue } } : {},
        maxRevenue > 0 ? { revenue: { lte: maxRevenue } } : {},
        minBSR    > 0 ? { bsr:     { gte: minBSR } }     : {},
        maxBSR    > 0 ? { bsr:     { lte: maxBSR } }     : {},
        minPrice  > 0 ? { price:   { gte: minPrice } }   : {},
        maxPrice  > 0 ? { price:   { lte: maxPrice } }   : {},
        maxReviews > 0 ? { reviews: { lte: maxReviews } } : {},
        minMargin > 0 ? { margin:  { gte: minMargin } }  : {},
      ],
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, orderBy: { [safeSort]: sortDir }, take: limit }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products: products.map((p) => ({
        ...p,
        sparkline: parseSparkline(p.sparkline),
        createdAt: p.createdAt.toISOString(),
      })),
      total,
      live: category && CATEGORY_SEARCH[category] ? true : false,
    });
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// ── Search-based seeder ───────────────────────────────────────────────────────

async function seedFromSearch(
  category: string,
  searchTerm: string,
  cacheKey: string,
  minPrice: number,
  maxPrice: number,
) {
  try {
    const priceOpts = {
      minPrice: minPrice > 0 ? minPrice : undefined,
      maxPrice: maxPrice > 0 ? maxPrice : undefined,
    };

    // Fetch all pages in parallel — 3× faster than sequential
    const pages = await Promise.all(
      Array.from({ length: SEARCH_PAGES }, (_, i) =>
        rainforestSearch(searchTerm, i + 1, priceOpts).catch(() => [])
      )
    );
    const allResults = pages.flat();
    if (allResults.length === 0) return;

    // Deduplicate by ASIN
    const seen = new Set<string>();
    const rfResults = allResults.filter((r) => {
      if (seen.has(r.asin)) return false;
      seen.add(r.asin);
      return true;
    });

    const asins = rfResults.map((r) => r.asin);

    // Skip Keepa for ASINs already in DB — only enrich new ones
    const existing = await prisma.product.findMany({
      where: { asin: { in: asins } },
      select: { asin: true },
    });
    const existingSet = new Set(existing.map((p) => p.asin));
    const newAsins = asins.filter((a) => !existingSet.has(a));

    const keepaData = newAsins.length > 0
      ? await keepaProducts(newAsins).catch(() => [])
      : [];
    const keepaMap = new Map(keepaData.map((k) => [k.asin, k]));
    const rfMap    = new Map(rfResults.map((r) => [r.asin, r]));

    // Build upsert payloads for new ASINs only
    const toUpsert: ProductInsert[] = [];
    for (const asin of newAsins) {
      const keepa = keepaMap.get(asin);
      const rf    = rfMap.get(asin) ?? null;
      if (!keepa && !rf) continue;
      const data: ProductInsert = keepa ? buildProduct(keepa, rf) : buildFromRF(rf!, category);
      if (!data.name || data.price <= 0) continue;
      // mapCategory() returns "Other" when Keepa/RF lack category metadata —
      // products from a category search belong to that category regardless.
      if (data.category === "Other") data.category = category;
      toUpsert.push(data);
    }

    // Upsert all in parallel
    await Promise.allSettled(
      toUpsert.map((data) =>
        prisma.product.upsert({
          where: { asin: data.asin },
          update: { name: data.name, category: data.category, revenue: data.revenue, bsr: data.bsr, price: data.price, reviews: data.reviews, score: data.score, competition: data.competition, trend: data.trend, margin: data.margin, sparkline: data.sparkline },
          create: { emoji: data.emoji, name: data.name, asin: data.asin, category: data.category, revenue: data.revenue, bsr: data.bsr, price: data.price, reviews: data.reviews, score: data.score, competition: data.competition, trend: data.trend, margin: data.margin, sparkline: data.sparkline },
        })
      )
    );

    const expiresAt = new Date(Date.now() + CACHE_TTL_MS);
    await prisma.searchCache.upsert({
      where: { query: cacheKey },
      update: { results: String(rfResults.length), fetchedAt: new Date(), expiresAt },
      create: { query: cacheKey, results: String(rfResults.length), expiresAt },
    });
  } catch (err) {
    console.error(`Failed to seed from search for ${category}:`, err);
  }
}

function buildFromRF(rf: RainforestSearchResult, categoryHint: string): ProductInsert {
  const reviews = rf.ratings_total ?? 0;
  const price   = rf.price?.value ?? 0;
  const bsr     = rf.bestseller_rank?.[0]?.rank ?? 50000;
  const trend   = "flat" as const;
  const cat     = rf.categories?.[0]?.name ? mapCategory(rf.categories[0].name) : categoryHint;

  return {
    emoji: "📦",
    name: rf.title,
    asin: rf.asin,
    category: cat,
    revenue: Math.round(bsrToMonthlyUnits(bsr) * price),
    bsr, price, reviews,
    score: sellerScore(bsr, reviews, price, trend),
    competition: competitionLevel(reviews),
    trend,
    margin: estimateMargin(price),
    sparkline: JSON.stringify([]),
  };
}
