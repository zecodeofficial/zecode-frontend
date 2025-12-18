
import axios from 'axios';
import https from 'https';

const agent = new https.Agent({ rejectUnauthorized: false });
const DIRECTUS_URL = "https://zecode-directus.onrender.com";

const TEST_COLLECTIONS = ['footer_settings', 'products', 'cms_categories'];

async function verifyPublicRead() {
    console.log("Verifying Public Read Access (Unauthenticated)...");

    for (const col of TEST_COLLECTIONS) {
        console.log(`\nTesting ${col}...`);
        try {
            const res = await axios.get(`${DIRECTUS_URL}/items/${col}`, {
                params: { limit: 1 },
                httpsAgent: agent
            });
            console.log(`✅ Success! [${col}]`);
            // console.log(JSON.stringify(res.data.data, null, 2));
        } catch (e) {
            console.error(`❌ Failed! [${col}] - Status: ${e.response?.status} (${e.response?.statusText})`);
            if (e.response?.data) {
                console.error("   Error:", JSON.stringify(e.response.data.errors?.[0]?.message || e.response.data));
            }
        }
    }
}

verifyPublicRead();
