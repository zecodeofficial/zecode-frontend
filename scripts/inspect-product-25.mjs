
import axios from 'axios';
import https from 'https';

const agent = new https.Agent({ rejectUnauthorized: false });
const DIRECTUS_URL = "https://zecode-directus.onrender.com";

async function inspect() {
    try {
        console.log("Fetching Product 25...");
        const res = await axios.get(`${DIRECTUS_URL}/items/products/25`, {
            params: {
                fields: "id,name,slug,image,image_url" // Get both to be sure
            },
            httpsAgent: agent
        });
        const product = res.data.data;
        console.log("Product Data:", JSON.stringify(product, null, 2));

        if (product.image) {
            console.log(`Checking File ID: ${product.image}...`);
            try {
                const fileRes = await axios.get(`${DIRECTUS_URL}/files/${product.image}`, { httpsAgent: agent });
                console.log("File Data:", JSON.stringify(fileRes.data.data, null, 2));
            } catch (fileErr) {
                console.log("Error fetching file:", fileErr.message);
                if (fileErr.response) console.log(fileErr.response.data);
            }
        } else {
            console.log("Image field is NULL.");
        }

    } catch (e) {
        console.error("Error:", e.message);
        if (e.response) console.error(JSON.stringify(e.response.data, null, 2));
    }
}

inspect();
