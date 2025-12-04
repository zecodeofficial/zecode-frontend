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
  
  const res = await fetch(DIRECTUS_URL + '/items/products/202', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const p = (await res.json()).data;
  
  console.log('=== PRODUCT 202 (after fix) ===');
  console.log('Name:', p.name);
  console.log('Slug:', p.slug);
  console.log('Color:', p.color);
  console.log('Subcategory:', p.subcategory);
  console.log('Category:', p.category);
  console.log('');
  console.log('Image URL:', p.image_url);
  console.log('');
  console.log('Description:', p.description?.substring(0, 150) + '...');
  console.log('');
  console.log('New URL: /men/' + p.slug);
  
  // Also check a few other products
  console.log('\n=== SAMPLE PRODUCTS ===');
  const samples = await fetch(DIRECTUS_URL + '/items/products?limit=10', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const prods = (await samples.json()).data;
  prods.forEach(p => {
    console.log('ID', p.id, ':', p.name);
    console.log('  Slug:', p.slug);
    console.log('  Color:', p.color, '| Category:', p.category);
  });
}

verify().catch(console.error);
