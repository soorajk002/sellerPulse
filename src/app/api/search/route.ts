/**
 * POST /api/search
 * Body: { query: string }
 *
 * Flow:
 *  1. Check DB cache (24h TTL) — return immediately if fresh
 *  2. Call Rainforest to get top ASINs from Amazon search results
 *  3. Feed those ASINs to Keepa for historical BSR, price, review data
 *  4. Compute SellerScore for each product
 *  5. Upsert products into the Product table
 *  6. Cache results in SearchCache
 *  7. Return enriched products sorted by score
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rainforestSearch, type RainforestSearchResult } from "@/lib/rainforest";
import { keepaProducts, type KeepaRawProduct } from "@/lib/keepa";
import { buildProduct } from "@/lib/scoring";
import type { Product } from "@/types";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_RESULTS = 20;

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { query } = await request.json();
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const normalizedQuery = query.trim().toLowerCase();

    // ── 1. Cache check ─────────────────────────────────────────────────────
    const cached = await prisma.searchCache.findUnique({
      where: { query: normalizedQuery },
    });

    if (cached && cached.expiresAt > new Date()) {
      const products = JSON.parse(cached.results) as Product[];
      return NextResponse.json({
        products,
        cached: true,
        cachedAt: cached.fetchedAt,
      });
    }

    // ── 2. Rainforest search ───────────────────────────────────────────────
    let rfResults: RainforestSearchResult[] = [];
    try {
      rfResults = await rainforestSearch(normalizedQuery);
      rfResults = rfResults.slice(0, MAX_RESULTS);
    } catch (err) {
      console.error("Rainforest error:", err);
      // Fall back to Keepa-only search if Rainforest fails
    }

    const asins = rfResults.map((r) => r.asin).filter(Boolean);

    if (asins.length === 0) {
      return NextResponse.json({
        products: [],
        message: "No results found on Amazon for this query.",
      });
    }

    // ── 3. Keepa enrichment ───────────────────────────────────────────────
    let keepaData: KeepaRawProduct[] = [];
    try {
      keepaData = await keepaProducts(asins);
    } catch (err) {
      console.error("Keepa error:", err);
      // If Keepa fails, we can still return Rainforest data with estimated metrics
    }

    // Build a map for quick lookup
    const keepaMap = new Map<string, KeepaRawProduct>(
      keepaData.map((k) => [k.asin, k])
    );
    const rfMap = new Map<string, RainforestSearchResult>(
      rfResults.map((r) => [r.asin, r])
    );

    // ── 4. Build + score products ─────────────────────────────────────────
    const enriched: (Omit<Product, "id"> & { id?: string })[] = [];

    for (const asin of asins) {
      const keepa = keepaMap.get(asin);
      const rf = rfMap.get(asin) ?? null;

      if (!keepa && !rf) continue;

      // If we have no Keepa data, build a minimal product from Rainforest only
      const productData = keepa
        ? buildProduct(keepa, rf)
        : buildProductFromRainforest(rf!);

      if (!productData.name || productData.price <= 0) continue;

      enriched.push(productData);
    }

    // Sort by score descending
    enriched.sort((a, b) => b.score - a.score);

    // ── 5. Upsert products into DB ────────────────────────────────────────
    const saved: Product[] = [];
    for (const p of enriched) {
      try {
        const product = await prisma.product.upsert({
          where: { asin: p.asin },
          update: {
            name: p.name,
            category: p.category,
            revenue: p.revenue,
            bsr: p.bsr,
            price: p.price,
            reviews: p.reviews,
            score: p.score,
            competition: p.competition,
            trend: p.trend,
            margin: p.margin,
            sparkline: p.sparkline,
          },
          create: {
            emoji: p.emoji,
            name: p.name,
            asin: p.asin,
            category: p.category,
            revenue: p.revenue,
            bsr: p.bsr,
            price: p.price,
            reviews: p.reviews,
            score: p.score,
            competition: p.competition,
            trend: p.trend,
            margin: p.margin,
            sparkline: p.sparkline,
          },
        });

        saved.push({
          ...product,
          sparkline: JSON.parse(product.sparkline),
        } as unknown as Product);
      } catch (e) {
        console.error(`Failed to upsert product ${p.asin}:`, e);
      }
    }

    // ── 6. Cache results ──────────────────────────────────────────────────
    const expiresAt = new Date(Date.now() + CACHE_TTL_MS);
    await prisma.searchCache.upsert({
      where: { query: normalizedQuery },
      update: {
        results: JSON.stringify(saved),
        fetchedAt: new Date(),
        expiresAt,
      },
      create: {
        query: normalizedQuery,
        results: JSON.stringify(saved),
        expiresAt,
      },
    });

    // Increment user search count
    await prisma.user.update({
      where: { id: session.user.id },
      data: { searches: { increment: 1 } },
    });

    return NextResponse.json({ products: saved, cached: false });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Search failed. Please try again." },
      { status: 500 }
    );
  }
}

/** Fallback: build a product from Rainforest data only (no Keepa). */
function buildProductFromRainforest(
  rf: RainforestSearchResult
): Omit<Product, "id"> {
  const reviews = rf.ratings_total ?? 0;
  const price = rf.price?.value ?? 0;
  const bsr = rf.bestseller_rank?.[0]?.rank ?? 50000;
  const trend = "flat" as const;

  const { sellerScore, competitionLevel, estimateMargin, bsrToMonthlyUnits } =
    require("@/lib/scoring") as typeof import("@/lib/scoring");

  const score = sellerScore(bsr, reviews, price, trend);
  const units = bsrToMonthlyUnits(bsr);

  return {
    emoji: "📦",
    name: rf.title,
    asin: rf.asin,
    category: rf.categories?.[0]?.name ?? "Other",
    revenue: Math.round(units * price),
    bsr,
    price,
    reviews,
    score,
    competition: competitionLevel(reviews),
    trend,
    margin: estimateMargin(price),
    sparkline: JSON.stringify([]),
    createdAt: new Date(),
  };
}
