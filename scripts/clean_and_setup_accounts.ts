import { PrismaClient } from "../lib/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🧹 1. Cleaning dummy orders and treasury transactions for a pristine start...");
  const delOrders = await prisma.order.deleteMany({});
  const delTreasury = await prisma.treasuryTransaction.deleteMany({});
  console.log(`✅ Deleted ${delOrders.count} old orders and ${delTreasury.count} old treasury records.`);

  console.log("🏢 2. Updating exact branch details...");
  const branch1 = await prisma.branch.upsert({
    where: { code: "HQ-QOBBA" },
    update: {
      name: "فرع حدائق القبة (الرئيسي)",
      address: "80 شارع المدينة المنورة، شرق الوايلي، حدائق القبة، القاهرة",
      phone: "0224382540",
      whatsapp: "01018671000",
      isActive: true,
    },
    create: {
      name: "فرع حدائق القبة (الرئيسي)",
      code: "HQ-QOBBA",
      address: "80 شارع المدينة المنورة، شرق الوايلي، حدائق القبة، القاهرة",
      phone: "0224382540",
      whatsapp: "01018671000",
      isActive: true,
    },
  });

  const branch2 = await prisma.branch.upsert({
    where: { code: "BR-WAYLI" },
    update: {
      name: "فرع سكة الوايلي الكبير",
      address: "شارع سكة الوايلي الكبير، أمام مسجد السلام، حدائق القبة، القاهرة",
      phone: "0224382540",
      whatsapp: "01068790620",
      isActive: true,
    },
    create: {
      name: "فرع سكة الوايلي الكبير",
      code: "BR-WAYLI",
      address: "شارع سكة الوايلي الكبير، أمام مسجد السلام، حدائق القبة، القاهرة",
      phone: "0224382540",
      whatsapp: "01068790620",
      isActive: true,
    },
  });

  console.log("👥 3. Setting up clean staff accounts with exact roles and branch restrictions...");
  // 1. Maestro (Owner - All Branches)
  await prisma.user.upsert({
    where: { username: "maestro" },
    update: {
      name: "أ/ حمزة عباس (المايسترو — المالك العام)",
      role: "owner",
      branchId: null,
      pin: "157230",
      passwordHash: "123456789",
      isActive: true,
    },
    create: {
      name: "أ/ حمزة عباس (المايسترو — المالك العام)",
      username: "maestro",
      passwordHash: "123456789",
      pin: "157230",
      role: "owner",
      branchId: null,
      phone: "01018671000",
      isActive: true,
    },
  });

  // 2. General Manager (All Branches)
  await prisma.user.upsert({
    where: { username: "manager" },
    update: {
      name: "أ/ إبراهيم فينيسيا (المدير العام للمعمل والفروع)",
      role: "manager",
      branchId: null,
      pin: "123456",
      passwordHash: "123456789",
      isActive: true,
    },
    create: {
      name: "أ/ إبراهيم فينيسيا (المدير العام للمعمل والفروع)",
      username: "manager",
      passwordHash: "123456789",
      pin: "123456",
      role: "manager",
      branchId: null,
      phone: "01018671001",
      isActive: true,
    },
  });

  // 3. Manager Branch 1 (حدائق القبة)
  await prisma.user.upsert({
    where: { username: "mgr_qobba" },
    update: {
      name: "مدير فرع حدائق القبة",
      role: "branch_manager",
      branchId: branch1.id,
      pin: "110011",
      passwordHash: "123456789",
      isActive: true,
    },
    create: {
      name: "مدير فرع حدائق القبة",
      username: "mgr_qobba",
      passwordHash: "123456789",
      pin: "110011",
      role: "branch_manager",
      branchId: branch1.id,
      phone: "01018671011",
      isActive: true,
    },
  });

  // 4. Cashier Branch 1 (حدائق القبة)
  await prisma.user.upsert({
    where: { username: "cashier_qobba" },
    update: {
      name: "كاشير فرع حدائق القبة",
      role: "cashier",
      branchId: branch1.id,
      pin: "112233",
      passwordHash: "123456789",
      isActive: true,
    },
    create: {
      name: "كاشير فرع حدائق القبة",
      username: "cashier_qobba",
      passwordHash: "123456789",
      pin: "112233",
      role: "cashier",
      branchId: branch1.id,
      phone: "01018671012",
      isActive: true,
    },
  });

  // 5. Manager Branch 2 (سكة الوايلي)
  await prisma.user.upsert({
    where: { username: "mgr_wayli" },
    update: {
      name: "مدير فرع سكة الوايلي",
      role: "branch_manager",
      branchId: branch2.id,
      pin: "220022",
      passwordHash: "123456789",
      isActive: true,
    },
    create: {
      name: "مدير فرع سكة الوايلي",
      username: "mgr_wayli",
      passwordHash: "123456789",
      pin: "220022",
      role: "branch_manager",
      branchId: branch2.id,
      phone: "01018671021",
      isActive: true,
    },
  });

  // 6. Cashier Branch 2 (سكة الوايلي)
  await prisma.user.upsert({
    where: { username: "cashier_wayli" },
    update: {
      name: "كاشير فرع سكة الوايلي",
      role: "cashier",
      branchId: branch2.id,
      pin: "445566",
      passwordHash: "123456789",
      isActive: true,
    },
    create: {
      name: "كاشير فرع سكة الوايلي",
      username: "cashier_wayli",
      passwordHash: "123456789",
      pin: "445566",
      role: "cashier",
      branchId: branch2.id,
      phone: "01018671022",
      isActive: true,
    },
  });

  // 7. Delivery Courier Branch 1
  await prisma.user.upsert({
    where: { username: "delivery_qobba" },
    update: {
      name: "طيار دليفري حدائق القبة",
      role: "delivery",
      branchId: branch1.id,
      pin: "113355",
      passwordHash: "123456789",
      isActive: true,
    },
    create: {
      name: "طيار دليفري حدائق القبة",
      username: "delivery_qobba",
      passwordHash: "123456789",
      pin: "113355",
      role: "delivery",
      branchId: branch1.id,
      phone: "01018671013",
      isActive: true,
    },
  });

  // 8. Delivery Courier Branch 2
  await prisma.user.upsert({
    where: { username: "delivery_wayli" },
    update: {
      name: "طيار دليفري سكة الوايلي",
      role: "delivery",
      branchId: branch2.id,
      pin: "224466",
      passwordHash: "123456789",
      isActive: true,
    },
    create: {
      name: "طيار دليفري سكة الوايلي",
      username: "delivery_wayli",
      passwordHash: "123456789",
      pin: "224466",
      role: "delivery",
      branchId: branch2.id,
      phone: "01018671023",
      isActive: true,
    },
  });

  console.log("✅ All accounts & branch details seeded cleanly!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
