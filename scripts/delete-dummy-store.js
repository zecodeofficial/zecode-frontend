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

async function deleteDummyStore() {
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

        console.log('Deleting Store ID 29...');
        const res = await fetch('https://zecode-directus.onrender.com/items/stores/29', {
            method: 'DELETE',
            headers
        });

        if (res.status === 204) {
            console.log('Success: Store 29 deleted.');
        } else {
            console.log('Failed:', res.status, await res.text());
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

deleteDummyStore();
