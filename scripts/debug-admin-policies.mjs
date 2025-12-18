
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

const POLICY_IDS = ["90de0f4d-f2dc-4742-84be-877af538b370", "3a533849-e2b4-47d4-9908-760bd6684704"];

async function debugPolicies() {
    try {
        console.log("Logging in as Admin...");
        const loginRes = await axios.post(`${DIRECTUS_URL}/auth/login`, {
            email: EMAIL, password: PASSWORD
        }, { httpsAgent: agent });

        const token = loginRes.data.data.access_token;
        const headers = { Authorization: `Bearer ${token}` };

        for (const pid of POLICY_IDS) {
            console.log(`\nFetching Policy ${pid}...`);
            try {
                const res = await axios.get(`${DIRECTUS_URL}/policies/${pid}`, { headers, httpsAgent: agent });
                const p = res.data.data;
                console.log(`   Name: ${p.name}`);
                console.log(`   Admin Access: ${p.admin_access}`);
                console.log(`   App Access: ${p.app_access}`);
                console.log(`   Permissions count: ${p.permissions ? p.permissions.length : 'N/A'}`);
            } catch (e) {
                console.error(`   Failed to fetch policy: ${e.message}`);
                // Try fetching directly from database if available via permissions endpoint? No, need policy object.
            }
        }

    } catch (e) {
        console.error("ERROR:", e.message);
        if (e.response) console.error(JSON.stringify(e.response.data));
    }
}

debugPolicies();
