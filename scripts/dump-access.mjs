
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

async function dumpAccess() {
    try {
        console.log("Logging in...");
        const loginRes = await axios.post(`${DIRECTUS_URL}/auth/login`, {
            email: EMAIL, password: PASSWORD
        }, { httpsAgent: agent });

        const token = loginRes.data.data.access_token;
        const headers = { Authorization: `Bearer ${token}` };

        console.log("\n--- Directus Access Table (Links between Roles and Policies) ---");
        const accessRes = await axios.get(`${DIRECTUS_URL}/access?limit=-1`, { headers, httpsAgent: agent });

        const data = accessRes.data.data;
        console.log(`Total Access Links: ${data.length}`);

        data.forEach(a => {
            console.log(`- ID: ${a.id} | Role: ${a.role || 'NULL'} | Policy: ${a.policy}`);
        });

    } catch (e) {
        console.error("FAILED:", e.message);
        if (e.response) console.error(JSON.stringify(e.response.data, null, 2));
    }
}

dumpAccess();
