/**
 * Product Improvement Script
 * 
 * This script improves product names, slugs, and generates 500-character descriptions
 * based on available product metadata.
 * 
 * Run with: node improve-products.js
 */

const fs = require('fs');
const path = require('path');

// Load environment
const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const DIRECTUS_URL = 'https://zecode-directus.onrender.com';

// Description templates by category/subcategory
const descriptionTemplates = {
  'T-Shirt': (p) => `Elevate your everyday style with this ${p.color.toLowerCase()} ${p.gender === 'Male' ? "men's" : p.gender === 'Female' ? "women's" : "kids'"} t-shirt${p.pattern ? ` featuring a ${p.pattern} design` : ''}. Crafted for ${p.style || 'casual'} wear, this versatile piece combines comfort with contemporary fashion. The premium fabric ensures all-day comfort while maintaining its shape wash after wash. Perfect for pairing with jeans, shorts, or layering under jackets. A wardrobe essential that transitions seamlessly from weekend outings to relaxed gatherings.`,
  
  'Shirt': (p) => `Make a statement with this sophisticated ${p.color.toLowerCase()} ${p.gender === 'Male' ? "men's" : "women's"} shirt${p.pattern ? ` showcasing a ${p.pattern} pattern` : ''}. Designed for the modern ${p.style || 'casual'} lifestyle, this shirt offers a refined silhouette that works for both professional and relaxed settings. The breathable fabric keeps you comfortable throughout the day, while thoughtful tailoring ensures a flattering fit. Pair with trousers for a polished look or dress down with jeans for weekend style.`,
  
  'Dress': (p) => `Turn heads in this stunning ${p.color.toLowerCase()} ${p.gender === 'Female' ? "women's" : "girls'"} dress${p.pattern ? ` adorned with a ${p.pattern} design` : ''}. Perfect for ${p.style || 'casual'} occasions, this dress combines elegance with comfort. The flattering cut accentuates your silhouette while the quality fabric drapes beautifully. Whether you're attending a brunch, a special event, or a casual outing, this versatile piece ensures you look effortlessly chic. Complete the look with your favorite accessories for a memorable ensemble.`,
  
  'Hoodie': (p) => `Stay cozy and stylish with this ${p.color.toLowerCase()} ${p.gender === 'Male' ? "men's" : p.gender === 'Female' ? "women's" : "kids'"} hoodie${p.pattern ? ` featuring a ${p.pattern} design` : ''}. Built for ${p.style || 'casual'} comfort, this hoodie combines warmth with contemporary street style. The soft fleece interior provides exceptional comfort while the durable construction ensures long-lasting wear. Perfect for layering on cool days or wearing solo during relaxed moments. A must-have addition to your ${p.style || 'casual'} wardrobe.`,
  
  'Jeans': (p) => `Discover your perfect fit with these ${p.color.toLowerCase()} ${p.gender === 'Male' ? "men's" : "women's"} jeans${p.pattern ? ` with ${p.pattern} detailing` : ''}. Crafted for the ${p.style || 'casual'} lifestyle, these jeans offer the ideal blend of comfort and style. The premium denim construction provides durability while maintaining flexibility for all-day wear. Classic styling meets modern sensibility, making these jeans versatile enough to dress up or down. An essential piece that complements any top in your wardrobe.`,
  
  'Pants': (p) => `Elevate your wardrobe with these versatile ${p.color.toLowerCase()} ${p.gender === 'Male' ? "men's" : "women's"} pants${p.pattern ? ` featuring ${p.pattern} details` : ''}. Designed for ${p.style || 'casual'} sophistication, these pants deliver both comfort and refined style. The quality fabric ensures a polished appearance while allowing freedom of movement. Perfect for work, weekend outings, or anywhere in between. Pair with shirts, blouses, or casual tops for endless styling possibilities that take you from day to night with ease.`,
  
  'Jacket': (p) => `Complete your look with this stylish ${p.color.toLowerCase()} ${p.gender === 'Male' ? "men's" : "women's"} jacket${p.pattern ? ` showcasing a ${p.pattern} pattern` : ''}. Perfect for ${p.style || 'casual'} occasions, this jacket combines functionality with fashion-forward design. The quality construction provides warmth and protection while the modern cut ensures a flattering silhouette. Layer over t-shirts, hoodies, or dresses for versatile styling options. A statement piece that elevates any outfit and keeps you looking polished.`,
  
  'Top': (p) => `Refresh your wardrobe with this chic ${p.color.toLowerCase()} ${p.gender === 'Female' ? "women's" : "girls'"} top${p.pattern ? ` featuring a ${p.pattern} design` : ''}. Created for ${p.style || 'casual'} elegance, this top offers effortless style for any occasion. The comfortable fit and quality fabric make it perfect for all-day wear, while the versatile design pairs beautifully with jeans, skirts, or trousers. Whether you're heading to brunch or running errands, this top ensures you look put-together with minimal effort.`,
  
  'Blouse': (p) => `Add feminine elegance to your wardrobe with this beautiful ${p.color.toLowerCase()} ${p.gender === 'Female' ? "women's" : "girls'"} blouse${p.pattern ? ` adorned with a ${p.pattern} pattern` : ''}. Designed for ${p.style || 'casual'} sophistication, this blouse combines graceful styling with comfortable wear. The flowing silhouette flatters every figure while the quality fabric ensures lasting beauty. Perfect for professional settings, special occasions, or elevated everyday wear. A timeless piece that adds polish to any ensemble.`,
  
  'Shorts': (p) => `Stay cool and stylish with these ${p.color.toLowerCase()} ${p.gender === 'Male' ? "men's" : "women's"} shorts${p.pattern ? ` featuring ${p.pattern} details` : ''}. Perfect for ${p.style || 'casual'} warm-weather wear, these shorts combine comfort with contemporary style. The quality construction ensures durability while the relaxed fit provides all-day comfort. Ideal for weekend adventures, beach days, or casual outings. Pair with t-shirts, tanks, or casual shirts for effortless warm-weather style.`,
  
  'Skirt': (p) => `Express your style with this versatile ${p.color.toLowerCase()} ${p.gender === 'Female' ? "women's" : "girls'"} skirt${p.pattern ? ` featuring a ${p.pattern} design` : ''}. Created for ${p.style || 'casual'} elegance, this skirt offers a flattering silhouette that moves beautifully. The quality fabric provides comfort while maintaining a polished appearance. Perfect for work, weekends, or special occasions. Style with blouses for a professional look or casual tops for relaxed outings. A wardrobe essential for every fashion-forward woman.`,
  
  'Sweater': (p) => `Wrap yourself in comfort with this cozy ${p.color.toLowerCase()} ${p.gender === 'Male' ? "men's" : "women's"} sweater${p.pattern ? ` featuring a ${p.pattern} pattern` : ''}. Perfect for ${p.style || 'casual'} cool-weather style, this sweater combines warmth with sophisticated design. The soft knit fabric provides exceptional comfort while the classic silhouette ensures versatile styling. Layer over shirts or wear alone for effortless seasonal style. A timeless piece that keeps you looking polished on chilly days.`,

  'Tunic': (p) => `Embrace effortless style with this beautiful ${p.color.toLowerCase()} ${p.gender === 'Female' ? "women's" : "girls'"} tunic${p.pattern ? ` adorned with a ${p.pattern} design` : ''}. Designed for ${p.style || 'casual'} comfort, this tunic offers a relaxed yet refined silhouette. The flowing fit provides easy movement while the quality fabric drapes gracefully. Perfect for pairing with leggings, jeans, or palazzo pants. A versatile piece that transitions from casual daytime wear to relaxed evening outings with ease.`,

  'Sweatshirt': (p) => `Experience ultimate comfort with this ${p.color.toLowerCase()} ${p.gender === 'Male' ? "men's" : "women's"} sweatshirt${p.pattern ? ` featuring a ${p.pattern} design` : ''}. Built for ${p.style || 'casual'} relaxation, this sweatshirt combines cozy warmth with contemporary style. The soft interior and durable construction ensure lasting comfort through countless wears. Perfect for lounging, casual outings, or layering on cool days. A wardrobe staple that delivers both comfort and effortless style.`,
  
  'default': (p) => `Discover this stylish ${p.color.toLowerCase()} ${p.gender === 'Male' ? "men's" : p.gender === 'Female' ? "women's" : "kids'"} ${(p.subcategory || 'piece').toLowerCase()}${p.pattern ? ` featuring a ${p.pattern} design` : ''}. Perfect for ${p.style || 'casual'} occasions, this piece combines quality craftsmanship with contemporary fashion. The thoughtful design ensures both comfort and style, making it a versatile addition to your wardrobe. Whether dressed up or down, this ${(p.subcategory || 'item').toLowerCase()} delivers effortless style for any occasion.`
};

