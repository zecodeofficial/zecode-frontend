const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const DIRECTUS_URL = 'https://zecode-directus.onrender.com';

async function findBroken() {
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
  
  // Find products with local paths instead of Cloudinary URLs
  const brokenProducts = products.filter(p => {
    const img = p.model_image_1 || '';
    return img && !img.includes('cloudinary.com') && !img.startsWith('http');
  });
  
  console.log('Products with BROKEN model image paths (local paths):');
  console.log('Total:', brokenProducts.length);
  console.log('');
  
  brokenProducts.forEach(p => {
    console.log('ID ' + p.id + ': ' + p.name);
    console.log('  model_image_1: ' + p.model_image_1);
  });
  
  // Save for fixing
  fs.writeFileSync('broken-products.json', JSON.stringify(brokenProducts.map(p => ({
    id: p.id,
    name: p.name,
    model_image_1: p.model_image_1,
    model_image_2: p.model_image_2,
    model_image_3: p.model_image_3
  })), null, 2));
}

findBroken();
