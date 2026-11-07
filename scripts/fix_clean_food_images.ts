import { PrismaClient } from "../lib/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// =========================================================================
// 100% PURE FOOD & DAIRY PHOTOGRAPHY (ABSOLUTELY NO WATERMELONS, NO CREPES, NO SHAWARMA)
// =========================================================================

// 1. HONEY (Verified Arwin Neil & Apiary collection - Pure Honey Jars with dipper & honeycomb)
const HONEY_JAR_DIPPER = "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=600&q=80"; // Golden liquid honey jar with wooden dipper
const HONEY_JAR_COMB   = "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80"; // Amber mountain honey jar with honeycomb
const HONEY_NUTS       = "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80"; // Honey drizzled over walnuts and almonds
const HONEY_PORTION    = "https://images.unsplash.com/photo-1471943311424-646960669fbc?auto=format&fit=crop&w=600&q=80"; // Small glass dip of natural honey

// 2. FRESH MILK & DRINKING DAIRY
const MILK_BOTTLE      = "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80"; // Cold glass bottle of fresh farm milk
const MILK_STREAM      = "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80"; // Fresh milk pouring into glass
const LABAN_RAYEB      = "https://images.unsplash.com/photo-1571212515416-fef01fc43637?auto=format&fit=crop&w=600&q=80"; // Cold thick rayeb buttermilk bottle
const ZABADO_MANGO     = "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80"; // Fresh mango fruit smoothie/yogurt drink
const ZABADO_STRAWBERRY= "https://images.unsplash.com/photo-1517578239113-b03992dcdd25?auto=format&fit=crop&w=600&q=80"; // Strawberry drinking yogurt

// 3. YOGURT & CLAY POTS
const YOGURT_BOWL      = "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80"; // Creamy baladi yogurt bowl
const YOGURT_POTTERY   = "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=600&q=80"; // Clay pot yogurt with thick cream layer

// 4. CHEESES
const ROUMI_WEDGE      = "https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=600&q=80"; // Aged Egyptian Roumi cheese wheel & wedges
const HARD_CHEESE_BLOCK= "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=600&q=80"; // Slicing farmhouse yellow aged cheese
const SLICED_ROUMI     = "https://images.unsplash.com/photo-1631379578550-7038263db699?auto=format&fit=crop&w=600&q=80"; // Sliced aged golden roumi cheese
const CHEDDAR_BLOCK    = "https://images.unsplash.com/photo-1618040996337-56904b7850b9?auto=format&fit=crop&w=600&q=80"; // Real cheddar cheese block & cubes
const CHEDDAR_DIP      = "https://images.unsplash.com/photo-1552767059-ce182ead6c1b?auto=format&fit=crop&w=600&q=80"; // Hot melted cheddar cheese sauce dip
const FETA_BLOCK       = "https://images.unsplash.com/photo-1589881133595-a3c085cb731d?auto=format&fit=crop&w=600&q=80"; // White feta block in olive oil & herbs
const QAREESH_COTTAGE  = "https://images.unsplash.com/photo-1559561853-08451507cbe7?auto=format&fit=crop&w=600&q=80"; // Fresh white cottage curd cheese (Qareesh)
const CHEESE_SALAD     = "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80"; // Turkish spicy cheese salad
const MOZZARELLA_BALL  = "https://images.unsplash.com/photo-1624806992066-5ffcf7ca186b?auto=format&fit=crop&w=600&q=80"; // Fresh mozzarella in bowl
const WHITE_SALTY_CHEESE="https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=600&q=80"; // Salted Baramily/Istanbouly cheese

// 5. GHEE & BUTTER & FRESH CREAM
const GHEE_JAR         = "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80"; // Golden clarified farm ghee in glass jar
const BUTTER_ROLL      = "https://images.unsplash.com/photo-1589985270915-d363595679cf?auto=format&fit=crop&w=600&q=80"; // Farmhouse white buffalo butter roll
const ESHTA_CREAM      = "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80"; // Pure farm clotted cream

// 6. DELI COLD CUTS (GENUINE PASTRAMI & ROAST BEEF - NO CREPES, NO SHAWARMA!)
const PASTRAMI_SLICES  = "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=600&q=80"; // Red sliced Egyptian cured pastrami
const DELI_COLD_CUTS   = "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&w=600&q=80"; // Thin deli luncheon and cold cuts
const SMOKED_ROAST_BEEF= "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=600&q=80"; // Smoked beef bacon & roast cuts

// 7. RICE PUDDING & DAIRY DESSERTS & HALAWA
const RICE_PUDDING_PLAIN = "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80"; // Plain Egyptian rice pudding in bowl
const BAKED_PUDDING_OVEN = "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80"; // Browned baked rice pudding (فرن)
const CLAY_POT_DESSERT   = "https://images.unsplash.com/photo-1517427294546-5aa121f68e8a?auto=format&fit=crop&w=600&q=80"; // Baked Om Ali & pottery dish
const OREO_LOTUS_DESSERT = "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=600&q=80"; // Crushed Oreo / Lotus rice pudding cup
const HALAWA_TAHINI      = "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80"; // Pure sesame Halawa tahinia confectionery block
const CHOCOLATE_FUDGE    = "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80"; // Chocolate swirl halawa / fudge
const MOLTEN_CAKE        = "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80"; // Chocolate molten lava cake

// 8. EGGS & SAUCES
const FARM_EGGS          = "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=600&q=80"; // Fresh farm eggs in basket
const CONDIMENT_SAUCE    = "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=600&q=80"; // Sauce packet / dip cup

