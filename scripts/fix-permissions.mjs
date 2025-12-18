
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

async function fixPermissions() {
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
            console.log("Creating new Public Config Role...");
            const createRoleRes = await axios.post(`${DIRECTUS_URL}/roles`, {
                name: "Public",
                icon: "public",
                description: "Default role for unauthenticated users",
                admin_access: false,
                app_access: false // Important: Public users don't log in to App
            }, { headers, httpsAgent: agent });
            publicRoleId = createRoleRes.data.data.id;
            console.log(`Created Role: ${publicRoleId}`);
        }

        // 2. Update Settings to use this Role
        console.log("Checking Project Settings...");
        const settingsRes = await axios.get(`${DIRECTUS_URL}/settings`, { headers, httpsAgent: agent });
        const currentPublicRole = settingsRes.data.data.public_role;

        if (currentPublicRole !== publicRoleId) {
            console.log(`Updating settings: public_role from ${currentPublicRole} to ${publicRoleId}...`);
            await axios.patch(`${DIRECTUS_URL}/settings`, {
                public_role: publicRoleId
            }, { headers, httpsAgent: agent });
            console.log("Settings updated.");
        } else {
            console.log("Settings already using correct Public Role.");
        }

        // 3. Ensure Policy Exists
        const POLICY_NAME = "Automated Public Assets";
        console.log(`Checking Policy: ${POLICY_NAME}...`);
        const policiesRes = await axios.get(`${DIRECTUS_URL}/policies`, {
            headers, httpsAgent: agent,
            params: { filter: { name: { _eq: POLICY_NAME } } }
        });

        let policyId;
        if (policiesRes.data.data.length > 0) {
            policyId = policiesRes.data.data[0].id;
            console.log(`Using existing Policy: ${policyId}`);
        } else {
            console.log("Creating Policy...");
            const createPolRes = await axios.post(`${DIRECTUS_URL}/policies`, {
                name: POLICY_NAME,
                icon: "public",
                app_access: true, // Needed for API usage effectively? Or maybe irrelevant for pure public but good for SDKs
                admin_access: false,
                enforce_tfa: false
            }, { headers, httpsAgent: agent });
            policyId = createPolRes.data.data.id;
            console.log(`Created Policy: ${policyId}`);
        }

        // 4. Ensure Permissions on Policy
        const COLLECTIONS = ['directus_files', 'directus_folders', 'directus_settings'];
        for (const col of COLLECTIONS) {
            console.log(`Checking permissions for ${col}...`);
            const permRes = await axios.get(`${DIRECTUS_URL}/permissions`, {
                headers, httpsAgent: agent,
                params: {
                    filter: {
                        policy: { _eq: policyId },
                        collection: { _eq: col },
                        action: { _eq: 'read' }
                    }
                }
            });

            if (permRes.data.data.length === 0) {
                await axios.post(`${DIRECTUS_URL}/permissions`, {
                    policy: policyId,
                    collection: col,
                    action: 'read',
                    fields: ['*']
                }, { headers, httpsAgent: agent });
                console.log(`-> Added READ for ${col}`);
            } else {
                console.log(`-> Permission exists for ${col}`);
                // Ensure fields are *
                await axios.patch(`${DIRECTUS_URL}/permissions/${permRes.data.data[0].id}`, {
                    fields: ['*']
                }, { headers, httpsAgent: agent });
            }
        }

        // 5. Link Policy to Role
        console.log("Linking Policy to Role...");
        const accessRes = await axios.get(`${DIRECTUS_URL}/access`, {
            headers, httpsAgent: agent,
            params: {
                filter: {
                    role: { _eq: publicRoleId },
                    policy: { _eq: policyId }
                }
            }
        });

        if (accessRes.data.data.length === 0) {
            await axios.post(`${DIRECTUS_URL}/access`, {
                role: publicRoleId,
                policy: policyId
            }, { headers, httpsAgent: agent });
            console.log("-> Link created.");
        } else {
            console.log("-> Link exists.");
        }

        console.log("SUCCESS: Public Role configured, Settings updated, Policy attached.");

    } catch (e) {
        console.error("FAILED:", e.message);
        if (e.response) console.error(JSON.stringify(e.response.data, null, 2));
    }
}

fixPermissions();
