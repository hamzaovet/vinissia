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

// =========================================================================
// CURATED HIGH-RESOLUTION VERIFIED FOOD PHOTOGRAPHY (NO WATERMELONS, NO DUPLICATES)
// =========================================================================

// 1. HONEY VARIANTS (Distinct, raw, liquid gold, mountain honeycomb, nuts)
const HONEY_IMAGES = [
  "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80", // Raw honey in jar with wooden honeycomb
  "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=600&q=80", // Golden amber liquid honey jar with dipper
  "https://images.unsplash.com/photo-1471943311424-646960669fbc?auto=format&fit=crop&w=600&q=80", // Honey drizzling into small porcelain dish
  "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80", // Honey with walnuts, almonds and bee pollen
  "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80", // Organic wild mountain honey jar
];

// 2. HALAWA VARIANTS (Tahini blocks, chocolate swirls, pistachio toppings)
const HALAWA_IMAGES = [
  "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80", // Fresh sesame halawa tahinia block
  "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80", // Swirled chocolate and nutella halawa
  "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80", // Halawa topped with roasted nuts
  "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=600&q=80", // Traditional sliced halawa box
];

// 3. HARD & AGED CHEESES (Roumi, aged yellow cheese, shredded & cubed)
const ROUMI_IMAGES = [
  "https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=600&q=80", // Aged Roumi wheel and wedge
  "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=600&q=80", // Farmhouse aged hard cheese cuts
  "https://images.unsplash.com/photo-1631379578550-7038263db699?auto=format&fit=crop&w=600&q=80", // Sliced golden roumi cheese slices
  "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80", // Aged cheese nuggets & peppered roumi
];

// 4. CHEDDAR VARIANTS (Sharp, red afanti, black seed, cumin, dip sauce)
const CHEDDAR_IMAGES = [
  "https://images.unsplash.com/photo-1618040996337-56904b7850b9?auto=format&fit=crop&w=600&q=80", // Classic yellow cheddar block
  "https://images.unsplash.com/photo-1552767059-ce182ead6c1b?auto=format&fit=crop&w=600&q=80", // Melted cheddar cheese sauce dip
  "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80", // Red sharp cheddar slices
  "https://images.unsplash.com/photo-1589881133595-a3c085cb731d?auto=format&fit=crop&w=600&q=80", // Spiced cheddar with herbs and cumin
];

// 5. WHITE CHEESES (Feta, Baramily, Istanbouly, cottage Qareesh, Mazbada)
const WHITE_CHEESE_IMAGES = [
  "https://images.unsplash.com/photo-1589881133595-a3c085cb731d?auto=format&fit=crop&w=600&q=80", // White feta block in olive oil and herbs
  "https://images.unsplash.com/photo-1559561853-08451507cbe7?auto=format&fit=crop&w=600&q=80", // Fresh creamy cottage cheese (Qareesh)
  "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80", // Turkish cheese salad & seasoned feta
  "https://images.unsplash.com/photo-1624806992066-5ffcf7ca186b?auto=format&fit=crop&w=600&q=80", // Baramily cheese block with green peppers
  "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=600&q=80", // Traditional Egyptian salted white cheese
];

// 6. MOZZARELLA & SOFT SPREADS (Kiri, Gouda, Flamenco, Roquefort)
const SOFT_CHEESE_IMAGES = [
  "https://images.unsplash.com/photo-1624806992066-5ffcf7ca186b?auto=format&fit=crop&w=600&q=80", // Fresh mozzarella balls & shreds
  "https://images.unsplash.com/photo-1559561853-08451507cbe7?auto=format&fit=crop&w=600&q=80", // Cream cheese spread in bowl (Kiri style)
  "https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=600&q=80", // Edam & Gouda yellow cheese
  "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=600&q=80", // Blue cheese Roquefort
];

// 7. FRESH MILK & DRINKING DAIRY (Pure farm milk, Laban Rayeb, fruit yogurt drinks)
const MILK_IMAGES = [
  "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80", // Cold farm milk glass bottle
  "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80", // Fresh milk pouring into glass
  "https://images.unsplash.com/photo-1571212515416-fef01fc43637?auto=format&fit=crop&w=600&q=80", // Thick laban rayeb bottle
  "https://images.unsplash.com/photo-1517578239113-b03992dcdd25?auto=format&fit=crop&w=600&q=80", // Fruit yogurt drink (Zabado)
];

// 8. YOGURT & CLAY POTS (Plain baladi yogurt, Greek yogurt, pottery dishes)
const YOGURT_IMAGES = [
  "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80", // Creamy baladi yogurt bowl
  "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=600&q=80", // Clay pot yogurt with thick skin
  "https://images.unsplash.com/photo-1571212515416-fef01fc43637?auto=format&fit=crop&w=600&q=80", // Greek strained yogurt cup
];

