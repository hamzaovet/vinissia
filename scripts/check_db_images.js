const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_i7Eou0AUebmj@ep-flat-dawn-b9bio6n2-pooler.c-7.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

client.connect().then(async () => {
  const res = await client.query('SELECT "nameAr", "categoryName", image FROM "Product" ORDER BY "categoryName", "nameAr" LIMIT 80');
  console.log('Total returned:', res.rows.length);
  res.rows.forEach(r => {
    const img = (r.image || 'NULL').substring(0, 90);
    console.log(`${r.categoryName} | ${r.nameAr} => ${img}`);
  });
  await client.end();
}).catch(e => { console.error('DB Error:', e.message); client.end(); });
