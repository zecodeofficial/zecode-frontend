const fs = require('fs');

try {
    const data = JSON.parse(fs.readFileSync('directus_products.json', 'utf8'));
    const products = data.data || [];

    const activewearSubs = ['Activewear', 'Hoodie', 'Joggers', 'Sweatpants', 'Tracksuit'];
    // Assuming gender filtering happens in frontend, but let's see what's in the data.
    // Usually gender is in `gender_category` or inferred.

    const matches = products.filter(p =>
        activewearSubs.some(sub =>
            (p.subcategory && p.subcategory.toLowerCase() === sub.toLowerCase())
        )
    );

    console.log(`Found ${matches.length} potential Activewear products:`);
    matches.forEach(p => {
        console.log(`[${p.id}] ${p.name} - Sub: ${p.subcategory} - Gender: ${p.gender_category || 'N/A'}`);
    });

} catch (err) {
    console.error(err);
}
