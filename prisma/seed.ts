import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const products = [
  { e: "🫙", n: "Bamboo Fiber Lunch Box Set with Lid", a: "B09X4P2K1L", c: "Kitchen", r: 8240, bsr: 1240, p: 24.99, rv: 187, s: 9.1, comp: "Low", tr: "up", mg: 42, sp: [40,45,52,48,55,60,58,65,70,68,75,80,82,88,91] },
  { e: "🐕", n: "Slow Feeder Dog Bowl Anti-Bloat", a: "B09L3KM7XQ", c: "Pet", r: 7340, bsr: 1890, p: 16.99, rv: 203, s: 8.9, comp: "Low", tr: "up", mg: 47, sp: [45,50,55,52,58,62,60,65,70,68,75,78,80,85,88] },
  { e: "💪", n: "Resistance Bands Set 5 Levels Premium", a: "B08K7FMQ3A", c: "Sports", r: 6890, bsr: 2180, p: 18.99, rv: 312, s: 8.7, comp: "Low", tr: "up", mg: 51, sp: [50,52,55,58,54,60,62,58,65,68,70,72,75,78,80] },
  { e: "🎒", n: "Kids Waterproof Backpack 20L Reflective", a: "B0BN23KL09", c: "Baby", r: 4560, bsr: 4320, p: 27.99, rv: 88, s: 8.6, comp: "Low", tr: "up", mg: 49, sp: [25,30,32,35,38,42,40,48,52,50,58,62,65,70,72] },
  { e: "🌿", n: "Organic Rosehip Face Serum 30ml", a: "B07T9KL2PQ", c: "Beauty", r: 5670, bsr: 3420, p: 22.50, rv: 94, s: 8.5, comp: "Low", tr: "up", mg: 58, sp: [30,35,38,42,40,45,50,48,55,58,60,65,68,72,75] },
  { e: "🐱", n: "Cat Puzzle Feeder Interactive Toy", a: "B0BNOP6712", c: "Pet", r: 3780, bsr: 6780, p: 21.99, rv: 89, s: 8.4, comp: "Low", tr: "up", mg: 52, sp: [22,25,28,32,30,35,38,40,42,45,48,52,55,58,60] },
  { e: "🧴", n: "Vitamin C Eye Cream 20ml Brightening", a: "B0BKLM7890", c: "Beauty", r: 6120, bsr: 2970, p: 26.99, rv: 176, s: 8.3, comp: "Low", tr: "up", mg: 62, sp: [35,38,42,40,45,50,48,55,58,60,65,68,70,75,78] },
  { e: "🍼", n: "Silicone Baby Spoon 6-Pack BPA Free", a: "B08PQRM5NT", c: "Baby", r: 3890, bsr: 6120, p: 14.99, rv: 67, s: 8.2, comp: "Low", tr: "up", mg: 55, sp: [20,25,28,30,35,32,38,42,40,45,50,52,58,62,65] },
  { e: "🧸", n: "Montessori Stacking Rings 10-Piece", a: "B08STUV123", c: "Baby", r: 4230, bsr: 5100, p: 18.99, rv: 156, s: 8.0, comp: "Low", tr: "flat", mg: 46, sp: [30,32,35,33,36,38,36,40,42,40,43,42,45,44,45] },
  { e: "🪴", n: "Self-Watering Plant Pots Set of 3", a: "B0CDPQR7ZX", c: "Kitchen", r: 3210, bsr: 7890, p: 19.99, rv: 145, s: 7.9, comp: "Low", tr: "up", mg: 44, sp: [28,30,33,35,38,36,40,42,45,48,50,52,55,58,60] },
  { e: "🖊️", n: "Ergonomic Gel Pen Set 12-Pack", a: "B0BXYZ4512", c: "Office", r: 4120, bsr: 5640, p: 12.99, rv: 456, s: 7.8, comp: "Medium", tr: "flat", mg: 38, sp: [40,42,40,43,42,44,43,45,44,46,45,47,46,47,48] },
  { e: "📎", n: "Magnetic Cable Clips Organiser 12-Pack", a: "B09QRST456", c: "Office", r: 2450, bsr: 11200, p: 9.99, rv: 234, s: 7.5, comp: "Medium", tr: "up", mg: 56, sp: [18,20,22,25,23,28,30,28,32,35,38,40,42,45,48] },
  { e: "🏋️", n: "Adjustable Ankle Weights 2kg Pair", a: "B0CLMN8920", c: "Sports", r: 5120, bsr: 3780, p: 29.99, rv: 521, s: 7.2, comp: "Medium", tr: "flat", mg: 35, sp: [42,44,43,45,44,46,45,46,45,47,46,47,46,48,47] },
  { e: "💆", n: "Foot Massage Roller Plantar Fasciitis", a: "B08YXMN3PL", c: "Sports", r: 2890, bsr: 9240, p: 11.99, rv: 332, s: 7.1, comp: "Medium", tr: "flat", mg: 41, sp: [35,36,35,37,36,38,37,38,37,39,38,39,38,39,40] },
  { e: "☕", n: "Insulated Travel Mug 500ml Leak-proof", a: "B09ABCDE45", c: "Kitchen", r: 9100, bsr: 980, p: 32.99, rv: 1240, s: 6.4, comp: "High", tr: "down", mg: 29, sp: [80,78,75,72,70,68,65,62,60,58,55,52,50,48,45] },
];

