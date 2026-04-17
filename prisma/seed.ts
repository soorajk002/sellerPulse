import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const products = [
  // ── Kitchen ──────────────────────────────────────────────────────────────────
  { e: "🫙", n: "Bamboo Fiber Lunch Box Set with Lid", a: "B09X4P2K1L", c: "Kitchen", r: 8240, bsr: 1240, p: 24.99, rv: 187, s: 9.1, comp: "Low", tr: "up", mg: 42, sp: [40,45,52,48,55,60,58,65,70,68,75,80,82,88,91] },
  { e: "🪴", n: "Self-Watering Plant Pots Set of 3", a: "B0CDPQR7ZX", c: "Kitchen", r: 3210, bsr: 7890, p: 19.99, rv: 145, s: 7.9, comp: "Low", tr: "up", mg: 44, sp: [28,30,33,35,38,36,40,42,45,48,50,52,55,58,60] },
  { e: "☕", n: "Insulated Travel Mug 500ml Leak-proof", a: "B09ABCDE45", c: "Kitchen", r: 9100, bsr: 980, p: 32.99, rv: 1240, s: 6.4, comp: "High", tr: "down", mg: 29, sp: [80,78,75,72,70,68,65,62,60,58,55,52,50,48,45] },
  { e: "🍳", n: "Silicone Spatula Set 5-Piece Heat Resistant", a: "B0CK7MN3PQ", c: "Kitchen", r: 4560, bsr: 3200, p: 16.99, rv: 98, s: 8.6, comp: "Low", tr: "up", mg: 48, sp: [30,34,38,36,40,44,42,46,50,48,52,56,58,62,65] },
  { e: "🫙", n: "Glass Food Storage Containers 18-Piece", a: "B0BN78KL12", c: "Kitchen", r: 6780, bsr: 2100, p: 38.99, rv: 234, s: 8.2, comp: "Medium", tr: "up", mg: 35, sp: [45,48,52,50,55,58,56,60,64,62,66,70,72,75,78] },
  { e: "🍳", n: "Cast Iron Skillet 10-inch Pre-seasoned", a: "B0CL9PQR4M", c: "Kitchen", r: 5230, bsr: 2800, p: 28.99, rv: 67, s: 8.8, comp: "Low", tr: "up", mg: 41, sp: [35,38,42,40,44,48,46,50,54,52,56,60,62,66,68] },
  { e: "🧊", n: "Silicone Ice Cube Tray with Lid Set of 4", a: "B0BX3JKL89", c: "Kitchen", r: 3890, bsr: 5600, p: 13.99, rv: 112, s: 8.1, comp: "Low", tr: "flat", mg: 52, sp: [28,30,32,34,32,35,37,36,38,40,39,41,43,42,44] },
  { e: "🫖", n: "Electric Kettle 1.7L Temperature Control", a: "B0CD4MNP56", c: "Kitchen", r: 7890, bsr: 1680, p: 42.99, rv: 389, s: 7.6, comp: "Medium", tr: "up", mg: 32, sp: [55,58,62,60,64,68,66,70,74,72,76,80,82,86,88] },

  // ── Pet ───────────────────────────────────────────────────────────────────────
  { e: "🐕", n: "Slow Feeder Dog Bowl Anti-Bloat", a: "B09L3KM7XQ", c: "Pet", r: 7340, bsr: 1890, p: 16.99, rv: 203, s: 8.9, comp: "Medium", tr: "up", mg: 47, sp: [45,50,55,52,58,62,60,65,70,68,75,78,80,85,88] },
  { e: "🐱", n: "Cat Puzzle Feeder Interactive Toy", a: "B0BNOP6712", c: "Pet", r: 3780, bsr: 6780, p: 21.99, rv: 89, s: 8.4, comp: "Low", tr: "up", mg: 52, sp: [22,25,28,32,30,35,38,40,42,45,48,52,55,58,60] },
  { e: "🐕", n: "Orthopedic Dog Bed Memory Foam Large", a: "B0CF2PQR9N", c: "Pet", r: 9800, bsr: 890, p: 59.99, rv: 128, s: 9.2, comp: "Low", tr: "up", mg: 38, sp: [60,64,68,66,72,76,74,78,82,80,84,88,90,92,95] },
  { e: "🐾", n: "Retractable Dog Leash 16ft Heavy Duty", a: "B0BK5LMN23", c: "Pet", r: 5640, bsr: 3100, p: 19.99, rv: 76, s: 8.7, comp: "Low", tr: "up", mg: 44, sp: [38,42,46,44,48,52,50,54,58,56,60,64,66,70,72] },
  { e: "🐕", n: "Puppy Training Pads 100-Count Odor Control", a: "B0CG8RQP45", c: "Pet", r: 12400, bsr: 620, p: 24.99, rv: 445, s: 7.8, comp: "Medium", tr: "up", mg: 36, sp: [70,74,78,76,80,84,82,86,90,88,92,96,98,100,102] },
  { e: "🐱", n: "Cat Litter Mat Extra Large Double Layer", a: "B0BL6NPQ78", c: "Pet", r: 4210, bsr: 5200, p: 22.99, rv: 134, s: 8.0, comp: "Low", tr: "flat", mg: 46, sp: [30,32,35,33,36,38,36,40,42,40,43,45,44,46,48] },
  { e: "🐾", n: "Pet Grooming Gloves Deshedding Brush", a: "B09QR7ST12", c: "Pet", r: 3560, bsr: 7200, p: 14.99, rv: 67, s: 8.3, comp: "Low", tr: "up", mg: 54, sp: [22,26,30,28,32,36,34,38,42,40,44,48,50,54,56] },
  { e: "🐕", n: "Dog Car Seat Cover Waterproof Hammock", a: "B0BM4KLN90", c: "Pet", r: 6780, bsr: 2300, p: 34.99, rv: 112, s: 8.8, comp: "Low", tr: "up", mg: 40, sp: [42,46,50,48,52,56,54,58,62,60,64,68,70,74,76] },
  { e: "🐱", n: "Automatic Cat Water Fountain 84oz Stainless", a: "B0CH9MNP34", c: "Pet", r: 8920, bsr: 1200, p: 45.99, rv: 98, s: 9.1, comp: "Low", tr: "up", mg: 35, sp: [55,59,63,61,65,69,67,71,75,73,77,81,83,87,89] },
  { e: "🐾", n: "Pet Carrier Backpack Ventilated Airline", a: "B0BN3PQR56", c: "Pet", r: 5230, bsr: 3800, p: 39.99, rv: 143, s: 8.0, comp: "Low", tr: "flat", mg: 37, sp: [32,35,38,36,40,43,41,45,48,46,50,53,52,55,57] },
  { e: "🐕", n: "Dog Anxiety Jacket Thunder Shirt Medium", a: "B0BQ7KLM67", c: "Pet", r: 4890, bsr: 4600, p: 29.99, rv: 88, s: 8.5, comp: "Low", tr: "up", mg: 43, sp: [30,34,38,36,40,44,42,46,50,48,52,56,58,62,64] },
  { e: "🐱", n: "Cat Scratcher Post 32-inch Sisal Rope", a: "B0CK2NPQ89", c: "Pet", r: 3120, bsr: 8900, p: 26.99, rv: 54, s: 8.2, comp: "Low", tr: "up", mg: 49, sp: [20,23,26,24,28,31,29,33,36,34,38,41,40,43,45] },
  { e: "🐾", n: "Flea and Tick Collar 8-Month Protection", a: "B09ST8UV23", c: "Pet", r: 7650, bsr: 1540, p: 18.99, rv: 267, s: 8.3, comp: "Medium", tr: "up", mg: 51, sp: [48,52,56,54,58,62,60,64,68,66,70,74,76,80,82] },
  { e: "🐕", n: "Interactive Dog Toy Puzzle Feeder Level 3", a: "B0BL9MNP01", c: "Pet", r: 2980, bsr: 9800, p: 23.99, rv: 45, s: 8.1, comp: "Low", tr: "up", mg: 47, sp: [18,21,24,22,26,29,27,31,34,32,36,39,38,41,43] },
  { e: "🐱", n: "Cat Toy Wand Feather Teaser 12-Pack", a: "B0CD3KLN45", c: "Pet", r: 2340, bsr: 12000, p: 11.99, rv: 78, s: 7.9, comp: "Low", tr: "up", mg: 55, sp: [15,18,21,19,23,26,24,28,31,29,33,36,35,38,40] },
  { e: "🐕", n: "No-Pull Dog Harness Reflective Adjustable", a: "B0BN7PQR12", c: "Pet", r: 8900, bsr: 1100, p: 27.99, rv: 134, s: 9.0, comp: "Low", tr: "up", mg: 42, sp: [55,59,63,61,65,69,67,71,75,73,77,81,83,87,89] },
  { e: "🐾", n: "Pet First Aid Kit 50-Piece Travel", a: "B0CG4LMN78", c: "Pet", r: 2100, bsr: 14500, p: 21.99, rv: 38, s: 8.3, comp: "Low", tr: "up", mg: 50, sp: [12,15,18,16,20,23,21,25,28,26,30,33,32,35,37] },
  { e: "🐕", n: "Dog DNA Test Kit Breed Health Genetic", a: "B0BM8NPQ34", c: "Pet", r: 15600, bsr: 450, p: 79.99, rv: 89, s: 9.3, comp: "Low", tr: "up", mg: 44, sp: [65,69,73,71,75,79,77,81,85,83,87,91,93,97,99] },
  { e: "🐱", n: "Self-Cleaning Litter Box Automatic", a: "B0CL5KPN90", c: "Pet", r: 18900, bsr: 320, p: 89.99, rv: 67, s: 9.4, comp: "Low", tr: "up", mg: 36, sp: [70,74,78,76,80,84,82,86,90,88,92,96,98,100,102] },

  // ── Sports ───────────────────────────────────────────────────────────────────
  { e: "💪", n: "Resistance Bands Set 5 Levels Premium", a: "B08K7FMQ3A", c: "Sports", r: 6890, bsr: 2180, p: 18.99, rv: 312, s: 8.7, comp: "Medium", tr: "up", mg: 51, sp: [50,52,55,58,54,60,62,58,65,68,70,72,75,78,80] },
  { e: "🏋️", n: "Adjustable Ankle Weights 2kg Pair", a: "B0CLMN8920", c: "Sports", r: 5120, bsr: 3780, p: 29.99, rv: 521, s: 7.2, comp: "High", tr: "flat", mg: 35, sp: [42,44,43,45,44,46,45,46,45,47,46,47,46,48,47] },
  { e: "💆", n: "Foot Massage Roller Plantar Fasciitis", a: "B08YXMN3PL", c: "Sports", r: 2890, bsr: 9240, p: 11.99, rv: 332, s: 7.1, comp: "Medium", tr: "flat", mg: 41, sp: [35,36,35,37,36,38,37,38,37,39,38,39,38,39,40] },
  { e: "🏊", n: "Swim Goggles Anti-Fog UV Protection Adult", a: "B0CF6LMN12", c: "Sports", r: 4560, bsr: 4200, p: 16.99, rv: 98, s: 8.4, comp: "Low", tr: "up", mg: 48, sp: [28,32,36,34,38,42,40,44,48,46,50,54,56,60,62] },
  { e: "🧘", n: "Yoga Mat 6mm Non-Slip Extra Wide 72-inch", a: "B0BL4NPQ67", c: "Sports", r: 7230, bsr: 1950, p: 34.99, rv: 145, s: 8.6, comp: "Low", tr: "up", mg: 38, sp: [42,46,50,48,52,56,54,58,62,60,64,68,70,74,76] },
  { e: "💪", n: "Pull-up Bar Doorway No Screws Heavy Duty", a: "B0BM9PQR45", c: "Sports", r: 5890, bsr: 2900, p: 39.99, rv: 67, s: 8.9, comp: "Low", tr: "up", mg: 37, sp: [36,40,44,42,46,50,48,52,56,54,58,62,64,68,70] },
  { e: "🥊", n: "Jump Rope Speed Cable Adjustable Bearings", a: "B0CD8LMN23", c: "Sports", r: 3450, bsr: 6800, p: 19.99, rv: 89, s: 8.2, comp: "Low", tr: "flat", mg: 46, sp: [24,27,30,28,32,35,33,37,40,38,42,45,44,47,49] },

  // ── Beauty ───────────────────────────────────────────────────────────────────
  { e: "🌿", n: "Organic Rosehip Face Serum 30ml", a: "B07T9KL2PQ", c: "Beauty", r: 5670, bsr: 3420, p: 22.50, rv: 94, s: 8.5, comp: "Low", tr: "up", mg: 58, sp: [30,35,38,42,40,45,50,48,55,58,60,65,68,72,75] },
  { e: "🧴", n: "Vitamin C Eye Cream 20ml Brightening", a: "B0BKLM7890", c: "Beauty", r: 6120, bsr: 2970, p: 26.99, rv: 176, s: 8.3, comp: "Medium", tr: "up", mg: 62, sp: [35,38,42,40,45,50,48,55,58,60,65,68,70,75,78] },
  { e: "💋", n: "Hyaluronic Acid Lip Plumper Gloss", a: "B0BN5PQR12", c: "Beauty", r: 3890, bsr: 6100, p: 17.99, rv: 78, s: 8.4, comp: "Low", tr: "up", mg: 65, sp: [22,26,30,28,32,36,34,38,42,40,44,48,50,54,56] },
  { e: "🧴", n: "Retinol Moisturizer Anti-Aging Night Cream", a: "B0CF3LMN56", c: "Beauty", r: 7890, bsr: 1700, p: 32.99, rv: 234, s: 8.1, comp: "Medium", tr: "up", mg: 56, sp: [48,52,56,54,58,62,60,64,68,66,70,74,76,80,82] },
  { e: "💆", n: "Jade Roller Face Massager Rose Quartz", a: "B0BL8NPQ34", c: "Beauty", r: 2780, bsr: 10200, p: 14.99, rv: 45, s: 8.3, comp: "Low", tr: "up", mg: 60, sp: [16,19,22,20,24,27,25,29,32,30,34,37,36,39,41] },
  { e: "🌿", n: "Niacinamide Toner 10% Pore Minimizer", a: "B0CD6KLN78", c: "Beauty", r: 5340, bsr: 3600, p: 19.99, rv: 123, s: 8.6, comp: "Low", tr: "up", mg: 59, sp: [32,36,40,38,42,46,44,48,52,50,54,58,60,64,66] },

  // ── Office ───────────────────────────────────────────────────────────────────
  { e: "🖊️", n: "Ergonomic Gel Pen Set 12-Pack", a: "B0BXYZ4512", c: "Office", r: 4120, bsr: 5640, p: 12.99, rv: 456, s: 7.8, comp: "High", tr: "flat", mg: 38, sp: [40,42,40,43,42,44,43,45,44,46,45,47,46,47,48] },
  { e: "📎", n: "Magnetic Cable Clips Organiser 12-Pack", a: "B09QRST456", c: "Office", r: 2450, bsr: 11200, p: 9.99, rv: 234, s: 7.5, comp: "Medium", tr: "up", mg: 56, sp: [18,20,22,25,23,28,30,28,32,35,38,40,42,45,48] },
  { e: "📐", n: "Acrylic Desk Organiser 7-Compartment", a: "B0BM6PQR23", c: "Office", r: 3780, bsr: 6500, p: 24.99, rv: 112, s: 8.0, comp: "Low", tr: "flat", mg: 44, sp: [25,28,30,32,30,33,35,33,36,38,37,39,41,40,42] },
  { e: "🖥️", n: "Monitor Stand Riser Adjustable Bamboo", a: "B0CF5LMN89", c: "Office", r: 5230, bsr: 3900, p: 35.99, rv: 89, s: 8.5, comp: "Low", tr: "up", mg: 40, sp: [30,34,38,36,40,44,42,46,50,48,52,56,58,62,64] },
  { e: "🪑", n: "Lumbar Support Pillow Memory Foam Chair", a: "B0BN2KLM56", c: "Office", r: 6890, bsr: 2400, p: 27.99, rv: 145, s: 8.3, comp: "Low", tr: "up", mg: 42, sp: [38,42,46,44,48,52,50,54,58,56,60,64,66,70,72] },

  // ── Baby ─────────────────────────────────────────────────────────────────────
  { e: "🎒", n: "Kids Waterproof Backpack 20L Reflective", a: "B0BN23KL09", c: "Baby", r: 4560, bsr: 4320, p: 27.99, rv: 88, s: 8.6, comp: "Low", tr: "up", mg: 49, sp: [25,30,32,35,38,42,40,48,52,50,58,62,65,70,72] },
  { e: "🍼", n: "Silicone Baby Spoon 6-Pack BPA Free", a: "B08PQRM5NT", c: "Baby", r: 3890, bsr: 6120, p: 14.99, rv: 67, s: 8.2, comp: "Low", tr: "up", mg: 55, sp: [20,25,28,30,35,32,38,42,40,45,50,52,58,62,65] },
  { e: "🧸", n: "Montessori Stacking Rings 10-Piece", a: "B08STUV123", c: "Baby", r: 4230, bsr: 5100, p: 18.99, rv: 156, s: 8.0, comp: "Medium", tr: "flat", mg: 46, sp: [30,32,35,33,36,38,36,40,42,40,43,42,45,44,45] },
  { e: "👶", n: "Baby Monitor WiFi 1080p Night Vision", a: "B0CG7LMN12", c: "Baby", r: 12300, bsr: 680, p: 69.99, rv: 89, s: 9.2, comp: "Low", tr: "up", mg: 33, sp: [62,66,70,68,72,76,74,78,82,80,84,88,90,94,96] },
  { e: "🛁", n: "Baby Bath Seat Suction Cup Non-Slip", a: "B0BL3NPQ78", c: "Baby", r: 3450, bsr: 7800, p: 23.99, rv: 78, s: 8.1, comp: "Low", tr: "up", mg: 48, sp: [22,25,28,26,30,33,31,35,38,36,40,43,42,45,47] },
  { e: "🧸", n: "Teething Toys 4-Pack BPA Free Silicone", a: "B0CF9KLM45", c: "Baby", r: 2890, bsr: 9500, p: 15.99, rv: 56, s: 8.3, comp: "Low", tr: "up", mg: 52, sp: [18,21,24,22,26,29,27,31,34,32,36,39,38,41,43] },
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
  { kw: "orthopedic dog bed memory foam", vol: 14200, cpc: 1.34, diff: "Low", tr: "up" },
  { kw: "no pull dog harness reflective", vol: 23600, cpc: 1.18, diff: "Low", tr: "up" },
  { kw: "automatic cat water fountain", vol: 11800, cpc: 0.96, diff: "Low", tr: "up" },
  { kw: "dog car seat cover hammock", vol: 8900, cpc: 1.05, diff: "Low", tr: "up" },
  { kw: "cat scratcher post sisal", vol: 9700, cpc: 0.72, diff: "Low", tr: "up" },
  { kw: "pet grooming gloves deshedding", vol: 12400, cpc: 0.85, diff: "Low", tr: "up" },
  { kw: "yoga mat non-slip wide", vol: 31200, cpc: 1.22, diff: "Medium", tr: "up" },
  { kw: "pull up bar doorway", vol: 18900, cpc: 0.98, diff: "Low", tr: "up" },
  { kw: "silicone spatula set heat resistant", vol: 15600, cpc: 0.78, diff: "Low", tr: "up" },
  { kw: "cast iron skillet pre-seasoned", vol: 21300, cpc: 1.15, diff: "Medium", tr: "up" },
  { kw: "hyaluronic acid lip plumper", vol: 8700, cpc: 1.88, diff: "Low", tr: "up" },
  { kw: "jade roller face massager", vol: 7400, cpc: 1.42, diff: "Low", tr: "up" },
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
