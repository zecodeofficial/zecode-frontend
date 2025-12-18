
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
const ADMIN_ROLE_ID = "ff62bf73-74c0-4024-bff2-adcde85301ae";

async function healAdmin() {
    try {
        console.log("Logging in...");
        const loginRes = await axios.post(`${DIRECTUS_URL}/auth/login`, {
            email: EMAIL, password: PASSWORD
        }, { httpsAgent: agent });

        const token = loginRes.data.data.access_token;
        const headers = { Authorization: `Bearer ${token}` };

        console.log(`Attempting to PATCH Role ${ADMIN_ROLE_ID} with admin_access: true...`);
        try {
            const updateRes = await axios.patch(`${DIRECTUS_URL}/roles/${ADMIN_ROLE_ID}`, {
                admin_access: true,
                app_access: true
            }, { headers, httpsAgent: agent });

            console.log("✅ PATCH Success!");
            console.log(`   New Admin Access: ${updateRes.data.data.admin_access}`);
            console.log(`   New App Access: ${updateRes.data.data.app_access}`);
        } catch (e) {
            console.error(`❌ PATCH Failed: ${e.response?.status} - ${e.response?.statusText}`);
            if (e.response?.data) console.error(JSON.stringify(e.response.data));
        }

    } catch (e) {
        console.error("Login Failed:", e.message);
    }
}

healAdmin();
