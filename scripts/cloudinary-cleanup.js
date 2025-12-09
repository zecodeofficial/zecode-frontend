#!/usr/bin/env node
/**
 * Cloudinary Cleanup Script
 * 
 * This script identifies and removes unused images from your Cloudinary account
 * by comparing Cloudinary assets with images referenced in your Directus database.
 * 
 * Features:
 * - List all images in Cloudinary
 * - Compare with Directus database references
 * - Identify unused images
 * - Dry-run mode to preview deletions
 * - Batch delete unused images
 * 
 * Usage:
 *   node scripts/cloudinary-cleanup.js --help
 */

const axios = require('axios');
const crypto = require('crypto');

// Cloudinary Configuration
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'ds8llatku';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

// Directus Configuration
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://127.0.0.1:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;
const DIRECTUS_EMAIL = process.env.DIRECTUS_EMAIL;
const DIRECTUS_PASSWORD = process.env.DIRECTUS_PASSWORD;

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  help: args.includes('--help'),
  folder: args.find(arg => arg.startsWith('--folder='))?.split('=')[1] || 'zecode',
  listOnly: args.includes('--list-only'),
  deleteUnused: args.includes('--delete-unused'),
  exportReport: args.includes('--export-report'),
};

// Help text
if (options.help) {
  console.log(`
Cloudinary Cleanup Script

Usage:
  node scripts/cloudinary-cleanup.js [OPTIONS]

Options:
  --help                Show this help message
  --dry-run             Preview changes without deleting anything
  --list-only           Only list Cloudinary images, don't compare with Directus
  --delete-unused       Delete unused images (use with caution!)
  --export-report       Export detailed report to JSON file
  --folder=<name>       Cloudinary folder to analyze (default: zecode)

Environment Variables:
  CLOUDINARY_CLOUD_NAME Cloud name (default: ds8llatku)
  CLOUDINARY_API_KEY    Cloudinary API key (required)
  CLOUDINARY_API_SECRET Cloudinary API secret (required)
  DIRECTUS_URL          Directus API URL
  DIRECTUS_TOKEN        Directus admin token (or use EMAIL/PASSWORD)
  DIRECTUS_EMAIL        Directus admin email
  DIRECTUS_PASSWORD     Directus admin password

Examples:
  # List all images in Cloudinary
  node scripts/cloudinary-cleanup.js --list-only
  
  # Find unused images (dry-run)
  node scripts/cloudinary-cleanup.js --dry-run
  
  # Delete unused images
  node scripts/cloudinary-cleanup.js --delete-unused
  
  # Export detailed report
  node scripts/cloudinary-cleanup.js --export-report

IMPORTANT: Always run with --dry-run first to preview changes!
`);
  process.exit(0);
}

// Validate Cloudinary credentials
if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error('❌ Error: Cloudinary credentials required.');
  console.error('Set CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET environment variables.');
  process.exit(1);
}

// Directus authentication
let directusToken = null;

async function authenticateDirectus() {
  if (DIRECTUS_TOKEN) {
    directusToken = DIRECTUS_TOKEN;
    console.log('✓ Using Directus API token');
    return;
  }

  if (!DIRECTUS_EMAIL || !DIRECTUS_PASSWORD) {
    console.error('❌ Error: Directus authentication required.');
    console.error('Set DIRECTUS_TOKEN or DIRECTUS_EMAIL/DIRECTUS_PASSWORD.');
    process.exit(1);
  }

  try {
    const response = await axios.post(`${DIRECTUS_URL}/auth/login`, {
      email: DIRECTUS_EMAIL,
      password: DIRECTUS_PASSWORD,
    });
    directusToken = response.data.data.access_token;
    console.log('✓ Authenticated with Directus');
  } catch (error) {
    console.error('❌ Directus authentication failed:', error.message);
    process.exit(1);
  }
}

// Generate Cloudinary API signature
function generateSignature(params, apiSecret) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  return crypto.createHash('sha1').update(sortedParams + apiSecret).digest('hex');
}

