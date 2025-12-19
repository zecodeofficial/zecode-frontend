/**
 * Script to fix model images for a specific product
 * Prioritizes matching by:
 * 1. Photo session ID (same photo session)
 * 2. Gender + outfit type
 * 3. Gender only
 * 
 * Usage: node scripts/fix-single-product-images.js <product_slug>
 * Example: node scripts/fix-single-product-images.js brown-black-tiger-print-chiffon-blouse-voluminous-sleeves-animal-graphic
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const fs = require('fs');
const path = require('path');

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://zecode-directus.onrender.com';
const DIRECTUS_EMAIL = process.env.DIRECTUS_EMAIL;
const DIRECTUS_PASSWORD = process.env.DIRECTUS_PASSWORD;

if (!DIRECTUS_EMAIL || !DIRECTUS_PASSWORD) {
  console.error('❌ Missing DIRECTUS_EMAIL or DIRECTUS_PASSWORD environment variables');
  process.exit(1);
}

const EXTRACTED_IMAGES_DIR = path.join(__dirname, '..', 'public', 'products', 'extracted');

async function getAccessToken() {
  const response = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: DIRECTUS_EMAIL, password: DIRECTUS_PASSWORD })
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  const data = await response.json();
  return data.data.access_token;
}

async function getProductBySlug(token, slug) {
  const response = await fetch(
    `${DIRECTUS_URL}/items/products?filter[slug][_eq]=${encodeURIComponent(slug)}&fields=*`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch product: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0];
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
    throw new Error(`Failed to update product: ${response.status} - ${error}`);
  }

  return response.json();
}

function getExtractedImages() {
  const files = fs.readdirSync(EXTRACTED_IMAGES_DIR);
  return files.filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'));
}

// Extract photo session ID from filename (more comprehensive)
function extractPhotoId(filename) {
  if (!filename) return null;
  
  // Normalize filename (remove path, get just filename)
  const name = filename.split('/').pop() || filename;
  
  // Match various patterns
  const patterns = [
    // SONY_ILCE-7RM5_6304x4180_000006 -> returns full pattern for better matching
    /(SONY_ILCE[-_]7RM5[-_]\d+x\d*[-_]?\d*)/i,
    // _DSC3952_Large -> returns DSC3952
    /(_DSC\d+)/i,
    // file_1616x1080_00132 -> returns file_1616x1080_00132
    /(file_\d+x\d+_\d+)/i
  ];
  
  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match) {
      return match[1].toUpperCase().replace(/-/g, '_');
    }
  }
  return null;
}

// Normalize photo ID for comparison (handle variations like ILCE-7RM5 vs ILCE_7RM5)
function normalizePhotoId(photoId) {
  if (!photoId) return null;
  return photoId.toUpperCase().replace(/-/g, '_').replace(/X\d+_/i, 'X_');
}

// Check if two photo IDs are from the same session
function isSamePhotoSession(photoId1, photoId2) {
  if (!photoId1 || !photoId2) return false;
  
  const norm1 = normalizePhotoId(photoId1);
  const norm2 = normalizePhotoId(photoId2);
  
  // Direct match
  if (norm1 === norm2) return true;
  
  // Check if they share the same base (e.g., SONY_ILCE_7RM5_6304X)
  const base1 = norm1.replace(/_\d+$/, '');
  const base2 = norm2.replace(/_\d+$/, '');
  
  if (base1.length > 10 && base2.length > 10 && base1.includes(base2.substring(0, 15))) return true;
  if (base1.length > 10 && base2.length > 10 && base2.includes(base1.substring(0, 15))) return true;
  
  return false;
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
    'top': ['top', 'tank', 'tee', 't_shirt', 't-shirt', 'cropped_top', 'sleeveless'],
    'dress': ['dress'],
    'hoodie': ['hoodie', 'sweatshirt'],
    'jacket': ['jacket', 'vest', 'cardigan'],
    'pants': ['pants', 'trousers', 'jeans', 'cargo'],
    'shorts': ['shorts'],
    'skirt': ['skirt'],
    'shirt': ['shirt', 'button_up', 'button-up', 'polo'],
    'sweater': ['sweater'],
  };
  
  for (const [type, keywords] of Object.entries(outfitTypes)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) return type;
    }
  }
  return null;
}

// Find best matching model images for a product
function findBestModelImages(mainImageFilename, gender, allImages) {
  const mainPhotoId = extractPhotoId(mainImageFilename);
  const mainOutfit = extractOutfitType(mainImageFilename);
  
  console.log(`\n📸 Main image analysis:`);
  console.log(`   Filename: ${mainImageFilename}`);
  console.log(`   Photo ID: ${mainPhotoId}`);
  console.log(`   Gender: ${gender}`);
  console.log(`   Outfit: ${mainOutfit}`);
  
  // Only consider model images (model2_, model3_, etc.)
  const modelImages = allImages.filter(img => /^model\d+_/i.test(img));
  console.log(`\n📁 Found ${modelImages.length} model images total`);
  
  const usedImages = new Set([mainImageFilename]);
  const matches = [];
  
  // Check for similar outfit types (blouse ≈ top)
  const isSimilarOutfit = (mainType, imgType) => {
    if (!mainType || !imgType) return false;
    if (mainType === imgType) return true;
    // Tops and blouses are similar
    if ((mainType === 'blouse' || mainType === 'top') && (imgType === 'blouse' || imgType === 'top')) return true;
    // Shirts and blouses can be similar
    if ((mainType === 'blouse' || mainType === 'shirt') && (imgType === 'blouse' || imgType === 'shirt')) return true;
    return false;
  };
  
  // Strategy 1: Same photo session ID + same gender + similar outfit (BEST)
  console.log(`\n🎯 Strategy 1: Same photo session + gender + similar outfit`);
  for (const img of modelImages) {
    if (usedImages.has(img)) continue;
    
    const imgPhotoId = extractPhotoId(img);
    const imgGender = extractGender(img);
    const imgOutfit = extractOutfitType(img);
    
    if (isSamePhotoSession(imgPhotoId, mainPhotoId) && imgGender === gender && isSimilarOutfit(mainOutfit, imgOutfit)) {
      console.log(`   ✅ Match: ${img} (Photo ID: ${imgPhotoId}, Outfit: ${imgOutfit})`);
      matches.push({ img, score: 100, reason: 'same_session+gender+outfit' });
      usedImages.add(img);
    }
  }
  
  // Strategy 2: Same photo session ID + same gender (any outfit)
  if (matches.length < 3) {
    console.log(`\n🎯 Strategy 2: Same photo session + gender (any outfit)`);
    for (const img of modelImages) {
      if (usedImages.has(img)) continue;
      if (matches.length >= 3) break;
      
      const imgPhotoId = extractPhotoId(img);
      const imgGender = extractGender(img);
      
      if (isSamePhotoSession(imgPhotoId, mainPhotoId) && imgGender === gender) {
        const imgOutfit = extractOutfitType(img);
        console.log(`   ✅ Match: ${img} (Photo ID: ${imgPhotoId}, Outfit: ${imgOutfit})`);
        matches.push({ img, score: 90, reason: 'same_session+gender' });
        usedImages.add(img);
      }
    }
  }
  
  // Strategy 3: Same gender + similar outfit type
  if (matches.length < 3) {
    console.log(`\n🎯 Strategy 3: Same gender + similar outfit type`);
    for (const img of modelImages) {
      if (usedImages.has(img)) continue;
      if (matches.length >= 3) break;
      
      const imgGender = extractGender(img);
      const imgOutfit = extractOutfitType(img);
      
      if (imgGender === gender && isSimilarOutfit(mainOutfit, imgOutfit)) {
        console.log(`   ✅ Match: ${img} (Gender: ${imgGender}, Outfit: ${imgOutfit})`);
        matches.push({ img, score: 70, reason: 'gender+outfit' });
        usedImages.add(img);
      }
    }
  }
  
  // Strategy 4: Same gender only (as fallback, but only for upper body items)
  if (matches.length < 3 && ['blouse', 'top', 'shirt', 'hoodie', 'sweater', 'jacket'].includes(mainOutfit)) {
    console.log(`\n🎯 Strategy 4: Same gender + upper body items`);
    for (const img of modelImages) {
      if (usedImages.has(img)) continue;
      if (matches.length >= 3) break;
      
      const imgGender = extractGender(img);
      const imgOutfit = extractOutfitType(img);
      
      // Only match with other upper body items
      if (imgGender === gender && ['blouse', 'top', 'shirt', 'hoodie', 'sweater', 'jacket', 'dress'].includes(imgOutfit)) {
        console.log(`   ✅ Match: ${img} (Gender: ${imgGender}, Outfit: ${imgOutfit})`);
        matches.push({ img, score: 50, reason: 'gender+upper_body' });
        usedImages.add(img);
      }
    }
  }
  
  // Sort by score (higher is better) and take top 3
  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, 3);
}

async function main() {
  const slug = process.argv[2];
  
  if (!slug) {
    console.error('❌ Please provide a product slug');
    console.error('Usage: node scripts/fix-single-product-images.js <product_slug>');
    process.exit(1);
  }
  
  console.log(`\n🚀 Fixing model images for product: ${slug}\n`);
  
  const token = await getAccessToken();
  console.log('✅ Authenticated with Directus\n');
  
  const product = await getProductBySlug(token, slug);
  
  if (!product) {
    console.error(`❌ Product not found: ${slug}`);
    process.exit(1);
  }
  
  console.log(`📦 Found product:`);
  console.log(`   ID: ${product.id}`);
  console.log(`   Name: ${product.name}`);
  console.log(`   Gender: ${product.gender}`);
  console.log(`   Image URL: ${product.image_url}`);
  console.log(`   Current model_image_1_url: ${product.model_image_1_url || 'none'}`);
  console.log(`   Current model_image_2_url: ${product.model_image_2_url || 'none'}`);
  console.log(`   Current model_image_3_url: ${product.model_image_3_url || 'none'}`);
  
  // Get main image filename
  const mainImageFilename = product.image_url ? product.image_url.split('/').pop() : null;
  
  if (!mainImageFilename) {
    console.error('❌ Product has no main image');
    process.exit(1);
  }
  
  // Get all extracted images
  const allImages = getExtractedImages();
  console.log(`\n📁 Found ${allImages.length} extracted images on disk`);
  
  // Find best matching model images
  const gender = (product.gender || '').toLowerCase();
  const matches = findBestModelImages(mainImageFilename, gender, allImages);
  
  console.log(`\n✨ Best matches found: ${matches.length}`);
  matches.forEach((m, idx) => {
    console.log(`   ${idx + 1}. ${m.img} (score: ${m.score}, reason: ${m.reason})`);
  });
  
  // Prepare updates
  const updates = {};
  if (matches[0]) updates.model_image_1_url = `/products/extracted/${matches[0].img}`;
  if (matches[1]) updates.model_image_2_url = `/products/extracted/${matches[1].img}`;
  if (matches[2]) updates.model_image_3_url = `/products/extracted/${matches[2].img}`;
  
  // Clear any slots that don't have matches
  if (!matches[0]) updates.model_image_1_url = null;
  if (!matches[1]) updates.model_image_2_url = null;
  if (!matches[2]) updates.model_image_3_url = null;
  
  console.log(`\n📝 Updates to apply:`);
  console.log(JSON.stringify(updates, null, 2));
  
  // Ask for confirmation (or use --yes flag to skip)
  if (!process.argv.includes('--yes')) {
    console.log(`\n⚠️  Add --yes flag to apply these changes automatically`);
    console.log(`   Example: node scripts/fix-single-product-images.js ${slug} --yes`);
    return;
  }
  
  // Apply updates
  await updateProduct(token, product.id, updates);
  console.log(`\n✅ Product updated successfully!`);
  
  // Verify the update
  const updatedProduct = await getProductBySlug(token, slug);
  console.log(`\n📋 Verified update:`);
  console.log(`   model_image_1_url: ${updatedProduct.model_image_1_url || 'none'}`);
  console.log(`   model_image_2_url: ${updatedProduct.model_image_2_url || 'none'}`);
  console.log(`   model_image_3_url: ${updatedProduct.model_image_3_url || 'none'}`);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
