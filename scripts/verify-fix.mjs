
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
const TEST_ASSET_ID = "9d1b4099-1a9f-47f3-b744-c318c2abe36f"; // One of the problem images

async function verifyFix() {
    try {
        console.log("1. Checking 'public_role' setting...");
        const loginRes = await axios.post(`${DIRECTUS_URL}/auth/login`, {
            email: EMAIL, password: PASSWORD
        }, { httpsAgent: agent });

        const token = loginRes.data.data.access_token;
        const headers = { Authorization: `Bearer ${token}` };

        const settingsRes = await axios.get(`${DIRECTUS_URL}/settings`, { headers, httpsAgent: agent });
        const publicRole = settingsRes.data.data.public_role;
        console.log(`   Current public_role: ${publicRole}`);

        if (publicRole) {
            console.log("   ✅ Public Role is SET.");
        } else {
            console.log("   ❌ Public Role is STILL NULL/UNDEFINED.");
        }

        console.log("\n2. Checking Asset Access (HTTP Request)...");
        try {
            // Using a random query param to bypass cache
            const assetUrl = `${DIRECTUS_URL}/assets/${TEST_ASSET_ID}?cb=${Date.now()}`;
            const assetRes = await axios.head(assetUrl, { httpsAgent: agent, validateStatus: () => true });
            console.log(`   URL: ${assetUrl}`);
            console.log(`   Status: ${assetRes.status} ${assetRes.statusText}`);

            if (assetRes.status === 200) {
                console.log("   ✅ Asset is ACCESSIBLE.");
            } else {
                console.log("   ❌ Asset is NOT accessible.");
            }

        } catch (e) {
            console.error("   Request failed:", e.message);
        }

    } catch (e) {
        console.error("ERROR:", e.message);
        if (e.response) console.error(JSON.stringify(e.response.data));
    }
}

verifyFix();
