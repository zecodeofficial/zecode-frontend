// Clear model images from identified Kids products
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

async function clearKidsImages() {
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

        const productIds = [128, 129, 130, 135, 136, 145, 146, 161, 181, 182, 188, 189, 193, 196, 224, 234];
        console.log(`\nClearing images for ${productIds.length} products...`);

        for (const id of productIds) {
            console.log(`Processing ID: ${id}...`);
            const res = await fetch(`https://zecode-directus.onrender.com/items/products/${id}`, {
                method: 'PATCH',
                headers: headers,
                body: JSON.stringify({
                    model_image_1: null,
                    model_image_2: null,
                    model_image_3: null
                })
            });

            if (res.ok) {
                console.log(`  ✓ Cleared ID ${id}`);
            } else {
                console.log(`  ✗ Failed ID ${id}: ${res.status}`);
            }
        }

        console.log('\nDone!');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

clearKidsImages();