// Fetch all images from Cloudinary
async function fetchCloudinaryImages() {
  console.log(`\n📦 Fetching images from Cloudinary folder: ${options.folder}...`);

  const allImages = [];
  let nextCursor = null;

  try {
    do {
      const params = {
        type: 'upload',
        prefix: options.folder,
        max_results: 500,
      };

      if (nextCursor) {
        params.next_cursor = nextCursor;
      }

      const auth = Buffer.from(`${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}`).toString('base64');

      const response = await axios.get(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/resources/image`,
        {
          params,
          headers: { Authorization: `Basic ${auth}` },
        }
      );

      const resources = response.data.resources || [];
      allImages.push(...resources);
      nextCursor = response.data.next_cursor;

      process.stdout.write(`\r✓ Fetched ${allImages.length} images...`);
    } while (nextCursor);

    console.log(`\n✓ Total images in Cloudinary: ${allImages.length}\n`);
    return allImages;
  } catch (error) {
    console.error('\n❌ Failed to fetch Cloudinary images:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Fetch all image references from Directus
async function fetchDirectusImageReferences() {
  console.log('📋 Fetching image references from Directus...\n');

  const imageReferences = new Set();

  try {
    // Fetch products
    const productsResponse = await axios.get(`${DIRECTUS_URL}/items/products`, {
      params: { limit: -1, fields: 'image,image_url,model_image_1,model_image_2,model_image_3' },
      headers: { Authorization: `Bearer ${directusToken}` },
    });

    const products = productsResponse.data.data || [];
    console.log(`✓ Checked ${products.length} products`);

    products.forEach(product => {
      [product.image, product.image_url, product.model_image_1, product.model_image_2, product.model_image_3]
        .filter(Boolean)
        .forEach(img => {
          // Extract Cloudinary public_id from URL or path
          if (typeof img === 'string') {
            // Handle Cloudinary URLs
            if (img.includes('cloudinary.com')) {
              const match = img.match(/\/zecode\/(.+?)(?:\.|$)/);
              if (match) imageReferences.add(`zecode/${match[1]}`);
            }
            // Handle local paths
            else if (img.startsWith('/')) {
              const cleanPath = img.replace(/^\//, '').replace(/\.[^.]+$/, '');
              imageReferences.add(cleanPath);
            }
          }
        });
    });

    // Fetch hero slides
    const heroResponse = await axios.get(`${DIRECTUS_URL}/items/hero_slides`, {
      params: { limit: -1, fields: 'image' },
      headers: { Authorization: `Bearer ${directusToken}` },
    });

    const heroSlides = heroResponse.data.data || [];
    console.log(`✓ Checked ${heroSlides.length} hero slides`);

    heroSlides.forEach(slide => {
      if (slide.image && typeof slide.image === 'string') {
        if (slide.image.includes('cloudinary.com')) {
          const match = slide.image.match(/\/zecode\/(.+?)(?:\.|$)/);
          if (match) imageReferences.add(`zecode/${match[1]}`);
        } else if (slide.image.startsWith('/')) {
          const cleanPath = slide.image.replace(/^\//, '').replace(/\.[^.]+$/, '');
          imageReferences.add(cleanPath);
        }
      }
    });

    console.log(`\n✓ Total unique image references: ${imageReferences.size}\n`);
    return imageReferences;
  } catch (error) {
    console.error('❌ Failed to fetch Directus references:', error.message);
    process.exit(1);
  }
}

// Compare and identify unused images
function identifyUnusedImages(cloudinaryImages, directusReferences) {
  console.log('🔍 Comparing Cloudinary images with Directus references...\n');

  const unused = [];
  const used = [];

  cloudinaryImages.forEach(image => {
    const publicId = image.public_id;
    const isReferenced = directusReferences.has(publicId);

    if (isReferenced) {
      used.push(image);
    } else {
      unused.push(image);
    }
  });

  return { unused, used };
}

// Delete images from Cloudinary
async function deleteCloudinaryImages(publicIds) {
  console.log(`\n🗑️  Deleting ${publicIds.length} images from Cloudinary...\n`);

  const batchSize = 100; // Cloudinary allows max 100 per batch
  let deletedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < publicIds.length; i += batchSize) {
    const batch = publicIds.slice(i, i + batchSize);

    try {
      const timestamp = Math.round(Date.now() / 1000);
      const params = {
        public_ids: batch,
        timestamp,
        api_key: CLOUDINARY_API_KEY,
      };

      const signature = generateSignature(params, CLOUDINARY_API_SECRET);

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/resources/image/upload`,
        {
          ...params,
          signature,
        }
      );

      deletedCount += batch.length;
      process.stdout.write(`\r✓ Deleted ${deletedCount}/${publicIds.length} images`);
    } catch (error) {
      failedCount += batch.length;
      console.error(`\n❌ Failed to delete batch:`, error.response?.data || error.message);
    }
  }

  console.log(`\n\n✅ Deletion complete: ${deletedCount} deleted, ${failedCount} failed\n`);
}

