// Check missed product data
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

async function checkMissedProduct() {
    try {
        console.log('Authenticating...');
        const authRes = await fetch('https://zecode-directus.onrender.com/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'zecode@siyaram.com',
                password: env.DIRECTUS_ADMIN_PASSWORD
            })
        });

        if (!authRes.ok) throw new Error('Auth failed');
        const { data: { access_token } } = await authRes.json();
        const headers = { 'Authorization': 'Bearer ' + access_token };

        const slug = 'boys-green-graphic-print-t-shirt';
        console.log(`\nFetching product: ${slug}...`);

        const res = await fetch(`https://zecode-directus.onrender.com/items/products?filter[slug][_eq]=${slug}`, { headers });
        const data = await res.json();

        if (data.data && data.data.length > 0) {
            const p = data.data[0];
            console.log('Product Found:');
            console.log(`ID: ${p.id}`);
            console.log(`Name: ${p.name}`);
            console.log(`Category: ${p.category}`);
            console.log(`Subcategory: ${p.subcategory}`);
            console.log(`Gender: ${p.gender_category}`); // Crucial check
            console.log(`Images: ${p.model_image_1 ? 'Yes' : 'No'}`);
        } else {
            console.log('Product not found.');
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkMissedProduct();
