const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const DIRECTUS_URL = 'https://zecode-directus.onrender.com';

async function fullAudit() {
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
  
  let cloudinaryUrls = 0;
  let localPaths = 0;
  let noModelImage = 0;
  const broken = [];
  const noModel = [];
  
  products.forEach(p => {
    const img = p.model_image_1 || '';
    if (!img) {
      noModelImage++;
      noModel.push(p);
    } else if (img.includes('cloudinary.com')) {
      cloudinaryUrls++;
    } else {
      localPaths++;
      broken.push(p);
    }
  });
  
  console.log('=== FULL WEBSITE AUDIT ===');
  console.log('');
  console.log('Total Products: ' + products.length);
  console.log('Cloudinary URLs (working): ' + cloudinaryUrls);
  console.log('Local Paths (BROKEN): ' + localPaths);
  console.log('No Model Image: ' + noModelImage);
  console.log('');
  
  if (broken.length > 0) {
    console.log('BROKEN (local paths):');
    broken.forEach(p => console.log('  ID ' + p.id + ': ' + p.name));
    console.log('');
  }
  
  if (noModel.length > 0) {
    console.log('No Model Image (accessories ok):');
    noModel.forEach(p => console.log('  ID ' + p.id + ': ' + p.name));
  }
}

fullAudit();
