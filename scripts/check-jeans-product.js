const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Load environment variables
try {
    const envPath = path.join(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["'](.*)["']$/, '$1');
                if (!process.env[key]) {
                    process.env[key] = value;
                }
            }
        });
    }
} catch (e) {
    console.log('Could not load .env.local', e);
}

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
const DIRECTUS_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD;

async function checkProduct() {
    try {
        const authRes = await axios.post(`${DIRECTUS_URL}/auth/login`, {
            email: DIRECTUS_EMAIL,
            password: DIRECTUS_PASSWORD,
        });
        const token = authRes.data.data.access_token;

        // Search for the product by slug
        const res = await axios.get(`${DIRECTUS_URL}/items/products`, {
            params: {
                'filter[slug][_eq]': 'womens-blue-slim-jeans-153'
            },
            headers: { Authorization: `Bearer ${token}` }
        });

        const product = res.data.data[0];
        if (product) {
            console.log('Product ID:', product.id);
            console.log('Name:', product.name);
            console.log('Main Image:', product.image_url || product.image);
            console.log('Model Image 1:', product.model_image_1);
            console.log('Model Image 2:', product.model_image_2);
            console.log('Model Image 3:', product.model_image_3);
        } else {
            console.log('Product not found');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkProduct();
