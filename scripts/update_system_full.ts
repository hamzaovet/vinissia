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

// High-res curated image map for categories and products
const curatedImages: Record<string, string> = {
  // Fresh Milk & Rayeb
  "لبن": "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80",
  "حليب": "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80",
  "رايب": "https://images.unsplash.com/photo-1571212515416-fef01fc43637?auto=format&fit=crop&w=600&q=80",
  "زبادو": "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=600&q=80",
  "زبادي": "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80",

  // Cheeses
  "رومي": "https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=600&q=80",
  "فصوص رومي": "https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=600&q=80",
  "براميلي": "https://images.unsplash.com/photo-1589881133595-a3c085cb731d?auto=format&fit=crop&w=600&q=80",
  "إسطنبولي": "https://images.unsplash.com/photo-1589881133595-a3c085cb731d?auto=format&fit=crop&w=600&q=80",
  "اسطنبولي": "https://images.unsplash.com/photo-1589881133595-a3c085cb731d?auto=format&fit=crop&w=600&q=80",
  "موتزريلا": "https://images.unsplash.com/photo-1624806992066-5ffcf7ca186b?auto=format&fit=crop&w=600&q=80",
  "شيدر": "https://images.unsplash.com/photo-1618040996337-56904b7850b9?auto=format&fit=crop&w=600&q=80",
  "صوص شيدر": "https://images.unsplash.com/photo-1618040996337-56904b7850b9?auto=format&fit=crop&w=600&q=80",
  "كيري": "https://images.unsplash.com/photo-1559561853-08451507cbe7?auto=format&fit=crop&w=600&q=80",
  "قريش": "https://images.unsplash.com/photo-1589881133595-a3c085cb731d?auto=format&fit=crop&w=600&q=80",
  "فلمنك": "https://images.unsplash.com/photo-1618040996337-56904b7850b9?auto=format&fit=crop&w=600&q=80",
  "جوده": "https://images.unsplash.com/photo-1618040996337-56904b7850b9?auto=format&fit=crop&w=600&q=80",
  "ريكفورد": "https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=600&q=80",
  "سلطه تركي": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80",
  "قديمة": "https://images.unsplash.com/photo-1589881133595-a3c085cb731d?auto=format&fit=crop&w=600&q=80",
  "فيتا": "https://images.unsplash.com/photo-1589881133595-a3c085cb731d?auto=format&fit=crop&w=600&q=80",
  "جبن": "https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=600&q=80",
  "جبنة": "https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=600&q=80",

  // Cold Cuts & Meats
  "لانشون": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
  "بسطرمة": "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=600&q=80",
  "تركي": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
  "سلامي": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
  "روستو": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
  "رستو": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
  "بيكون": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
  "لحوم": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",

  // Farm Ghee & Butter
  "سمن": "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80",
  "زبده": "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80",
  "زبدة": "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80",
  "قشطه": "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80",
  "قشطة": "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80",
  "مورته": "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80",
  "كريمة": "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80",
  "بيض": "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=600&q=80",

  // Desserts & Rice Pudding
  "رز بلبن": "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80",
  "أرز بلبن": "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80",
  "مهلبية": "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80",
  "أم علي": "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80",
  "كريم كراميل": "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80",
  "كاستر": "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80",
  "جيلي": "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80",
  "تشيز كيك": "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80",
  "ديسباسيتو": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80",
  "مولتن": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80",
  "قنبلة": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80",
  "حلاوه": "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80",
  "حلاوة": "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80",

  // Honey & Sauces
  "عسل": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80",
  "صوص": "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=600&q=80",
};

function getCuratedImage(name: string, category: string): string {
  for (const [key, url] of Object.entries(curatedImages)) {
    if (name.includes(key)) return url;
  }
  for (const [key, url] of Object.entries(curatedImages)) {
    if (category.includes(key)) return url;
  }
  return "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80";
}

