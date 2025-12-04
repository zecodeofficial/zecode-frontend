/**
 * Script to regenerate all product slugs based on their names
 * Ensures uniqueness by appending product ID when duplicates occur
 */

const DIRECTUS_URL = 'https://zecode-directus.onrender.com';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || 'admin_token_2024';

// Convert name to slug
function nameToSlug(name) {
  return name
    .toLowerCase()
    .replace(/[']/g, '')           // Remove apostrophes
    .replace(/[^a-z0-9]+/g, '-')   // Replace non-alphanumeric with dashes
    .replace(/^-+|-+$/g, '')       // Remove leading/trailing dashes
    .replace(/-+/g, '-');          // Collapse multiple dashes
}

async function fetchAllProducts() {
  const response = await fetch(`${DIRECTUS_URL}/items/products?fields=id,name,slug&limit=-1`);
  const data = await response.json();
  return data.data;
}

async function updateProduct(id, slug) {
  const response = await fetch(`${DIRECTUS_URL}/items/products/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DIRECTUS_TOKEN}`
    },
    body: JSON.stringify({ slug })
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to update product ${id}: ${text}`);
  }
  
  return response.json();
}

async function main() {
  console.log('Fetching all products...');
  const products = await fetchAllProducts();
  console.log(`Found ${products.length} products\n`);
  
  // Generate new slugs based on names
  const slugCounts = {};
  const updates = [];
  
  for (const product of products) {
    let baseSlug = nameToSlug(product.name);
    
    // Track how many times this slug has been used
    if (!slugCounts[baseSlug]) {
      slugCounts[baseSlug] = 0;
    }
    slugCounts[baseSlug]++;
    
    // If this is a duplicate, append the product ID for uniqueness
    let newSlug = baseSlug;
    if (slugCounts[baseSlug] > 1) {
      newSlug = `${baseSlug}-${product.id}`;
    }
    
    // Only update if slug changed
    if (newSlug !== product.slug) {
      updates.push({
        id: product.id,
        name: product.name,
        oldSlug: product.slug,
        newSlug: newSlug
      });
    }
  }
  
  // Count duplicates that needed fixing
  const duplicateBaseSlugs = Object.entries(slugCounts).filter(([_, count]) => count > 1);
  console.log(`Found ${duplicateBaseSlugs.length} base slugs with duplicates`);
  console.log(`Total products needing slug updates: ${updates.length}\n`);
  
  if (updates.length === 0) {
    console.log('All slugs are already correct!');
    return;
  }
  
  // Show preview of changes
  console.log('Preview of changes (first 15):');
  for (const update of updates.slice(0, 15)) {
    console.log(`  ID ${update.id}: "${update.name}"`);
    console.log(`    ${update.oldSlug} -> ${update.newSlug}`);
  }
  if (updates.length > 15) {
    console.log(`  ... and ${updates.length - 15} more\n`);
  }
  
  // Check for --dry-run flag
  if (process.argv.includes('--dry-run')) {
    console.log('\nDry run mode - no changes made');
    console.log('\nSummary of duplicate base slugs:');
    for (const [slug, count] of duplicateBaseSlugs.slice(0, 10)) {
      console.log(`  ${slug}: ${count} products`);
    }
    return;
  }
  
  // Apply updates
  console.log('\nApplying updates...\n');
  let successCount = 0;
  let errorCount = 0;
  
  for (const update of updates) {
    try {
      await updateProduct(update.id, update.newSlug);
      console.log(`  ✓ Product ${update.id}: ${update.newSlug}`);
      successCount++;
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error) {
      console.error(`  ✗ Failed product ${update.id}: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log(`\nDone! Updated ${successCount} products, ${errorCount} errors`);
}

main().catch(console.error);
