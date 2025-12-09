const fs = require('fs');
const PRODUCTS_FILE = 'directus_products.json';

try {
    const data = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
    const products = data.data || [];

    const searchTerms = [
        'Dark Blue Graphic Print Top',
        'Purple Casual Jacket'
    ];

    console.log('Searching for products...');

    products.forEach(p => {
        searchTerms.forEach(term => {
            if (p.name && p.name.includes(term)) {
                console.log('\n--- Found Match ---');
                console.log(`ID: ${p.id}`);
                console.log(`Name: ${p.name}`);
                console.log(`Slug: ${p.slug}`);
                console.log(`Subcategory: ${p.subcategory}`);
                console.log(`Description: ${p.description ? p.description.substring(0, 50) + '...' : 'N/A'}`);
            }
        });
    });

} catch (err) {
    console.error('Error:', err);
}
