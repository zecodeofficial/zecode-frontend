
import axios from 'axios';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const agent = new https.Agent({ rejectUnauthorized: false });
const DIRECTUS_URL = "https://zecode-directus.onrender.com";
const EMAIL = "zecode@siyaram.com";
const PASSWORD = "S!Y@rAM's";

async function inspect() {
    try {
        console.log("Logging in...");
        const authRes = await axios.post(`${DIRECTUS_URL}/auth/login`, {
            email: EMAIL, password: PASSWORD
        }, { httpsAgent: agent });
        const token = authRes.data.data.access_token;
        const headers = { Authorization: `Bearer ${token}` };

        console.log("Fetching Public Role...");
        const rolesRes = await axios.get(`${DIRECTUS_URL}/roles`, { headers, httpsAgent: agent });
        const publicRole = rolesRes.data.data.find(r => r.name === 'Public');
        console.log(`Public Role ID: ${publicRole.id}`);

        console.log("Fetching Policies attached to Public Role...");
        const accessRes = await axios.get(`${DIRECTUS_URL}/access`, {
            headers, httpsAgent: agent,
            params: { filter: { role: { _eq: publicRole.id } } }
        });

        const attachedPolicies = accessRes.data.data;
        console.log(`Found ${attachedPolicies.length} policies attached.`);

        for (const link of attachedPolicies) {
            const policyId = link.policy;
            console.log(`\n--- Policy ID: ${policyId} ---`);
            const policyRes = await axios.get(`${DIRECTUS_URL}/policies/${policyId}`, { headers, httpsAgent: agent });
            console.log(`Name: ${policyRes.data.data.name}`);
            console.log(`App Access: ${policyRes.data.data.app_access}`);
            console.log(`Admin Access: ${policyRes.data.data.admin_access}`);

            console.log("Permissions:");
            const permRes = await axios.get(`${DIRECTUS_URL}/permissions`, {
                headers, httpsAgent: agent,
                params: { filter: { policy: { _eq: policyId } } }
            });
            permRes.data.data.forEach(p => {
                console.log(`  - ${p.collection} (${p.action}) Fields: ${p.fields}`);
            });
        }

    } catch (e) {
        console.error("Error:", e.message);
        if (e.response) console.error(JSON.stringify(e.response.data));
    }
}

inspect();
