import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const checks: Record<string, string> = {};

  // Check env vars
  checks.DATABASE_URL = process.env.DATABASE_URL ? "set" : "MISSING";
  checks.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET ? "set" : "MISSING";

  // Check DB connection + tables
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.db_connection = "ok";
  } catch (e) {
    checks.db_connection = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
  }

  try {
    const count = await prisma.user.count();
    checks.users_table = `ok (${count} rows)`;
  } catch (e) {
    checks.users_table = `MISSING — run: npx prisma db push`;
  }

  try {
    const count = await prisma.product.count();
    checks.products_table = `ok (${count} rows)`;
  } catch (e) {
    checks.products_table = `MISSING — run: npx prisma db push`;
  }

  const allOk = Object.values(checks).every((v) => v === "set" || v.startsWith("ok"));

  return NextResponse.json(
    { status: allOk ? "healthy" : "unhealthy", checks },
    { status: allOk ? 200 : 500 }
  );
}
