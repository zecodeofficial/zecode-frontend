// Comprehensive cleanup for ALL Kids products
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

async function comprehensiveCleanup() {
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
        const headers = {
            'Authorization': 'Bearer ' + access_token,
            'Content-Type': 'application/json'
        };

        console.log('\nFetching ALL Kids products (limit=-1)...');

        // Use limit=-1 to fetch all items
        const res = await fetch('https://zecode-directus.onrender.com/items/products?filter[gender_category][_eq]=Kids&limit=-1', { headers });
        const data = await res.json();

        if (data.data) {
            const productsWithImages = data.data.filter(p =>
                p.model_image_1 || p.model_image_2 || p.model_image_3
            );

            console.log(`Found ${productsWithImages.length} products with model images out of ${data.data.length} total Kids products.`);

            if (productsWithImages.length > 0) {
                console.log('Starting cleanup...');
                for (const p of productsWithImages) {
                    console.log(`Clearing ID: ${p.id} (${p.name})...`);
                    const updateRes = await fetch(`https://zecode-directus.onrender.com/items/products/${p.id}`, {
                        method: 'PATCH',
                        headers: headers,
                        body: JSON.stringify({
                            model_image_1: null,
                            model_image_2: null,
                            model_image_3: null
                        })
                    });

                    if (updateRes.ok) console.log(`  ✓ Done`);
                    else console.log(`  ✗ Failed: ${updateRes.status}`);
                }
            } else {
                console.log('No products with model images found! All clean.');
            }
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

comprehensiveCleanup();
