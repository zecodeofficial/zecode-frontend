
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

async function testAdmin() {
    try {
        console.log("Logging in...");
        const loginRes = await axios.post(`${DIRECTUS_URL}/auth/login`, {
            email: EMAIL, password: PASSWORD
        }, { httpsAgent: agent });

        const token = loginRes.data.data.access_token;
        const headers = { Authorization: `Bearer ${token}` };

        console.log("\n--- Users / Me ---");
        const meRes = await axios.get(`${DIRECTUS_URL}/users/me`, { headers, httpsAgent: agent });
        console.log("User:", meRes.data.data.email);
        console.log("Role:", meRes.data.data.role);

        console.log("\n--- Collections List ---");
        const collRes = await axios.get(`${DIRECTUS_URL}/collections`, { headers, httpsAgent: agent });
        console.log(`Found ${collRes.data.data.length} collections.`);
        // console.log(collRes.data.data.map(c => c.collection));

        console.log("\n--- Testing Single Collection Read (Products) ---");
        try {
            const prodRes = await axios.get(`${DIRECTUS_URL}/items/products`, { params: { limit: 1 }, headers, httpsAgent: agent });
            console.log("✅ Admin can read products.");
        } catch (e) {
            console.error("❌ Admin CANNOT read products:", e.response?.status);
        }

    } catch (e) {
        console.error("FAILED:", e.message);
        if (e.response) console.error(JSON.stringify(e.response.data, null, 2));
    }
}

testAdmin();
