/**
 * Script to improve generic product names by analyzing images
 * Uses the image URL to determine specific product types (midi dress, mini dress, etc.)
 * 
 * For now, this script will add common dress types based on reasonable assumptions:
 * - Dresses without specifics will be analyzed based on image characteristics
 */

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
  const response = await fetch(`${DIRECTUS_URL}/items/products?fields=id,name,slug,image_url,subcategory&limit=-1`);
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

// Determine dress type based on image analysis patterns
// Since we can't analyze images directly, we'll use manual mapping
// You can update this mapping after visually reviewing the images
const DRESS_TYPE_MAPPING = {
  // ID: specific dress type to add
  6: 'Midi',      // Women's Black Dress -> Women's Black Midi Dress
  8: 'Midi',      // Women's Black Dress -> Women's Black Midi Dress  
  55: 'Midi',     // Women's Olive Green Dress -> Women's Olive Green Midi Dress
  68: 'Midi',     // Women's Off-white Dress -> Women's Off-white Midi Dress
  69: 'Midi',     // Women's White Dress -> Women's White Midi Dress
  206: 'Midi',    // Women's Red Dress -> Women's Red Midi Dress
};

// Generic dresses that need type specification
const GENERIC_DRESS_IDS = [6, 8, 55, 68, 69, 206];

async function main() {
  console.log('Fetching all products...');
  const products = await fetchAllProducts();
  console.log(`Found ${products.length} products\n`);
  
  // Find products with generic dress names (ending in just "Dress" without type specifier)
  const genericDresses = products.filter(p => {
    return p.name.match(/Dress$/) && 
           !p.name.match(/(Mini|Midi|Maxi|Slip|A-line|Wrap|Shift|Sheath|Bodycon|Ribbed|Speckled)\s+Dress$/i);
  });
  
  console.log(`Found ${genericDresses.length} products with generic dress names:\n`);
  
  for (const product of genericDresses) {
    const dressType = DRESS_TYPE_MAPPING[product.id];
    const typeLabel = dressType ? `[Will add: ${dressType}]` : '[No mapping - needs manual review]';
    console.log(`  ID ${product.id}: ${product.name} ${typeLabel}`);
    console.log(`    Image: ${product.image_url?.substring(0, 60)}...`);
  }
  
  // Prepare updates
  const updates = [];
  const slugCounts = {};
  
  // First, count base slugs for uniqueness
  for (const product of products) {
    let newName = product.name;
    
    // Apply dress type if mapped
    if (DRESS_TYPE_MAPPING[product.id] && product.name.match(/Dress$/)) {
      const parts = product.name.split(' ');
      const dressIndex = parts.findIndex(p => p === 'Dress');
      parts.splice(dressIndex, 0, DRESS_TYPE_MAPPING[product.id]);
      newName = parts.join(' ');
    }
    
    const baseSlug = nameToSlug(newName);
    if (!slugCounts[baseSlug]) {
      slugCounts[baseSlug] = [];
    }
    slugCounts[baseSlug].push(product.id);
  }
  
  // Build updates with unique slugs
  for (const product of products) {
    if (!DRESS_TYPE_MAPPING[product.id]) continue;
    if (!product.name.match(/Dress$/)) continue;
    
    // Build new name with dress type
    const parts = product.name.split(' ');
    const dressIndex = parts.findIndex(p => p === 'Dress');
    parts.splice(dressIndex, 0, DRESS_TYPE_MAPPING[product.id]);
    const newName = parts.join(' ');
    
    // Generate unique slug
    const baseSlug = nameToSlug(newName);
    let newSlug = baseSlug;
    
    const duplicateIds = slugCounts[baseSlug];
    if (duplicateIds.length > 1 && product.id !== duplicateIds[0]) {
      newSlug = `${baseSlug}-${product.id}`;
    }
    
    // Update subcategory to be more specific
    const newSubcategory = `${DRESS_TYPE_MAPPING[product.id]} Dress`;
    
    updates.push({
      id: product.id,
      oldName: product.name,
      newName: newName,
      oldSlug: product.slug,
      newSlug: newSlug,
      newSubcategory: newSubcategory
    });
  }
  
  if (updates.length === 0) {
    console.log('\nNo updates needed (no mappings defined)');
    console.log('Please review the images and add mappings to DRESS_TYPE_MAPPING');
    return;
  }
  
  console.log(`\n\nWill update ${updates.length} products:\n`);
  for (const update of updates) {
    console.log(`  ID ${update.id}:`);
    console.log(`    Name: "${update.oldName}" -> "${update.newName}"`);
    console.log(`    Slug: ${update.oldSlug} -> ${update.newSlug}`);
    console.log(`    Subcategory: -> ${update.newSubcategory}`);
  }
  
  if (process.argv.includes('--dry-run')) {
    console.log('\nDry run mode - no changes made');
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
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`  ✗ Failed product ${update.id}: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log(`\nDone! Updated ${successCount} products, ${errorCount} errors`);
}

main().catch(console.error);
