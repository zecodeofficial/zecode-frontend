
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
const TARGET_SLUG = "brown-black-tiger-print-chiffon-blouse-voluminous-sleeves-animal-graphic";

async function inspectProduct() {
    try {
        console.log(`Fetching product: ${TARGET_SLUG}...`);
        const res = await axios.get(`${DIRECTUS_URL}/items/products`, {
            params: {
                "filter[slug][_eq]": TARGET_SLUG,
                fields: "id,name,image,image_url"
            },
            httpsAgent: agent
        });

        const product = res.data.data[0];
        if (!product) {
            console.error("Product NOT FOUND.");
            return;
        }

        console.log("Product Data:");
        console.log(`ID: ${product.id}`);
        console.log(`Name: ${product.name}`);
        console.log(`Image (ID): ${product.image}`);
        console.log(`Image URL: ${product.image_url}`);

        if (product.image) {
            console.log(`\nTesting access to Image ID: ${product.image}`);
            try {
                // Test /files/ endpoint since /assets/ is known broken
                const fileUrl = `${DIRECTUS_URL}/files/${product.image}`;
                const fileRes = await axios.head(fileUrl, { httpsAgent: agent });
                console.log(`✅ ${fileUrl} -> ${fileRes.status}`);
            } catch (e) {
                console.log(`❌ /files/ access failed: ${e.response?.status}`);
            }
        }

    } catch (e) {
        console.error("Error:", e.message);
    }
}

inspectProduct();
