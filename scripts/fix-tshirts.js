const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const DIRECTUS_URL = 'https://zecode-directus.onrender.com';

// Fix products with subcategory 'T' - should be 'T-Shirt'
async function fixTShirts() {
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
  
  // Find products with subcategory 'T' and name ending in 'T'
  const toFix = products.filter(p => 
    p.subcategory === 'T' && p.name?.endsWith(' T')
  );
  
  console.log('Products to fix (subcategory T):', toFix.length);
  
  for (const p of toFix) {
    const newName = p.name.replace(/ T$/, ' T-Shirt');
    const newSlug = newName.toLowerCase()
      .replace(/['']/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    console.log('Fixing ID', p.id + ':', p.name, '->', newName);
    
    const updateRes = await fetch(DIRECTUS_URL + '/items/products/' + p.id, {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: newName,
        slug: newSlug,
        subcategory: 'T-Shirt'
      })
    });
    
    if (updateRes.ok) {
      console.log('  ✓ Updated');
    } else {
      console.error('  ✗ Failed');
    }
  }
  
  // Also fix 'Short' subcategory products that are actually shirts
  const shortProds = products.filter(p => 
    p.subcategory === 'Short' && p.name?.includes('Short')
  );
  
  console.log('\nProducts with Short subcategory:', shortProds.length);
  shortProds.forEach(p => console.log(' ', p.id, '|', p.name, '|', p.image_url?.split('/').pop()));
  
  console.log('\nDone!');
}

fixTShirts().catch(console.error);
