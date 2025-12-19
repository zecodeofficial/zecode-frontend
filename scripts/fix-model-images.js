/**
 * Script to fix missing model images by matching:
 * 1. Photo session ID (from filename)
 * 2. Gender (male/female)
 * 3. Outfit type (blouse, top, dress, pants, etc.)
 * 
 * Usage: node scripts/fix-model-images.js
 */

// Disable SSL certificate verification
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const fs = require('fs');
const path = require('path');

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://zecode-directus.onrender.com';
const DIRECTUS_EMAIL = process.env.DIRECTUS_EMAIL;
const DIRECTUS_PASSWORD = process.env.DIRECTUS_PASSWORD;

if (!DIRECTUS_EMAIL || !DIRECTUS_PASSWORD) {
  console.error('❌ Missing required environment variables: DIRECTUS_EMAIL and DIRECTUS_PASSWORD');
  console.error('   Set them in .env file or export them before running this script.');
  process.exit(1);
}

const EXTRACTED_IMAGES_DIR = path.join(__dirname, '..', 'public', 'products', 'extracted');

async function getAccessToken() {
  const response = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: DIRECTUS_EMAIL,
      password: DIRECTUS_PASSWORD
    })
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  const data = await response.json();
  return data.data.access_token;
}

async function getAllProducts(token) {
  const response = await fetch(
    `${DIRECTUS_URL}/items/products?limit=-1&fields=id,name,slug,image_url,model_image_1_url,model_image_2_url,model_image_3_url,gender,color,subcategory`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

async function updateProduct(token, productId, updates) {
  const response = await fetch(`${DIRECTUS_URL}/items/products/${productId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update product ${productId}: ${response.status} - ${error}`);
  }

  return response.json();
}

function getExtractedImages() {
  const files = fs.readdirSync(EXTRACTED_IMAGES_DIR);
  return files.filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'));
}

// Extract photo session ID from filename
function extractPhotoId(filename) {
  if (!filename) return null;
  
  // Match patterns like: SONY_ILCE-7RM5_6304x4180_000006, _DSC3952_Large, etc.
  const patterns = [
    /SONY_ILCE[-_]7RM5[-_]\d+x\d*[-_](\d+)/i,
    /SONY_ILCE[-_]7RM5[-_](\d+x)/i,
    /_DSC(\d+)/i,
    /file_\d+x\d+_(\d+)/i
  ];
  
  for (const pattern of patterns) {
    const match = filename.match(pattern);
    if (match) {
      return match[0];
    }
  }
  return null;
}

// Extract gender from filename
function extractGender(filename) {
  if (!filename) return null;
  const lower = filename.toLowerCase();
  if (lower.includes('female') || lower.includes('women')) return 'female';
  if (lower.includes('male') || lower.includes('men')) return 'male';
  return null;
}

// Extract outfit type from filename
function extractOutfitType(filename) {
  if (!filename) return null;
  const lower = filename.toLowerCase();
  
  const outfitTypes = {
    'blouse': ['blouse'],
    'top': ['top', 'tank', 'tee', 't_shirt', 't-shirt'],
    'dress': ['dress'],
    'hoodie': ['hoodie', 'sweatshirt'],
    'jacket': ['jacket', 'vest'],
    'pants': ['pants', 'trousers', 'jeans', 'cargo'],
    'shorts': ['shorts'],
    'skirt': ['skirt'],
    'shirt': ['shirt', 'button_up', 'button-up'],
    'sweater': ['sweater', 'cardigan'],
  };
  
  for (const [type, keywords] of Object.entries(outfitTypes)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return type;
      }
    }
  }
  return null;
}

// Extract color from filename
function extractColor(filename) {
  if (!filename) return null;
  const lower = filename.toLowerCase();
  
  const colors = [
    'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'pink', 
    'purple', 'brown', 'beige', 'grey', 'gray', 'navy', 'cream', 'caramel',
    'olive', 'teal', 'maroon', 'khaki', 'dark_blue', 'light_blue'
  ];
  
  for (const color of colors) {
    if (lower.includes(color.replace('_', ' ')) || lower.includes(color)) {
      return color;
    }
  }
  return null;
}

