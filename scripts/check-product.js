const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const DIRECTUS_URL = 'https://zecode-directus.onrender.com';

async function check() {
  const authRes = await fetch(DIRECTUS_URL + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'zecode@siyaram.com', password: env.DIRECTUS_ADMIN_PASSWORD })
  });
  const token = (await authRes.json()).data.access_token;
  
  // Search for the product by slug pattern
  const res = await fetch(DIRECTUS_URL + '/items/products?limit=-1', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const products = (await res.json()).data;
  
  // Find products matching "dark casual graphic print t-shirt"
  const matches = products.filter(p => {
    const name = (p.name || '').toLowerCase();
    return name.includes('dark') && name.includes('casual') && name.includes('graphic') && name.includes('t-shirt');
  });
  
  console.log('Products matching "dark casual graphic print t-shirt":');
  matches.forEach(p => {
    console.log('');
    console.log('ID:', p.id);
    console.log('Name:', p.name);
    console.log('Slug:', p.slug);
    console.log('model_image_1:', p.model_image_1 ? p.model_image_1.substring(0, 60) + '...' : 'NULL');
    console.log('model_image_2:', p.model_image_2 ? 'SET' : 'NULL');
    console.log('model_image_3:', p.model_image_3 ? 'SET' : 'NULL');
  });
}

check();
