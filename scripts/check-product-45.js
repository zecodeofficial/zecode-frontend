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

        const res = await axios.get(`${DIRECTUS_URL}/items/products/45`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Product ID 45:');
        console.log('  Name:', res.data.data.name);
        console.log('  Subcategory:', res.data.data.subcategory);
        console.log('  Gender:', res.data.data.gender_category);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkProduct();
