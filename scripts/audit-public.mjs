
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

async function auditPublic() {
    try {
        console.log("Logging in as Admin...");
        const loginRes = await axios.post(`${DIRECTUS_URL}/auth/login`, {
            email: EMAIL, password: PASSWORD
        }, { httpsAgent: agent });

        const token = loginRes.data.data.access_token;
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Check Settings
        console.log("\n--- Settings ---");
        const settingsRes = await axios.get(`${DIRECTUS_URL}/settings`, { headers, httpsAgent: agent });
        console.log("Current public_role ID:", settingsRes.data.data.public_role);

        // 2. Check Roles
        console.log("\n--- Roles ---");
        const rolesRes = await axios.get(`${DIRECTUS_URL}/roles`, { headers, httpsAgent: agent });
        const publicRole = rolesRes.data.data.find(r => r.name === 'Public');
        console.log("Public Role in DB:", publicRole ? `${publicRole.name} (${publicRole.id})` : "NOT FOUND");

        // 3. Check Permissions for NULL Role
        console.log("\n--- Permissions for Role: NULL ---");
        const nullPerms = await axios.get(`${DIRECTUS_URL}/permissions`, {
            headers, httpsAgent: agent,
            params: { filter: { role: { _null: true } } }
        });
        console.log(`Found ${nullPerms.data.data.length} permissions for NULL role.`);
        nullPerms.data.data.forEach(p => console.log(`  - ${p.action} on ${p.collection}`));

        // 4. Check Policies for Public Role
        if (publicRole) {
            console.log(`\n--- Policies for Role: Public (${publicRole.id}) ---`);
            const access = await axios.get(`${DIRECTUS_URL}/access?filter[role][_eq]=${publicRole.id}`, { headers, httpsAgent: agent });
            for (const a of access.data.data) {
                const pol = await axios.get(`${DIRECTUS_URL}/policies/${a.policy}`, { headers, httpsAgent: agent });
                console.log(`  - Policy: ${pol.data.data.name} (${pol.data.data.id})`);
                const pms = await axios.get(`${DIRECTUS_URL}/permissions?filter[policy][_eq]=${pol.data.data.id}`, { headers, httpsAgent: agent });
                console.log(`    - Permissions: ${pms.data.data.length}`);
                pms.data.data.forEach(p => console.log(`      - ${p.action} on ${p.collection}`));
            }
        }

    } catch (e) {
        console.error("FAILED:", e.message);
        if (e.response) console.error(JSON.stringify(e.response.data, null, 2));
    }
}

auditPublic();
