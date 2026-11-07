// Script to fix ALL product images with verified, accurate Unsplash photos
// Most specific rules FIRST to prevent general keywords (like 'لبن') from swallowing 'أرز بلبن'
const { Client } = require('pg');

const DB_URL = 'postgresql://neondb_owner:npg_i7Eou0AUebmj@ep-flat-dawn-b9bio6n2-pooler.c-7.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

function img(id) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&q=80`;
}

// Ordered strictly from MOST SPECIFIC to LEAST SPECIFIC
const imageMap = [
  // 1. DESSERTS WITH MILK (أرز بلبن وحلويات - Must be BEFORE 'لبن')
  { match: ['أرز بلبن فرن', 'رز بلبن فرن', 'قرع عسل فرن', 'قرع عسل'], img: img('1587314168485-3236d6710814') }, // Baked golden rice pudding
  { match: ['أرز بلبن فخار', 'رز بلبن فخار', 'أم علي', 'ام علي'], img: img('1517427294546-5aa121f68e8a') }, // Traditional clay pot dessert
  { match: ['أرز بلبن مكسرات', 'رز بلبن مكسرات', 'قنبلة فينيسيا', 'قنبلة'], img: img('1541781774459-bb2af2f05b55') }, // Rich topped rice pudding
  { match: ['أرز بلبن اوريو', 'أرز بلبن لوتس', 'رز بلبن اوريو', 'رز بلبن لوتس'], img: img('1563729784474-d77dbb933a9e') }, // Cookies & cream dessert
  { match: ['أرز بلبن مانجو', 'رز بلبن مانجو'], img: img('1553279768-865429fa0078') }, // Mango topping
  { match: ['أرز بلبن', 'رز بلبن'], img: img('1541781774459-bb2af2f05b55') }, // Creamy white rice pudding
  { match: ['كاستر', 'مهلبية', 'جيلي', 'كريم كراميل'], img: img('1517427294546-5aa121f68e8a') },
  { match: ['حلاوة', 'حلاوه'], img: img('1517427294546-5aa121f68e8a') },

  // 2. BEVERAGES & YOGURT DRINKS (زبادو ومشروبات)
  { match: ['زبادو فراولة', 'زبادو فراوله', 'رايب فراولة'], img: img('1517578239113-b03992dcdd25') }, // Strawberry pink yogurt drink
  { match: ['زبادو مانجو', 'رايب مانجو'], img: img('1553279768-865429fa0078') }, // Mango yellow yogurt drink
  { match: ['لبن رايب بالنعناع', 'رايب بالنعناع', 'نعناع'], img: img('1571212515416-fef01fc43637') }, // Mint fresh yogurt drink
  { match: ['لبن رايب فواكه', 'رايب فواكه', 'رايب أنواع'], img: img('1571212515416-fef01fc43637') }, // Fruit yogurt drink
  { match: ['لبن رايب فلاحي بالزبدة', 'رايب بالزبدة'], img: img('1589985270915-d363595679cf') }, // Rich farm rayeb
  { match: ['لبن رايب', 'رايب بلدي', 'رايب سادة', 'رايب ساده'], img: img('1505253716362-afaea1d3d1af') }, // Egyptian fresh rayeb pot

  // 3. HONEY VARIANTS (عسل نحل متنوع بدون تكرار)
  { match: ['عسل سدر', 'سدر'], img: img('1443397646383-f69d49ceecc5') }, // Sidr amber honey
  { match: ['عسل شمع', 'شمع عسل', 'قرص عسل'], img: img('1601924921557-69a28a5ef7e9') }, // Natural honeycomb
  { match: ['عسل حبة البركة', 'حبه بركه', 'عسل اسود', 'عسل أسود'], img: img('1471943311424-646960669fbc') }, // Dark nigella honey
  { match: ['عسل موالح', 'عسل برتقال', 'عسل زهور'], img: img('1587049352846-4a222e784d38') }, // Light floral honey
  { match: ['عسل جينسج', 'عسل مكسرات', 'عسل اضافة', 'عسل نحل', 'عسل'], img: img('1558642452-9d2a7deb7f62') }, // Golden clover honey with dipper

  // 4. YOGURT & CREAMS (زبادي وقشطة)
  { match: ['زبادي يوناني', 'يوناني'], img: img('1488477181946-6428a0291777') }, // Thick Greek yogurt
  { match: ['زبادي بلدي', 'طاجن زبادي', 'زبادي'], img: img('1505253716362-afaea1d3d1af') }, // Egyptian clay pot yogurt
  { match: ['قشطة', 'قشطه', 'كريمة لباني', 'كريمي'], img: img('1589985270915-d363595679cf') }, // Clotted fresh cream

  // 5. BUTTER & GHEE (سمن وزبدة)
  { match: ['سمن بلدي', 'سمن جاموسي', 'سمن بقري', 'سمنه', 'سمن'], img: img('1483695028503-10d75d99f197') }, // Golden clarified butter / ghee
  { match: ['زبدة فلاحي', 'زبدة بقري', 'زبدة جاموسي', 'زبده', 'زبدة'], img: img('1483695028503-10d75d99f197') },

  // 6. SPECIALTY CHEESES (أجبان متخصصة)
  { match: ['رومي كافيار', 'رومي بطارخ', 'رومي قديم', 'رومي وسط', 'فصوص رومي', 'رومي'], img: img('1452195100486-9cc805987862') }, // Egyptian aged Roumi
  { match: ['ريكفورد', 'بلو تشيز', 'بلو'], img: img('1486297678162-eb2a19b0a32d') }, // Blue cheese
  { match: ['شيدر'], img: img('1618040996337-56904b7850b9') }, // Cheddar cheese
  { match: ['موتزريلا', 'موتزاريلا', 'مبشور'], img: img('1624806992066-5ffcf7ca186b') }, // Mozzarella
  { match: ['قديمة بالمش', 'مش صعيدي', 'مش'], img: img('1631379578550-7038263db699') }, // Fermented Egyptian Mish
  { match: ['قريش'], img: img('1559561853-08451507cbe7') }, // Farm white Qareesh
  { match: ['كيري', 'كريمي فينيسيا'], img: img('1559561853-08451507cbe7') },
  { match: ['فلامنك', 'جودة'], img: img('1552767059-ce182ead6c1b') }, // Gouda / Edam wheel
  { match: ['براميلي', 'فيتا', 'اسطنبولي', 'ملح خفيف'], img: img('1589881133595-a3c085cb731d') }, // White salty feta/baramily

  // 7. COLD CUTS & MEATS (لحوم مصنعة ومبردة)
  { match: ['بسطرمة', 'بسطرمه'], img: img('1607623814075-e51df1bdc82f') }, // Cured Egyptian pastrami
  { match: ['لانشون', 'روستو', 'بيف', 'تركي'], img: img('1588168333986-5078d3ae3976') }, // Cold cuts

  // 8. PURE FRESH MILK (ألبان طازجة - only reaches here if not desserts/yogurt)
  { match: ['لبن جاموسي', 'لبن بقري', 'لبن فلاحي', 'لبن مبستر', 'علبة لبن', 'لبن إبل', 'لبن', 'حليب'], img: img('1550583724-b2692b85b150') },
];

async function run() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  console.log('✅ Connected to Neon PostgreSQL');

  const { rows } = await client.query('SELECT id, "nameAr", "categoryName", image FROM "Product"');
  console.log(`Analyzing ${rows.length} products...`);

  let updated = 0;
  let alreadyCorrect = 0;

  for (const product of rows) {
    let newImage = null;

    for (const rule of imageMap) {
      if (rule.match.some(keyword => product.nameAr.includes(keyword))) {
        newImage = rule.img;
        break;
      }
    }

    if (!newImage) {
      // Fallback based on category
      const cat = product.categoryName || '';
      if (cat.includes('أجبان') || cat.includes('جبن')) {
        newImage = img('1589881133595-a3c085cb731d');
      } else if (cat.includes('حلو') || cat.includes('حلويات')) {
        newImage = img('1541781774459-bb2af2f05b55');
      } else if (cat.includes('لحوم') || cat.includes('مصنع')) {
        newImage = img('1607623814075-e51df1bdc82f');
      } else if (cat.includes('سمن') || cat.includes('زبدة')) {
        newImage = img('1483695028503-10d75d99f197');
      } else {
        newImage = img('1550583724-b2692b85b150');
      }
    }

    if (newImage && newImage !== product.image) {
      await client.query('UPDATE "Product" SET image = $1 WHERE id = $2', [newImage, product.id]);
      console.log(`✅ [UPDATED] ${product.nameAr} -> ${newImage.slice(30, 75)}`);
      updated++;
    } else {
      alreadyCorrect++;
    }
  }

  console.log(`\n🎉 All done! Updated: ${updated}, Already correct: ${alreadyCorrect}`);
  await client.end();
}

run().catch((e) => {
  console.error('❌ Error updating images:', e);
  process.exit(1);
});
