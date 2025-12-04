const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const DIRECTUS_URL = 'https://zecode-directus.onrender.com';

async function findIncomplete() {
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
  
  // Products with NO product images
  const noProductImages = products.filter(p => !p.image_1 && !p.image_2 && !p.image_3);
  
  // Products with model images but no product images
  const modelButNoProduct = noProductImages.filter(p => p.model_image_1);
  
  // Products completely empty
  const completelyEmpty = noProductImages.filter(p => !p.model_image_1);
  
  console.log('=== INCOMPLETE PRODUCTS ANALYSIS ===');
  console.log('');
  console.log('Total products: ' + products.length);
  console.log('Products with NO product images: ' + noProductImages.length);
  console.log('  - Have model images (questionable): ' + modelButNoProduct.length);
  console.log('  - Completely empty: ' + completelyEmpty.length);
  console.log('');
  
  console.log('Products with model images but NO product images:');
  modelButNoProduct.forEach(p => {
    console.log('  ID ' + p.id + ': ' + p.name);
    console.log('    Slug: ' + p.slug);
    console.log('    Model: ' + p.model_image_1.split('/').pop());
  });
}

findIncomplete();
