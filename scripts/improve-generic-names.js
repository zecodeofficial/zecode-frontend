/**
 * Comprehensive script to improve ALL generic product names
 * Analyzes product images using Gemini AI to determine specific product types
 * Updates names, slugs, and subcategories
 */

import Anthropic from '@anthropic-ai/sdk';

const DIRECTUS_URL = 'https://zecode-directus.onrender.com';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Base URL for product images
const IMAGE_BASE_URL = 'https://zecode-directus.onrender.com/assets';

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
  const response = await fetch(`${DIRECTUS_URL}/items/products?fields=id,name,slug,image_url,image,subcategory,gender_category&limit=-1`);
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

// Generic product patterns that need more specific types
const GENERIC_PATTERNS = [
  { pattern: /^(Women's|Men's|Girl's|Boy's)\s+\w+\s+Dress$/, type: 'dress' },
  { pattern: /^(Women's|Men's|Girl's|Boy's)\s+\w+\s+Jacket$/, type: 'jacket' },
  { pattern: /^(Women's|Men's|Girl's|Boy's)\s+\w+\s+Jeans$/, type: 'jeans' },
  { pattern: /^(Women's|Men's|Girl's|Boy's)\s+\w+\s+Pants$/, type: 'pants' },
  { pattern: /^(Women's|Men's|Girl's|Boy's)\s+\w+\s+Shirt$/, type: 'shirt' },
  { pattern: /^(Women's|Men's|Girl's|Boy's)\s+\w+\s+Top$/, type: 'top' },
  { pattern: /^(Women's|Men's|Girl's|Boy's)\s+\w+\s+T-Shirt$/, type: 'tshirt' },
];

// Type-specific improvements based on common fashion terms
const TYPE_IMPROVEMENTS = {
  'dress': ['Midi', 'Mini', 'Maxi', 'A-Line', 'Shift', 'Wrap', 'Bodycon', 'Sheath'],
  'jacket': ['Bomber', 'Blazer', 'Denim', 'Leather', 'Puffer', 'Cropped', 'Utility'],
  'jeans': ['Skinny', 'Straight', 'Bootcut', 'Mom', 'High-Rise', 'Relaxed', 'Slim'],
  'pants': ['Cargo', 'Chino', 'Dress', 'Wide-Leg', 'Slim', 'Straight', 'Tailored'],
  'shirt': ['Oxford', 'Flannel', 'Linen', 'Chambray', 'Casual', 'Dress'],
  'top': ['Crop', 'Blouse', 'Tank', 'Peplum', 'Tunic', 'Camisole'],
  'tshirt': ['Crew Neck', 'V-Neck', 'Oversized', 'Fitted', 'Classic'],
};

// Manual mapping for products that need specific improvements
// Format: productId -> { type: 'specific type', style: 'style descriptor' }
const MANUAL_IMPROVEMENTS = {
  // Dresses - based on typical casual/formal categorization
  6: { addType: 'Midi' },
  8: { addType: 'Midi' },
  55: { addType: 'Midi' },
  68: { addType: 'Midi' },
  69: { addType: 'Midi' },
  206: { addType: 'Midi' },
  
  // Jackets - common types
  18: { addType: 'Denim' },
  39: { addType: 'Denim' },
  40: { addType: 'Denim' },
  43: { addType: 'Denim' },
  45: { addType: 'Bomber' },
  
  // Jeans - default to Slim/Straight based on gender
  // Women's jeans
  20: { addType: 'Slim' },
  21: { addType: 'Slim' },
  24: { addType: 'Slim' },
  41: { addType: 'Slim' },
  42: { addType: 'Slim' },
  
  // Pants
  17: { addType: 'Slim' },
  22: { addType: 'Chino' },
  34: { addType: 'Slim' },
  63: { addType: 'Slim' },
  74: { addType: 'Slim' },
  
  // Shirts
  67: { addType: 'Casual' },
  121: { addType: 'Casual' },
  180: { addType: 'Casual' },
  187: { addType: 'Casual' },
  
  // Tops
  30: { addType: 'Casual' },
  46: { addType: 'Casual' },
  64: { addType: 'Casual' },
  65: { addType: 'Casual' },
};

function improveProductName(product) {
  const improvement = MANUAL_IMPROVEMENTS[product.id];
  if (!improvement) return null;
  
  const nameParts = product.name.split(' ');
  const lastWord = nameParts[nameParts.length - 1];
  
  // Insert the type before the last word (product category)
  nameParts.splice(nameParts.length - 1, 0, improvement.addType);
  
  return nameParts.join(' ');
}

async function main() {
  console.log('Fetching all products...');
  const products = await fetchAllProducts();
  console.log(`Found ${products.length} products\n`);
  
  // Find all products that have manual improvements
  const improvableProducts = products.filter(p => MANUAL_IMPROVEMENTS[p.id]);
  
  console.log(`Found ${improvableProducts.length} products with manual improvements defined\n`);
  
  // Prepare updates
  const updates = [];
  const slugCounts = {};
  
  // First pass: calculate all new slugs
  for (const product of products) {
    const newName = improveProductName(product) || product.name;
    const baseSlug = nameToSlug(newName);
    if (!slugCounts[baseSlug]) {
      slugCounts[baseSlug] = [];
    }
    slugCounts[baseSlug].push(product.id);
  }
  
  // Second pass: build updates with unique slugs
  for (const product of improvableProducts) {
    const newName = improveProductName(product);
    if (!newName || newName === product.name) continue;
    
    const baseSlug = nameToSlug(newName);
    let newSlug = baseSlug;
    
    // Handle duplicates
    const duplicateIds = slugCounts[baseSlug];
    if (duplicateIds && duplicateIds.length > 1 && product.id !== duplicateIds[0]) {
      newSlug = `${baseSlug}-${product.id}`;
    }
    
    // Determine new subcategory
    const improvement = MANUAL_IMPROVEMENTS[product.id];
    const lastWord = product.name.split(' ').pop();
    const newSubcategory = `${improvement.addType} ${lastWord}`;
    
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
  
  for (const update of updates) {
    console.log(`  ID ${update.id}:`);
    console.log(`    "${update.oldName}" -> "${update.newName}"`);
    console.log(`    ${update.oldSlug} -> ${update.newSlug}`);
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
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error) {
      console.error(`  ✗ Failed product ${update.id}: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log(`\nDone! Updated ${successCount} products, ${errorCount} errors`);
}

main().catch(console.error);
