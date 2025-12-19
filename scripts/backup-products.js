/**
 * Product Catalogue Backup Script
 * 
 * Exports all products from Directus to CSV with full field details.
 * Creates timestamped backups in the data/backups folder.
 * 
 * Usage:
 *   node scripts/backup-products.js           # Create backup now
 *   node scripts/backup-products.js --restore <file>  # Restore from backup
 * 
 * For daily backups, add to cron or Windows Task Scheduler:
 *   0 2 * * * cd /path/to/project && node scripts/backup-products.js
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

const BACKUP_DIR = path.join(__dirname, '..', 'data', 'backups');
const LATEST_BACKUP = path.join(__dirname, '..', 'data', 'product_catalogue_latest.csv');
const LATEST_JSON = path.join(__dirname, '..', 'data', 'product_catalogue_latest.json');

// All product fields in order
const PRODUCT_FIELDS = [
  'id',
  'status',
  'sort',
  'name',
  'slug',
  'category',
  'subcategory',
  'gender_category',
  'gender',
  'age_group',
  'price',
  'original_price',
  'image_url',
  'description',
  'sizes',
  'colors',
  'color',
  'pattern',
  'style',
  'sku',
  'featured',
  'new_arrival',
  'on_sale',
  'seo_title',
  'seo_description',
  'canonical_url',
  'product_gallery',
  'image',
  'model_image_1',
  'model_image_2',
  'model_image_3',
  'model_image_1_url',
  'model_image_2_url',
  'model_image_3_url',
  'main_image'
];

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
  const fields = PRODUCT_FIELDS.join(',');
  const response = await fetch(
    `${DIRECTUS_URL}/items/products?limit=-1&fields=${fields}`,
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

function escapeCSV(value) {
  if (value === null || value === undefined) {
    return '';
  }
  
  // Convert objects/arrays to JSON string
  if (typeof value === 'object') {
    value = JSON.stringify(value);
  }
  
  // Convert to string
  value = String(value);
  
  // Escape quotes and wrap in quotes if contains special characters
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    value = '"' + value.replace(/"/g, '""') + '"';
  }
  
  return value;
}

function productsToCSV(products) {
  const header = PRODUCT_FIELDS.join(',');
  const rows = products.map(product => {
    return PRODUCT_FIELDS.map(field => escapeCSV(product[field])).join(',');
  });
  
  return [header, ...rows].join('\n');
}

function getBackupFilename() {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `product_catalogue_${timestamp}.csv`;
}

async function createBackup() {
  console.log('🚀 Starting product catalogue backup...\n');

  // Ensure backup directory exists
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`📁 Created backup directory: ${BACKUP_DIR}\n`);
  }

  // Authenticate
  console.log('🔐 Authenticating with Directus...');
  const token = await getAccessToken();
  console.log('✅ Authenticated\n');

  // Fetch all products
  console.log('📦 Fetching all products...');
  const products = await getAllProducts(token);
  console.log(`✅ Found ${products.length} products\n`);

  // Generate CSV
  console.log('📝 Generating CSV...');
  const csv = productsToCSV(products);

  // Save timestamped backup
  const backupFilename = getBackupFilename();
  const backupPath = path.join(BACKUP_DIR, backupFilename);
  fs.writeFileSync(backupPath, csv, 'utf8');
  console.log(`✅ Saved backup: ${backupPath}\n`);

  // Save latest backup (overwrites previous)
  fs.writeFileSync(LATEST_BACKUP, csv, 'utf8');
  console.log(`✅ Updated latest: ${LATEST_BACKUP}\n`);

  // Save JSON version for easy restoration
  fs.writeFileSync(LATEST_JSON, JSON.stringify(products, null, 2), 'utf8');
  console.log(`✅ Updated JSON: ${LATEST_JSON}\n`);

  // Cleanup old backups (keep last 30)
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('product_catalogue_') && f.endsWith('.csv'))
    .sort()
    .reverse();

  if (backups.length > 30) {
    const toDelete = backups.slice(30);
    toDelete.forEach(file => {
      fs.unlinkSync(path.join(BACKUP_DIR, file));
      console.log(`🗑️  Deleted old backup: ${file}`);
    });
    console.log('');
  }

  // Summary
  console.log('='.repeat(60));
  console.log('📊 BACKUP SUMMARY');
  console.log('='.repeat(60));
  console.log(`Products exported: ${products.length}`);
  console.log(`Fields per product: ${PRODUCT_FIELDS.length}`);
  console.log(`Backup file: ${backupFilename}`);
  console.log(`File size: ${(fs.statSync(backupPath).size / 1024).toFixed(2)} KB`);
  console.log('='.repeat(60));

  return { products, backupPath };
}

async function restoreFromBackup(backupFile) {
  console.log(`🔄 Restoring from backup: ${backupFile}\n`);

  // Check if file exists
  let filePath = backupFile;
  if (!fs.existsSync(filePath)) {
    filePath = path.join(BACKUP_DIR, backupFile);
  }
  if (!fs.existsSync(filePath)) {
    throw new Error(`Backup file not found: ${backupFile}`);
  }

  // For JSON files, restore directly
  if (filePath.endsWith('.json')) {
    const products = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`📦 Loaded ${products.length} products from JSON\n`);
    
    // Authenticate
    console.log('🔐 Authenticating with Directus...');
    const token = await getAccessToken();
    console.log('✅ Authenticated\n');

    // Update each product
    console.log('🔄 Updating products in Directus...\n');
    let updated = 0;
    let errors = 0;

    for (const product of products) {
      try {
        const response = await fetch(`${DIRECTUS_URL}/items/products/${product.id}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(product)
        });

        if (response.ok) {
          updated++;
          process.stdout.write(`\r  Updated: ${updated}/${products.length}`);
        } else {
          errors++;
          console.log(`\n❌ Failed to update product ${product.id}: ${response.status}`);
        }
      } catch (error) {
        errors++;
        console.log(`\n❌ Error updating product ${product.id}: ${error.message}`);
      }
    }

    console.log('\n\n' + '='.repeat(60));
    console.log('📊 RESTORE SUMMARY');
    console.log('='.repeat(60));
    console.log(`Products updated: ${updated}`);
    console.log(`Errors: ${errors}`);
    console.log('='.repeat(60));
  } else {
    console.log('⚠️  CSV restore not implemented. Use JSON backup file instead.');
    console.log(`   Try: node scripts/backup-products.js --restore ${LATEST_JSON}`);
  }
}

async function main() {
  const args = process.argv.slice(2);

  try {
    if (args[0] === '--restore' && args[1]) {
      await restoreFromBackup(args[1]);
    } else if (args[0] === '--help') {
      console.log(`
Product Catalogue Backup Script

Usage:
  node scripts/backup-products.js              Create a new backup
  node scripts/backup-products.js --restore <file>  Restore from backup
  node scripts/backup-products.js --help       Show this help

Backup locations:
  - Timestamped: data/backups/product_catalogue_YYYY-MM-DDTHH-MM-SS.csv
  - Latest CSV:  data/product_catalogue_latest.csv
  - Latest JSON: data/product_catalogue_latest.json

For daily backups, add to crontab (Linux/Mac):
  0 2 * * * cd /path/to/zecode-frontend && node scripts/backup-products.js >> /var/log/zecode-backup.log 2>&1

Or Windows Task Scheduler:
  Action: node
  Arguments: scripts/backup-products.js
  Start in: C:\\path\\to\\zecode-frontend
      `);
    } else {
      await createBackup();
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
