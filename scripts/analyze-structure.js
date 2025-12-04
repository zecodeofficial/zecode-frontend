const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const DIRECTUS_URL = 'https://zecode-directus.onrender.com';

async function analyze() {
  const authRes = await fetch(DIRECTUS_URL + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'zecode@siyaram.com', password: env.DIRECTUS_ADMIN_PASSWORD })
  });
  const token = (await authRes.json()).data.access_token;
  
  // Get all products
  const productsRes = await fetch(DIRECTUS_URL + '/items/products?limit=-1', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const products = (await productsRes.json()).data;
  
  console.log('=== UNIQUE VALUES IN KEY FIELDS ===');
  console.log('category:', [...new Set(products.map(p => p.category))]);
  console.log('subcategory:', [...new Set(products.map(p => p.subcategory))]);
  console.log('gender_category:', [...new Set(products.map(p => p.gender_category))]);
  console.log('gender:', [...new Set(products.map(p => p.gender))]);
  console.log('style:', [...new Set(products.map(p => p.style))]);
  
  console.log('\n=== BY SUBCATEGORY ===');
  const bySubcat = {};
  products.forEach(p => {
    const key = p.subcategory || 'none';
    if (!bySubcat[key]) bySubcat[key] = [];
    bySubcat[key].push({ id: p.id, name: p.name, image_url: p.image_url });
  });
  Object.keys(bySubcat).forEach(k => {
    console.log('\n' + k + ' (' + bySubcat[k].length + ' products):');
    bySubcat[k].slice(0, 5).forEach(p => console.log('  ID', p.id, ':', p.name));
  });
  
  // Look for ethnic wear patterns
  console.log('\n=== POTENTIAL ETHNIC WEAR (by name) ===');
  const ethnicKeywords = ['kurta', 'kurti', 'ethnic', 'traditional', 'saree', 'lehenga', 'anarkali', 'salwar', 'palazzo'];
  products.forEach(p => {
    const name = (p.name || '').toLowerCase();
    if (ethnicKeywords.some(k => name.includes(k))) {
      console.log('ID', p.id, ':', p.name, '| subcat:', p.subcategory);
    }
  });
  
  // Check products under 'dresses'
  console.log('\n=== ALL DRESS PRODUCTS ===');
  const dresses = products.filter(p => p.subcategory === 'dresses' || (p.name || '').toLowerCase().includes('dress'));
  dresses.forEach(p => {
    console.log('ID', p.id, ':', p.name);
    console.log('  image_url:', p.image_url);
  });
}

analyze().catch(console.error);
