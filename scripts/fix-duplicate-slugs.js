/**
 * Script to fix duplicate slugs in Directus products
 * Makes each slug unique by appending the product ID for duplicates
 */

const DIRECTUS_URL = 'https://zecode-directus.onrender.com';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || 'admin_token_2024';

async function fetchAllProducts() {
  const response = await fetch(`${DIRECTUS_URL}/items/products?fields=id,slug&limit=-1`);
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
  
  // Group products by slug
  const slugGroups = {};
  for (const product of products) {
    if (!slugGroups[product.slug]) {
      slugGroups[product.slug] = [];
    }
    slugGroups[product.slug].push(product);
  }
  
  // Find duplicates
  const duplicateGroups = Object.entries(slugGroups).filter(([slug, prods]) => prods.length > 1);
  console.log(`Found ${duplicateGroups.length} slug groups with duplicates\n`);
  
  if (duplicateGroups.length === 0) {
    console.log('No duplicate slugs found. All slugs are unique!');
    return;
  }
  
  // List duplicates
  console.log('Duplicate slugs:');
  for (const [slug, prods] of duplicateGroups) {
    console.log(`  ${slug}: ${prods.map(p => p.id).join(', ')}`);
  }
  console.log('');
  
  // Fix duplicates by adding product ID to all but the first occurrence
  let fixCount = 0;
  const updates = [];
  
  for (const [slug, prods] of duplicateGroups) {
    // Sort by ID to keep the lowest ID with the original slug
    prods.sort((a, b) => a.id - b.id);
    
    // Keep the first product's slug as-is, update the rest
    for (let i = 1; i < prods.length; i++) {
      const product = prods[i];
      const newSlug = `${slug}-${product.id}`;
      updates.push({
        id: product.id,
        oldSlug: slug,
        newSlug: newSlug
      });
    }
  }
  
  console.log(`Will update ${updates.length} products with new slugs:\n`);
  
  // Show first 10 updates as preview
  const preview = updates.slice(0, 10);
  for (const update of preview) {
    console.log(`  Product ${update.id}: ${update.oldSlug} -> ${update.newSlug}`);
  }
  if (updates.length > 10) {
    console.log(`  ... and ${updates.length - 10} more`);
  }
  console.log('');
  
  // Check for --dry-run flag
  if (process.argv.includes('--dry-run')) {
    console.log('Dry run mode - no changes made');
    return;
  }
  
  // Apply updates
  console.log('Applying updates...\n');
  let successCount = 0;
  let errorCount = 0;
  
  for (const update of updates) {
    try {
      await updateProduct(update.id, update.newSlug);
      console.log(`  ✓ Updated product ${update.id}`);
      successCount++;
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`  ✗ Failed to update product ${update.id}: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log(`\nDone! Updated ${successCount} products, ${errorCount} errors`);
}

main().catch(console.error);
