const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Load environment variables manually from .env.local
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
        console.log('Loaded .env.local');
    }
} catch (e) {
    console.log('Could not load .env.local', e);
}

// Configuration
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://127.0.0.1:8055';
const DIRECTUS_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || process.env.DIRECTUS_EMAIL;
const DIRECTUS_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || process.env.DIRECTUS_PASSWORD;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

// Product Details
const TARGET_SLUG = 'womens-purple-casual-jacket';
const NEW_SUBCATEGORY = 'activewear';

async function authenticate() {
    if (DIRECTUS_TOKEN) return DIRECTUS_TOKEN;

    try {
        const response = await axios.post(`${DIRECTUS_URL}/auth/login`, {
            email: DIRECTUS_EMAIL,
            password: DIRECTUS_PASSWORD,
        });
        return response.data.data.access_token;
    } catch (error) {
        console.error('Authentication failed:', error.message);
        process.exit(1);
    }
}

async function findProduct(token) {
    try {
        const response = await axios.get(`${DIRECTUS_URL}/items/products`, {
            params: {
                'filter[slug][_eq]': TARGET_SLUG
            },
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data.data[0];
    } catch (error) {
        console.error('Search failed:', error.message);
        return null;
    }
}

async function updateProduct(token, id) {
    try {
        const response = await axios.patch(
            `${DIRECTUS_URL}/items/products/${id}`,
            { subcategory: NEW_SUBCATEGORY },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Update successful!');
        console.log(`Product ID: ${response.data.data.id}`);
        console.log(`Name: ${response.data.data.name}`);
        console.log(`Subcategory: ${response.data.data.subcategory}`);
        return true;
    } catch (error) {
        console.error('Update failed:', error.response?.data?.errors || error.message);
        return false;
    }
}

async function main() {
    console.log('Moving purple jacket to activewear category...\n');
    const token = await authenticate();

    console.log(`Searching for product: ${TARGET_SLUG}`);
    const product = await findProduct(token);

    if (!product) {
        console.error('Product not found!');
        return;
    }

    console.log(`\nFound product:`);
    console.log(`  ID: ${product.id}`);
    console.log(`  Name: ${product.name}`);
    console.log(`  Current subcategory: ${product.subcategory}`);
    console.log(`\nUpdating subcategory to: ${NEW_SUBCATEGORY}\n`);

    await updateProduct(token, product.id);
}

main();