// Export report to JSON
function exportReport(unused, used) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total_cloudinary_images: unused.length + used.length,
      used_images: used.length,
      unused_images: unused.length,
      storage_savings_mb: (unused.reduce((sum, img) => sum + (img.bytes || 0), 0) / 1024 / 1024).toFixed(2),
    },
    unused_images: unused.map(img => ({
      public_id: img.public_id,
      url: img.secure_url,
      size_kb: ((img.bytes || 0) / 1024).toFixed(2),
      created_at: img.created_at,
    })),
  };

  const fs = require('fs');
  const filename = `cloudinary-cleanup-report-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report exported to: ${filename}\n`);
}

// Main execution
async function main() {
  console.log('\n🧹 Cloudinary Cleanup Tool\n');
  console.log(`Cloud: ${CLOUDINARY_CLOUD_NAME}`);
  console.log(`Folder: ${options.folder}\n`);

  if (options.dryRun) {
    console.log('🔍 DRY RUN MODE - No deletions will be performed\n');
  }

  // Fetch Cloudinary images
  const cloudinaryImages = await fetchCloudinaryImages();

  if (options.listOnly) {
    console.log('📋 Cloudinary Images:\n');
    cloudinaryImages.slice(0, 20).forEach(img => {
      console.log(`  ${img.public_id} (${(img.bytes / 1024).toFixed(2)} KB)`);
    });
    if (cloudinaryImages.length > 20) {
      console.log(`  ... and ${cloudinaryImages.length - 20} more`);
    }
    process.exit(0);
  }

  // Authenticate with Directus
  await authenticateDirectus();

  // Fetch Directus references
  const directusReferences = await fetchDirectusImageReferences();

  // Compare and identify unused
  const { unused, used } = identifyUnusedImages(cloudinaryImages, directusReferences);

  // Display results
  console.log('📊 Analysis Results:\n');
  console.log(`  Total images in Cloudinary: ${cloudinaryImages.length}`);
  console.log(`  Used images (referenced): ${used.length}`);
  console.log(`  Unused images: ${unused.length}`);

  const unusedSizeMB = (unused.reduce((sum, img) => sum + (img.bytes || 0), 0) / 1024 / 1024).toFixed(2);
  console.log(`  Storage savings: ${unusedSizeMB} MB\n`);

  if (unused.length > 0) {
    console.log('🗑️  Unused Images (sample):');
    unused.slice(0, 10).forEach(img => {
      console.log(`  - ${img.public_id} (${(img.bytes / 1024).toFixed(2)} KB)`);
    });
    if (unused.length > 10) {
      console.log(`  ... and ${unused.length - 10} more\n`);
    }
  }

  // Export report if requested
  if (options.exportReport) {
    exportReport(unused, used);
  }

  // Delete if requested
  if (options.deleteUnused && unused.length > 0) {
    if (options.dryRun) {
      console.log('✓ Dry run complete. Would delete ' + unused.length + ' images.');
      console.log('Remove --dry-run to actually delete these images.');
    } else {
      const publicIds = unused.map(img => img.public_id);
      await deleteCloudinaryImages(publicIds);
    }
  } else if (!options.deleteUnused && unused.length > 0) {
    console.log('💡 To delete these unused images, run with --delete-unused flag');
    console.log('   (Always use --dry-run first!)');
  }

  console.log('\n✅ Cleanup analysis complete!\n');
}

// Run the script
main().catch(error => {
  console.error('\n❌ Unexpected error:', error.message);
  process.exit(1);
});
