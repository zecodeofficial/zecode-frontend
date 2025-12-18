
import axios from 'axios';
import https from 'https';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import { fileURLToPath } from 'url';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, '../public');

// Setup Directus
const agent = new https.Agent({ rejectUnauthorized: false });
const DIRECTUS_URL = "https://zecode-directus.onrender.com";
// We need an admin token or email/pass. 
// Using email/pass from known env or hardcoded for this script (assuming we have access).
// Creating a login helper.
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || "password";

// Using the same credentials as verified in previous steps or asking user if needed.
// Actually, previous scripts failed AUTH strings. Check .env.local availability?
// I'll try to use the token if I can get it, or just prompt/fail if no auth.
// Wait, I don't have the password. 
// I will try to read .env.local to get them if possible, or use a known one if I saw it.
// I saw .env.local in "view_file" history earlier (Step 1).
// Snippet showed: DIRECTUS_ADMIN_EMAIL, DIRECTUS_ADMIN_PASSWORD.
// I will read .env.local to load these.
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function getToken() {
    try {
        const res = await axios.post(`${DIRECTUS_URL}/auth/login`, {
            email: process.env.DIRECTUS_ADMIN_EMAIL,
            password: process.env.DIRECTUS_ADMIN_PASSWORD
        }, { httpsAgent: agent });
        return res.data.data.access_token;
    } catch (e) {
        console.error("Login failed:", e.message);
        throw e;
    }
}

function log(msg) {
    console.log(msg);
    fs.appendFileSync('restore_log.txt', msg + '\n');
}

async function restore() {
    fs.writeFileSync('restore_log.txt', '');
    log("Starting Image Restoration...");

    let token;
    try {
        token = await getToken();
        log("Authenticated successfully.");
    } catch (e) {
        log("Could not authenticate. Check .env.local variables.");
        return;
    }

    try {
        // 1. Fetch broken products
        const res = await axios.get(`${DIRECTUS_URL}/items/products`, {
            params: {
                filter: JSON.stringify({
                    _and: [
                        { status: { _eq: "published" } },
                        { image: { _null: true } },
                        // { image_url: { _starts_with: "/" } } // Filter locally or via API
                    ]
                }),
                fields: "id,name,slug,image,image_url",
                limit: -1
            },
            httpsAgent: agent
        });

        const allProducts = res.data.data;
        const productsToFix = allProducts.filter(p => p.image_url && p.image_url.startsWith('/'));

        log(`Found ${productsToFix.length} products to fix.`);

        for (const product of productsToFix) {
            const relativePath = product.image_url; // e.g. /products/extracted/foo.png
            const localPath = path.join(PUBLIC_DIR, relativePath);

            log(`[${product.name}] Processing...`);

            if (!fs.existsSync(localPath)) {
                log(`  -> FAILED: Local file not found at ${localPath}`);
                continue;
            }

            // 2. Upload File
            try {
                const form = new FormData();
                form.append('file', fs.createReadStream(localPath));
                form.append('title', product.name);
                // form.append('folder', '...'); // Optional: Put in a specific folder if known UUID

                const uploadRes = await axios.post(`${DIRECTUS_URL}/files`, form, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        ...form.getHeaders()
                    },
                    httpsAgent: agent
                });

                const fileId = uploadRes.data.data.id;
                log(`  -> Uploaded file: ${fileId}`);

                // 3. Update Product
                await axios.patch(`${DIRECTUS_URL}/items/products/${product.id}`, {
                    image: fileId,
                    image_url: null // Clear the legacy field
                }, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    httpsAgent: agent
                });

                log(`  -> Updated product record.`);

            } catch (err) {
                const errMsg = err.response ? JSON.stringify(err.response.data) : err.message;
                log(`  -> ERROR: ${errMsg}`);
            }
        }

    } catch (e) {
        log("Restoration process failed: " + e.message);
    }
}

restore();
