// Script to list all product images currently referenced in Directus

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const axios = require('axios');

const DIRECTUS = process.env.DIRECTUS_URL || 'https://zecode-directus.onrender.com';
const ADMIN_TOKEN = process.env.DIRECTUS_TOKEN || '';

async function main() {
  const url = `${DIRECTUS}/items/products?limit=-1`;
  const res = await axios.get(url, {
    headers: ADMIN_TOKEN ? { Authorization: `Bearer ${ADMIN_TOKEN}` } : {},
  });
  const products = res.data.data;
  const usedImages = new Set();
  for (const p of products) {
    if (p.image) usedImages.add(p.image);
    if (p.image_url) usedImages.add(p.image_url);
    if (Array.isArray(p.images)) for (const img of p.images) usedImages.add(img);
    if (p.model_image_1) usedImages.add(p.model_image_1);
    if (p.model_image_2) usedImages.add(p.model_image_2);
    if (p.model_image_3) usedImages.add(p.model_image_3);
  }
  // Print all unique used image paths
  for (const img of usedImages) {
    console.log(img);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