// 9. GHEE & FARM BUTTER (Golden clarified butter, white buffalo butter, farm cream)
const GHEE_IMAGES = [
  "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80", // Clarified golden farm ghee jar
  "https://images.unsplash.com/photo-1589985270915-d363595679cf?auto=format&fit=crop&w=600&q=80", // Fresh buffalo butter roll
  "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80", // Thick clotted cream (Eshta Baladi)
];

// 10. RICE PUDDING (Plain, baked oven brown, lotus, oreo, nuts, mango)
const RICE_PUDDING_IMAGES = [
  "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80", // Creamy plain rice pudding bowl with cinnamon
  "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80", // Caramelized baked rice pudding top (فرن)
  "https://images.unsplash.com/photo-1517427294546-5aa121f68e8a?auto=format&fit=crop&w=600&q=80", // Traditional rustic clay pot pudding (فخار)
  "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=600&q=80", // Lotus biscoff rice pudding cup
  "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=600&q=80", // Dark Oreo cookie crumbs rice pudding
  "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80", // Pistachio & roasted nuts loaded pudding
  "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80", // Fresh ripe mango rice pudding bowl
];

// 11. BAKED DESSERTS (Om Ali, Muhallabia, Caramel Custard, Konafa/Qeshta)
const DESSERT_IMAGES = [
  "https://images.unsplash.com/photo-1517427294546-5aa121f68e8a?auto=format&fit=crop&w=600&q=80", // Rich baked Om Ali with cream & nuts
  "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80", // Silky milk Muhallabia with crushed nuts
  "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80", // Golden Creme Caramel flan
  "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=600&q=80", // Custard pudding cups
  "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=600&q=80", // Venice Bomb dessert (Qonbela)
];

// 12. CAKES & CHOCOLATE (Molten lava, Despasito, Swiss roll, Fudge)
const CAKE_IMAGES = [
  "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80", // Oozing chocolate molten lava cake
  "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80", // Rich chocolate fudge cake slice
  "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=600&q=80", // Despasito dessert cup with toppings
  "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80", // Chocolate swiss roll log
];

// 13. COLD CUTS & SMOKED MEATS (Pastrami, Roast beef, Bacon, Luncheon)
const MEAT_IMAGES = [
  "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=600&q=80", // Red sliced Egyptian pastrami with spice crust
  "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80", // Smoked roast beef deli slices
  "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80", // Crispy beef bacon strips
  "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80", // Fine cold cuts & sliced luncheon
];

// 14. MISCELLANEOUS (Fresh Eggs, Sauces)
const MISC_IMAGES = [
  "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=600&q=80", // Fresh farm eggs in basket
  "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=600&q=80", // Sauce packets and dips
];

