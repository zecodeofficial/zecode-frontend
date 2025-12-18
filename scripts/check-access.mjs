
import axios from 'axios';
import https from 'https';

const agent = new https.Agent({ rejectUnauthorized: false });
const ASSET_URL = "https://zecode-directus.onrender.com/assets/9d1b4099-1a9f-47f3-b744-c318c2abe36f";

async function checkPublicAccess() {
    try {
        console.log(`Checking public access to: ${ASSET_URL}`);
        const res = await axios.get(ASSET_URL, {
            httpsAgent: agent,
            maxRedirects: 0,
            validateStatus: (status) => status < 500 // Accept anything to see the code
        });
        console.log(`Status Code: ${res.status}`);
        console.log(`Content-Type: ${res.headers['content-type']}`);

        if (res.status === 200 && res.headers['content-type'].includes('image')) {
            console.log("SUCCESS: Image is publicly accessible.");
        } else {
            console.log("FAILURE: Image is NOT normally accessible.");
            console.log("Response:", JSON.stringify(res.data));
        }
    } catch (e) {
        console.error("Error:", e.message);
        if (e.response) {
            console.log("Status:", e.response.status);
            console.log("Data:", JSON.stringify(e.response.data));
        }
    }
}

checkPublicAccess();
