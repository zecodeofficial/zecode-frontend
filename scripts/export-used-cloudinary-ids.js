#!/usr/bin/env node
/*
 * scripts/export-used-cloudinary-ids.js
 *
 * Fetch all products from Directus and extract all Cloudinary public_ids used by
 * product image fields. Writes a JSON array to scripts/used-ids.json.
 *
 * Usage (PowerShell):
 *  $env:DIRECTUS_URL='https://zecode-directus.onrender.com'; $env:DIRECTUS_TOKEN='token' ; node .\scripts\export-used-cloudinary-ids.js
 *  OR provide admin credentials in env: DIRECTUS_ADMIN_EMAIL + DIRECTUS_ADMIN_PASSWORD
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://zecode-directus.onrender.com';
const TOKEN = process.env.DIRECTUS_TOKEN || '';
const EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
const PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD;

async function getTokenIfNeeded() {
  if (TOKEN) return TOKEN;
  if (!EMAIL || !PASSWORD) {
    console.error('Provide either DIRECTUS_TOKEN or DIRECTUS_ADMIN_EMAIL + DIRECTUS_ADMIN_PASSWORD');
    process.exit(1);
  }
  const res = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Directus login failed: ${res.status} ${txt}`);
  }
  const body = await res.json();
  return body.data && body.data.access_token ? body.data.access_token : body.access_token;
}

function extractCloudinaryPublicId(urlOrPath) {
  if (!urlOrPath) return null;
  // If it's already a Cloudinary URL
  try {
    const u = String(urlOrPath).trim();
    // Handle Cloudinary full URLs
    const cloudRegex = /res\.cloudinary\.com\/(?:[^\/]+)\/image\/upload\/(.*)$/i;
    const m = u.match(cloudRegex);
    if (m && m[1]) {
      // remove any transformations (f_auto,q_auto etc) and optional version numbers
      let remainder = m[1];
      // strip query params
      remainder = remainder.split('?')[0];
      // remove leading transformations like f_auto,q_auto/
      remainder = remainder.replace(/^(?:[a-z0-9_,=]+\/[a-z0-9_,=]+\/)+/i, '');
      // remove leading v123456/ versions
      remainder = remainder.replace(/^v\d+\//, '');
      // remove file extension
      remainder = remainder.replace(/\.[a-z0-9]{2,5}$/i, '');
      return remainder;
    }

    // If it's a next/image path containing cloudinary URL encoded
    const nextImgRegex = /url=([^&]+)/i;
    const ni = u.match(nextImgRegex);
    if (ni && ni[1]) {
      const dec = decodeURIComponent(ni[1]);
      return extractCloudinaryPublicId(dec);
    }

    // If it looks like a local path (e.g. /products/extracted-products/foo.png)
    if (u.startsWith('/')) {
      const cleaned = u.replace(/^\//, '');
      // follow app convention: public_id is `zecode/<cleaned_without_ext>`
      const noExt = cleaned.replace(/\.[a-z0-9]{2,5}$/i, '');
      return `zecode/${noExt}`;
    }

    // Already looks like a Cloudinary public id
    if (u.startsWith('zecode/') || u.includes('/zecode/')) {
      // strip v123 etc and extensions
      let s = u;
      s = s.replace(/^v\d+\//, '');
      s = s.replace(/\.[a-z0-9]{2,5}$/, '');
      return s;
    }

    return null;
  } catch (e) {
    return null;
  }
}

async function fetchProducts(token) {
  const all = [];
  let limit = 500;
  let offset = 0;
  while (true) {
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    // ask for fields we care about
    params.set('fields', 'id,name,slug,image,image_url,images,model_image_1,model_image_2,model_image_3');
    const res = await fetch(`${DIRECTUS_URL}/items/products?${params.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);
    const body = await res.json();
    const data = body.data || body;
    if (!Array.isArray(data) || data.length === 0) break;
    all.push(...data);
    if (data.length < limit) break;
    offset += limit;
  }
  return all;
}

(async function main() {
  try {
    console.log('\n🔎 Fetching products from Directus...');
    const token = await getTokenIfNeeded();
    const products = await fetchProducts(token);
    console.log(`Fetched ${products.length} products`);

    const ids = new Set();
    for (const p of products) {
      const fields = ['image', 'image_url', 'model_image_1', 'model_image_2', 'model_image_3'];
      for (const f of fields) {
        if (p[f]) {
          const parts = Array.isArray(p[f]) ? p[f] : [p[f]];
          for (const v of parts) {
            const candidate = extractCloudinaryPublicId(v);
            if (candidate) ids.add(candidate);
          }
        }
      }
      // images array field (if any)
      if (Array.isArray(p.images)) {
        for (const img of p.images) {
          const candidate = extractCloudinaryPublicId(img);
          if (candidate) ids.add(candidate);
        }
      }
    }

    const out = Array.from(ids).sort();
    const outPath = path.join(__dirname, 'used-ids.json');
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
    console.log(`\n✅ Wrote ${out.length} Cloudinary public_ids to ${outPath}`);
  } catch (err) {
    console.error('Fatal:', err.message || err);
    process.exit(1);
  }
})();
