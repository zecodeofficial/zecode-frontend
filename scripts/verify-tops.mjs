
import axios from 'axios';
import https from 'https';

// Ignore self-signed certs just in case
const agent = new https.Agent({ rejectUnauthorized: false });

const DIRECTUS_URL = "https://zecode-directus.onrender.com";

async function test() {
    const subcategory = ["Top", "Tops", "Casual Top", "Tank Top"];
    const gender = "women";

    // Re-implement logic from lib/directus.ts
    const subcatValues = Array.isArray(subcategory) ? subcategory : [subcategory];
    const allCaseValues = subcatValues.flatMap(v => [
        v,
        v.toLowerCase(),
        v.charAt(0).toUpperCase() + v.slice(1).toLowerCase(),
        v.toUpperCase()
    ]);
    const uniqueValues = [...new Set(allCaseValues)];

    console.log("Unique subcategory values:", uniqueValues);

    const filter = {
        _and: [
            { status: { _eq: "published" } },
            {
                _or: [
                    { subcategory: { _in: uniqueValues } },
                    { category: { _in: uniqueValues } }
                ]
            },
            // { gender_category: { _istarts_with: gender } } // Temporarily commented out to debug gender
        ]
    };

    if (gender) {
        filter._and.push({ gender_category: { _istarts_with: gender } });
    }

    console.log("Using filter:", JSON.stringify(filter, null, 2));

    try {
        const res = await axios.get(`${DIRECTUS_URL}/items/products`, {
            params: {
                filter: JSON.stringify(filter),
                fields: "id,name,subcategory,category,gender_category,status",
                limit: 10
            },
            httpsAgent: agent
        });
        console.log("Count:", res.data.data.length);
        // console.log("Products:", JSON.stringify(res.data.data, null, 2));
        if (res.data.data.length === 0) {
            console.log("No products found with this filter.");
        } else {
            console.log("First Product:", res.data.data[0].name, res.data.data[0].subcategory, res.data.data[0].gender_category);
        }
    } catch (e) {
        console.error("Error:", e.message);
        if (e.response) console.error("Response data:", JSON.stringify(e.response.data, null, 2));
    }
}

test();
