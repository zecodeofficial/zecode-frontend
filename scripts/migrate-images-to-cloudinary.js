/**
 * Script to migrate all products from broken Directus image references
 * to Cloudinary URLs via the extracted images in public/products/extracted/
 * 
 * The Directus instance on Render uses ephemeral local storage, so uploaded
 * files are lost on service restart. This script fixes that by:
 * 1. Clearing the broken `image` and `main_image` fields
 * 2. Setting `image_url` to point to /products/extracted/<filename>.png
 * 
 * The frontend's fileUrl() function transforms these paths to Cloudinary URLs.
 * 
 * Usage: node scripts/migrate-images-to-cloudinary.js
 */

// Load environment variables from .env.local
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

// Disable SSL certificate verification (needed for some environments)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const fs = require('fs');
const path = require('path');
const https = require('https');

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://zecode-directus.onrender.com';
const DIRECTUS_EMAIL = process.env.DIRECTUS_EMAIL;
const DIRECTUS_PASSWORD = process.env.DIRECTUS_PASSWORD;

if (!DIRECTUS_EMAIL || !DIRECTUS_PASSWORD) {
  console.error('❌ Missing required environment variables: DIRECTUS_EMAIL and DIRECTUS_PASSWORD');
  console.error('   Set them in .env file or export them before running this script.');
  process.exit(1);
}

// Path to extracted images
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
    `${DIRECTUS_URL}/items/products?limit=-1&fields=id,name,slug,image,image_url,main_image,sku,gender,color,pattern,style`,
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

async function getFileMetadata(token, fileId) {
  try {
    const response = await fetch(`${DIRECTUS_URL}/files/${fileId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data;
  } catch (e) {
    return null;
  }
}

function getExtractedImages() {
  const files = fs.readdirSync(EXTRACTED_IMAGES_DIR);
  return files.filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'));
}

function normalizeString(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function findMatchingImage(product, extractedImages, fileMetadata) {
  // Strategy 1: Match by original filename from Directus metadata
  if (fileMetadata && fileMetadata.filename_download) {
    const originalName = fileMetadata.filename_download.replace(/\.[^.]+$/, '');
    const match = extractedImages.find(img => {
      const imgName = img.replace(/\.[^.]+$/, '');
      return imgName === originalName || imgName.includes(originalName) || originalName.includes(imgName);
    });
    if (match) return match;
  }

  // Strategy 2: Match by product attributes (gender, color, pattern)
  const gender = product.gender?.toLowerCase() || '';
  const color = product.color?.toLowerCase().replace(/\s+/g, '_') || '';
  
  // Build search patterns
  const patterns = [];
  
  if (gender && color) {
    patterns.push(`${gender}_${color}`);
  }
  
  // Find images that match the pattern
  for (const pattern of patterns) {
    const matches = extractedImages.filter(img => 
      img.toLowerCase().includes(pattern)
    );
    
    if (matches.length === 1) {
      return matches[0];
    }
  }

  return null;
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

async function main() {
  console.log('🚀 Starting image migration to Cloudinary...\n');

  // Get access token
  console.log('🔐 Authenticating with Directus...');
  const token = await getAccessToken();
  console.log('✅ Authenticated\n');

  // Get all products
  console.log('📦 Fetching all products...');
  const products = await getAllProducts(token);
  console.log(`✅ Found ${products.length} products\n`);

  // Get list of extracted images
  console.log('📁 Loading extracted images list...');
  const extractedImages = getExtractedImages();
  console.log(`✅ Found ${extractedImages.length} extracted images\n`);

  // Build a map of Directus file IDs to their metadata
  console.log('🔍 Fetching file metadata for products with Directus image references...');
  const fileMetadataMap = new Map();
  
  const productsWithDirectusImages = products.filter(p => p.image && !p.image_url);
  let fetchedCount = 0;
  
  for (const product of productsWithDirectusImages) {
    if (product.image) {
      const metadata = await getFileMetadata(token, product.image);
      if (metadata) {
        fileMetadataMap.set(product.image, metadata);
      }
      fetchedCount++;
      if (fetchedCount % 10 === 0) {
        process.stdout.write(`  Fetched ${fetchedCount}/${productsWithDirectusImages.length} file metadata...\r`);
      }
    }
  }
  console.log(`\n✅ Fetched metadata for ${fileMetadataMap.size} files\n`);

  // Process products
  const results = {
    skipped: [],      // Already has image_url
    matched: [],      // Found matching extracted image
    unmatched: [],    // No matching image found
    errors: []        // Update failed
  };

  console.log('🔄 Processing products...\n');

  for (const product of products) {
    // Skip if already has a valid image_url
    if (product.image_url && !product.image) {
      results.skipped.push({ id: product.id, name: product.name, reason: 'Already has image_url' });
      continue;
    }

    // Skip if no image reference at all
    if (!product.image && !product.image_url) {
      results.skipped.push({ id: product.id, name: product.name, reason: 'No image reference' });
      continue;
    }

    // Try to find matching extracted image
    const fileMetadata = product.image ? fileMetadataMap.get(product.image) : null;
    const matchingImage = findMatchingImage(product, extractedImages, fileMetadata);

    if (matchingImage) {
      const imagePath = `/products/extracted/${matchingImage}`;
      
      try {
        await updateProduct(token, product.id, {
          image: null,
          main_image: null,
          image_url: imagePath
        });
        
        results.matched.push({
          id: product.id,
          name: product.name,
          originalFile: fileMetadata?.filename_download || product.image,
          newImageUrl: imagePath
        });
        
        console.log(`✅ [${product.id}] ${product.name.substring(0, 50)}... → ${matchingImage}`);
      } catch (error) {
        results.errors.push({
          id: product.id,
          name: product.name,
          error: error.message
        });
        console.log(`❌ [${product.id}] ${product.name.substring(0, 50)}... - ${error.message}`);
      }
    } else {
      results.unmatched.push({
        id: product.id,
        name: product.name,
        directusFile: fileMetadata?.filename_download || product.image,
        gender: product.gender,
        color: product.color
      });
      console.log(`⚠️  [${product.id}] ${product.name.substring(0, 50)}... - No match found`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Matched & Updated: ${results.matched.length}`);
  console.log(`⏭️  Skipped:          ${results.skipped.length}`);
  console.log(`⚠️  Unmatched:        ${results.unmatched.length}`);
  console.log(`❌ Errors:           ${results.errors.length}`);
  console.log('='.repeat(60));

  // Save detailed results
  const reportPath = path.join(__dirname, '..', 'image-migration-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);

  // List unmatched products for manual review
  if (results.unmatched.length > 0) {
    console.log('\n⚠️  UNMATCHED PRODUCTS (require manual image assignment):');
    console.log('-'.repeat(60));
    for (const item of results.unmatched) {
      console.log(`  ID ${item.id}: ${item.name.substring(0, 60)}...`);
      console.log(`    Original file: ${item.directusFile || 'N/A'}`);
      console.log(`    Gender: ${item.gender || 'N/A'}, Color: ${item.color || 'N/A'}`);
    }
  }
}

main().catch(console.error);
