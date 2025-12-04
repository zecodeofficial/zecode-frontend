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
  
  const res = await fetch(DIRECTUS_URL + '/items/products?limit=-1', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const products = (await res.json()).data;
  
  // Find the product with slug men-s-dark-casual-graphic-print-t-shirt
  const match = products.find(p => p.slug === 'men-s-dark-casual-graphic-print-t-shirt');
  
  if (match) {
    console.log('=== Product Details ===');
    console.log('ID:', match.id);
    console.log('Name:', match.name);
    console.log('Slug:', match.slug);
    console.log('Description:', match.description ? match.description.substring(0, 200) + '...' : 'NULL');
    console.log('');
    console.log('Product Images:');
    console.log('  image_1:', match.image_1 || 'NULL');
    console.log('  image_2:', match.image_2 || 'NULL');
    console.log('  image_3:', match.image_3 || 'NULL');
    console.log('');
    console.log('Model Images:');
    console.log('  model_image_1:', match.model_image_1 || 'NULL');
    console.log('  model_image_2:', match.model_image_2 || 'NULL');
    console.log('  model_image_3:', match.model_image_3 || 'NULL');
  } else {
    console.log('Product not found with slug: men-s-dark-casual-graphic-print-t-shirt');
    
    // Find similar
    const similar = products.filter(p => p.slug && p.slug.includes('dark-casual-graphic-print-t-shirt'));
    console.log('Similar slugs:');
    similar.forEach(p => console.log('  ' + p.slug + ' (ID: ' + p.id + ')'));
  }
}

check();