function findMatchingModelImages(mainImageFilename, allImages, existingModelUrls) {
  const photoId = extractPhotoId(mainImageFilename);
  const gender = extractGender(mainImageFilename);
  const outfitType = extractOutfitType(mainImageFilename);
  const color = extractColor(mainImageFilename);
  
  // Get already used images (extract filename from URL)
  const usedImages = new Set();
  if (mainImageFilename) usedImages.add(mainImageFilename);
  existingModelUrls.forEach(url => {
    if (url) {
      const filename = url.split('/').pop();
      usedImages.add(filename);
    }
  });
  
  // Filter for model images only (model2_, model3_, model4_, model5_)
  const modelImages = allImages.filter(img => /^model\d+_/.test(img));
  
  const matches = [];
  
  // Strategy 1: Match by photo ID + gender + outfit type
  if (photoId && gender && outfitType) {
    for (const img of modelImages) {
      if (usedImages.has(img)) continue;
      
      const imgPhotoId = extractPhotoId(img);
      const imgGender = extractGender(img);
      const imgOutfit = extractOutfitType(img);
      
      if (imgPhotoId && imgPhotoId === photoId && imgGender === gender && imgOutfit === outfitType) {
        matches.push({ img, score: 100, reason: 'photo_id+gender+outfit' });
        usedImages.add(img);
      }
    }
  }
  
  // Strategy 2: Match by photo ID + gender
  if (matches.length < 3 && photoId && gender) {
    for (const img of modelImages) {
      if (usedImages.has(img)) continue;
      
      const imgPhotoId = extractPhotoId(img);
      const imgGender = extractGender(img);
      
      if (imgPhotoId && imgPhotoId === photoId && imgGender === gender) {
        matches.push({ img, score: 80, reason: 'photo_id+gender' });
        usedImages.add(img);
        if (matches.length >= 3) break;
      }
    }
  }
  
  // Strategy 3: Match by gender + outfit type + color
  if (matches.length < 3 && gender && outfitType) {
    for (const img of modelImages) {
      if (usedImages.has(img)) continue;
      
      const imgGender = extractGender(img);
      const imgOutfit = extractOutfitType(img);
      const imgColor = extractColor(img);
      
      if (imgGender === gender && imgOutfit === outfitType) {
        const colorMatch = color && imgColor && (color === imgColor || color.includes(imgColor) || imgColor.includes(color));
        if (colorMatch) {
          matches.push({ img, score: 70, reason: 'gender+outfit+color' });
          usedImages.add(img);
          if (matches.length >= 3) break;
        }
      }
    }
  }
  
  // Strategy 4: Match by gender + outfit type only
  if (matches.length < 3 && gender && outfitType) {
    for (const img of modelImages) {
      if (usedImages.has(img)) continue;
      
      const imgGender = extractGender(img);
      const imgOutfit = extractOutfitType(img);
      
      if (imgGender === gender && imgOutfit === outfitType) {
        matches.push({ img, score: 50, reason: 'gender+outfit' });
        usedImages.add(img);
        if (matches.length >= 3) break;
      }
    }
  }
  
  // Sort by score and return top 3
  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, 3);
}

async function main() {
  console.log('🚀 Starting model image fix...\n');

  const token = await getAccessToken();
  console.log('✅ Authenticated\n');

  const products = await getAllProducts(token);
  console.log(`📦 Found ${products.length} products\n`);

  const allImages = getExtractedImages();
  console.log(`📁 Found ${allImages.length} extracted images\n`);

  const results = {
    updated: [],
    skipped: [],
    noMatch: [],
    errors: []
  };

  console.log('🔄 Processing products...\n');

  for (const product of products) {
    // Skip if no main image_url
    if (!product.image_url) {
      results.skipped.push({ id: product.id, name: product.name, reason: 'No main image' });
      continue;
    }

    // Skip if all model images already exist
    if (product.model_image_1_url && product.model_image_2_url && product.model_image_3_url) {
      results.skipped.push({ id: product.id, name: product.name, reason: 'All model images exist' });
      continue;
    }

    const mainFilename = product.image_url.split('/').pop();
    const existingUrls = [product.model_image_1_url, product.model_image_2_url, product.model_image_3_url];
    
    const matches = findMatchingModelImages(mainFilename, allImages, existingUrls);

    if (matches.length === 0) {
      results.noMatch.push({
        id: product.id,
        name: product.name,
        mainImage: mainFilename,
        gender: extractGender(mainFilename),
        outfit: extractOutfitType(mainFilename)
      });
      console.log(`⚠️  [${product.id}] ${product.name.substring(0, 40)}... - No matches`);
      continue;
    }

    // Build update object
    const updates = {};
    let updateIndex = 0;
    
    // Fill in missing model images
    if (!product.model_image_1_url && matches[updateIndex]) {
      updates.model_image_1_url = `/products/extracted/${matches[updateIndex].img}`;
      updateIndex++;
    }
    if (!product.model_image_2_url && matches[updateIndex]) {
      updates.model_image_2_url = `/products/extracted/${matches[updateIndex].img}`;
      updateIndex++;
    }
    if (!product.model_image_3_url && matches[updateIndex]) {
      updates.model_image_3_url = `/products/extracted/${matches[updateIndex].img}`;
      updateIndex++;
    }

    if (Object.keys(updates).length === 0) {
      results.skipped.push({ id: product.id, name: product.name, reason: 'No updates needed' });
      continue;
    }

    try {
      await updateProduct(token, product.id, updates);
      results.updated.push({
        id: product.id,
        name: product.name,
        updates: updates,
        matchReasons: matches.map(m => m.reason)
      });
      console.log(`✅ [${product.id}] ${product.name.substring(0, 40)}... - Added ${Object.keys(updates).length} model images`);
    } catch (error) {
      results.errors.push({
        id: product.id,
        name: product.name,
        error: error.message
      });
      console.log(`❌ [${product.id}] ${product.name.substring(0, 40)}... - ${error.message}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 MODEL IMAGE FIX SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Updated:    ${results.updated.length}`);
  console.log(`⏭️  Skipped:    ${results.skipped.length}`);
  console.log(`⚠️  No Match:   ${results.noMatch.length}`);
  console.log(`❌ Errors:     ${results.errors.length}`);
  console.log('='.repeat(60));

  // Save report
  const reportPath = path.join(__dirname, '..', 'model-image-fix-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Report saved to: ${reportPath}`);

  if (results.noMatch.length > 0) {
    console.log('\n⚠️  PRODUCTS WITHOUT MATCHING MODEL IMAGES:');
    console.log('-'.repeat(60));
    for (const item of results.noMatch.slice(0, 20)) {
      console.log(`  ID ${item.id}: ${item.name.substring(0, 50)}...`);
      console.log(`    Gender: ${item.gender || 'unknown'}, Outfit: ${item.outfit || 'unknown'}`);
    }
    if (results.noMatch.length > 20) {
      console.log(`  ... and ${results.noMatch.length - 20} more`);
    }
  }
}

main().catch(console.error);