async function main() {
  console.log("🏢 1. Updating accurate branches from official Vinissia printed bag...");

  // Delete previous unused branches if any
  const allBranches = await prisma.branch.findMany();
  for (const b of allBranches) {
    if (!["BRANCH_HELIOPOLIS", "BRANCH_QOBBA"].includes(b.code)) {
      await prisma.branch.delete({ where: { id: b.id } }).catch(() => {});
    }
  }

  // Branch 1: مصر الجديدة - جسر السويس
  const branch1 = await prisma.branch.upsert({
    where: { code: "BRANCH_HELIOPOLIS" },
    update: {
      name: "فرع مصر الجديدة وجسر السويس",
      address: "17 شارع أحمد خليل متفرع من شارع جسر السويس أمام سنترال مصر الجديدة",
      phone: "0226342212",
      whatsapp: "01118400150",
      isActive: true,
    },
    create: {
      name: "فرع مصر الجديدة وجسر السويس",
      code: "BRANCH_HELIOPOLIS",
      address: "17 شارع أحمد خليل متفرع من شارع جسر السويس أمام سنترال مصر الجديدة",
      phone: "0226342212",
      whatsapp: "01118400150",
      isActive: true,
    },
  });

  // Branch 2: حدائق القبة
  const branch2 = await prisma.branch.upsert({
    where: { code: "BRANCH_QOBBA" },
    update: {
      name: "فرع حدائق القبة (شارع المدينة المنورة)",
      address: "101 تقسيم الرقابة الإدارية - شارع المدينة المنورة متفرع من ولي العهد - حدائق القبة",
      phone: "0224555203 - 01500905334",
      whatsapp: "01118400150",
      isActive: true,
    },
    create: {
      name: "فرع حدائق القبة (شارع المدينة المنورة)",
      code: "BRANCH_QOBBA",
      address: "101 تقسيم الرقابة الإدارية - شارع المدينة المنورة متفرع من ولي العهد - حدائق القبة",
      phone: "0224555203 - 01500905334",
      whatsapp: "01118400150",
      isActive: true,
    },
  });

  console.log(`✅ Branches updated: ${branch1.name} & ${branch2.name}`);

  // Update Settings
  await prisma.systemSettings.upsert({
    where: { id: "global_settings" },
    update: {
      storeName: "ألبان فينيسيا",
      tagline: "مش بس لبن وزبادي — خير المزارع الطبيعي على أصوله",
      address: "الفرع الأول: 17 ش أحمد خليل من جسر السويس أمام سنترال مصر الجديدة | الفرع الثاني: 101 تقسيم الرقابة الإدارية ش المدينة المنورة - حدائق القبة",
      phone: "0226342212 / 0224555203",
      hotline: "01500905334",
      whatsapp: "01118400150",
      announcement: "🥛 مرحباً بكم في ألبان فينيسيا (Venice) — مش بس لبن وزبادي! زوروا فرعينا بمصر الجديدة وحدائق القبة | ليس لدينا فروع أخرى",
    },
    create: {
      id: "global_settings",
      storeName: "ألبان فينيسيا",
      tagline: "مش بس لبن وزبادي — خير المزارع الطبيعي على أصوله",
      address: "الفرع الأول: 17 ش أحمد خليل من جسر السويس أمام سنترال مصر الجديدة | الفرع الثاني: 101 تقسيم الرقابة الإدارية ش المدينة المنورة - حدائق القبة",
      phone: "0226342212 / 0224555203",
      hotline: "01500905334",
      whatsapp: "01118400150",
      announcement: "🥛 مرحباً بكم في ألبان فينيسيا (Venice) — مش بس لبن وزبادي! زوروا فرعينا بمصر الجديدة وحدائق القبة | ليس لدينا فروع أخرى",
    },
  });

  console.log("👥 2. Updating staff accounts according to updated branches...");
  // 1. Maestro (المالك العام)
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
      phone: "01118400150",
      isActive: true,
    },
  });

  // 2. Manager (المدير العام)
  await prisma.user.upsert({
    where: { username: "manager" },
    update: {
      name: "أ/ إبراهيم فينيسيا (المدير العام للمعمل والفروع)",
      role: "manager",
      branchId: null,
      pin: "112233",
      passwordHash: "123456789",
      isActive: true,
    },
    create: {
      name: "أ/ إبراهيم فينيسيا (المدير العام للمعمل والفروع)",
      username: "manager",
      passwordHash: "123456789",
      pin: "112233",
      role: "manager",
      branchId: null,
      phone: "01118400151",
      isActive: true,
    },
  });

  // Branch 1: مصر الجديدة
  await prisma.user.upsert({
    where: { username: "mgr_helio" },
    update: {
      name: "مدير فرع مصر الجديدة وجسر السويس",
      role: "branch_manager",
      branchId: branch1.id,
      pin: "101101",
      passwordHash: "123456789",
      isActive: true,
    },
    create: {
      name: "مدير فرع مصر الجديدة وجسر السويس",
      username: "mgr_helio",
      passwordHash: "123456789",
      pin: "101101",
      role: "branch_manager",
      branchId: branch1.id,
      phone: "01118400152",
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { username: "cashier_helio" },
    update: {
      name: "كاشير فرع مصر الجديدة",
      role: "cashier",
      branchId: branch1.id,
      pin: "101102",
      passwordHash: "123456789",
      isActive: true,
    },
    create: {
      name: "كاشير فرع مصر الجديدة",
      username: "cashier_helio",
      passwordHash: "123456789",
      pin: "101102",
      role: "cashier",
      branchId: branch1.id,
      phone: "01118400153",
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { username: "delivery_helio" },
    update: {
      name: "طيار دليفري مصر الجديدة",
      role: "delivery",
      branchId: branch1.id,
      pin: "101103",
      passwordHash: "123456789",
      isActive: true,
    },
    create: {
      name: "طيار دليفري مصر الجديدة",
      username: "delivery_helio",
      passwordHash: "123456789",
      pin: "101103",
      role: "delivery",
      branchId: branch1.id,
      phone: "01118400154",
      isActive: true,
    },
  });

  // Branch 2: حدائق القبة
  await prisma.user.upsert({
    where: { username: "mgr_qobba" },
    update: {
      name: "مدير فرع حدائق القبة",
      role: "branch_manager",
      branchId: branch2.id,
      pin: "201101",
      passwordHash: "123456789",
      isActive: true,
    },
    create: {
      name: "مدير فرع حدائق القبة",
      username: "mgr_qobba",
      passwordHash: "123456789",
      pin: "201101",
      role: "branch_manager",
      branchId: branch2.id,
      phone: "01118400155",
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { username: "cashier_qobba" },
    update: {
      name: "كاشير فرع حدائق القبة",
      role: "cashier",
      branchId: branch2.id,
      pin: "201102",
      passwordHash: "123456789",
      isActive: true,
    },
    create: {
      name: "كاشير فرع حدائق القبة",
      username: "cashier_qobba",
      passwordHash: "123456789",
      pin: "201102",
      role: "cashier",
      branchId: branch2.id,
      phone: "01118400156",
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { username: "delivery_qobba" },
    update: {
      name: "طيار دليفري حدائق القبة",
      role: "delivery",
      branchId: branch2.id,
      pin: "201103",
      passwordHash: "123456789",
      isActive: true,
    },
    create: {
      name: "طيار دليفري حدائق القبة",
      username: "delivery_qobba",
      passwordHash: "123456789",
      pin: "201103",
      role: "delivery",
      branchId: branch2.id,
      phone: "01118400157",
      isActive: true,
    },
  });

  console.log("🥛 3. Adding newly requested products...");
  // Find or create appropriate categories
  let catCheese = await prisma.category.findFirst({ where: { nameAr: { contains: "أجبان" } } });
  let catMeat = await prisma.category.findFirst({ where: { nameAr: { contains: "لحوم" } } });
  let catSweet = await prisma.category.findFirst({ where: { nameAr: { contains: "حلو" } } });
  let catFarm = await prisma.category.findFirst({ where: { nameAr: { contains: "سمن" } } });

  if (!catCheese) catCheese = await prisma.category.create({ data: { nameAr: "أجبان فاخرة ومعتقة", icon: "🧀" } });
  if (!catMeat) catMeat = await prisma.category.create({ data: { nameAr: "لحوم مصنعة ومبردات", icon: "🥩" } });
  if (!catSweet) catSweet = await prisma.category.create({ data: { nameAr: "حلويات ومعلبات مصنعة يدوي", icon: "🥣" } });
  if (!catFarm) catFarm = await prisma.category.create({ data: { nameAr: "سمن وزبدة ومكملات مزارع", icon: "🧈" } });

  const newProductsList = [
    {
      nameAr: "فصوص رومي مدخن فاخر",
      catId: catCheese.id,
      catName: catCheese.nameAr,
      price: 960,
      cost: 780,
      isWeighted: true,
      unit: "1 كجم",
      plu: "801",
      badge: "فاخر بالوزن ⭐",
      desc: "فصوص جبنة رومي معتقة ومبهرة طبيعياً بالوزن",
    },
    {
      nameAr: "حلاوة لذيذة بالمكسرات",
      catId: catSweet.id,
      catName: catSweet.nameAr,
      price: 160,
      cost: 120,
      isWeighted: true,
      unit: "1 كجم",
      plu: "802",
      badge: "طازج اليوم ⭐",
      desc: "حلاوة طحينية فاخرة ممتازة وغنية بالسمسم الطبيعي",
    },
    {
      nameAr: "حلاوة وش حلة سادة ونوتيلا",
      catId: catSweet.id,
      catName: catSweet.nameAr,
      price: 175,
      cost: 135,
      isWeighted: true,
      unit: "1 كجم",
      plu: "803",
      badge: "صنع فينيسيا 🥛",
      desc: "حلاوة وش حلة طازجة بطعم النوتيلا الكريمي الغني",
    },
    {
      nameAr: "حلاوة وش حلة مكسرات وشيكولاتة بندق",
      catId: catSweet.id,
      catName: catSweet.nameAr,
      price: 200,
      cost: 155,
      isWeighted: true,
      unit: "1 كجم",
      plu: "804",
      badge: "صنع فينيسيا 🥛",
      desc: "حلاوة وش حلة غنية بقطع البندق والشيكولاتة الفاخرة",
    },
    {
      nameAr: "صوص شيدر كريمي فاخر",
      catId: catCheese.id,
      catName: catCheese.nameAr,
      price: 200,
      cost: 150,
      isWeighted: true,
      unit: "1 كجم",
      plu: "805",
      badge: "طازج اليوم ⭐",
      desc: "صوص جبنة شيدر غني وناعم للساندوتشات والوجبات",
    },
    {
      nameAr: "سلطة تركي متبلة مخصوص",
      catId: catCheese.id,
      catName: catCheese.nameAr,
      price: 200,
      cost: 150,
      isWeighted: true,
      unit: "1 كجم",
      plu: "806",
      badge: "خلطة فينيسيا 🥛",
      desc: "سلطة جبنة تركي مع فلفل وزيتون وتتبيلة فينيسيا السرية",
    },
    {
      nameAr: "لحم روستو مدخن فاخر (رستو)",
      catId: catMeat.id,
      catName: catMeat.nameAr,
      price: 380,
      cost: 300,
      isWeighted: true,
      unit: "1 كجم",
      plu: "807",
      badge: "أعلى جودة 🥩",
      desc: "عرق روستو بقر مدخن شرائح ومتبل على أعلى مستوى",
    },
    {
      nameAr: "بيف بيكون مدخن فاخر",
      catId: catMeat.id,
      catName: catMeat.nameAr,
      price: 480,
      cost: 380,
      isWeighted: true,
      unit: "1 كجم",
      plu: "808",
      badge: "مدخن فاخر 🥩",
      desc: "شرائح بيف بيكون بقري مدخن على خشب الأرو",
    },
    {
      nameAr: "صوص أكياس منوع (شيدر / رانش / باربيكيو)",
      catId: catFarm.id,
      catName: catFarm.nameAr,
      price: 7,
      cost: 4.5,
      isWeighted: false,
      unit: "كيس",
      plu: "809",
      badge: "إضافة سريعة 📦",
      desc: "كيس صوص مغلف عملي ومناسب لكل الوجبات",
    },
    {
      nameAr: "عسل سدر طبيعي 100%",
      catId: catFarm.id,
      catName: catFarm.nameAr,
      price: 1200,
      cost: 950,
      isWeighted: true,
      unit: "1 كجم",
      plu: "810",
      badge: "مزارعنا الطبيعية 🍯",
      desc: "عسل سدر جبلي خام ونقي 100% بدون أي تغذية أو إضافات",
    },
    {
      nameAr: "عسل جينسينج وغذاء ملكات النحل",
      catId: catFarm.id,
      catName: catFarm.nameAr,
      price: 450,
      cost: 350,
      isWeighted: true,
      unit: "1 كجم",
      plu: "811",
      badge: "صحي ومقوي 🍯",
      desc: "عسل جبلي مقوي مضاف إليه خلاصة الجينسينج وغذاء ملكات النحل",
    },
    {
      nameAr: "عسل إضافة (علبة صغيرة)",
      catId: catFarm.id,
      catName: catFarm.nameAr,
      price: 6,
      cost: 3.5,
      isWeighted: false,
      unit: "علبة صغيرة",
      plu: "812",
      badge: "إضافة حلويات 🍯",
      desc: "علبة صغيرة عسل نحل نقي لإضافتها على الرز بلبن والحلويات",
    },
    {
      nameAr: "عسل إضافة بالمكسرات (علبة صغيرة)",
      catId: catFarm.id,
      catName: catFarm.nameAr,
      price: 8,
      cost: 5,
      isWeighted: false,
      unit: "علبة صغيرة",
      plu: "813",
      badge: "إضافة حلويات 🍯",
      desc: "علبة صغيرة عسل نحل نقي مضاف إليها مكسرات مشكلة فاخرة",
    },
  ];

  for (const item of newProductsList) {
    const existing = await prisma.product.findFirst({ where: { nameAr: item.nameAr } });
    const img = getCuratedImage(item.nameAr, item.catName);
    if (!existing) {
      const prod = await prisma.product.create({
        data: {
          nameAr: item.nameAr,
          categoryId: item.catId,
          categoryName: item.catName,
          basePrice: item.price,
          pricePerKg: item.isWeighted ? item.price : null,
          costPrice: item.cost,
          isWeighted: item.isWeighted,
          unit: item.unit,
          pluCode: item.plu,
          badge: item.badge,
          description: item.desc,
          image: img,
          stockQty: 50,
        },
      });

      // Branch Stocks
      await prisma.branchStock.createMany({
        data: [
          { branchId: branch1.id, productId: prod.id, stockQty: 25, openingStock: 25 },
          { branchId: branch2.id, productId: prod.id, stockQty: 25, openingStock: 25 },
        ],
      });
    } else {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          basePrice: item.price,
          pricePerKg: item.isWeighted ? item.price : null,
          costPrice: item.cost,
          image: img,
          badge: item.badge,
          description: item.desc,
        },
      });
    }
  }
  console.log(`✅ All ${newProductsList.length} newly requested items added/updated!`);

  console.log("📸 4. Assigning high-res photography images to ALL products...");
  const allProducts = await prisma.product.findMany();
  let updatedImagesCount = 0;

  for (const prod of allProducts) {
    const imgUrl = getCuratedImage(prod.nameAr, prod.categoryName);
    await prisma.product.update({
      where: { id: prod.id },
      data: { image: imgUrl },
    });

    // Make sure each product has BranchStock entries for both branches
    await prisma.branchStock.upsert({
      where: {
        branchId_productId: {
          branchId: branch1.id,
          productId: prod.id,
        },
      },
      update: {},
      create: {
        branchId: branch1.id,
        productId: prod.id,
        stockQty: 30,
        openingStock: 30,
      },
    });

    await prisma.branchStock.upsert({
      where: {
        branchId_productId: {
          branchId: branch2.id,
          productId: prod.id,
        },
      },
      update: {},
      create: {
        branchId: branch2.id,
        productId: prod.id,
        stockQty: 30,
        openingStock: 30,
      },
    });

    updatedImagesCount++;
  }
  console.log(`✅ Assigned high-res imagery and branch stock to ${updatedImagesCount} products!`);
}

main()
  .then(() => {
    console.log("🎉 Complete setup & data update finished successfully!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error updating system data:", err);
    process.exit(1);
  });
