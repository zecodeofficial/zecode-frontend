
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
const PUBLIC_ROLE_ID = "ff23b7d4-6985-4f1b-a9b5-8c2129d70b09"; // Retrieved from simple-debug.mjs

async function forcePatch() {
    try {
        console.log("Logging in as Admin...");
        const loginRes = await axios.post(`${DIRECTUS_URL}/auth/login`, {
            email: EMAIL, password: PASSWORD
        }, { httpsAgent: agent });

        const token = loginRes.data.data.access_token;
        const headers = { Authorization: `Bearer ${token}` };

        console.log(`Force PATCH public_role to ${PUBLIC_ROLE_ID}...`);

        const patchRes = await axios.patch(`${DIRECTUS_URL}/settings`, {
            public_role: PUBLIC_ROLE_ID
        }, { headers, httpsAgent: agent });

        console.log("PATCH Response:");
        // Dump the returned settings to see if it stuck
        console.log("public_role:", patchRes.data.data.public_role);

        // Double check
        const verifyRes = await axios.get(`${DIRECTUS_URL}/settings`, { headers, httpsAgent: agent });
        console.log("VERIFY public_role:", verifyRes.data.data.public_role);

    } catch (e) {
        console.error("ERROR:", e.message);
        if (e.response) console.error(JSON.stringify(e.response.data));
    }
}

forcePatch();
