/**
 * Script to improve generic product names with sensible defaults
 * Adds style descriptors based on product category
 */

// Disable SSL certificate verification
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const fetch = require('node-fetch');

const DIRECTUS_URL = 'https://zecode-directus.onrender.com';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

if (!DIRECTUS_TOKEN) {
  console.error('Error: DIRECTUS_TOKEN environment variable is required');
  process.exit(1);
}

// Convert name to slug
function nameToSlug(name) {
  return name
    .toLowerCase()
    .replace(/[']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

async function fetchAllProducts() {
  const response = await fetch(`${DIRECTUS_URL}/items/products?fields=id,name,slug,image_url,subcategory,gender_category&limit=-1`);
  const data = await response.json();
  return data.data;
}

async function updateProduct(id, updates) {
  const response = await fetch(`${DIRECTUS_URL}/items/products/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DIRECTUS_TOKEN}`
    },
    body: JSON.stringify(updates)
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to update product ${id}: ${text}`);
  }
  
  return response.json();
}

// Default style descriptors for each category
const DEFAULT_DESCRIPTORS = {
  'Dress': 'Midi',
  'Jacket': 'Casual',
  'Jeans': 'Slim',
  'Pants': 'Slim',
  'Shirt': 'Casual',
  'Top': 'Casual',
  'T-Shirt': 'Classic'
};

// Check if product name is generic (needs improvement)
function isGenericName(name) {
  // Already has specific descriptors
  const specificPatterns = [
    /Mini\s+(Dress|Skirt)/i, /Midi\s+(Dress|Skirt)/i, /Maxi\s+(Dress|Skirt)/i, /Slip\s+Dress/i,
    /A-Line/i, /Bodycon/i, /Shift\s+Dress/i, /Wrap\s+Dress/i,
    /Denim\s+Jacket/i, /Bomber/i, /Blazer/i, /Puffer/i, /Varsity/i,
    /Skinny/i, /Bootcut/i, /Wide-Leg/i, /Mom\s+Jeans/i, /Cargo/i,
    /Chino/i, /Dress\s+Pants/i, /Tailored/i,
    /Button-Up/i, /Polo/i, /Short\s+Sleeve/i, /Oxford/i, /Flannel/i,
    /Graphic\s+Print/i, /Striped/i, /Ribbed/i, /Speckled/i,
    /Crop\s+Top/i, /Tank\s+Top/i, /Blouse/i, /Sleeveless/i
  ];
  
  return !specificPatterns.some(pattern => pattern.test(name));
}

// Get product category type from name
function getCategoryType(name) {
  const words = name.split(' ');
  const lastWord = words[words.length - 1];
  const secondLast = words.length > 1 ? words[words.length - 2] : '';
  
  if (lastWord === 'Top' && secondLast === 'Tank') return null; // Already specific
  if (lastWord === 'Shirt' && secondLast === 'T') return 'T-Shirt';
  
  return lastWord;
}

async function main() {
  console.log('Fetching all products...\n');
  const products = await fetchAllProducts();
  console.log(`Found ${products.length} products\n`);
  
  // Find generic products that need improvement
  const genericProducts = products.filter(p => {
    const category = getCategoryType(p.name);
    if (!category) return false;
    const hasDefault = DEFAULT_DESCRIPTORS[category];
    return hasDefault && isGenericName(p.name);
  });
  
  console.log(`Found ${genericProducts.length} generic products that need improvement\n`);
  
  if (genericProducts.length === 0) {
    console.log('No generic products found!');
    return;
  }
  
  // Prepare improvements
  const improvements = new Map();
  
  for (const product of genericProducts) {
    const category = getCategoryType(product.name);
    const descriptor = DEFAULT_DESCRIPTORS[category];
    if (descriptor) {
      improvements.set(product.id, descriptor);
    }
  }
  
  // Calculate new names and slugs
  const slugCounts = {};
  
  for (const product of products) {
    let newName = product.name;
    
    if (improvements.has(product.id)) {
      const descriptor = improvements.get(product.id);
      const nameParts = product.name.split(' ');
      const categoryType = getCategoryType(product.name);
      
      // Find position to insert descriptor (before the category type)
      const insertIndex = categoryType === 'T-Shirt' 
        ? nameParts.length - 2 
        : nameParts.length - 1;
      
      nameParts.splice(insertIndex, 0, descriptor);
      newName = nameParts.join(' ');
    }
    
    const baseSlug = nameToSlug(newName);
    if (!slugCounts[baseSlug]) {
      slugCounts[baseSlug] = [];
    }
    slugCounts[baseSlug].push({ id: product.id, newName });
  }
  
  // Build final updates with unique slugs
  const updates = [];
  
  for (const product of genericProducts) {
    if (!improvements.has(product.id)) continue;
    
    const descriptor = improvements.get(product.id);
    const nameParts = product.name.split(' ');
    const categoryType = getCategoryType(product.name);
    
    const insertIndex = categoryType === 'T-Shirt' 
      ? nameParts.length - 2 
      : nameParts.length - 1;
    
    nameParts.splice(insertIndex, 0, descriptor);
    const newName = nameParts.join(' ');
    
    const baseSlug = nameToSlug(newName);
    let newSlug = baseSlug;
    
    const duplicates = slugCounts[baseSlug];
    if (duplicates && duplicates.length > 1) {
      const firstId = duplicates[0].id;
      if (product.id !== firstId) {
        newSlug = `${baseSlug}-${product.id}`;
      }
    }
    
    const newSubcategory = `${descriptor} ${categoryType}`;
    
    updates.push({
      id: product.id,
      oldName: product.name,
      newName: newName,
      oldSlug: product.slug,
      newSlug: newSlug,
      newSubcategory: newSubcategory
    });
  }
  
  console.log(`Will update ${updates.length} products:\n`);
  
  // Show all updates
  for (const update of updates) {
    console.log(`  ID ${update.id}: "${update.oldName}" -> "${update.newName}"`);
  }
  
  if (process.argv.includes('--dry-run')) {
    console.log('\nDry run mode - not applying changes');
    return;
  }
  
  console.log('\nApplying updates...\n');
  let successCount = 0;
  let errorCount = 0;
  
  for (const update of updates) {
    try {
      await updateProduct(update.id, {
        name: update.newName,
        slug: update.newSlug,
        subcategory: update.newSubcategory
      });
      console.log(`  ✓ Product ${update.id}: ${update.newName}`);
      successCount++;
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error) {
      console.error(`  ✗ Failed product ${update.id}: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log(`\nDone! Updated ${successCount} products, ${errorCount} errors`);
}

main().catch(console.error);
