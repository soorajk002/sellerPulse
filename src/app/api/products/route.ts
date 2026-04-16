/**
 * GET /api/products
 *
 * Flow when `category` is provided:
 *  1. Check SearchCache for "bestsellers:{category}" (24h TTL)
 *  2. Cache miss → fetch Rainforest bestsellers → Keepa enrichment
 *     → upsert into Product table → write cache marker
 *  3. Query Product table with all filter params → return
 *
 * Flow when no `category`:
 *  - Query Product table directly (fast; may return empty if DB not seeded)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rainforestBestsellers } from "@/lib/rainforest";
import { keepaProducts } from "@/lib/keepa";
import { buildProduct, sellerScore, competitionLevel, estimateMargin, bsrToMonthlyUnits } from "@/lib/scoring";
import { mapCategory, type RainforestSearchResult } from "@/lib/rainforest";
import { parseSparkline } from "@/lib/utils";
import type { ProductInsert } from "@/types";
import type { Prisma } from "@prisma/client";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Amazon browse node IDs for bestseller pages
const CATEGORY_NODE: Record<string, string> = {
  Kitchen:     "284507",
  Pet:         "2619533011",
  Sports:      "3375251",
  Beauty:      "11055981",
  Office:      "1064954",
  Baby:        "165797011",
  Toys:        "165993011",
  Clothing:    "7141123011",
  Electronics: "172282",
  Books:       "283155",
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

    // ── 1. If a category is selected, ensure its data is fresh ─────────────
    if (category && CATEGORY_NODE[category]) {
      const cacheKey = `bestsellers:${category.toLowerCase()}`;
      const cached = await prisma.searchCache.findUnique({ where: { query: cacheKey } });
      const isStale = !cached || cached.expiresAt < new Date();

      if (isStale) {
        await seedCategory(category, CATEGORY_NODE[category], cacheKey);
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
      live: category && CATEGORY_NODE[category] ? true : false,
    });
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// ── Category seeder ───────────────────────────────────────────────────────────

async function seedCategory(category: string, nodeId: string, cacheKey: string) {
  try {
    const rfResults = await rainforestBestsellers(nodeId);
    if (rfResults.length === 0) return;

    const asins = rfResults.map((r) => r.asin);
    const keepaData = await keepaProducts(asins).catch(() => []);
    const keepaMap = new Map(keepaData.map((k) => [k.asin, k]));
    const rfMap = new Map(rfResults.map((r) => [r.asin, r]));

    for (const asin of asins) {
      const keepa = keepaMap.get(asin);
      const rf = rfMap.get(asin) ?? null;
      if (!keepa && !rf) continue;

      const data: ProductInsert = keepa
        ? buildProduct(keepa, rf)
        : buildFromRF(rf!, category);

      if (!data.name || data.price <= 0) continue;

      try {
        await prisma.product.upsert({
          where: { asin: data.asin },
          update: { name: data.name, category: data.category, revenue: data.revenue, bsr: data.bsr, price: data.price, reviews: data.reviews, score: data.score, competition: data.competition, trend: data.trend, margin: data.margin, sparkline: data.sparkline },
          create: { emoji: data.emoji, name: data.name, asin: data.asin, category: data.category, revenue: data.revenue, bsr: data.bsr, price: data.price, reviews: data.reviews, score: data.score, competition: data.competition, trend: data.trend, margin: data.margin, sparkline: data.sparkline },
        });
      } catch { /* skip */ }
    }

    // Mark category as fresh
    const expiresAt = new Date(Date.now() + CACHE_TTL_MS);
    await prisma.searchCache.upsert({
      where: { query: cacheKey },
      update: { results: String(rfResults.length), fetchedAt: new Date(), expiresAt },
      create: { query: cacheKey, results: String(rfResults.length), expiresAt },
    });
  } catch (err) {
    console.error(`Failed to seed category ${category}:`, err);
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
