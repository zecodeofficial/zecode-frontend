const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const DIRECTUS_URL = 'https://zecode-directus.onrender.com';

async function analyzeProduct() {
  const authRes = await fetch(DIRECTUS_URL + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'zecode@siyaram.com', password: env.DIRECTUS_ADMIN_PASSWORD })
  });
  const token = (await authRes.json()).data.access_token;
  
  // Find the product by slug
  const res = await fetch(DIRECTUS_URL + '/items/products?filter[slug][_eq]=mens-dark-casual-graphic-print-shirt&limit=1', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const result = await res.json();
  const p = result.data?.[0];
  
  if (!p) {
    console.log('Product not found with slug: mens-dark-casual-graphic-print-shirt');
    return;
  }
  
  console.log('=== PRODUCT DATA ===');
  console.log('ID:', p.id);
  console.log('Name:', p.name);
  console.log('Slug:', p.slug);
  console.log('Category:', p.category);
  console.log('Subcategory:', p.subcategory);
  console.log('Color:', p.color);
  console.log('Pattern:', p.pattern);
  console.log('Style:', p.style);
  console.log('');
  console.log('=== IMAGE DATA ===');
  console.log('image_url:', p.image_url);
  console.log('model_image_1:', p.model_image_1);
  console.log('');
  console.log('=== FILENAME ANALYSIS ===');
  const filename = p.image_url?.split('/').pop() || '';
  console.log('Filename:', filename);
  
  // Parse actual product info from filename
  const parts = filename.replace('.png', '').split('_');
  console.log('Parsed parts:', parts);
}

analyzeProduct().catch(console.error);
