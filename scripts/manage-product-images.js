const axios = require('axios');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function authenticate() {
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

async function findProduct(token, searchTerm) {
    try {
        const response = await axios.get(`${DIRECTUS_URL}/items/products`, {
            params: {
                'filter[_or][0][name][_contains]': searchTerm,
                'filter[_or][1][slug][_contains]': searchTerm,
                'filter[_or][2][id][_eq]': searchTerm,
                limit: 10
            },
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data.data;
    } catch (error) {
        console.error('Search failed:', error.message);
        return [];
    }
}

async function getProduct(token, id) {
    try {
        const response = await axios.get(`${DIRECTUS_URL}/items/products/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data.data;
    } catch (error) {
        console.error('Failed to get product:', error.message);
        return null;
    }
}

async function updateProductImages(token, id, images) {
    try {
        const response = await axios.patch(
            `${DIRECTUS_URL}/items/products/${id}`,
            images,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('\n✅ Product images updated successfully!');
        return true;
    } catch (error) {
        console.error('❌ Update failed:', error.response?.data?.errors || error.message);
        return false;
    }
}

async function main() {
    console.log('='.repeat(60));
    console.log('MANUAL PRODUCT IMAGE MANAGEMENT TOOL');
    console.log('='.repeat(60));
    console.log('This tool allows you to manually assign images to products.\n');

    const token = await authenticate();
    console.log('✅ Authenticated successfully\n');

    while (true) {
        const searchTerm = await question('\nEnter product name, slug, or ID (or "exit" to quit): ');

        if (searchTerm.toLowerCase() === 'exit') {
            console.log('\nGoodbye!');
            rl.close();
            process.exit(0);
        }

        const products = await findProduct(token, searchTerm);

        if (products.length === 0) {
            console.log('❌ No products found. Try a different search term.');
            continue;
        }

        console.log('\n📦 Found products:');
        products.forEach((p, index) => {
            console.log(`${index + 1}. [ID: ${p.id}] ${p.name} (${p.slug})`);
        });

        const choice = await question('\nSelect product number (or 0 to search again): ');
        const productIndex = parseInt(choice) - 1;

        if (productIndex < 0 || productIndex >= products.length) {
            continue;
        }

        const product = await getProduct(token, products[productIndex].id);

        console.log('\n' + '='.repeat(60));
        console.log('PRODUCT DETAILS');
        console.log('='.repeat(60));
        console.log(`ID: ${product.id}`);
        console.log(`Name: ${product.name}`);
        console.log(`Slug: ${product.slug}`);
        console.log('\nCURRENT IMAGES:');
        console.log(`Main Image: ${product.image_url || product.image || '(none)'}`);
        console.log(`Model Image 1: ${product.model_image_1 || '(none)'}`);
        console.log(`Model Image 2: ${product.model_image_2 || '(none)'}`);
        console.log(`Model Image 3: ${product.model_image_3 || '(none)'}`);
        console.log('='.repeat(60));

        const action = await question('\nWhat would you like to do?\n1. Update images\n2. Clear model images\n3. Back to search\nChoice: ');

        if (action === '1') {
            console.log('\nEnter new image URLs (press Enter to keep current value):');

            const newMainImage = await question(`Main Image [${product.image_url || product.image || 'none'}]: `);
            const newModel1 = await question(`Model Image 1 [${product.model_image_1 || 'none'}]: `);
            const newModel2 = await question(`Model Image 2 [${product.model_image_2 || 'none'}]: `);
            const newModel3 = await question(`Model Image 3 [${product.model_image_3 || 'none'}]: `);

            const updates = {};
            if (newMainImage.trim()) updates.image_url = newMainImage.trim();
            if (newModel1.trim()) updates.model_image_1 = newModel1.trim();
            if (newModel2.trim()) updates.model_image_2 = newModel2.trim();
            if (newModel3.trim()) updates.model_image_3 = newModel3.trim();

            if (Object.keys(updates).length > 0) {
                const confirm = await question('\n⚠️  Confirm update? (yes/no): ');
                if (confirm.toLowerCase() === 'yes') {
                    await updateProductImages(token, product.id, updates);
                } else {
                    console.log('❌ Update cancelled');
                }
            } else {
                console.log('ℹ️  No changes made');
            }
        } else if (action === '2') {
            const confirm = await question('\n⚠️  Clear all model images? (yes/no): ');
            if (confirm.toLowerCase() === 'yes') {
                await updateProductImages(token, product.id, {
                    model_image_1: null,
                    model_image_2: null,
                    model_image_3: null
                });
            } else {
                console.log('❌ Cancelled');
            }
        }
    }
}

main().catch(console.error);
