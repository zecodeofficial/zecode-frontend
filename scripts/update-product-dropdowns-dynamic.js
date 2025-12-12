/**
 * Update Product Fields to Dropdowns (Dynamic - from existing data)
 * This script fetches unique values from existing products and creates dropdowns
 * Run with: node scripts/update-product-dropdowns-dynamic.js
 */

// Disable SSL certificate validation
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const RENDER_URL = 'https://zecode-directus.onrender.com';
const ADMIN_EMAIL = 'zecode@siyaram.com';
const ADMIN_PASSWORD = "S!Y@rAM's";

let accessToken = null;

async function login() {
    console.log('🔐 Logging in to Directus...');
    const res = await fetch(`${RENDER_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });

    if (!res.ok) {
        throw new Error(`Login failed: ${await res.text()}`);
    }

    const data = await res.json();
    accessToken = data.data.access_token;
    console.log('✓ Logged in successfully\n');
}

async function fetchProducts() {
    console.log('📦 Fetching all products...');
    const res = await fetch(`${RENDER_URL}/items/products?limit=-1`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch products: ${await res.text()}`);
    }

    const data = await res.json();
    console.log(`✓ Found ${data.data.length} products\n`);
    return data.data;
}

function getUniqueValues(products, field) {
    const values = products
        .map(p => p[field])
        .filter(v => v && v.trim())
        .map(v => v.trim());

    return [...new Set(values)].sort();
}

function createChoices(values) {
    return values.map(value => ({
        text: value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' '),
        value: value
    }));
}

async function updateField(collection, fieldName, fieldMeta) {
    const res = await fetch(`${RENDER_URL}/fields/${collection}/${fieldName}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ meta: fieldMeta }),
    });

    if (!res.ok) {
        const error = await res.text();
        console.error(`  ✗ Failed to update ${fieldName}:`, error);
        return false;
    }

    return true;
}

async function main() {
    console.log('='.repeat(60));
    console.log('🔧 Update Product Fields to Dropdowns (Dynamic)');
    console.log('='.repeat(60));
    console.log(`Target: ${RENDER_URL}`);
    console.log('='.repeat(60) + '\n');

    await login();

    // Fetch all products
    const products = await fetchProducts();

    console.log('🔍 Analyzing existing data...\n');

    // Extract unique values for each field
    const fields = {
        category: getUniqueValues(products, 'category'),
        subcategory: getUniqueValues(products, 'subcategory'),
        gender_category: getUniqueValues(products, 'gender_category'),
        gender: getUniqueValues(products, 'gender'),
        age_group: getUniqueValues(products, 'age_group'),
        color: getUniqueValues(products, 'color')
    };

    // Display what was found
    for (const [field, values] of Object.entries(fields)) {
        console.log(`  ${field}: ${values.length} unique values`);
        console.log(`    → ${values.join(', ')}`);
    }

    console.log('\n📝 Updating field interfaces...\n');

    // Update each field
    for (const [fieldName, values] of Object.entries(fields)) {
        const choices = createChoices(values);

        const success = await updateField('products', fieldName, {
            interface: 'select-dropdown',
            options: {
                choices: choices,
                allowOther: true
            },
            note: `${fieldName.replace('_', ' ')} (${values.length} existing values + custom)`,
            width: 'half'
        });

        if (success) {
            console.log(`  ✓ Updated ${fieldName} (${values.length} options)`);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL FIELDS UPDATED WITH EXISTING DATA!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    for (const [field, values] of Object.entries(fields)) {
        console.log(`  • ${field}: ${values.length} options + custom values allowed`);
    }
    console.log('\n🔗 Test: https://zecode-directus.onrender.com/admin/content/products');
    console.log('\n💡 Refresh your browser (Ctrl+Shift+R) to see the changes!');
}

main().catch(console.error);
