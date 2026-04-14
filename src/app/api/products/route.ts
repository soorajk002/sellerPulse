import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    // Keywords request
    if (type === "keywords") {
      const keywords = await prisma.keyword.findMany({
        orderBy: { volume: "desc" },
      });
      return NextResponse.json({ keywords });
    }

    // Products request with optional filters
    const q = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const minScore = parseFloat(searchParams.get("minScore") || "0");
    const competition = searchParams.get("competition") || "";
    const minRevenue = parseInt(searchParams.get("minRevenue") || "0");
    const maxRevenue = parseInt(searchParams.get("maxRevenue") || "999999999");
    const maxReviews = parseInt(searchParams.get("maxReviews") || "999999");

    const products = await prisma.product.findMany({
      where: {
        AND: [
          q ? {
            OR: [
              { name: { contains: q } },
              { asin: { contains: q } },
              { category: { contains: q } },
            ],
          } : {},
          category ? { category } : {},
          minScore > 0 ? { score: { gte: minScore } } : {},
          competition ? { competition } : {},
          minRevenue > 0 ? { revenue: { gte: minRevenue } } : {},
          maxRevenue < 999999999 ? { revenue: { lte: maxRevenue } } : {},
          maxReviews < 999999 ? { reviews: { lte: maxReviews } } : {},
        ],
      },
      orderBy: { score: "desc" },
    });

    // Parse sparkline JSON for each product
    const parsedProducts = products.map((p) => ({
      ...p,
      sparkline: JSON.parse(p.sparkline),
    }));

    return NextResponse.json({ products: parsedProducts });
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
