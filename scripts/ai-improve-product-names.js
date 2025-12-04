/**
 * AI-powered script to improve generic product names
 * Uses Google Gemini to analyze product images and determine specific types
 */

// Disable SSL certificate verification
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = require('node-fetch');
const https = require('https');

// Create custom agent for SSL bypass
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const DIRECTUS_URL = 'https://zecode-directus.onrender.com';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Cloudinary configuration for product images
const CLOUDINARY_CLOUD_NAME = 'ds8llatku';
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;

if (!DIRECTUS_TOKEN) {
  console.error('Error: DIRECTUS_TOKEN environment variable is required');
  process.exit(1);
}

if (!GOOGLE_API_KEY) {
  console.error('Error: GOOGLE_API_KEY environment variable is required');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

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

// Get image as base64 for Gemini
async function getImageAsBase64(imageUrl) {
  try {
    // Handle different URL formats
    let fullUrl;
    if (imageUrl.startsWith('http')) {
      fullUrl = imageUrl;
    } else if (imageUrl.startsWith('/')) {
      // Transform local path to Cloudinary URL (same as frontend does)
      const cleanPath = imageUrl.replace(/^\//, '').replace(/\.[^.]+$/, '');
      fullUrl = `${CLOUDINARY_BASE_URL}/f_auto,q_auto/zecode/${cleanPath}`;
    } else {
      fullUrl = `${CLOUDINARY_BASE_URL}/f_auto,q_auto/zecode/${imageUrl}`;
    }
    
    console.log(`    Fetching: ${fullUrl.substring(0, 80)}...`);
    
    const response = await fetch(fullUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const buffer = await response.buffer();
    return buffer.toString('base64');
  } catch (error) {
    console.error(`    Error fetching image: ${error.message}`);
    return null;
  }
}

// Analyze product image with Gemini
async function analyzeProductImage(product, imageBase64) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const categoryType = product.name.split(' ').pop(); // Get last word (Dress, Jacket, etc.)
  
  const prompt = `Analyze this fashion product image. The product is currently named "${product.name}".

I need you to identify ONE specific style/type descriptor that should be added to make the name more specific.

For ${categoryType}, choose from these options ONLY:
${categoryType === 'Dress' ? '- Midi (knee to mid-calf length)\n- Mini (above knee)\n- Maxi (ankle length)\n- A-Line\n- Bodycon (fitted)\n- Shift (loose, straight)' : ''}
${categoryType === 'Jacket' ? '- Denim\n- Bomber\n- Blazer\n- Puffer\n- Leather\n- Cropped\n- Utility' : ''}
${categoryType === 'Jeans' ? '- Skinny\n- Slim\n- Straight\n- Bootcut\n- Wide-Leg\n- Mom\n- Relaxed' : ''}
${categoryType === 'Pants' ? '- Slim\n- Straight\n- Wide-Leg\n- Cargo\n- Chino\n- Tailored\n- Dress' : ''}
${categoryType === 'Shirt' ? '- Casual\n- Dress\n- Oxford\n- Flannel\n- Linen' : ''}
${categoryType === 'Top' ? '- Casual\n- Crop\n- Tank\n- Blouse\n- Peplum' : ''}
${categoryType === 'T-Shirt' ? '- Crew Neck\n- V-Neck\n- Oversized\n- Fitted\n- Classic' : ''}

Respond with ONLY the single descriptor word/phrase, nothing else.`;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/png',
          data: imageBase64
        }
      }
    ]);
    
    const response = await result.response;
    const text = response.text().trim();
    
    // Clean up response - just get the descriptor
    const cleanText = text.replace(/[^a-zA-Z\s-]/g, '').trim();
    
    // Validate it's a reasonable descriptor (not too long)
    if (cleanText.length > 20 || cleanText.split(' ').length > 3) {
      console.log(`    Warning: Unexpected AI response "${cleanText}", using default`);
      return getDefaultDescriptor(categoryType);
    }
    
    return cleanText;
  } catch (error) {
    console.error(`    AI analysis failed: ${error.message}`);
    return getDefaultDescriptor(categoryType);
  }
}

