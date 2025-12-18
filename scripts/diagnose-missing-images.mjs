import axios from 'axios';
import https from 'https';
import fs from 'fs';

const agent = new https.Agent({ rejectUnauthorized: false });
const DIRECTUS_URL = "https://zecode-directus.onrender.com";

function log(msg) {
    console.log(msg);
    fs.appendFileSync('diagnosis_log.txt', msg + '\n');
}

async function diagnose() {
    const targetSlug = "navy-blue-sleeveless-ribbed-knit-racerback-tank-top";
    fs.writeFileSync('diagnosis_log.txt', ''); // Clear log

    try {
        log(`Checking product: ${targetSlug}...`);

        const filter = {
            slug: { _eq: targetSlug }
        };

        // Test fields one by one to find the forbidden one
        const fieldsToTest = [
            "id,name",
            "id,name,image",
            "id,name,image_url",
            "id,name,gallery",
            "id,name,model_image_1",
            "id,name,model_image_1_url",
            "id,name,model_image_1,model_image_1_url" // Combination
        ];

        for (const fields of fieldsToTest) {
            log(`Testing fields: [${fields}]...`);
            try {
                const res = await axios.get(`${DIRECTUS_URL}/items/products`, {
                    params: {
                        filter: JSON.stringify(filter),
                        fields: fields,
                        limit: 1
                    },
                    httpsAgent: agent
                });
                if (res.data.data.length > 0) {
                    const p = res.data.data[0];
                    log(`-> OK. Data: ${JSON.stringify(p)}`);
                } else {
                    log("-> OK (Empty result)");
                }
            } catch (e) {
                const errMsg = e.response ? JSON.stringify(e.response.data) : e.message;
                log(`-> FAILED: ${errMsg}`);
            }
        }

    } catch (e) {
        log(`Error: ${e.message}`);
    }
}

diagnose();
