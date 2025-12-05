// Remove incorrect model images from specific product
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

async function fixProductImage() {
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

        const productId = 79; // From previous check
        console.log(`\nUpdating product ID ${productId}...`);

        const res = await fetch(`https://zecode-directus.onrender.com/items/products/${productId}`, {
            method: 'PATCH',
            headers: headers,
            body: JSON.stringify({
                model_image_1: null,
                model_image_2: null,
                model_image_3: null
            })
        });

        const data = await res.json();

        if (data.data) {
            console.log('Success! Cleared model images.');
            console.log(`ID: ${data.data.id}`);
            console.log(`Model Image 1: ${data.data.model_image_1}`);
        } else {
            console.log('Failed to update product.');
            console.log(data);
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

fixProductImage();
