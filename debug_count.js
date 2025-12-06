
const fetch = require('node-fetch'); // Or use native fetch if Node 18+
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const API_URL = "https://zecode-frontend.vercel.app/api/directus/items/products?filter[gender_category][_istarts_with]=men&limit=-1";

// COPY OF UTILS
const MEN_SUB_MAP = {
    'tshirts': ['T', 'T-Shirt', 'Classic T-Shirt'],
    'shirts': ['Shirt', 'Casual Shirt', 'Button-Up Shirt', 'Short Sleeve Shirt'],
    'jeans': ['Jeans', 'Slim Jeans'],
    'trousers': 'Trousers',
    'jackets': ['Jacket', 'Casual Jacket', 'Denim Jacket', 'Varsity Jacket'],
    'shoes': 'Footwear',
};

function isStrictMatch(product, category, slug) {
    // 1. Gender/Category Check (Simulating what might happen, though API filters it)
    // const pCat = (product.category || "").toLowerCase();
    // const pGender = (product.gender_category || "").toLowerCase();

    // 2. Subcategory Check
    const pSub = product.subcategory;
    if (!pSub) return false;

    let map = {};
    if (category === 'men') map = MEN_SUB_MAP;

    const validValues = map[slug];
    if (!validValues) {
        // console.log(`No valid values for slug: ${slug}`);
        return false;
    }

    // Normalize product subcategories to an array of lowercase strings
    const pSubArray = (Array.isArray(pSub) ? pSub : [pSub])
        .filter(Boolean)
        .map((s) => s.toLowerCase().trim());

    // Normalize valid map values to an array of lowercase strings
    const validArray = (Array.isArray(validValues) ? validValues : [validValues])
        .map(s => s.toLowerCase().trim());

    // Check for intersection: Does element in pSubArray exist in validArray?
    const isMatch = pSubArray.some(sub => validArray.includes(sub));

    return isMatch;
}

async function run() {
    console.log("Fetching products from:", API_URL);
    try {
        const res = await fetch(API_URL);
        const json = await res.json();
        const products = json.data;
        console.log(`Fetched ${products.length} products total.`);

        // Count T-Shirts
        const tshirts = products.filter(p => isStrictMatch(p, 'men', 'tshirts'));
        console.log(`\nMatched T-SHIRTS: ${tshirts.length}`);
        tshirts.forEach(p => console.log(` - [${p.id}] ${p.name} (${p.subcategory})`));

        // Count Shirts
        const shirts = products.filter(p => isStrictMatch(p, 'men', 'shirts'));
        console.log(`\nMatched SHIRTS: ${shirts.length}`);

        // Count Trousers
        const trousers = products.filter(p => isStrictMatch(p, 'men', 'trousers'));
        console.log(`\nMatched TROUSERS: ${trousers.length}`);

        // Debug failed ones?
        console.log("\nChecking for near-misses (T-Shirt vs tshirts):");
        products.forEach(p => {
            const sub = (p.subcategory || "").toLowerCase();
            if (sub.includes('shirt') && !isStrictMatch(p, 'men', 'tshirts') && !isStrictMatch(p, 'men', 'shirts')) {
                console.log(` [MISS] ID ${p.id}: ${p.name}, Sub: '${p.subcategory}'`);
            }
        });

    } catch (e) {
        console.error("Error:", e);
    }
}

run();
