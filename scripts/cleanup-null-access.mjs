
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

const ACCESS_IDS_TO_DELETE = [
    '1b247010-1424-4bf2-adaf-2b608ecca5ff', // $t:public_label (Built-in)
    '1d6002a0-783c-4164-b3d5-5723baf11856', // Administrator (SUSPICIOUS!)
    '13aa5d8f-5962-425a-a770-431e0ef8694e', // Public Read Access
    '1f0cdd34-798a-4414-a830-a5a3f55d4be9'  // Public Website Access
];

async function cleanupAccess() {
    try {
        console.log("Logging in...");
        const loginRes = await axios.post(`${DIRECTUS_URL}/auth/login`, {
            email: EMAIL, password: PASSWORD
        }, { httpsAgent: agent });

        const token = loginRes.data.data.access_token;
        const headers = { Authorization: `Bearer ${token}` };

        for (const id of ACCESS_IDS_TO_DELETE) {
            console.log(`Deleting access link: ${id}...`);
            try {
                await axios.delete(`${DIRECTUS_URL}/access/${id}`, { headers, httpsAgent: agent });
                console.log(`  -> Deleted.`);
            } catch (e) {
                console.error(`  -> Failed: ${e.message}`);
                // if (e.response) console.error(JSON.stringify(e.response.data, null, 2));
            }
        }

        console.log("\nDONE: Access links cleaned up.");

    } catch (e) {
        console.error("FAILED:", e.message);
        if (e.response) console.error(JSON.stringify(e.response.data, null, 2));
    }
}

cleanupAccess();
