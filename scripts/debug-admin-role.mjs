
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

async function debugAdminRole() {
    try {
        console.log("Logging in as Admin...");
        const loginRes = await axios.post(`${DIRECTUS_URL}/auth/login`, {
            email: EMAIL, password: PASSWORD
        }, { httpsAgent: agent });

        const token = loginRes.data.data.access_token;
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Get Current User info
        const meRes = await axios.get(`${DIRECTUS_URL}/users/me`, { headers, httpsAgent: agent });
        const user = meRes.data.data;
        console.log(`User ID: ${user.id}`);
        console.log(`User Role ID: ${user.role}`);

        // 2. Fetch Role Details
        const roleRes = await axios.get(`${DIRECTUS_URL}/roles/${user.role}`, { headers, httpsAgent: agent });
        const role = roleRes.data.data;
        console.log(`Role Name: ${role.name}`);
        console.log(`Admin Access: ${role.admin_access}`);
        console.log(`App Access: ${role.app_access}`);

        // 3. Inspect Policies attached to this role (if any)
        if (role.policies) {
            console.log(`Policies: ${JSON.stringify(role.policies)}`);
        } else {
            console.log("Policies: [Legacy Admin Role - uses implicit full access]");
        }

    } catch (e) {
        console.error("ERROR:", e.message);
        if (e.response) console.error(JSON.stringify(e.response.data));
    }
}

debugAdminRole();
