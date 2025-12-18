
import axios from 'axios';
import https from 'https';

const agent = new https.Agent({ rejectUnauthorized: false });
const DIRECTUS_URL = "https://zecode-directus.onrender.com";
const KEY = "EDgsv-AKkv_nXaj3qjYtFsY9IkVK3_Ki";

async function verify() {
    console.log(`Verifying key: ${KEY}`);
    try {
        // Try to get current user info
        const res = await axios.get(`${DIRECTUS_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${KEY}` },
            httpsAgent: agent
        });
        const user = res.data.data;
        console.log("User Found:", user.email);
        console.log("Role ID:", user.role);

        // Fetch Role Name if possible
        try {
            const roleRes = await axios.get(`${DIRECTUS_URL}/roles/${user.role}`, {
                headers: { 'Authorization': `Bearer ${KEY}` }, // Try using same key
                httpsAgent: agent
            });
            console.log("Role Name:", roleRes.data.data.name);
            console.log("Admin Access:", roleRes.data.data.admin_access);
        } catch (roleErr) {
            console.log("Could not fetch role details (likely lack of permission):", roleErr.message);
        }

    } catch (e) {
        console.error("Token verification failed.");
        if (e.response) {
            console.log("Status:", e.response.status);
            console.log("Error:", JSON.stringify(e.response.data));
        } else {
            console.log("Error:", e.message);
        }
    }
}

verify();
