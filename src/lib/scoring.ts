/**
 * SellerScore algorithm
 *
 * Combines demand, competition, margin potential, and trend signals
 * into a single 0–10 opportunity score — matching the prototype's
 * scoring philosophy.
 *
 * Weights:
 *  35% Demand     – driven by BSR (lower = stronger demand)
 *  30% Competition– driven by review count (fewer = easier to enter)
 *  20% Margin     – driven by price (higher price = more room for fees/PPC)
 *  15% Trend      – driven by BSR direction over last 15 data points
 */

import type { Product } from "@/types";
import {
  getBSR,
  getBSRSparkline,
  getBSRTrend,
  keepaPrice,
  type KeepaRawProduct,
} from "./keepa";
import { mapCategory, type RainforestSearchResult } from "./rainforest";

// ── BSR → estimated monthly units ────────────────────────────────────────────

/**
 * Rough BSR-to-units-per-month estimate for general Amazon.com categories.
 * Sourced from industry benchmarks (Jungle Scout / Helium 10 public data).
 */
export function bsrToMonthlyUnits(bsr: number): number {
  if (bsr <= 0) return 0;
  if (bsr <= 50) return 12000;
  if (bsr <= 100) return 8000;
  if (bsr <= 300) return 5000;
  if (bsr <= 500) return 3500;
  if (bsr <= 1000) return 2200;
  if (bsr <= 2000) return 1400;
  if (bsr <= 3000) return 1000;
  if (bsr <= 5000) return 700;
  if (bsr <= 10000) return 450;
  if (bsr <= 20000) return 280;
  if (bsr <= 30000) return 180;
  if (bsr <= 50000) return 110;
  if (bsr <= 75000) return 65;
  if (bsr <= 100000) return 40;
  if (bsr <= 150000) return 22;
  if (bsr <= 250000) return 12;
  if (bsr <= 500000) return 5;
  return 2;
}

// ── Sub-score helpers (each returns 0–10) ────────────────────────────────────

function demandScore(bsr: number): number {
  if (bsr <= 500) return 10;
  if (bsr <= 1000) return 9.2;
  if (bsr <= 2000) return 8.5;
  if (bsr <= 3500) return 7.8;
  if (bsr <= 5000) return 7.0;
  if (bsr <= 8000) return 6.2;
  if (bsr <= 12000) return 5.4;
  if (bsr <= 20000) return 4.6;
  if (bsr <= 35000) return 3.8;
  if (bsr <= 60000) return 3.0;
  if (bsr <= 100000) return 2.2;
  if (bsr <= 200000) return 1.4;
  return 0.6;
}

function competitionScore(reviews: number): number {
  if (reviews <= 25) return 10;
  if (reviews <= 50) return 9.2;
  if (reviews <= 100) return 8.4;
  if (reviews <= 150) return 7.6;
  if (reviews <= 250) return 6.8;
  if (reviews <= 400) return 5.8;
  if (reviews <= 600) return 4.8;
  if (reviews <= 900) return 3.8;
  if (reviews <= 1500) return 2.8;
  if (reviews <= 3000) return 1.8;
  return 0.8;
}

function marginScore(price: number): number {
  if (price >= 60) return 10;
  if (price >= 45) return 9.0;
  if (price >= 35) return 8.0;
  if (price >= 28) return 7.0;
  if (price >= 22) return 6.0;
  if (price >= 16) return 5.0;
  if (price >= 12) return 4.0;
  if (price >= 8) return 3.0;
  if (price >= 5) return 2.0;
  return 1.0;
}

function trendScore(trend: "up" | "down" | "flat"): number {
  if (trend === "up") return 9.0;
  if (trend === "flat") return 6.0;
  return 2.5;
}

// ── Competition level ─────────────────────────────────────────────────────────

export function competitionLevel(reviews: number): "Low" | "Medium" | "High" {
  if (reviews < 150) return "Low";
  if (reviews < 500) return "Medium";
  return "High";
}

// ── Margin estimate after Amazon fees ────────────────────────────────────────

/**
 * Estimates net margin % after:
 *  - Amazon referral fee: 15%
 *  - FBA fulfillment fee: approx based on price tier
 *  - Estimated COGS: 30% of price (typical sourcing ratio)
 */
export function estimateMargin(price: number): number {
  const referral = price * 0.15;
  const fba = price < 10 ? 2.50 : price < 20 ? 3.00 : price < 35 ? 3.50 : 4.50;
  const cogs = price * 0.30;
  const net = price - referral - fba - cogs;
  return Math.max(5, Math.round((net / price) * 100));
}

