
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
const TEST_ASSET_ID = "9d1b4099-1a9f-47f3-b744-c318c2abe36f";

async function debugPerms() {
    try {
        console.log("Logging in...");
        const loginRes = await axios.post(`${DIRECTUS_URL}/auth/login`, {
            email: EMAIL, password: PASSWORD
        }, { httpsAgent: agent });

        const token = loginRes.data.data.access_token;
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Check Asset Folder
        console.log(`\nInspecting Asset ${TEST_ASSET_ID}...`);
        const fileRes = await axios.get(`${DIRECTUS_URL}/files/${TEST_ASSET_ID}`, { headers, httpsAgent: agent });
        const folder = fileRes.data.data.folder;
        console.log(`   Folder: ${folder}`);

        // 2. Check Permissions for NULL role on directus_folders
        console.log("\nChecking Permissions for role: null...");
        const accessRes = await axios.get(`${DIRECTUS_URL}/access`, {
            headers, httpsAgent: agent,
            params: { filter: { role: { _null: true } } }
        });

        let hasFolderRead = false;

        if (accessRes.data.data.length > 0) {
            for (const access of accessRes.data.data) {
                const policyId = access.policy;
                const permRes = await axios.get(`${DIRECTUS_URL}/permissions`, {
                    headers, httpsAgent: agent,
                    params: { filter: { policy: { _eq: policyId }, collection: { _eq: 'directus_settings' } } }
                });

                if (permRes.data.data.length > 0) {
                    permRes.data.data.forEach(p => {
                        if (p.action === 'read') {
                            hasFolderRead = true;
                            console.log(`   Found 'read' on directus_settings (Policy ${policyId})`);
                        }
                    });
                }
            }
        }

        if (!hasFolderRead) {
            console.log("   ❌ NO 'read' permission on directus_settings for NULL role.");

            // Fix it!
            if (accessRes.data.data.length > 0) {
                const policyId = accessRes.data.data[0].policy;
                console.log(`   >>> ATTEMPTING FIX: Adding directus_settings read to Policy ${policyId}...`);
                try {
                    await axios.post(`${DIRECTUS_URL}/permissions`, {
                        policy: policyId,
                        collection: 'directus_settings',
                        action: 'read',
                        fields: ['*']
                    }, { headers, httpsAgent: agent });
                    console.log("   ✅ Permission added.");
                } catch (e) {
                    console.error("   Failed to add permission:", e.message);
                }
            }
        } else {
            console.log("   ✅ 'read' permission on directus_settings exists.");
        }

    } catch (e) {
        console.error("ERROR:", e.message);
        if (e.response) console.error(JSON.stringify(e.response.data));
    }
}

debugPerms();
