/**
 * POST /api/admin/seed
 * Body: { categoryKey: string }  — one of the keys in SEED_CATEGORIES, or "all"
 *
 * Fetches Amazon bestsellers for the requested category via Rainforest,
 * enriches with Keepa, scores with SellerScore, and upserts into the DB.
 * Requires a valid session (any authenticated user).
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rainforestBestsellers, mapCategory, type RainforestSearchResult } from "@/lib/rainforest";
import { keepaProducts } from "@/lib/keepa";
import { buildProduct, sellerScore, competitionLevel, estimateMargin, bsrToMonthlyUnits } from "@/lib/scoring";
import type { ProductInsert } from "@/types";
import { parseSparkline } from "@/lib/utils";

// Amazon browse node IDs for bestseller pages
const SEED_CATEGORIES: Record<string, { name: string; nodeId: string }> = {
  kitchen:     { name: "Kitchen",      nodeId: "284507" },
  pet:         { name: "Pet",          nodeId: "2619533011" },
  sports:      { name: "Sports",       nodeId: "3375251" },
  beauty:      { name: "Beauty",       nodeId: "11055981" },
  office:      { name: "Office",       nodeId: "1064954" },
  baby:        { name: "Baby",         nodeId: "165797011" },
  toys:        { name: "Toys",         nodeId: "165993011" },
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { categoryKey } = await request.json() as { categoryKey: string };

  const toSeed = categoryKey === "all"
    ? Object.entries(SEED_CATEGORIES)
    : Object.entries(SEED_CATEGORIES).filter(([k]) => k === categoryKey);

  if (toSeed.length === 0) {
    return NextResponse.json({ error: "Unknown category" }, { status: 400 });
  }

  const summary: Record<string, number> = {};

  for (const [key, { name, nodeId }] of toSeed) {
    try {
      // 1. Fetch bestsellers from Rainforest
      const rfResults = await rainforestBestsellers(nodeId);
      if (rfResults.length === 0) {
        summary[key] = 0;
        continue;
      }

      // 2. Enrich with Keepa
      const asins = rfResults.map((r) => r.asin);
      const keepaData = await keepaProducts(asins).catch(() => []);
      const keepaMap = new Map(keepaData.map((k) => [k.asin, k]));
      const rfMap = new Map(rfResults.map((r) => [r.asin, r]));

      // 3. Build + score
      const enriched: ProductInsert[] = [];
      for (const asin of asins) {
        const keepa = keepaMap.get(asin);
        const rf = rfMap.get(asin) ?? null;
        if (!keepa && !rf) continue;

        const data = keepa ? buildProduct(keepa, rf) : buildFromRF(rf!, name);
        if (!data.name || data.price <= 0) continue;
        enriched.push(data);
      }

      // 4. Upsert into DB
      let saved = 0;
      for (const p of enriched) {
        try {
          await prisma.product.upsert({
            where: { asin: p.asin },
            update: { name: p.name, category: p.category, revenue: p.revenue, bsr: p.bsr, price: p.price, reviews: p.reviews, score: p.score, competition: p.competition, trend: p.trend, margin: p.margin, sparkline: p.sparkline },
            create: { emoji: p.emoji, name: p.name, asin: p.asin, category: p.category, revenue: p.revenue, bsr: p.bsr, price: p.price, reviews: p.reviews, score: p.score, competition: p.competition, trend: p.trend, margin: p.margin, sparkline: p.sparkline },
          });
          saved++;
        } catch { /* skip duplicate / constraint errors */ }
      }

      summary[key] = saved;
    } catch (err) {
      console.error(`Seed failed for category ${key}:`, err);
      summary[key] = -1;
    }
  }

  const total = Object.values(summary).filter((n) => n >= 0).reduce((a, b) => a + b, 0);
  return NextResponse.json({ summary, total });
}

function buildFromRF(rf: RainforestSearchResult, categoryHint: string): ProductInsert {
  const reviews = rf.ratings_total ?? 0;
  const price   = rf.price?.value ?? 0;
  const bsr     = rf.bestseller_rank?.[0]?.rank ?? 50000;
  const trend   = "flat" as const;
  const score   = sellerScore(bsr, reviews, price, trend);
  const units   = bsrToMonthlyUnits(bsr);
  const cat     = rf.categories?.[0]?.name ? mapCategory(rf.categories[0].name) : categoryHint;

  return {
    emoji: "📦",
    name: rf.title,
    asin: rf.asin,
    category: cat,
    revenue: Math.round(units * price),
    bsr,
    price,
    reviews,
    score,
    competition: competitionLevel(reviews),
    trend,
    margin: estimateMargin(price),
    sparkline: JSON.stringify([]),
  };
}

// Suppress unused import warning
void parseSparkline;
