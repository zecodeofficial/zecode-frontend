
import axios from 'axios';
import https from 'https';
import fs from 'fs';

const agent = new https.Agent({ rejectUnauthorized: false });
const DIRECTUS_URL = "https://zecode-directus.onrender.com";

function log(msg) {
    console.log(msg);
    fs.appendFileSync('scan_log.txt', msg + '\n');
}

async function scan() {
    fs.writeFileSync('scan_log.txt', '');
    log("Scanning for products with specific image issues...");

    try {
        // Fetch minimum fields to identify issues
        // Avoid fetching 'gallery' as it caused Service Unavailable previously
        const fields = "id,name,slug,image,image_url";

        const res = await axios.get(`${DIRECTUS_URL}/items/products`, {
            params: {
                filter: JSON.stringify({ status: { _eq: "published" } }),
                fields: fields,
                limit: -1
            },
            httpsAgent: agent
        });

        const products = res.data.data;
        log(`Total Products Scanned: ${products.length}`);

        // Filter for:
        // 1. image is NULL
        // 2. AND (image_url is NULL OR image_url starts with '/')
        // If image_url starts with http, it's likely fine (Cloudinary/External).
        // If it starts with '/', it might be the issue depending on handling.

        const missingMain = products.filter(p => !p.image && !p.image_url);
        const localPathOnly = products.filter(p => !p.image && p.image_url && p.image_url.startsWith('/'));

        log(`\nProducts with NO image at all: ${missingMain.length}`);
        if (missingMain.length > 0) {
            missingMain.forEach(p => log(`- [MISSING] ${p.name} (${p.slug})`));
        }

        log(`\nProducts with ONLY local path image_url: ${localPathOnly.length}`);
        if (localPathOnly.length > 0) {
            localPathOnly.forEach(p => log(`- [LOCAL_PATH] ${p.name} (${p.slug}) | Path: ${p.image_url}`));
        }

    } catch (e) {
        log("Scan failed: " + e.message);
    }
}

scan();