const keywords = [
  { kw: "bamboo lunch box", vol: 22400, cpc: 1.12, diff: "Low", tr: "up" },
  { kw: "slow feeder dog bowl", vol: 18700, cpc: 0.89, diff: "Low", tr: "up" },
  { kw: "resistance bands set", vol: 54200, cpc: 1.45, diff: "Medium", tr: "up" },
  { kw: "waterproof kids backpack", vol: 12800, cpc: 1.28, diff: "Low", tr: "up" },
  { kw: "organic rosehip serum", vol: 9400, cpc: 2.10, diff: "Low", tr: "up" },
  { kw: "cat puzzle feeder", vol: 7200, cpc: 0.74, diff: "Low", tr: "up" },
  { kw: "vitamin c eye cream", vol: 16500, cpc: 1.95, diff: "Medium", tr: "flat" },
  { kw: "silicone baby spoon bpa free", vol: 8100, cpc: 0.88, diff: "Low", tr: "up" },
  { kw: "montessori stacking rings", vol: 6300, cpc: 0.65, diff: "Low", tr: "flat" },
  { kw: "self watering plant pot", vol: 11200, cpc: 0.92, diff: "Low", tr: "up" },
  { kw: "ergonomic gel pen set", vol: 28400, cpc: 0.55, diff: "High", tr: "flat" },
  { kw: "magnetic cable clips", vol: 19800, cpc: 0.48, diff: "Medium", tr: "up" },
];

async function main() {
  console.log("Seeding database...");

  // Create demo user
  const hashedPassword = await bcrypt.hash("password123", 10);
  await prisma.user.upsert({
    where: { email: "demo@sellerpulse.com" },
    update: {},
    create: {
      email: "demo@sellerpulse.com",
      name: "Demo User",
      password: hashedPassword,
      plan: "pro",
      searches: 5,
      maxSearches: 100,
    },
  });
  console.log("Created demo user: demo@sellerpulse.com / password123");

  // Seed products
  for (const p of products) {
    await prisma.product.upsert({
      where: { asin: p.a },
      update: {},
      create: {
        emoji: p.e,
        name: p.n,
        asin: p.a,
        category: p.c,
        revenue: p.r,
        bsr: p.bsr,
        price: p.p,
        reviews: p.rv,
        score: p.s,
        competition: p.comp,
        trend: p.tr,
        margin: p.mg,
        sparkline: JSON.stringify(p.sp),
      },
    });
  }
  console.log(`Seeded ${products.length} products`);

  // Seed keywords
  for (const k of keywords) {
    await prisma.keyword.upsert({
      where: { keyword: k.kw },
      update: {},
      create: {
        keyword: k.kw,
        volume: k.vol,
        cpc: k.cpc,
        difficulty: k.diff,
        trend: k.tr,
      },
    });
  }
  console.log(`Seeded ${keywords.length} keywords`);

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