// Function to generate better product name
function generateProductName(p) {
  const gender = p.gender_category === 'Kids' 
    ? (p.gender === 'Girl' ? "Girl's" : "Boy's")
    : (p.gender === 'Female' ? "Women's" : "Men's");
  
  const color = capitalizeFirst(p.color || '');
  const style = capitalizeFirst(p.style || 'Casual');
  const pattern = p.pattern ? capitalizeFirst(p.pattern) + ' Print ' : '';
  const subcategory = capitalizeFirst(p.subcategory || 'Item');
  
  // Better naming format
  return `${gender} ${color} ${style} ${pattern}${subcategory}`.replace(/\s+/g, ' ').trim();
}

// Function to generate URL slug
function generateSlug(name) {
  return name.toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Function to generate description
function generateDescription(p) {
  const subcat = (p.subcategory || '').replace(/[-_]/g, ' ');
  
  // Find matching template
  let template = descriptionTemplates['default'];
  for (const [key, fn] of Object.entries(descriptionTemplates)) {
    if (subcat.toLowerCase().includes(key.toLowerCase()) || 
        key.toLowerCase().includes(subcat.toLowerCase())) {
      template = fn;
      break;
    }
  }
  
  let desc = template(p);
  
  // Ensure it's around 500 characters
  if (desc.length < 450) {
    desc += ` Shop now and add this ${p.subcategory?.toLowerCase() || 'piece'} to your collection for a fresh update to your everyday style.`;
  }
  
  if (desc.length > 550) {
    desc = desc.substring(0, 547) + '...';
  }
  
  return desc;
}

function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

async function improveProducts() {
  // Authenticate
  const authRes = await fetch(DIRECTUS_URL + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'zecode@siyaram.com', password: env.DIRECTUS_ADMIN_PASSWORD })
  });
  const token = (await authRes.json()).data.access_token;
  
  // Get all products
  const productsRes = await fetch(DIRECTUS_URL + '/items/products?limit=-1', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const products = (await productsRes.json()).data;
  
  console.log(`Processing ${products.length} products...\n`);
  
  // Generate improvements
  const improvements = products.map(p => {
    const newName = generateProductName(p);
    const newSlug = generateSlug(newName);
    const newDesc = generateDescription(p);
    
    return {
      id: p.id,
      original: {
        name: p.name,
        slug: p.slug,
        description: p.description
      },
      improved: {
        name: newName,
        slug: newSlug,
        description: newDesc
      }
    };
  });
  
  // Save to file for review
  fs.writeFileSync('product-improvements.json', JSON.stringify(improvements, null, 2));
  console.log('Saved improvements to product-improvements.json');
  
  // Show samples
  console.log('\n=== SAMPLE IMPROVEMENTS ===\n');
  improvements.slice(0, 5).forEach(imp => {
    console.log(`ID ${imp.id}:`);
    console.log(`  Old Name: ${imp.original.name}`);
    console.log(`  New Name: ${imp.improved.name}`);
    console.log(`  Old Desc: ${imp.original.description}`);
    console.log(`  New Desc: ${imp.improved.description.substring(0, 100)}...`);
    console.log(`  Desc Length: ${imp.improved.description.length} chars`);
    console.log('');
  });
  
  console.log('\nTo apply these improvements, run: node apply-improvements.js');
}

improveProducts().catch(console.error);
