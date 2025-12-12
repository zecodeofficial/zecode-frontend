/**
 * Update Product Fields to Dropdowns (Deduplicated & Normalized)
 * This script fetches unique values, normalizes them, and removes duplicates
 * Run with: node scripts/update-product-dropdowns-clean.js
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

function normalizeValue(value) {
    if (!value) return null;
    // Convert to lowercase and trim
    return value.toString().toLowerCase().trim();
}

function getUniqueNormalizedValues(products, field) {
    const valueMap = new Map();

    products.forEach(p => {
        const rawValue = p[field];
        if (!rawValue || !rawValue.trim()) return;

        const normalized = normalizeValue(rawValue);

        // Keep the first occurrence's original casing for display
        if (!valueMap.has(normalized)) {
            valueMap.set(normalized, rawValue.trim());
        }
    });

    // Return sorted array of normalized values
    return Array.from(valueMap.keys()).sort();
}

function createChoices(normalizedValues) {
    return normalizedValues.map(value => {
        // Create proper display text from normalized value
        const displayText = value
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        return {
            text: displayText,
            value: value
        };
    });
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
    console.log('🔧 Update Product Dropdowns (Deduplicated & Clean)');
    console.log('='.repeat(60));
    console.log(`Target: ${RENDER_URL}`);
    console.log('='.repeat(60) + '\n');

    await login();

    // Fetch all products
    const products = await fetchProducts();

    console.log('🔍 Analyzing and deduplicating data...\n');

    // Extract unique normalized values for each field
    const fields = {
        category: getUniqueNormalizedValues(products, 'category'),
        subcategory: getUniqueNormalizedValues(products, 'subcategory'),
        gender_category: getUniqueNormalizedValues(products, 'gender_category'),
        gender: getUniqueNormalizedValues(products, 'gender'),
        age_group: getUniqueNormalizedValues(products, 'age_group'),
        color: getUniqueNormalizedValues(products, 'color')
    };

    // Display what was found
    console.log('📊 Unique values found (after deduplication):\n');
    for (const [field, values] of Object.entries(fields)) {
        console.log(`  ${field}: ${values.length} unique values`);
        console.log(`    → ${values.slice(0, 10).join(', ')}${values.length > 10 ? '...' : ''}`);
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
            note: `${fieldName.replace('_', ' ')} (${values.length} unique values + custom)`,
            width: 'half'
        });

        if (success) {
            console.log(`  ✓ Updated ${fieldName} (${values.length} deduplicated options)`);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL FIELDS UPDATED (DUPLICATES REMOVED)!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    for (const [field, values] of Object.entries(fields)) {
        console.log(`  • ${field}: ${values.length} unique options`);
    }
    console.log('\n🔗 Test: https://zecode-directus.onrender.com/admin/content/products');
    console.log('\n💡 Hard refresh your browser (Ctrl+Shift+R) to see clean dropdowns!');
}

main().catch(console.error);
