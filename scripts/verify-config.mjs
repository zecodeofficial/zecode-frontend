
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

async function verifyPermissions() {
    try {
        console.log("Logging in as Admin...");
        const loginRes = await axios.post(`${DIRECTUS_URL}/auth/login`, {
            email: EMAIL, password: PASSWORD
        }, { httpsAgent: agent });

        const token = loginRes.data.data.access_token;
        const headers = { Authorization: `Bearer ${token}` };

        // We assume public_role is NULL/undefined, so we check for usage of role: null
        console.log("Checking Access for role: null...");
        const accessRes = await axios.get(`${DIRECTUS_URL}/access`, {
            headers, httpsAgent: agent,
            params: { filter: { role: { _null: true } } } // Filter for null role
        });

        if (accessRes.data.data.length === 0) {
            console.log("No policies attached to NULL role.");

            // Fallback: Check for policies attached to 'public' role we created
            console.log("Checking Access for role: Public (by name)...");
            const rolesRes = await axios.get(`${DIRECTUS_URL}/roles`, { headers, httpsAgent: agent, params: { filter: { name: { _eq: 'Public' } } } });
            if (rolesRes.data.data.length > 0) {
                const pubId = rolesRes.data.data[0].id;
                console.log(`Checking policies for role ${pubId}...`);
                const pubAccess = await axios.get(`${DIRECTUS_URL}/access`, {
                    headers, httpsAgent: agent,
                    params: { filter: { role: { _eq: pubId } } }
                });
                console.log(`Found ${pubAccess.data.data.length} policies for Public role.`);
            }

        } else {
            console.log(`Found ${accessRes.data.data.length} policies linked to NULL role.`);
            for (const access of accessRes.data.data) {
                const policyId = access.policy;
                console.log(`- Policy ID: ${policyId}`);

                const policyRes = await axios.get(`${DIRECTUS_URL}/policies/${policyId}`, { headers, httpsAgent: agent });
                console.log(`  Name: ${policyRes.data.data.name}`);
                console.log(`  App Access: ${policyRes.data.data.app_access}`);
                console.log(`  Admin Access: ${policyRes.data.data.admin_access}`);
                console.log(`  IP Access: ${JSON.stringify(policyRes.data.data.ip_access)}`);

                // Check Permissions
                const permRes = await axios.get(`${DIRECTUS_URL}/permissions`, {
                    headers, httpsAgent: agent,
                    params: { filter: { policy: { _eq: policyId }, collection: { _eq: 'directus_files' } } }
                });

                if (permRes.data.data.length > 0) {
                    console.log(`  -> Permissions for directus_files:`);
                    permRes.data.data.forEach(p => {
                        console.log(`     Action: ${p.action}`);
                        console.log(`     Fields: ${JSON.stringify(p.fields)}`);
                        console.log(`     Permissions: ${JSON.stringify(p.permissions)}`); // This contains custom validations
                        console.log(`     Validation: ${JSON.stringify(p.validation)}`);
                        console.log(`     Presets: ${JSON.stringify(p.presets)}`);
                    });
                }
            }
        }

    } catch (e) {
        console.error("ERROR:", e.message);
        if (e.response) console.error(JSON.stringify(e.response.data));
    }
}

verifyPermissions();