function getDefaultDescriptor(categoryType) {
  const defaults = {
    'Dress': 'Midi',
    'Jacket': 'Casual',
    'Jeans': 'Slim',
    'Pants': 'Slim',
    'Shirt': 'Casual',
    'Top': 'Casual',
    'T-Shirt': 'Classic'
  };
  return defaults[categoryType] || 'Classic';
}

// Check if product name is generic (needs improvement)
function isGenericName(name) {
  // Has specific descriptors already
  const specificPatterns = [
    /Mini\s+Dress/i, /Midi\s+Dress/i, /Maxi\s+Dress/i, /Slip\s+Dress/i,
    /A-Line/i, /Bodycon/i, /Shift\s+Dress/i, /Wrap\s+Dress/i,
    /Denim\s+Jacket/i, /Bomber/i, /Blazer/i, /Puffer/i, /Varsity/i,
    /Skinny/i, /Bootcut/i, /Wide-Leg/i, /Mom\s+Jeans/i,
    /Cargo/i, /Chino/i, /Dress\s+Pants/i,
    /Button-Up/i, /Polo/i, /Short\s+Sleeve/i,
    /Graphic\s+Print/i, /Striped/i, /Ribbed/i, /Speckled/i
  ];
  
  return !specificPatterns.some(pattern => pattern.test(name));
}

// Get product category type from name
function getCategoryType(name) {
  const words = name.split(' ');
  const lastWord = words[words.length - 1];
  const secondLast = words.length > 1 ? words[words.length - 2] : '';
  
  if (lastWord === 'Top' && secondLast === 'Tank') return 'Tank Top';
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
    const isGeneric = ['Dress', 'Jacket', 'Jeans', 'Pants', 'Shirt', 'Top'].includes(category);
    return isGeneric && isGenericName(p.name);
  });
  
  console.log(`Found ${genericProducts.length} generic products that need improvement\n`);
  
  if (genericProducts.length === 0) {
    console.log('No generic products found!');
    return;
  }
  
  // Show products to be analyzed
  console.log('Products to analyze:');
  for (const p of genericProducts) {
    console.log(`  ID ${p.id}: ${p.name}`);
  }
  console.log('');
  
  if (process.argv.includes('--dry-run')) {
    console.log('Dry run mode - not analyzing images or making changes');
    return;
  }
  
  // Analyze each product and prepare updates
  const updates = [];
  const slugCounts = {};
  
  // First, calculate base slugs for all products (including improved names)
  const productImprovements = new Map();
  
  console.log('Analyzing product images with AI...\n');
  
  for (const product of genericProducts) {
    console.log(`  Analyzing ID ${product.id}: ${product.name}`);
    
    const imageUrl = product.image_url || product.image;
    if (!imageUrl) {
      console.log(`    No image URL, skipping`);
      continue;
    }
    
    const imageBase64 = await getImageAsBase64(imageUrl);
    if (!imageBase64) {
      console.log(`    Could not fetch image, skipping`);
      continue;
    }
    
    const descriptor = await analyzeProductImage(product, imageBase64);
    console.log(`    AI suggests: ${descriptor}`);
    
    productImprovements.set(product.id, descriptor);
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Calculate new names and slugs
  for (const product of products) {
    let newName = product.name;
    
    if (productImprovements.has(product.id)) {
      const descriptor = productImprovements.get(product.id);
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
  for (const product of genericProducts) {
    if (!productImprovements.has(product.id)) continue;
    
    const descriptor = productImprovements.get(product.id);
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
  
  console.log(`\n\nWill update ${updates.length} products:\n`);
  
  for (const update of updates) {
    console.log(`  ID ${update.id}:`);
    console.log(`    "${update.oldName}" -> "${update.newName}"`);
    console.log(`    ${update.oldSlug} -> ${update.newSlug}`);
  }
  
  if (process.argv.includes('--analyze-only')) {
    console.log('\nAnalyze only mode - not applying changes');
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
