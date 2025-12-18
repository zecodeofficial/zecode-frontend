
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

async function debugSettings() {
    try {
        console.log("Logging in as Admin...");
        const loginRes = await axios.post(`${DIRECTUS_URL}/auth/login`, {
            email: EMAIL, password: PASSWORD
        }, { httpsAgent: agent });

        const token = loginRes.data.data.access_token;
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Find Public Role ID
        console.log("Finding 'Public' Role...");
        const rolesRes = await axios.get(`${DIRECTUS_URL}/roles`, { headers, httpsAgent: agent });
        const publicRole = rolesRes.data.data.find(r => r.name === 'Public');

        if (!publicRole) {
            console.error("FAIL: Role 'Public' not found!");
            return;
        }
        const targetId = publicRole.id;
        console.log(`Target Public Role ID: ${targetId}`);

        // 2. Dump current settings keys related to public
        console.log("Current Settings (Public keys):");
        let settingsRes = await axios.get(`${DIRECTUS_URL}/settings`, { headers, httpsAgent: agent });
        let currentRole = settingsRes.data.data.public_role;
        console.log(`BEFORE PATCH: public_role = ${currentRole}`);

        // 3. Force PATCH
        console.log(`Attempting to PATCH public_role to ${targetId}...`);
        try {
            const patchRes = await axios.patch(`${DIRECTUS_URL}/settings`, {
                public_role: targetId
            }, { headers, httpsAgent: agent });
            console.log("PATCH Response Data:", patchRes.data.data.public_role);
        } catch (e) {
            console.error("PATCH FAILED:", e.message);
            if (e.response) console.log(JSON.stringify(e.response.data));
        }

        // 4. Read Verification
        console.log("Re-reading Settings...");
        settingsRes = await axios.get(`${DIRECTUS_URL}/settings`, { headers, httpsAgent: agent });
        currentRole = settingsRes.data.data.public_role;
        console.log(`AFTER PATCH: public_role = ${currentRole}`);

        if (currentRole === targetId) {
            console.log("SUCCESS: Setting persisted.");
        } else {
            console.error("FAIL: Setting did not persist.");
        }

    } catch (e) {
        console.error("ERROR:", e.message);
        if (e.response) console.error(JSON.stringify(e.response.data));
    }
}

debugSettings();
