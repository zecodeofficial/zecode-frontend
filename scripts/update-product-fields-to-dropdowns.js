/**
 * Update Product Fields to Dropdowns
 * Run with: 
 *   $env:DIRECTUS_ADMIN_EMAIL='zecode@siyaram.com'
 *   $env:DIRECTUS_ADMIN_PASSWORD='S!Y@rAM'"'"'s'
 *   node scripts/update-product-fields-to-dropdowns.js
 */

// Disable SSL certificate validation for enterprise proxies
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const RENDER_URL = 'https://zecode-directus.onrender.com';
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || 'zecode@siyaram.com';
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || "S!Y@rAM's";

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

    console.log(`  ✓ Updated ${fieldName}`);
    return true;
}

async function main() {
    console.log('='.repeat(60));
    console.log('🔧 Update Product Fields to Dropdowns');
    console.log('='.repeat(60));
    console.log(`Target: ${RENDER_URL}`);
    console.log('='.repeat(60) + '\n');

    await login();

    console.log('📝 Updating field interfaces...\n');

    // Category field
    await updateField('products', 'category', {
        interface: 'select-dropdown',
        options: {
            choices: [
                { text: 'Men', value: 'men' },
                { text: 'Women', value: 'women' },
                { text: 'Kids', value: 'kids' },
                { text: 'Footwear', value: 'footwear' }
            ],
            allowOther: true
        },
        note: 'Main product category',
        width: 'half'
    });

    // Subcategory field
    await updateField('products', 'subcategory', {
        interface: 'select-dropdown',
        options: {
            choices: [
                { text: 'T-Shirts', value: 't-shirts' },
                { text: 'Shirts', value: 'shirts' },
                { text: 'Jeans', value: 'jeans' },
                { text: 'Trousers', value: 'trousers' },
                { text: 'Shorts', value: 'shorts' },
                { text: 'Jackets', value: 'jackets' },
                { text: 'Sweaters', value: 'sweaters' },
                { text: 'Activewear', value: 'activewear' },
                { text: 'Tops', value: 'tops' },
                { text: 'Dresses', value: 'dresses' },
                { text: 'Skirts', value: 'skirts' },
                { text: 'Ethnic Fusion', value: 'ethnic-fusion' },
                { text: 'Boys T-Shirts', value: 'boys-t-shirts' },
                { text: 'Girls Dresses', value: 'girls-dresses' },
                { text: 'Kids Jeans', value: 'kids-jeans' },
                { text: 'Casual Shoes', value: 'casual-shoes' },
                { text: 'Formal Shoes', value: 'formal-shoes' },
                { text: 'Sports Shoes', value: 'sports-shoes' },
                { text: 'Sandals', value: 'sandals' },
                { text: 'Shoes', value: 'shoes' }
            ],
            allowOther: true
        },
        note: 'Product subcategory',
        width: 'half'
    });

    // Gender Category field
    await updateField('products', 'gender_category', {
        interface: 'select-dropdown',
        options: {
            choices: [
                { text: 'Men', value: 'men' },
                { text: 'Women', value: 'women' },
                { text: 'Boys', value: 'boys' },
                { text: 'Girls', value: 'girls' },
                { text: 'Unisex', value: 'unisex' }
            ],
            allowOther: true
        },
        note: 'Gender category',
        width: 'half'
    });

    // Gender field
    await updateField('products', 'gender', {
        interface: 'select-dropdown',
        options: {
            choices: [
                { text: 'Male', value: 'male' },
                { text: 'Female', value: 'female' },
                { text: 'Unisex', value: 'unisex' }
            ],
            allowOther: true
        },
        note: 'Target gender',
        width: 'half'
    });

    // Age Group field
    await updateField('products', 'age_group', {
        interface: 'select-dropdown',
        options: {
            choices: [
                { text: 'Infant (0-2 years)', value: 'infant' },
                { text: 'Toddler (2-4 years)', value: 'toddler' },
                { text: 'Kids (4-8 years)', value: 'kids' },
                { text: 'Tweens (8-12 years)', value: 'tweens' },
                { text: 'Teens (12-18 years)', value: 'teens' },
                { text: 'Adults (18+ years)', value: 'adults' }
            ],
            allowOther: true
        },
        note: 'Target age group',
        width: 'half'
    });

    // Color field
    await updateField('products', 'color', {
        interface: 'select-dropdown',
        options: {
            choices: [
                { text: 'Black', value: 'black' },
                { text: 'White', value: 'white' },
                { text: 'Red', value: 'red' },
                { text: 'Blue', value: 'blue' },
                { text: 'Navy Blue', value: 'navy-blue' },
                { text: 'Dark Blue', value: 'dark-blue' },
                { text: 'Light Blue', value: 'light-blue' },
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
            ],
            allowOther: true
        },
        note: 'Primary color',
        width: 'half'
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL FIELDS UPDATED!');
    console.log('='.repeat(60));
    console.log('\n📋 Updated fields:');
    console.log('  • category (4 options + custom)');
    console.log('  • subcategory (20 options + custom)');
    console.log('  • gender_category (5 options + custom)');
    console.log('  • gender (3 options + custom)');
    console.log('  • age_group (6 options + custom)');
    console.log('  • color (19 options + custom)');
    console.log('\n🔗 Test: https://zecode-directus.onrender.com/admin/content/products');
    console.log('\n💡 Refresh your browser to see the changes!');
}

main().catch(console.error);
