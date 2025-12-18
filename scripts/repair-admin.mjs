
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

async function repairAdmin() {
    try {
        console.log("Logging in...");
        const loginRes = await axios.post(`${DIRECTUS_URL}/auth/login`, {
            email: EMAIL, password: PASSWORD
        }, { httpsAgent: agent });

        const token = loginRes.data.data.access_token;
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Create New Policy
        console.log("Creating 'Super Admin Repair' Policy...");
        try {
            const policyRes = await axios.post(`${DIRECTUS_URL}/policies`, {
                name: "Super Admin Repair",
                icon: "verified_user",
                description: "Restoring Admin Access",
                admin_access: true,
                app_access: true,
                enforce_tfa: false
            }, { headers, httpsAgent: agent });

            const newPolicyId = policyRes.data.data.id;
            console.log(`✅ Policy Created: ${newPolicyId}`);

            // 2. Attach to Admin Role
            // Need to fetch current role to preserve existing policies (even if we can't read them via /policies endpoint, the role object might have the IDs)
            console.log("Fetching current policies from Role...");
            const roleRes = await axios.get(`${DIRECTUS_URL}/roles/${ADMIN_ROLE_ID}`, { headers, httpsAgent: agent });
            let currentPolicies = roleRes.data.data.policies || [];

            if (!currentPolicies.includes(newPolicyId)) {
                console.log(`Adding Policy ${newPolicyId} to Role ${ADMIN_ROLE_ID}...`);
                const updatedPolicies = [...currentPolicies, newPolicyId];

                await axios.patch(`${DIRECTUS_URL}/roles/${ADMIN_ROLE_ID}`, {
                    policies: updatedPolicies
                }, { headers, httpsAgent: agent });
                console.log("✅ Role Updated with New Policy!");
            } else {
                console.log("Policy already attached.");
            }

        } catch (e) {
            console.error(`❌ Repair Failed: ${e.message}`);
            if (e.response?.data) console.error(JSON.stringify(e.response.data));
        }

    } catch (e) {
        console.error("Login Failed:", e.message);
    }
}

repairAdmin();
