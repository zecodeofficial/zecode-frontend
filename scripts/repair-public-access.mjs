
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

const COLLECTIONS = [
    'globals',
    'hero_slides',
    'cms_categories',
    'stores',
    'products',
    'pages',
    'social_links',
    'footer_link_groups',
    'footer_links',
    'navigation_menu',
    'footer_settings',
    'homepage_sections',
    'directus_files',
    'directus_folders',
    'directus_settings'
];

async function repairPublicAccess() {
    try {
        console.log("Logging in as Admin...");
        const loginRes = await axios.post(`${DIRECTUS_URL}/auth/login`, {
            email: EMAIL, password: PASSWORD
        }, { httpsAgent: agent });

        const token = loginRes.data.data.access_token;
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Get or Create Public Role
        console.log("Fetching/creating Public Role...");
        const rolesRes = await axios.get(`${DIRECTUS_URL}/roles`, { headers, httpsAgent: agent });
        let publicRole = rolesRes.data.data.find(r => r.name === 'Public');
        let publicRoleId;

        if (publicRole) {
            console.log(`Found existing Public Role: ${publicRole.id}`);
            publicRoleId = publicRole.id;
        } else {
            console.log("Creating new Public Role...");
            const createRoleRes = await axios.post(`${DIRECTUS_URL}/roles`, {
                name: "Public",
                icon: "public",
                description: "Default role for unauthenticated users",
                admin_access: false,
                app_access: false
            }, { headers, httpsAgent: agent });
            publicRoleId = createRoleRes.data.data.id;
        }

        // 2. Ensure Policy exists and is linked
        const POLICY_NAME = "Comprehensive Public Access";
        let policyId;
        const policiesRes = await axios.get(`${DIRECTUS_URL}/policies`, {
            headers, httpsAgent: agent,
            params: { filter: { name: { _eq: POLICY_NAME } } }
        });

        if (policiesRes.data.data.length > 0) {
            policyId = policiesRes.data.data[0].id;
            console.log(`Using existing Policy: ${policyId}`);
        } else {
            console.log("Creating Policy...");
            const createPolRes = await axios.post(`${DIRECTUS_URL}/policies`, {
                name: POLICY_NAME,
                icon: "public",
                app_access: true,
                admin_access: false
            }, { headers, httpsAgent: agent });
            policyId = createPolRes.data.data.id;
        }

        // Link to role
        console.log("Checking policy links...");
        const rolesToLink = [publicRoleId, null]; // Link to both Public and NULL role

        for (const rId of rolesToLink) {
            console.log(`Linking Policy to Role: ${rId === null ? 'NULL (Fallback)' : rId}...`);
            const accessCheck = await axios.get(`${DIRECTUS_URL}/access`, {
                headers, httpsAgent: agent,
                params: {
                    filter: rId === null
                        ? { role: { _null: true }, policy: { _eq: policyId } }
                        : { role: { _eq: rId }, policy: { _eq: policyId } }
                }
            });

            if (accessCheck.data.data.length === 0) {
                await axios.post(`${DIRECTUS_URL}/access`, {
                    role: rId,
                    policy: policyId
                }, { headers, httpsAgent: agent });
                console.log(`  -> Linked successfully.`);
            } else {
                console.log(`  -> Link already exists.`);
            }
        }

        // 3. APPLY PERMISSIONS
        console.log("\n--- Applying Permissions ---");
        for (const col of COLLECTIONS) {
            console.log(`Working on ${col}...`);
            try {
                // Check if perm exists
                const existing = await axios.get(`${DIRECTUS_URL}/permissions`, {
                    headers, httpsAgent: agent,
                    params: { filter: { policy: { _eq: policyId }, collection: { _eq: col }, action: { _eq: 'read' } } }
                });

                if (existing.data.data.length > 0) {
                    console.log(`  Updating READ for ${col}...`);
                    await axios.patch(`${DIRECTUS_URL}/permissions/${existing.data.data[0].id}`, {
                        fields: ['*'],
                        validation: {},
                        presets: {}
                    }, { headers, httpsAgent: agent });
                } else {
                    console.log(`  Creating READ for ${col}...`);
                    await axios.post(`${DIRECTUS_URL}/permissions`, {
                        policy: policyId,
                        collection: col,
                        action: 'read',
                        fields: ['*']
                    }, { headers, httpsAgent: agent });
                }
            } catch (err) {
                console.error(`  Error for ${col}: ${err.message}`);
            }
        }

        // 4. Fallback: Check if we can apply to the legacy "NULL" role (for unauthenticated if no public_role is set)
        // In Directus Policies mode, the "NULL" role might still be fallback if the settings patch failed.
        // We'll try to find a policy linked to a NULL role if possible, or just rely on the public role link we created.

        console.log("\nAttempting to set public_role in settings again...");
        try {
            await axios.patch(`${DIRECTUS_URL}/settings`, { public_role: publicRoleId }, { headers, httpsAgent: agent });
            console.log("✅ Successfully updated public_role setting.");
        } catch (err) {
            console.warn("⚠️ Could not update public_role setting (might be immutable).");
        }

        console.log("\nDONE: Permissions repair complete.");

    } catch (e) {
        console.error("CRITICAL FAILED:", e.message);
        if (e.response) console.error(JSON.stringify(e.response.data, null, 2));
    }
}

repairPublicAccess();
