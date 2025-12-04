const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const DIRECTUS_URL = 'https://zecode-directus.onrender.com';

async function verify() {
  const authRes = await fetch(DIRECTUS_URL + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'zecode@siyaram.com', password: env.DIRECTUS_ADMIN_PASSWORD })
  });
  const token = (await authRes.json()).data.access_token;
  
  const res = await fetch(DIRECTUS_URL + '/items/products?limit=-1', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const products = (await res.json()).data;
  
  console.log('=== SUMMARY ===');
  console.log('Total products:', products.length);
  
  // Category breakdown
  const byCat = {};
  products.forEach(p => {
    byCat[p.category] = (byCat[p.category] || 0) + 1;
  });
  console.log('\nBy Category:');
  Object.entries(byCat).sort((a,b) => b[1]-a[1]).forEach(([cat, count]) => {
    console.log(' ', cat + ':', count);
  });
  
  // Check ethnic fusion
  console.log('\n=== ETHNIC FUSION PRODUCTS ===');
  const ethnic = products.filter(p => p.category === 'Ethnic Fusion');
  ethnic.forEach(p => {
    console.log('ID:', p.id);
    console.log('  Name:', p.name);
    console.log('  Slug:', p.slug);
    console.log('  Subcat:', p.subcategory);
    console.log('  Desc length:', p.description?.length || 0);
  });
  
  // Sample other products
  console.log('\n=== SAMPLE UPDATED PRODUCTS ===');
  [3, 10, 50, 100, 200].forEach(id => {
    const p = products.find(x => x.id === id);
    if (p) {
      console.log('ID', id + ':', p.name);
      console.log('  Slug:', p.slug);
      console.log('  Desc:', p.description?.substring(0, 80) + '...');
      console.log('  Desc length:', p.description?.length || 0);
    }
  });
}

verify().catch(console.error);
