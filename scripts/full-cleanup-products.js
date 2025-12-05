process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const axios = require('axios');
const fs = require('fs');

const DIRECTUS = process.env.DIRECTUS_URL || 'https://zecode-directus.onrender.com';
const EMAIL = process.env.DIRECTUS_EMAIL || 'zecode@siyaram.com';
const PASSWORD = process.env.DIRECTUS_PASSWORD || "S!Y@rAM's";

function collapseRepeatedWords(s) {
  if (!s) return s;
  // Collapse repeated words: "Slim Slim" -> "Slim"
  let out = s.replace(/\b(\w+)(\s+\1\b)+/gi, '$1');
  // Collapse repeated phrases separated by spaces, e.g., "Casual Casual Casual"
  out = out.replace(/(\b\w+\b)(?:\s+\1)+/gi, '$1');
  // Remove duplicate spaces
  out = out.replace(/\s{2,}/g, ' ');
  return out.trim();
}

function cleanName(name) {
  if (!name) return name;
  let out = name;
  out = collapseRepeatedWords(out);
  // Fix extraneous commas or repeated punctuation
  out = out.replace(/\s*,\s*/g, ', ');
  out = out.replace(/\.{2,}/g, '.');
  out = out.replace(/\s{2,}/g, ' ');
  out = out.trim();
  return out;
}

function slugifyFromString(s) {
  if (!s) return '';
  return s.toLowerCase()
    .replace(/[^a-z0-9-\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function cleanSlug(slug) {
  if (!slug) return slug;
  let out = slug.toLowerCase();
  // Replace repeated segment patterns like '-slim-slim-' -> '-slim-'
  out = out.replace(/-(\w+)(-\1)+/g, '-$1');
  // Also replace occurrences at end: 'x-x' patterns
  out = out.replace(/-+(\w+)-+\1-*/g, '-$1');
  out = out.replace(/-+/g, '-');
  out = out.replace(/^-|-$/g, '');
  return out;
}

async function login() {
  const url = `${DIRECTUS}/auth/login`;
  const resp = await axios.post(url, { email: EMAIL, password: PASSWORD });
  return resp.data?.data?.access_token;
}

async function main() {
  try {
    console.log('Logging in to Directus...');
    const token = await login();
    console.log('Token obtained');

    console.log('Fetching all products...');
    const res = await axios.get(`${DIRECTUS}/items/products`, {
      params: { limit: -1 },
      headers: { Authorization: `Bearer ${token}` }
    });
    const products = res.data?.data || [];
    console.log(`Fetched ${products.length} products`);

    const existingSlugs = new Map(); // slug -> id
    for (const p of products) {
      if (p.slug) existingSlugs.set((p.slug||'').toLowerCase(), p.id);
    }

    const redirects = [];
    const updates = [];
    const failures = [];

    for (const p of products) {
      const origName = p.name || '';
      const origSlug = p.slug || '';

      // Clean name
      const cleanedName = cleanName(origName);

      // Clean slug: try to clean existing slug first, otherwise derive from name
      let candidateSlug = cleanSlug(origSlug);
      if (!candidateSlug || candidateSlug.length === 0) {
        candidateSlug = slugifyFromString(cleanedName || origName || `product-${p.id}`);
      }

      // If slug collides with another product's slug, append the product id
      const existingOwner = existingSlugs.get(candidateSlug.toLowerCase());
      if (existingOwner && existingOwner !== p.id) {
        candidateSlug = `${candidateSlug}-${p.id}`;
      }

      // Final normalize
      candidateSlug = candidateSlug.replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();

      // If nothing changed, skip
      const nameChanged = cleanedName !== origName;
      const slugChanged = candidateSlug !== origSlug;

      if (!nameChanged && !slugChanged) continue;

      // Attempt patch
      try {
        await axios.patch(`${DIRECTUS}/items/products/${p.id}`, {
          name: cleanedName,
          slug: candidateSlug
        }, { headers: { Authorization: `Bearer ${token}` } });

        updates.push({ id: p.id, from: { name: origName, slug: origSlug }, to: { name: cleanedName, slug: candidateSlug } });
        if (slugChanged) {
          redirects.push({ from: `/${origSlug}`, to: `/${candidateSlug}` });
          // Update existingSlugs map
          existingSlugs.delete((origSlug||'').toLowerCase());
          existingSlugs.set(candidateSlug.toLowerCase(), p.id);
        }

        if (updates.length % 50 === 0) console.log(`Updated ${updates.length} products so far...`);

      } catch (err) {
        failures.push({ id: p.id, error: err.response?.data || err.message });
        console.error(`Failed updating ${p.id}:`, err.response?.data || err.message);
      }
    }

    console.log('\nDone.');
    console.log(`Updated ${updates.length} products, failures: ${failures.length}`);

    // Write mapping file for redirects (vercel format suggestion)
    const vercelRedirects = redirects.map(r => ({ source: r.from, destination: r.to, permanent: true }));
    // Write to the scripts folder (running from repo root or scripts folder)
    const outPath = process.cwd().endsWith('scripts') ? './slug-redirects.json' : './scripts/slug-redirects.json';
    fs.writeFileSync(outPath, JSON.stringify({ redirects: vercelRedirects, updated: updates }, null, 2));
    console.log(`Wrote redirect mapping and update log to ${outPath}`);

  } catch (err) {
    console.error('Fatal error:', err.response?.data || err.message);
    process.exitCode = 1;
  }
}

main();
