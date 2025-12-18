
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

async function listRoles() {
    try {
        console.log("Logging in...");
        const loginRes = await axios.post(`${DIRECTUS_URL}/auth/login`, {
            email: EMAIL, password: PASSWORD
        }, { httpsAgent: agent });

        const token = loginRes.data.data.access_token;
        const headers = { Authorization: `Bearer ${token}` };

        console.log("Fetching roles...");
        const res = await axios.get(`${DIRECTUS_URL}/roles`, {
            headers, httpsAgent: agent,
            params: { limit: -1 }
        });

        console.log(`Found ${res.data.data.length} roles:`);
        res.data.data.forEach(r => {
            console.log(`ID: ${r.id} | Name: ${r.name}`);
        });

    } catch (e) {
        console.error("Error:", e.message);
        if (e.response) console.error(JSON.stringify(e.response.data));
    }
}

listRoles();
