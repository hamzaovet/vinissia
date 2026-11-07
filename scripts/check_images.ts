import { PrismaClient } from "../lib/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const products = await prisma.product.findMany();
  console.log("Total products in Neon DB:", products.length);

  // Check how many have images containing watermelon, crepe, shawarma or unsplash IDs
  const imageCounts: Record<string, number> = {};
  for (const p of products) {
    if (p.image) {
      imageCounts[p.image] = (imageCounts[p.image] || 0) + 1;
    }
  }

  console.log("\nImage URLs usage frequency:");
  for (const [url, count] of Object.entries(imageCounts)) {
    console.log(`${count} products use: ${url}`);
  }

  console.log("\nFirst 10 products:");
  for (const p of products.slice(0, 10)) {
    console.log(`[${p.categoryName}] ${p.nameAr} => ${p.image}`);
  }
}

main().finally(() => prisma.$disconnect());
