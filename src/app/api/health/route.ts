import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Protect with a secret so this isn't publicly enumerable
const HEALTH_SECRET = process.env.HEALTH_SECRET ?? process.env.NEXTAUTH_SECRET;

export async function GET(request: NextRequest) {
  const token = request.headers.get("x-health-token") ??
    request.nextUrl.searchParams.get("token");

  if (!token || token !== HEALTH_SECRET) {
    return NextResponse.json({ status: "unauthorized" }, { status: 401 });
  }

  const checks: Record<string, string> = {};
  checks.DATABASE_URL = process.env.DATABASE_URL ? "set" : "MISSING";
  checks.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET ? "set" : "MISSING";
  checks.KEEPA_API_KEY = process.env.KEEPA_API_KEY ? "set" : "MISSING";
  checks.RAINFOREST_API_KEY = process.env.RAINFOREST_API_KEY ? "set" : "MISSING";

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.db_connection = "ok";
  } catch (e) {
    checks.db_connection = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
  }

  try {
    const count = await prisma.user.count();
    checks.users_table = `ok (${count} rows)`;
  } catch {
    checks.users_table = "MISSING — run: npx prisma db push";
  }

  try {
    const count = await prisma.product.count();
    checks.products_table = `ok (${count} rows)`;
  } catch {
    checks.products_table = "MISSING — run: npx prisma db push";
  }

  const allOk = Object.values(checks).every((v) => v === "set" || v.startsWith("ok"));
  return NextResponse.json(
    { status: allOk ? "healthy" : "unhealthy", checks },
    { status: allOk ? 200 : 500 }
  );
}
