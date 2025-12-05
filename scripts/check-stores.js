// Check stores in Directus
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

async function checkStores() {
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

        console.log('\nFetching Stores...');
        const res = await fetch('https://zecode-directus.onrender.com/items/stores', { headers });
        const data = await res.json();

        if (!res.ok) {
            console.log('Failed to fetch stores:', data);
            return;
        }

        if (data.data) {
            console.log(`Found ${data.data.length} stores in Directus.`);
            data.data.forEach(s => {
                console.log(`- ${s.name} (${s.city})`);
            });
        } else {
            console.log('No stores found or data structure mismatch.');
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkStores();
