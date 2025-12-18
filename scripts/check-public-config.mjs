
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

async function checkConfig() {
    try {
        console.log("Logging in...");
        const loginRes = await axios.post(`${DIRECTUS_URL}/auth/login`, {
            email: EMAIL, password: PASSWORD
        }, { httpsAgent: agent });

        const token = loginRes.data.data.access_token;
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Get Settings
        const settingsRes = await axios.get(`${DIRECTUS_URL}/settings`, { headers, httpsAgent: agent });
        const settingsPublicRoleID = settingsRes.data.data.public_role;
        console.log("Settings public_role ID:", settingsPublicRoleID);

        // 2. Get Roles
        const rolesRes = await axios.get(`${DIRECTUS_URL}/roles`, { headers, httpsAgent: agent });
        const roles = rolesRes.data.data;
        const publicRole = roles.find(r => r.name === 'Public');
        console.log("Role 'Public' ID from /roles:", publicRole ? publicRole.id : "NOT FOUND");

        if (settingsPublicRoleID && publicRole && settingsPublicRoleID !== publicRole.id) {
            console.warn("⚠️ MISMATCH! Settings public_role points to different ID than 'Public' role.");
        }

        // 3. Dump Permissions for both
        const targetRoles = [settingsPublicRoleID, publicRole?.id].filter(Boolean);
        // Also look for NULL role perms (legacy)

        console.log("\n--- Permissions Audit ---");
        const allPerms = await axios.get(`${DIRECTUS_URL}/permissions`, { headers, httpsAgent: agent });

        const nullPerms = allPerms.data.data.filter(p => p.role === null && p.policy === null);
        console.log(`\nPermissions for NULL Role (legacy fallback): ${nullPerms.length}`);
        nullPerms.slice(0, 10).forEach(p => console.log(`  - ${p.action} on ${p.collection}`));

        if (settingsPublicRoleID) {
            const spPerms = allPerms.data.data.filter(p => p.role === settingsPublicRoleID);
            console.log(`\nPermissions linked directly to Role ID ${settingsPublicRoleID}: ${spPerms.length}`);
            spPerms.slice(0, 10).forEach(p => console.log(`  - ${p.action} on ${p.collection}`));

            // Check Policies linked to this role via /access
            const access = await axios.get(`${DIRECTUS_URL}/access?filter[role][_eq]=${settingsPublicRoleID}`, { headers, httpsAgent: agent });
            console.log(`\nPolicies linked to Role ID ${settingsPublicRoleID}: ${access.data.data.length}`);
            for (const ac of access.data.data) {
                const pol = await axios.get(`${DIRECTUS_URL}/policies/${ac.policy}`, { headers, httpsAgent: agent });
                console.log(`  - Policy: ${pol.data.data.name} (${pol.data.data.id})`);
                const polPerms = allPerms.data.data.filter(p => p.policy === ac.policy);
                console.log(`    - Permissions in policy: ${polPerms.length}`);
                polPerms.slice(0, 5).forEach(p => console.log(`      - ${p.action} on ${p.collection}`));
            }
        }

    } catch (e) {
        console.error("FAILED:", e.message);
        if (e.response) console.error(JSON.stringify(e.response.data, null, 2));
    }
}

checkConfig();