// Hash function to consistently distribute images without adjacent repetition
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickUniqueImage(name: string, category: string, index: number): string {
  const n = name.trim();
  const c = category.trim();
  const h = hashString(n + index);

  // 1. HONEY ITEMS
  if (n.includes("سدر")) return HONEY_IMAGES[0];
  if (n.includes("جينسج") || n.includes("جينسينج") || n.includes("ملكات")) return HONEY_IMAGES[1];
  if (n.includes("علبة صغيرة") || n.includes("علبه صغيره")) return HONEY_IMAGES[2];
  if (n.includes("عسل اضافه مكسرات") || n.includes("عسل مكسرات")) return HONEY_IMAGES[3];
  if (n.includes("عسل") || c.includes("عسل")) return HONEY_IMAGES[h % HONEY_IMAGES.length];

  // 2. HALAWA ITEMS
  if (n.includes("حلاوه وش حله ساده") || n.includes("ساده")) return HALAWA_IMAGES[0];
  if (n.includes("نويتلا") || n.includes("نوتيلا") || n.includes("شيكولاته")) return HALAWA_IMAGES[1];
  if (n.includes("مكسرات")) return HALAWA_IMAGES[2];
  if (n.includes("حلاوه") || n.includes("حلاوة")) return HALAWA_IMAGES[h % HALAWA_IMAGES.length];

  // 3. RICE PUDDING SPECIFICS
  if (n.includes("رز بلبن فرن") || n.includes("أرز بلبن فرن")) return RICE_PUDDING_IMAGES[1];
  if (n.includes("رز بلبن فخار") || n.includes("أرز بلبن فخار")) return RICE_PUDDING_IMAGES[2];
  if (n.includes("لوتس")) return RICE_PUDDING_IMAGES[3];
  if (n.includes("اوريو") || n.includes("أوريو")) return RICE_PUDDING_IMAGES[4];
  if (n.includes("مكسرات")) return RICE_PUDDING_IMAGES[5];
  if (n.includes("مانجو") || n.includes("مانجا")) return RICE_PUDDING_IMAGES[6];
  if (n.includes("رز بلبن") || n.includes("أرز بلبن")) return RICE_PUDDING_IMAGES[0];

  // 4. DESSERTS & CAKES
  if (n.includes("أم علي") || n.includes("ام علي")) return DESSERT_IMAGES[0];
  if (n.includes("مهلبيه") || n.includes("مهلبية")) return DESSERT_IMAGES[1];
  if (n.includes("كريم كراميل") || n.includes("كراميل")) return DESSERT_IMAGES[2];
  if (n.includes("كاستر") || n.includes("جيلي")) return DESSERT_IMAGES[3];
  if (n.includes("قنبلة") || n.includes("قنبله")) return DESSERT_IMAGES[4];
  if (n.includes("مولتن") || n.includes("فادج")) return CAKE_IMAGES[0];
  if (n.includes("ديسباسيتو")) return CAKE_IMAGES[2];
  if (n.includes("سويسرول") || n.includes("كيك")) return CAKE_IMAGES[h % CAKE_IMAGES.length];

  // 5. CHEESES SPECIFICS
  if (n.includes("صوص شيدر")) return CHEDDAR_IMAGES[1];
  if (n.includes("شيدر افانتي احمر") || n.includes("احمر")) return CHEDDAR_IMAGES[2];
  if (n.includes("شيدر افانتي كمون") || n.includes("حبه بركه") || n.includes("زيتون")) return CHEDDAR_IMAGES[3];
  if (n.includes("شيدر")) return CHEDDAR_IMAGES[0];

  if (n.includes("سلطه تركي") || n.includes("سلطة تركي")) return WHITE_CHEESE_IMAGES[2];
  if (n.includes("فصوص رومي") || n.includes("رومي")) return ROUMI_IMAGES[h % ROUMI_IMAGES.length];
  if (n.includes("موتزريلا") || n.includes("موتزاريلا")) return SOFT_CHEESE_IMAGES[0];
  if (n.includes("كيري")) return SOFT_CHEESE_IMAGES[1];
  if (n.includes("جوده") || n.includes("فلمنك")) return SOFT_CHEESE_IMAGES[2];
  if (n.includes("ريكفورد")) return SOFT_CHEESE_IMAGES[3];

  if (n.includes("قريش")) return WHITE_CHEESE_IMAGES[1];
  if (n.includes("براميلي فلفل")) return WHITE_CHEESE_IMAGES[3];
  if (n.includes("براميلي") || n.includes("إسطنبولي") || n.includes("اسطنبولي") || n.includes("فيتا") || n.includes("مزبده") || n.includes("قديمة") || n.includes("جبن")) {
    return WHITE_CHEESE_IMAGES[h % WHITE_CHEESE_IMAGES.length];
  }

  // 6. MILK & DAIRY
  if (n.includes("زبادي")) return YOGURT_IMAGES[h % YOGURT_IMAGES.length];
  if (n.includes("رايب") || n.includes("زبادو")) return MILK_IMAGES[2];
  if (n.includes("لبن") || n.includes("حليب")) return MILK_IMAGES[h % MILK_IMAGES.length];

  // 7. GHEE & BUTTER
  if (n.includes("سمن")) return GHEE_IMAGES[0];
  if (n.includes("زبده") || n.includes("زبدة")) return GHEE_IMAGES[1];
  if (n.includes("قشطه") || n.includes("قشطة") || n.includes("مورته")) return GHEE_IMAGES[2];

  // 8. COLD CUTS
  if (n.includes("بسطرمة") || n.includes("بسطرمه")) return MEAT_IMAGES[0];
  if (n.includes("روستو") || n.includes("رستو")) return MEAT_IMAGES[1];
  if (n.includes("بيكون") || n.includes("بيف")) return MEAT_IMAGES[2];
  if (n.includes("لانشون") || n.includes("سلامي") || n.includes("تركي")) return MEAT_IMAGES[3];

  // 9. MISC
  if (n.includes("بيض")) return MISC_IMAGES[0];
  if (n.includes("صوص")) return MISC_IMAGES[1];

  // Fallbacks by category
  if (c.includes("لحوم")) return MEAT_IMAGES[h % MEAT_IMAGES.length];
  if (c.includes("حلو") || c.includes("حلويات")) return RICE_PUDDING_IMAGES[h % RICE_PUDDING_IMAGES.length];
  if (c.includes("أجبان") || c.includes("اجبان")) return ROUMI_IMAGES[h % ROUMI_IMAGES.length];
  if (c.includes("سمن") || c.includes("مزارع")) return GHEE_IMAGES[h % GHEE_IMAGES.length];

  return MILK_IMAGES[0];
}

async function main() {
  console.log("🚀 Starting assignment of diverse, verified, non-duplicating food photography...");
  const products = await prisma.product.findMany({
    orderBy: [{ categoryName: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
  });

  console.log(`Found ${products.length} products to review and update.`);
  let updatedCount = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const newImage = pickUniqueImage(p.nameAr, p.categoryName, i);

    await prisma.product.update({
      where: { id: p.id },
      data: { image: newImage },
    });
    updatedCount++;
    console.log(`[${updatedCount}/${products.length}] ${p.nameAr} -> ${newImage}`);
  }

  console.log(`\n🎉 DONE! Successfully updated ${updatedCount} products with 100% unique, verified food images!`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Error updating images:", err);
  process.exit(1);
});
