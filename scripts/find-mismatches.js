const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const DIRECTUS_URL = 'https://zecode-directus.onrender.com';

async function findMismatches() {
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
  
  console.log('Products with potential T-Shirt/Shirt mismatch:');
  console.log('');
  
  const mismatches = [];
  
  products.forEach(p => {
    if (!p.model_image_1 || !p.name) return;
    
    const productName = p.name.toLowerCase();
    const modelPath = p.model_image_1.toLowerCase();
    
    // Check for T-Shirt product with Shirt model (not T-Shirt)
    if (productName.includes('t-shirt') && modelPath.includes('_shirt') && !modelPath.includes('t-shirt')) {
      mismatches.push({
        id: p.id,
        name: p.name,
        issue: 'T-Shirt product has Shirt model images',
        model: p.model_image_1.split('/').pop()
      });
    }
    
    // Check for Shirt product with T-Shirt model
    if (productName.includes('shirt') && !productName.includes('t-shirt') && modelPath.includes('t-shirt')) {
      mismatches.push({
        id: p.id,
        name: p.name,
        issue: 'Shirt product has T-Shirt model images',
        model: p.model_image_1.split('/').pop()
      });
    }
    
    // Check for Off white vs White mismatch
    if (productName.includes('white') && !productName.includes('off white') && modelPath.includes('off_white')) {
      mismatches.push({
        id: p.id,
        name: p.name,
        issue: 'White product has Off-white model images',
        model: p.model_image_1.split('/').pop()
      });
    }
    
    // Check for Sweatshirt vs T-Shirt mismatch
    if (productName.includes('t-shirt') && modelPath.includes('sweatshirt')) {
      mismatches.push({
        id: p.id,
        name: p.name,
        issue: 'T-Shirt product has Sweatshirt model images',
        model: p.model_image_1.split('/').pop()
      });
    }
  });
  
  mismatches.forEach(m => {
    console.log('ID ' + m.id + ': ' + m.name);
    console.log('  Issue: ' + m.issue);
    console.log('  Model: ' + m.model);
    console.log('');
  });
  
  console.log('Total mismatches found: ' + mismatches.length);
  
  // Save for fixing
  fs.writeFileSync('mismatches.json', JSON.stringify(mismatches, null, 2));
}

findMismatches();
