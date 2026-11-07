import { PrismaClient } from "../lib/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🔒 Checking and ensuring all staff and manager accounts in database...");

  const branches = await prisma.branch.findMany();
  const heliopolis = branches.find((b) => b.code === "BR-HELIOPOLIS") || branches[0];
  const qobba = branches.find((b) => b.code === "HQ-QOBBA") || branches[1] || branches[0];

  const targetUsers = [
    {
      username: "maestro",
      name: "أ/ حمزة عباس (المايسترو — المالك العام)",
      passwordHash: "123456789",
      pin: "157230",
      phone: "01018671000",
      role: "owner",
      branchId: null,
      permissions: JSON.stringify(["pos", "inventory", "orders", "settings", "reports", "users", "scale", "treasury"]),
      isActive: true,
    },
    {
      username: "manager",
      name: "أ/ إبراهيم فينيسيا (المدير العام للمعمل والفروع)",
      passwordHash: "123456789",
      pin: "112233",
      phone: "01118400151",
      role: "manager",
      branchId: null,
      permissions: JSON.stringify(["pos", "inventory", "orders", "settings", "reports", "users", "scale", "treasury"]),
      isActive: true,
    },
    {
      username: "cashier_heliopolis",
      name: "كاشير فرع مصر الجديدة وجسر السويس",
      passwordHash: "123456789",
      pin: "223344",
      phone: "0226342212",
      role: "cashier",
      branchId: heliopolis?.id || null,
      permissions: JSON.stringify(["pos", "inventory", "orders"]),
      isActive: true,
    },
    {
      username: "cashier_qobba",
      name: "كاشير فرع حدائق القبة (الرئيسي)",
      passwordHash: "123456789",
      pin: "334455",
      phone: "0224555203",
      role: "cashier",
      branchId: qobba?.id || null,
      permissions: JSON.stringify(["pos", "inventory", "orders"]),
      isActive: true,
    },
  ];

  for (const u of targetUsers) {
    const existing = await prisma.user.findUnique({ where: { username: u.username } });
    if (existing) {
      await prisma.user.update({
        where: { username: u.username },
        data: {
          name: u.name,
          passwordHash: u.passwordHash,
          pin: u.pin,
          role: u.role,
          phone: u.phone,
          branchId: u.branchId,
          permissions: u.permissions,
          isActive: true,
        },
      });
      console.log(`Updated user: ${u.username} | PIN: ${u.pin} | Password: ${u.passwordHash}`);
    } else {
      await prisma.user.create({
        data: u,
      });
      console.log(`Created user: ${u.username} | PIN: ${u.pin} | Password: ${u.passwordHash}`);
    }
  }

  // Also seed default Couriers (طيارين الدليفري)
  const existingCouriers = await prisma.courier.findMany();
  if (existingCouriers.length === 0) {
    console.log("🛵 Seeding active delivery couriers...");
    await prisma.courier.createMany({
      data: [
        {
          name: "كابتن أحمد فينيسيا (فرع مصر الجديدة)",
          phone: "01099887711",
          vehicleType: "موتوسيكل سريع 🛵",
          isAvailable: true,
          activeOrdersCount: 0,
        },
        {
          name: "كابتن محمود فينيسيا (فرع حدائق القبة)",
          phone: "01122334455",
          vehicleType: "سكوتر دليفري 🛵",
          isAvailable: true,
          activeOrdersCount: 0,
        },
        {
          name: "كابتن حسام النسر (طوارئ الفروع)",
          phone: "01234567890",
          vehicleType: "موتوسيكل مجهز بصندوق حراري 🛵",
          isAvailable: true,
          activeOrdersCount: 0,
        },
      ],
    });
    console.log("✅ Seeded 3 active couriers!");
  }

  console.log("✅ All accounts and couriers verified in database!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
