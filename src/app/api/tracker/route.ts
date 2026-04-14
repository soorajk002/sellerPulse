import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const trackedProducts = await prisma.trackedProduct.findMany({
      where: { userId: session.user.id },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    });

    const parsed = trackedProducts.map((tp) => ({
      ...tp,
      product: {
        ...tp.product,
        sparkline: JSON.parse(tp.product.sparkline),
      },
    }));

    return NextResponse.json({ trackedProducts: parsed });
  } catch (error) {
    console.error("Tracker GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tracked products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    const tracked = await prisma.trackedProduct.create({
      data: {
        userId: session.user.id,
        productId,
      },
    });

    return NextResponse.json({ tracked }, { status: 201 });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Product already tracked" },
        { status: 409 }
      );
    }
    console.error("Tracker POST error:", error);
    return NextResponse.json(
      { error: "Failed to track product" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    await prisma.trackedProduct.deleteMany({
      where: {
        userId: session.user.id,
        productId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tracker DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to untrack product" },
      { status: 500 }
    );
  }
}
