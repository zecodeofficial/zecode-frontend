const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const DIRECTUS_URL = 'https://zecode-directus.onrender.com';

async function exportProducts() {
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
  
  // Export to JSON for analysis
  fs.writeFileSync('all-products.json', JSON.stringify(products, null, 2));
  console.log('Exported', products.length, 'products to all-products.json');
  
  // Create CSV for easier review
  const csv = ['id,name,slug,category,subcategory,gender_category,style,description,image_url'];
  products.forEach(p => {
    csv.push([
      p.id,
      '"' + (p.name || '').replace(/"/g, '""') + '"',
      p.slug,
      p.category,
      p.subcategory,
      p.gender_category,
      p.style,
      '"' + (p.description || '').replace(/"/g, '""') + '"',
      p.image_url
    ].join(','));
  });
  fs.writeFileSync('all-products.csv', csv.join('\n'));
  console.log('Exported to all-products.csv');
}

exportProducts().catch(console.error);
