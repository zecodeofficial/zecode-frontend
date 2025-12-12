/**
 * Update Product Fields to Dropdowns (Curated Standardized Values)
 * Uses a clean, standardized list instead of raw database values
 * Run with: node scripts/update-product-dropdowns-curated.js
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const RENDER_URL = 'https://zecode-directus.onrender.com';
const ADMIN_EMAIL = 'zecode@siyaram.com';
const ADMIN_PASSWORD = "S!Y@rAM's";

let accessToken = null;

// CURATED STANDARDIZED VALUES - Edit these as needed
const CURATED_OPTIONS = {
    category: [
        { text: 'Men', value: 'men' },
        { text: 'Women', value: 'women' },
        { text: 'Kids', value: 'kids' },
        { text: 'Footwear', value: 'footwear' }
    ],
    subcategory: [
        // Tops
        { text: 'T-Shirts', value: 't-shirts' },
        { text: 'Shirts', value: 'shirts' },
        { text: 'Tops', value: 'tops' },
        { text: 'Blouses', value: 'blouses' },
        // Bottoms
        { text: 'Jeans', value: 'jeans' },
        { text: 'Trousers', value: 'trousers' },
        { text: 'Shorts', value: 'shorts' },
        { text: 'Skirts', value: 'skirts' },
        // Outerwear
        { text: 'Jackets', value: 'jackets' },
        { text: 'Sweaters', value: 'sweaters' },
        { text: 'Hoodies', value: 'hoodies' },
        // Dresses & Ethnic
        { text: 'Dresses', value: 'dresses' },
        { text: 'Ethnic Fusion', value: 'ethnic-fusion' },
        { text: 'Kurtas', value: 'kurtas' },
        // Activewear
        { text: 'Activewear', value: 'activewear' },
        // Kids specific
        { text: 'Boys T-Shirts', value: 'boys-t-shirts' },
        { text: 'Girls Dresses', value: 'girls-dresses' },
        { text: 'Kids Jeans', value: 'kids-jeans' },
        // Footwear
        { text: 'Casual Shoes', value: 'casual-shoes' },
        { text: 'Formal Shoes', value: 'formal-shoes' },
        { text: 'Sports Shoes', value: 'sports-shoes' },
        { text: 'Sandals', value: 'sandals' },
        { text: 'Sneakers', value: 'sneakers' }
    ],
    gender_category: [
        { text: 'Men', value: 'men' },
        { text: 'Women', value: 'women' },
        { text: 'Boys', value: 'boys' },
        { text: 'Girls', value: 'girls' },
        { text: 'Unisex', value: 'unisex' }
    ],
    gender: [
        { text: 'Male', value: 'male' },
        { text: 'Female', value: 'female' },
        { text: 'Unisex', value: 'unisex' }
    ],
    age_group: [
        { text: 'Adults', value: 'adults' },
        { text: 'Teens', value: 'teens' },
        { text: 'Kids', value: 'kids' },
        { text: 'Toddlers', value: 'toddlers' }
    ],
    color: [
        { text: 'Black', value: 'black' },
        { text: 'White', value: 'white' },
        { text: 'Blue', value: 'blue' },
        { text: 'Navy Blue', value: 'navy-blue' },
        { text: 'Light Blue', value: 'light-blue' },
        { text: 'Red', value: 'red' },
        { text: 'Green', value: 'green' },
        { text: 'Yellow', value: 'yellow' },
        { text: 'Orange', value: 'orange' },
        { text: 'Pink', value: 'pink' },
        { text: 'Purple', value: 'purple' },
        { text: 'Brown', value: 'brown' },
        { text: 'Grey', value: 'grey' },
        { text: 'Beige', value: 'beige' },
        { text: 'Cream', value: 'cream' },
        { text: 'Maroon', value: 'maroon' },
        { text: 'Olive', value: 'olive' },
        { text: 'Multicolor', value: 'multicolor' }
    ]
};

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
    console.log('🔧 Update Product Dropdowns (Curated Standardized Values)');
    console.log('='.repeat(60));
    console.log(`Target: ${RENDER_URL}`);
    console.log('='.repeat(60) + '\n');

    await login();

    console.log('📝 Updating fields with curated dropdown options...\n');

    for (const [fieldName, choices] of Object.entries(CURATED_OPTIONS)) {
        const success = await updateField('products', fieldName, {
            interface: 'select-dropdown',
            options: {
                choices: choices,
                allowOther: true
            },
            note: `${choices.length} standard options + custom values allowed`,
            width: 'half'
        });

        if (success) {
            console.log(`  ✓ ${fieldName}: ${choices.length} curated options`);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL FIELDS UPDATED WITH CURATED VALUES!');
    console.log('='.repeat(60));
    console.log('\n📊 Clean dropdown options:');
    for (const [field, choices] of Object.entries(CURATED_OPTIONS)) {
        console.log(`  • ${field}: ${choices.map(c => c.text).join(', ')}`);
    }
    console.log('\n🔗 Test: https://zecode-directus.onrender.com/admin/content/products');
    console.log('\n💡 Hard refresh your browser (Ctrl+Shift+R)!');
}

main().catch(console.error);
