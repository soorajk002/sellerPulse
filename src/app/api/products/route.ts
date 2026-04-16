import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseSparkline } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

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
    const limit       = Math.min(parseInt(s.get("limit") || "50"), 100);

    const allowedSort = ["score", "revenue", "bsr", "price", "reviews", "margin", "createdAt"];
    const safeSort    = allowedSort.includes(sortBy) ? sortBy : "score";

    const where: Prisma.ProductWhereInput = {
      AND: [
        category    ? { category }    : {},
        competition ? { competition } : {},
        trend       ? { trend }       : {},
        minScore  > 0 ? { score:   { gte: minScore } }  : {},
        maxScore  > 0 ? { score:   { lte: maxScore } }  : {},
        minRevenue > 0 ? { revenue: { gte: minRevenue } } : {},
        maxRevenue > 0 ? { revenue: { lte: maxRevenue } } : {},
        minBSR    > 0 ? { bsr:     { gte: minBSR } }    : {},
        maxBSR    > 0 ? { bsr:     { lte: maxBSR } }    : {},
        minPrice  > 0 ? { price:   { gte: minPrice } }  : {},
        maxPrice  > 0 ? { price:   { lte: maxPrice } }  : {},
        maxReviews > 0 ? { reviews: { lte: maxReviews } } : {},
        minMargin > 0 ? { margin:  { gte: minMargin } } : {},
      ],
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { [safeSort]: sortDir },
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products: products.map((p) => ({
        ...p,
        sparkline: parseSparkline(p.sparkline),
        createdAt: p.createdAt.toISOString(),
      })),
      total,
    });
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
