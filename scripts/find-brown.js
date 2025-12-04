const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const DIRECTUS_URL = 'https://zecode-directus.onrender.com';

async function findProduct() {
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
  
  // Find brown products
  const brown = products.filter(p => p.name?.toLowerCase().includes('brown'));
  console.log('Products with "Brown" in name:');
  brown.forEach(p => {
    console.log('ID:', p.id, '|', p.name);
    console.log('  Slug:', p.slug);
  });
  
  // Find product 124 (from earlier we saw a brown t-shirt)
  console.log('\n--- Product ID 124 ---');
  const p124 = products.find(p => p.id === 124);
  if (p124) {
    console.log('Name:', p124.name);
    console.log('Slug:', p124.slug);
    console.log('Gender:', p124.gender_category);
  }
  
  // Show all men's t-shirts
  console.log('\n--- Men T-Shirts ---');
  const menTs = products.filter(p => 
    p.gender_category === 'Men' && 
    (p.subcategory === 'T' || p.subcategory === 'T-Shirt')
  );
  menTs.forEach(p => {
    console.log(p.id, '|', p.name, '|', p.slug);
  });
}

findProduct().catch(console.error);
