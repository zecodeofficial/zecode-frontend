const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const DIRECTUS_URL = 'https://zecode-directus.onrender.com';

// Fix 'Short' products - they are short sleeve shirts, not shorts
async function fixShortSleeve() {
  const authRes = await fetch(DIRECTUS_URL + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'zecode@siyaram.com', password: env.DIRECTUS_ADMIN_PASSWORD })
  });
  const token = (await authRes.json()).data.access_token;
  
  // These are short sleeve shirts based on image filenames
  const shortSleeveIds = [85, 109, 132, 133, 210, 239, 252];
  
  for (const id of shortSleeveIds) {
    const res = await fetch(DIRECTUS_URL + '/items/products/' + id, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const p = (await res.json()).data;
    
    // Change "Short" to "Short Sleeve Shirt"
    const newName = p.name.replace(/ Short$/, ' Short Sleeve Shirt');
    const newSlug = newName.toLowerCase()
      .replace(/['']/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    console.log('Fixing ID', id + ':', p.name, '->', newName);
    
    const updateRes = await fetch(DIRECTUS_URL + '/items/products/' + id, {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: newName,
        slug: newSlug,
        subcategory: 'Shirt',
        category: 'Tops'
      })
    });
    
    if (updateRes.ok) {
      console.log('  ✓ Updated');
    } else {
      console.error('  ✗ Failed');
    }
  }
  
  console.log('\nDone!');
}

fixShortSleeve().catch(console.error);
