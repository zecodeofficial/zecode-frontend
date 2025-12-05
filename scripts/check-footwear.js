// Check footwear products in Directus
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

async function checkFootwearProducts() {
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

        // Check men's footwear
        console.log('\nFetching Men products...');
        const menRes = await fetch('https://zecode-directus.onrender.com/items/products?filter[gender_category][_eq]=Men&fields=id,name,gender_category,subcategory,category&limit=20', { headers });
        const menData = await menRes.json();

        console.log('=== MEN PRODUCTS ===');
        console.log(`Total: ${menData.data?.length || 0}`);
        if (menData.data) {
            menData.data.forEach(p => {
                console.log(`  ${p.id}: ${p.name}`);
                console.log(`    gender: ${p.gender_category}, subcat: ${p.subcategory}, cat: ${p.category}`);
            });
        }

        // Check potential men's footwear by name
        console.log('\nSearching for potential Men\'s Footwear by keywords...');
        const keywords = ['Sneaker', 'Boot', 'Loafer', 'Sandal', 'Shoe'];

        for (const keyword of keywords) {
            const res = await fetch(`https://zecode-directus.onrender.com/items/products?filter[name][_contains]=${keyword}&fields=id,name,gender_category,subcategory,category&limit=10`, { headers });
            const data = await res.json();

            if (data.data && data.data.length > 0) {
                console.log(`\nFound products matching "${keyword}":`);
                data.data.forEach(p => {
                    console.log(`  ${p.id}: ${p.name}`);
                    console.log(`    gender: ${p.gender_category}, subcat: ${p.subcategory}, cat: ${p.category}`);
                });
            }
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkFootwearProducts();
