
import axios from 'axios';
import https from 'https';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const agent = new https.Agent({ rejectUnauthorized: false });
const DIRECTUS_URL = "https://zecode-directus.onrender.com";
const EMAIL = "zecode@siyaram.com";
const PASSWORD = "S!Y@rAM's";

async function checkAdminAsset() {
    try {
        console.log("Logging in as Admin...");
        const loginRes = await axios.post(`${DIRECTUS_URL}/auth/login`, {
            email: EMAIL, password: PASSWORD
        }, { httpsAgent: agent });

        const token = loginRes.data.data.access_token;
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Get Product 25 to find its image ID
        console.log("Fetching Product 25...");
        const productRes = await axios.get(`${DIRECTUS_URL}/items/products/25`, { headers, httpsAgent: agent });
        const product = productRes.data.data;

        if (!product) {
            console.error("Product 25 not found!");
            return;
        }

        const imageId = product.image; // Assuming 'image' field holds the ID
        console.log(`Product 25 Image ID: ${imageId}`);

        if (!imageId) {
            console.error("Product 25 has no image ID!");
            return;
        }

        // 2. Try to fetch the Asset as Admin
        console.log(`Fetching Asset ${imageId} as Admin...`);
        const assetUrl = `${DIRECTUS_URL}/assets/${imageId}`;

        try {
            const assetRes = await axios.get(assetUrl, {
                headers,
                httpsAgent: agent,
                responseType: 'arraybuffer' // Just getting content
            });
            console.log(`✅ Admin Access SUCCESS. Status: ${assetRes.status}`);
            console.log(`   Content-Type: ${assetRes.headers['content-type']}`);
            console.log(`   Size: ${assetRes.data.length} bytes`);
        } catch (e) {
            console.error(`❌ Admin Access FAILED. Status: ${e.response?.status}`);
            if (e.response?.status === 403) {
                console.log("   Reason: Forbidden");
            }
        }

        // 3. Try to fetch as Public (No Auth)
        console.log(`\nFetching Asset ${imageId} as Public (No Auth)...`);
        try {
            const pubAssetRes = await axios.get(assetUrl, { httpsAgent: agent });
            console.log(`✅ Public Access SUCCESS. Status: ${pubAssetRes.status}`);
        } catch (e) {
            console.error(`❌ Public Access FAILED. Status: ${e.response?.status}`);
        }

        // 4. Try /files/ endpoint as Public
        console.log(`\nFetching File ${imageId} as Public (/files/ endpoint)...`);
        try {
            const pubFileRes = await axios.get(`${DIRECTUS_URL}/files/${imageId}`, { httpsAgent: agent });
            console.log(`✅ Public File Access SUCCESS. Status: ${pubFileRes.status}`);
        } catch (e) {
            console.error(`❌ Public File Access FAILED. Status: ${e.response?.status}`);
        }


    } catch (e) {
        console.error("ERROR:", e.message);
        if (e.response) console.error(JSON.stringify(e.response.data));
    }
}

checkAdminAsset();
