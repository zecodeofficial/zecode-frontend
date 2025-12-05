// Find Kids products with model images
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

async function findKidsWithImages() {
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

        console.log('\nSearching for Kids products with model images...');

        // Filter for Kids category (or gender)
        // Accessing more products to ensure we cover everything
        const res = await fetch('https://zecode-directus.onrender.com/items/products?filter[gender_category][_eq]=Kids&limit=100', { headers });
        const data = await res.json();

        if (data.data) {
            const productsWithImages = data.data.filter(p =>
                p.model_image_1 || p.model_image_2 || p.model_image_3
            );

            console.log(`Found ${productsWithImages.length} products with model images out of ${data.data.length} Kids products.`);

            productsWithImages.forEach(p => {
                console.log(`\nID: ${p.id} | Name: ${p.name}`);
                if (p.model_image_1) console.log(`  Img1: ${p.model_image_1}`);
                if (p.model_image_2) console.log(`  Img2: ${p.model_image_2}`);
                if (p.model_image_3) console.log(`  Img3: ${p.model_image_3}`);
            });
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

findKidsWithImages();
