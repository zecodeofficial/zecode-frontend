// Quick diagnostic script to check Men's products in Directus
// Run with: node diagnose_mens_products.js

const axios = require('axios');

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://127.0.0.1:8055';

async function diagnoseMensProducts() {
    try {
        console.log('Fetching all Men\'s products from Directus...\n');

        const response = await axios.get(`${DIRECTUS_URL}/items/products`, {
            params: {
                limit: -1,
                fields: 'id,name,subcategory,gender_category',
                'filter[gender_category][_contains]': 'Men'
            }
        });

        const products = response.data.data || [];
        console.log(`Total Men's products found: ${products.length}\n`);

        // Group by subcategory
        const bySubcategory = {};
        products.forEach(p => {
            const sub = p.subcategory || 'NO_SUBCATEGORY';
            if (!bySubcategory[sub]) {
                bySubcategory[sub] = [];
            }
            bySubcategory[sub].push({
                id: p.id,
                name: p.name,
                gender: p.gender_category
            });
        });

        console.log('Products grouped by subcategory:\n');
        Object.keys(bySubcategory).sort().forEach(sub => {
            console.log(`\n${sub}: ${bySubcategory[sub].length} products`);
            console.log('  Sample products:');
            bySubcategory[sub].slice(0, 3).forEach(p => {
                console.log(`    - ${p.name} (gender: ${p.gender})`);
            });
        });

        // Check what would match "tshirts" based on our mapping
        console.log('\n\n=== T-SHIRTS ANALYSIS ===');
        const tshirtMappings = ['t', 'tshirt', 't-shirt', 'tshirts'];
        const normalizeSub = (s) => s ? s.toLowerCase().replace(/[^a-z0-9]/g, '') : '';

        const matchingTshirts = products.filter(p => {
            const normalized = normalizeSub(p.subcategory);
            return tshirtMappings.some(mapping => normalized === normalizeSub(mapping));
        });

        console.log(`Products matching T-shirt mappings: ${matchingTshirts.length}`);
        matchingTshirts.forEach(p => {
            console.log(`  - ${p.name} (subcategory: "${p.subcategory}", gender: ${p.gender_category})`);
        });

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

diagnoseMensProducts();
