process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const axios = require('axios');

const DIRECTUS = process.env.DIRECTUS_URL || 'https://zecode-directus.onrender.com';
const EMAIL = process.env.DIRECTUS_EMAIL || 'zecode@siyaram.com';
const PASSWORD = process.env.DIRECTUS_PASSWORD || "S!Y@rAM's";

function normalizeSlugCollision(slug, existingSlugs, id) {
  if (!existingSlugs.has(slug)) return slug;
  const candidate = `${slug}-${id}`;
  if (!existingSlugs.has(candidate)) return candidate;
  return `${slug}-${Date.now()}`;
}

async function login() {
  const url = `${DIRECTUS}/auth/login`;
  const res = await axios.post(url, { email: EMAIL, password: PASSWORD });
  return res.data?.data?.access_token;
}

function fixText(s) {
  if (!s) return s;
  return s.replace(/Slim\s+Slim/gi, 'Slim')
          .replace(/Casual\s+Casual/gi, 'Casual')
          .replace(/Classic\s+Classic/gi, 'Classic')
          .replace(/Midi\s+Midi/gi, 'Midi')
          .replace(/\s+/g, ' ').trim();
}

function fixSlug(slug) {
  if (!slug) return slug;
  return slug.replace(/-slim-slim-/g, '-slim-')
             .replace(/-casual-casual-/g, '-casual-')
             .replace(/-classic-classic-/g, '-classic-')
             .replace(/-midi-midi-/g, '-midi-')
             .replace(/-casual-casual-/g, '-casual-')
             .replace(/-\b(\w+)\b-\1-/g, '-$1-');
}

async function main(){
  try{
    console.log('Logging in to Directus...');
    const token = await login();
    console.log('Token obtained');

    // Fetch all products
    console.log('Fetching all products...');
    const res = await axios.get(`${DIRECTUS}/items/products`, { params: { limit: -1 } , headers: { Authorization: `Bearer ${token}` } });
    const products = res.data?.data || [];
    console.log(`Fetched ${products.length} products`);

    const existingSlugs = new Set(products.map(p => (p.slug||'').toLowerCase()));

    // Find affected products
    const affected = products.filter(p => {
      const slug = (p.slug||'').toLowerCase();
      const name = (p.name||'').toLowerCase();
      return slug.includes('-slim-slim-') || slug.includes('-casual-casual-') || name.includes('slim slim') || name.includes('casual casual');
    });

    console.log('Affected count:', affected.length);
    if(affected.length===0){
      console.log('No duplicate-descriptor products found.');
      return;
    }

    const failures = [];
    const updates = [];
    for(const p of affected){
      const origName = p.name || '';
      const origSlug = p.slug || '';
      const newName = fixText(origName);
      let newSlug = fixSlug(origSlug.toLowerCase());
      // Ensure slug uniqueness
      newSlug = normalizeSlugCollision(newSlug, existingSlugs, p.id);

      if(newName === origName && newSlug === origSlug) {
        console.log(`No change needed for ID ${p.id}`);
        continue;
      }

      // Attempt update
      try{
        const patchRes = await axios.patch(`${DIRECTUS}/items/products/${p.id}`, { name: newName, slug: newSlug }, { headers: { Authorization: `Bearer ${token}` } });
        existingSlugs.delete(origSlug.toLowerCase());
        existingSlugs.add(newSlug.toLowerCase());
        updates.push({ id: p.id, from: { name: origName, slug: origSlug }, to: { name: newName, slug: newSlug } });
        console.log(`Updated ID ${p.id}: '${origSlug}' -> '${newSlug}'`);
      }catch(e){
        console.error(`Failed to update ${p.id}:`, e.response?.data || e.message);
        failures.push({ id: p.id, error: e.response?.data || e.message });
      }
    }

    console.log('\nSummary:');
    console.log('Updated:', updates.length);
    updates.slice(0,20).forEach(u=>console.log(`  ${u.id}: ${u.from.slug} -> ${u.to.slug}`));
    if(failures.length>0){
      console.log('Failures:', failures.length);
      failures.slice(0,10).forEach(f=>console.log(`  ${f.id}: ${JSON.stringify(f.error)}`));
    }

  }catch(err){
    console.error('Error in main:', err.response?.data || err.message);
    process.exitCode = 1;
  }
}

main();
