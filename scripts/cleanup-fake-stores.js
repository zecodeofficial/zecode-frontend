// Delete fake stores (outside Karnataka)
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

async function cleanupFakeStores() {
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

        console.log('\nScanning for fake stores...');
        const res = await fetch('https://zecode-directus.onrender.com/items/stores?limit=-1', { headers });
        const data = await res.json();

        if (data.data) {
            // Identify fake stores: verified all real Zecode stores are in Karnataka for now.
            // Also looking for generic/dummy names.
            const fakeStores = data.data.filter(s =>
                (s.state && s.state.toLowerCase() !== 'karnataka') ||
                s.city === 'Mumbai' ||
                s.city === 'New Delhi' ||
                s.phone.includes('123456') ||
                s.phone.includes('345678')
            );

            console.log(`Found ${fakeStores.length} fake stores to delete.`);

            for (const s of fakeStores) {
                console.log(`Deleting ID ${s.id}: ${s.name} (${s.city}, ${s.state})`);
                const delRes = await fetch(`https://zecode-directus.onrender.com/items/stores/${s.id}`, {
                    method: 'DELETE',
                    headers: headers
                });

                if (delRes.ok) console.log('  ✓ Deleted');
                else console.log(`  ✗ Failed: ${delRes.status}`);
            }
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

cleanupFakeStores();
