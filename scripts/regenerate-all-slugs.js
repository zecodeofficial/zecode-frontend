/**
 * Script to regenerate ALL product slugs based on their full names
 * Ensures uniqueness by appending product ID when duplicates occur
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
  
  // Sort products by ID to ensure consistent ordering
  products.sort((a, b) => a.id - b.id);
  
  // First pass: generate base slugs and track counts
  const slugCounts = {};
  const productSlugs = [];
  
  for (const product of products) {
    const baseSlug = nameToSlug(product.name);
    
    if (!slugCounts[baseSlug]) {
      slugCounts[baseSlug] = [];
    }
    slugCounts[baseSlug].push(product.id);
    
    productSlugs.push({
      id: product.id,
      name: product.name,
      oldSlug: product.slug,
      baseSlug: baseSlug
    });
  }
  
  // Second pass: assign unique slugs
  const updates = [];
  const seenSlugs = new Set();
  
  for (const item of productSlugs) {
    let newSlug = item.baseSlug;
    
    // If this base slug has duplicates, append product ID for all but the first
    const duplicateIds = slugCounts[item.baseSlug];
    if (duplicateIds.length > 1 && item.id !== duplicateIds[0]) {
      newSlug = `${item.baseSlug}-${item.id}`;
    }
    
    // Safety check: if slug is somehow still not unique, add ID
    if (seenSlugs.has(newSlug)) {
      newSlug = `${item.baseSlug}-${item.id}`;
    }
    seenSlugs.add(newSlug);
    
    // Track all updates (even if slug hasn't changed, for completeness)
    if (newSlug !== item.oldSlug) {
      updates.push({
        id: item.id,
        name: item.name,
        oldSlug: item.oldSlug,
        newSlug: newSlug
      });
    }
  }
  
  // Count duplicates
  const duplicateBaseSlugs = Object.entries(slugCounts).filter(([_, ids]) => ids.length > 1);
  console.log(`Found ${duplicateBaseSlugs.length} product names with duplicates`);
  console.log(`Total products needing slug updates: ${updates.length}\n`);
  
  if (updates.length === 0) {
    console.log('All slugs are already correct!');
    return;
  }
  
  // Show preview of changes
  console.log('Preview of changes (first 20):');
  for (const update of updates.slice(0, 20)) {
    console.log(`  ID ${update.id}: "${update.name}"`);
    console.log(`    OLD: ${update.oldSlug}`);
    console.log(`    NEW: ${update.newSlug}`);
  }
  if (updates.length > 20) {
    console.log(`  ... and ${updates.length - 20} more\n`);
  }
  
  // Check for --dry-run flag
  if (process.argv.includes('--dry-run')) {
    console.log('\nDry run mode - no changes made');
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