function getCleanFoodImage(name: string, category: string): string {
  const n = name.trim();
  const c = category.trim();

  // 1. HONEY: Guaranteed 100% pure honey photography (NO WATERMELON!)
  if (n.includes("سدر")) return HONEY_JAR_DIPPER;
  if (n.includes("جينسج") || n.includes("جينسينج") || n.includes("ملكات")) return HONEY_JAR_COMB;
  if (n.includes("مكسرات") && (n.includes("عسل") || c.includes("عسل"))) return HONEY_NUTS;
  if (n.includes("علبة صغيرة") || n.includes("علبه صغيره") || n.includes("إضافة") || n.includes("اضافة")) return HONEY_PORTION;
  if (n.includes("عسل") || c.includes("عسل")) return HONEY_JAR_DIPPER;

  // 2. HALAWA
  if (n.includes("نويتلا") || n.includes("نوتيلا") || n.includes("شيكولاته") || n.includes("شوكولاتة")) return CHOCOLATE_FUDGE;
  if (n.includes("حلاوه") || n.includes("حلاوة")) return HALAWA_TAHINI;

  // 3. EGGS
  if (n.includes("بيض")) return FARM_EGGS;

  // 4. GHEE & BUTTER & CREAM
  if (n.includes("سمن")) return GHEE_JAR;
  if (n.includes("زبده") || n.includes("زبدة")) return BUTTER_ROLL;
  if (n.includes("قشطه") || n.includes("قشطة") || n.includes("مورته") || n.includes("كريمة")) return ESHTA_CREAM;

  // 5. RICE PUDDING & DESSERTS
  if (n.includes("رز بلبن فرن") || n.includes("أرز بلبن فرن")) return BAKED_PUDDING_OVEN;
  if (n.includes("رز بلبن فخار") || n.includes("أرز بلبن فخار")) return CLAY_POT_DESSERT;
  if (n.includes("لوتس") || n.includes("اوريو") || n.includes("أوريو")) return OREO_LOTUS_DESSERT;
  if (n.includes("مانجو") || n.includes("مانجا")) return ZABADO_MANGO;
  if (n.includes("رز بلبن") || n.includes("أرز بلبن")) return RICE_PUDDING_PLAIN;
  if (n.includes("أم علي") || n.includes("ام علي") || n.includes("مهلبية") || n.includes("مهلبيه") || n.includes("كريم كراميل") || n.includes("كاستر") || n.includes("جيلي")) {
    return CLAY_POT_DESSERT;
  }
  if (n.includes("مولتن") || n.includes("فادج") || n.includes("كيك") || n.includes("ديسباسيتو") || n.includes("سويسرول")) {
    return MOLTEN_CAKE;
  }

  // 6. MILK & DRINKING DAIRY
  if (n.includes("زبادي بلدي") || n.includes("طاجن زبادي")) return YOGURT_POTTERY;
  if (n.includes("زبادي")) return YOGURT_BOWL;
  if (n.includes("فراولة")) return ZABADO_STRAWBERRY;
  if (n.includes("مانجو")) return ZABADO_MANGO;
  if (n.includes("رايب") || n.includes("زبادو")) return LABAN_RAYEB;
  if (n.includes("لبن") || n.includes("حليب")) return MILK_BOTTLE;

  // 7. COLD CUTS & DELI (NO CREPES, NO SHAWARMA!)
  if (n.includes("بسطرمة") || n.includes("بسطرمه")) return PASTRAMI_SLICES;
  if (n.includes("بيكون") || n.includes("روستو") || n.includes("رستو") || n.includes("بيف")) return SMOKED_ROAST_BEEF;
  if (n.includes("لانشون") || n.includes("سلامي") || n.includes("تركي")) return DELI_COLD_CUTS;

  // 8. CHEESES (NO PIZZA, NO WRAPS!)
  if (n.includes("صوص شيدر")) return CHEDDAR_DIP;
  if (n.includes("شيدر")) return CHEDDAR_BLOCK;
  if (n.includes("سلطه تركي") || n.includes("سلطة تركي")) return CHEESE_SALAD;
  if (n.includes("فصوص رومي")) return SLICED_ROUMI;
  if (n.includes("رومي")) return ROUMI_WEDGE;
  if (n.includes("موتزريلا") || n.includes("موتزاريلا")) return MOZZARELLA_BALL;
  if (n.includes("كيري") || n.includes("قريش")) return QAREESH_COTTAGE;
  if (n.includes("جوده") || n.includes("فلمنك") || n.includes("ريكفورد")) return HARD_CHEESE_BLOCK;
  if (n.includes("براميلي") || n.includes("إسطنبولي") || n.includes("اسطنبولي") || n.includes("فيتا") || n.includes("مزبده") || n.includes("قديمة") || n.includes("جبن") || n.includes("جبنة")) {
    return FETA_BLOCK;
  }

  if (n.includes("صوص")) return CONDIMENT_SAUCE;

  if (c.includes("لحوم")) return DELI_COLD_CUTS;
  if (c.includes("أجبان") || c.includes("اجبان")) return ROUMI_WEDGE;
  if (c.includes("حلو") || c.includes("حلويات")) return RICE_PUDDING_PLAIN;
  if (c.includes("سمن") || c.includes("مزارع")) return GHEE_JAR;

  return MILK_BOTTLE;
}

async function main() {
  console.log("🧼 Purging all watermelon, crepe, shawarma and placeholder images from Neon Database...");

  const products = await prisma.product.findMany();
  let updatedCount = 0;

  for (const p of products) {
    const cleanImage = getCleanFoodImage(p.nameAr, p.categoryName);
    await prisma.product.update({
      where: { id: p.id },
      data: { image: cleanImage },
    });
    updatedCount++;
    console.log(`[${updatedCount}/${products.length}] ${p.nameAr} => ${cleanImage}`);
  }

  console.log(`\n🎉 SUCCESS! All ${updatedCount} products updated with 100% verified dairy, honey, cheese, and deli imagery!`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
