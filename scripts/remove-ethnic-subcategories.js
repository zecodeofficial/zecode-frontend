/**
 * Remove Sub-categories from Ethnic Fusion Products
 * This script fetches all products in the "Ethnic Fusion" category
 * and removes their subcategory values, consolidating them under the main category
 */

// Bypass SSL certificate validation for self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const fs = require('fs');
const path = require('path');

// Read environment variables
const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
});

const DIRECTUS_URL = 'https://zecode-directus.onrender.com';

async function removeEthnicFusionSubcategories() {
    try {
        // Step 1: Authenticate
        console.log('🔐 Authenticating with Directus...');
        const authRes = await fetch(DIRECTUS_URL + '/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'zecode@siyaram.com',
                password: env.DIRECTUS_ADMIN_PASSWORD
            })
        });

        if (!authRes.ok) {
            throw new Error('Authentication failed: ' + await authRes.text());
        }

        const authData = await authRes.json();
        const token = authData.data.access_token;
        console.log('✅ Authenticated successfully\n');

        // Step 2: Fetch all Ethnic Fusion products
        console.log('📥 Fetching Ethnic Fusion products...');
        const productsRes = await fetch(
            `${DIRECTUS_URL}/items/products?filter[category][_eq]=Ethnic Fusion&fields=id,name,category,subcategory`,
            {
                headers: { 'Authorization': 'Bearer ' + token }
            }
        );

        if (!productsRes.ok) {
            throw new Error('Failed to fetch products: ' + await productsRes.text());
        }

        const productsData = await productsRes.json();
        const products = productsData.data;

        console.log(`✅ Found ${products.length} Ethnic Fusion products\n`);

        // Display current state
        console.log('📊 Current Sub-categories:');
        const subcategories = {};
        products.forEach(p => {
            if (p.subcategory) {
                subcategories[p.subcategory] = (subcategories[p.subcategory] || 0) + 1;
            }
        });

        Object.entries(subcategories).forEach(([subcat, count]) => {
            console.log(`   - ${subcat}: ${count} product(s)`);
        });
        console.log('');

        // Step 3: Update each product to remove subcategory
        console.log('🔄 Removing sub-categories...\n');
        let successCount = 0;
        let errorCount = 0;

        for (const product of products) {
            if (!product.subcategory) {
                console.log(`⏭️  Product ${product.id} (${product.name}) - Already has no subcategory`);
                successCount++;
                continue;
            }

            console.log(`📝 Updating product ${product.id}: ${product.name}`);
            console.log(`   Current subcategory: "${product.subcategory}" → Removing...`);

            const updateRes = await fetch(`${DIRECTUS_URL}/items/products/${product.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subcategory: null  // Remove the subcategory
                })
            });

            if (updateRes.ok) {
                console.log(`   ✅ Successfully removed subcategory\n`);
                successCount++;
            } else {
                const errorText = await updateRes.text();
                console.error(`   ❌ Failed: ${errorText}\n`);
                errorCount++;
            }
        }

        // Summary
        console.log('\n' + '='.repeat(50));
        console.log('📊 SUMMARY');
        console.log('='.repeat(50));
        console.log(`Total products processed: ${products.length}`);
        console.log(`✅ Successfully updated: ${successCount}`);
        console.log(`❌ Errors: ${errorCount}`);
        console.log('='.repeat(50));
        console.log('\n✨ All Ethnic Fusion products are now consolidated under the main category!');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        process.exit(1);
    }
}

// Run the script
removeEthnicFusionSubcategories().catch(console.error);
