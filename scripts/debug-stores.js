process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const DIRECTUS_URL = "https://zecode-directus.onrender.com";
const ADMIN_EMAIL = "zecode@siyaram.com";
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || "Zecode@2024";

async function checkStores() {
    try {
        console.log("Authenticating...");
        const authRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD,
            })
        });

        if (!authRes.ok) {
            throw new Error(`Auth failed: ${authRes.statusText}`);
        }

        const authData = await authRes.json();
        const token = authData.data.access_token;
        console.log("Authenticated. Fetching stores...");

        const res = await fetch(`${DIRECTUS_URL}/items/stores?limit=-1&sort=id`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        const stores = data.data;
        console.log(`Found ${stores.length} stores:`);
        stores.forEach(s => {
            console.log(`[${s.id}] ${s.name} (${s.city}, ${s.state}) - Phone: ${s.phone}`);
        });

    } catch (error) {
        console.error("Error:", error.message);
    }
}

checkStores();