// ── Main scoring function ─────────────────────────────────────────────────────

export function sellerScore(
  bsr: number,
  reviews: number,
  price: number,
  trend: "up" | "down" | "flat"
): number {
  const raw =
    demandScore(bsr) * 0.35 +
    competitionScore(reviews) * 0.30 +
    marginScore(price) * 0.20 +
    trendScore(trend) * 0.15;

  return Math.round(Math.min(10, Math.max(0, raw)) * 10) / 10;
}

// ── Build Product from Keepa + Rainforest data ────────────────────────────────

/**
 * Merge a Keepa raw product with its Rainforest search result entry
 * into our app's Product shape.
 */
export function buildProduct(
  keepa: KeepaRawProduct,
  rf: RainforestSearchResult | null
): Omit<Product, "id"> {
  const reviews = keepa.reviewCount ?? rf?.ratings_total ?? 0;

  // Price: prefer Keepa buybox (csv index 0 = Amazon price, 18 = Buy Box)
  const keepaBuyBox = keepaPrice(keepa.csv?.[18]?.[keepa.csv[18].length - 1]);
  const keepaAmazon = keepaPrice(keepa.csv?.[0]?.[keepa.csv[0].length - 1]);
  const rfPrice = rf?.price?.value ?? null;
  const price = keepaBuyBox ?? keepaAmazon ?? rfPrice ?? 0;

  const bsr = getBSR(keepa.salesRanks);
  const sparkline = getBSRSparkline(keepa.salesRanks);
  const trend = getBSRTrend(sparkline);

  const units = bsrToMonthlyUnits(bsr);
  const revenue = Math.round(units * price);

  const score = sellerScore(bsr, reviews, price, trend);
  const competition = competitionLevel(reviews);
  const margin = estimateMargin(price);

  // Category: prefer Rainforest (cleaner text) then Keepa
  const rawCategory =
    rf?.categories?.[0]?.name ??
    keepa.categoryTreeName ??
    "";
  const category = mapCategory(rawCategory);

  // Pick an emoji based on category
  const emoji = categoryEmoji(category, keepa.title ?? "");

  return {
    emoji,
    name: keepa.title ?? rf?.title ?? "Unknown Product",
    asin: keepa.asin,
    category,
    revenue,
    bsr,
    price,
    reviews,
    score,
    competition,
    trend,
    margin,
    sparkline: JSON.stringify(sparkline),
    createdAt: new Date(),
  };
}

const CATEGORY_EMOJI: Record<string, string> = {
  Kitchen: "🍳",
  Pet: "🐾",
  Sports: "⚽",
  Beauty: "💄",
  Office: "📎",
  Baby: "🍼",
  Toys: "🧸",
  Clothing: "👕",
  Electronics: "💻",
  Books: "📚",
  Other: "📦",
};

function categoryEmoji(category: string, title: string): string {
  const t = title.toLowerCase();
  if (t.includes("bamboo") || t.includes("eco") || t.includes("plant")) return "🌿";
  if (t.includes("dog") || t.includes("puppy")) return "🐕";
  if (t.includes("cat") || t.includes("kitten")) return "🐱";
  if (t.includes("coffee") || t.includes("mug") || t.includes("tea")) return "☕";
  if (t.includes("baby") || t.includes("infant") || t.includes("toddler")) return "👶";
  if (t.includes("backpack") || t.includes("bag")) return "🎒";
  if (t.includes("band") || t.includes("weight") || t.includes("dumbbell")) return "💪";
  if (t.includes("serum") || t.includes("cream") || t.includes("moistur")) return "🧴";
  if (t.includes("spoon") || t.includes("fork") || t.includes("utensil")) return "🥄";
  if (t.includes("pen") || t.includes("pencil")) return "🖊️";
  if (t.includes("cable") || t.includes("wire") || t.includes("usb")) return "📎";
  if (t.includes("bowl") || t.includes("feeder")) return "🥣";
  if (t.includes("massage") || t.includes("roller")) return "💆";
  if (t.includes("pot") || t.includes("planter")) return "🪴";
  if (t.includes("ring") || t.includes("stack")) return "🧸";
  if (t.includes("lunch") || t.includes("bento")) return "🫙";
  return CATEGORY_EMOJI[category] ?? "📦";
}
