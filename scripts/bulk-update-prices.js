#!/usr/bin/env node
/**
 * Bulk Price Update Script for Directus Products
 * 
 * This script allows you to bulk update product prices in your Directus CMS.
 * 
 * Features:
 * - Percentage increase/decrease
 * - Filter by category, gender, or subcategory
 * - Import prices from CSV
 * - Dry-run mode to preview changes
 * 
 * Usage:
 *   node scripts/bulk-update-prices.js --help
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://127.0.0.1:8055';
const DIRECTUS_EMAIL = process.env.DIRECTUS_EMAIL;
const DIRECTUS_PASSWORD = process.env.DIRECTUS_PASSWORD;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
    dryRun: args.includes('--dry-run'),
    help: args.includes('--help'),
    percentage: parseFloat(args.find(arg => arg.startsWith('--percentage='))?.split('=')[1]),
    fixedPrice: parseFloat(args.find(arg => arg.startsWith('--fixed-price='))?.split('=')[1]),
    category: args.find(arg => arg.startsWith('--category='))?.split('=')[1],
    gender: args.find(arg => arg.startsWith('--gender='))?.split('=')[1],
    subcategory: args.find(arg => arg.startsWith('--subcategory='))?.split('=')[1],
    csvFile: args.find(arg => arg.startsWith('--csv='))?.split('=')[1],
    minPrice: parseFloat(args.find(arg => arg.startsWith('--min-price='))?.split('=')[1]),
    maxPrice: parseFloat(args.find(arg => arg.startsWith('--max-price='))?.split('=')[1]),
};

// Help text
if (options.help) {
    console.log(`
Bulk Price Update Script for Directus Products

Usage:
  node scripts/bulk-update-prices.js [OPTIONS]

Options:
  --help                    Show this help message
  --dry-run                 Preview changes without applying them
  
  Price Update Methods (choose one):
  --percentage=<number>     Increase/decrease prices by percentage (e.g., --percentage=10 for 10% increase, --percentage=-5 for 5% decrease)
  --fixed-price=<number>    Set all matching products to a fixed price
  --csv=<file>              Import prices from CSV file (format: id,price or slug,price)
  
  Filters (optional):
  --category=<category>     Filter by category (e.g., --category=men)
  --gender=<gender>         Filter by gender (e.g., --gender=Women)
  --subcategory=<subcat>    Filter by subcategory (e.g., --subcategory=T-Shirt)
  --min-price=<number>      Only update products with price >= this value
  --max-price=<number>      Only update products with price <= this value

Environment Variables:
  DIRECTUS_URL              Directus API URL (default: http://127.0.0.1:8055)
  DIRECTUS_EMAIL            Admin email for authentication
  DIRECTUS_PASSWORD         Admin password for authentication
  DIRECTUS_TOKEN            Admin API token (alternative to email/password)

Examples:
  # Increase all prices by 10%
  node scripts/bulk-update-prices.js --percentage=10 --dry-run
  
  # Decrease women's product prices by 5%
  node scripts/bulk-update-prices.js --percentage=-5 --gender=Women
  
  # Set all T-Shirts to ₹499
  node scripts/bulk-update-prices.js --fixed-price=499 --subcategory=T-Shirt
  
  # Import prices from CSV
  node scripts/bulk-update-prices.js --csv=prices.csv
  
  # Increase prices for products between ₹500-₹1000 by 15%
  node scripts/bulk-update-prices.js --percentage=15 --min-price=500 --max-price=1000
`);
    process.exit(0);
}

// Authentication
let authToken = null;

async function authenticate() {
    if (DIRECTUS_TOKEN) {
        authToken = DIRECTUS_TOKEN;
        console.log('✓ Using API token for authentication');
        return;
    }

    if (!DIRECTUS_EMAIL || !DIRECTUS_PASSWORD) {
        console.error('❌ Error: Authentication required. Set DIRECTUS_EMAIL and DIRECTUS_PASSWORD or DIRECTUS_TOKEN environment variables.');
        process.exit(1);
    }

    try {
        const response = await axios.post(`${DIRECTUS_URL}/auth/login`, {
            email: DIRECTUS_EMAIL,
            password: DIRECTUS_PASSWORD,
        });
        authToken = response.data.data.access_token;
        console.log('✓ Authenticated successfully');
    } catch (error) {
        console.error('❌ Authentication failed:', error.response?.data?.errors?.[0]?.message || error.message);
        process.exit(1);
    }
}

// Fetch products with filters
async function fetchProducts() {
    const params = {
        limit: -1, // Get all products
    };

    if (options.category) params['filter[category][_eq]'] = options.category;
    if (options.gender) params['filter[gender_category][_eq]'] = options.gender;
    if (options.subcategory) params['filter[subcategory][_eq]'] = options.subcategory;

    try {
        const response = await axios.get(`${DIRECTUS_URL}/items/products`, {
            params,
            headers: { Authorization: `Bearer ${authToken}` },
        });

        let products = response.data.data || [];

        // Apply price range filters
        if (options.minPrice !== undefined) {
            products = products.filter(p => p.price >= options.minPrice);
        }
        if (options.maxPrice !== undefined) {
            products = products.filter(p => p.price <= options.maxPrice);
        }

        return products;
    } catch (error) {
        console.error('❌ Failed to fetch products:', error.response?.data?.errors?.[0]?.message || error.message);
        process.exit(1);
    }
}

// Calculate new price based on percentage
function calculatePercentagePrice(currentPrice, percentage) {
    return Math.round(currentPrice * (1 + percentage / 100));
}

// Update product price
async function updateProductPrice(productId, newPrice) {
    try {
        await axios.patch(
            `${DIRECTUS_URL}/items/products/${productId}`,
            { price: newPrice },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        return true;
    } catch (error) {
        console.error(`❌ Failed to update product ${productId}:`, error.response?.data?.errors?.[0]?.message || error.message);
        return false;
    }
}

// Parse CSV file
function parseCSV(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.trim().split('\n');
        const priceMap = new Map();

        // Skip header if present
        const startIndex = lines[0].toLowerCase().includes('id') || lines[0].toLowerCase().includes('slug') ? 1 : 0;

        for (let i = startIndex; i < lines.length; i++) {
            const [identifier, price] = lines[i].split(',').map(s => s.trim());
            if (identifier && price) {
                priceMap.set(identifier, parseFloat(price));
            }
        }

        return priceMap;
    } catch (error) {
        console.error('❌ Failed to parse CSV file:', error.message);
        process.exit(1);
    }
}

// Main execution
async function main() {
    console.log('\n🔧 Directus Bulk Price Update Tool\n');

    // Validate options
    if (!options.percentage && !options.fixedPrice && !options.csvFile) {
        console.error('❌ Error: Please specify a price update method (--percentage, --fixed-price, or --csv)');
        console.log('Run with --help for usage information');
        process.exit(1);
    }

    if (options.dryRun) {
        console.log('🔍 DRY RUN MODE - No changes will be applied\n');
    }

    // Authenticate
    await authenticate();

    // Fetch products
    console.log('\n📦 Fetching products...');
    const products = await fetchProducts();
    console.log(`✓ Found ${products.length} products matching filters\n`);

    if (products.length === 0) {
        console.log('No products to update. Exiting.');
        process.exit(0);
    }

    // Prepare updates
    const updates = [];

    if (options.csvFile) {
        // CSV import mode
        const priceMap = parseCSV(options.csvFile);
        console.log(`✓ Loaded ${priceMap.size} price entries from CSV\n`);

        for (const product of products) {
            const newPrice = priceMap.get(String(product.id)) || priceMap.get(product.slug);
            if (newPrice !== undefined) {
                updates.push({
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    oldPrice: product.price,
                    newPrice: newPrice,
                });
            }
        }
    } else if (options.percentage !== undefined) {
        // Percentage mode
        for (const product of products) {
            const newPrice = calculatePercentagePrice(product.price, options.percentage);
            updates.push({
                id: product.id,
                name: product.name,
                slug: product.slug,
                oldPrice: product.price,
                newPrice: newPrice,
            });
        }
    } else if (options.fixedPrice !== undefined) {
        // Fixed price mode
        for (const product of products) {
            updates.push({
                id: product.id,
                name: product.name,
                slug: product.slug,
                oldPrice: product.price,
                newPrice: options.fixedPrice,
            });
        }
    }

    // Display preview
    console.log('📋 Price Updates Preview:\n');
    console.log('ID\tProduct Name\t\t\tOld Price\tNew Price\tChange');
    console.log('─'.repeat(80));

    for (const update of updates.slice(0, 10)) {
        const change = update.newPrice - update.oldPrice;
        const changePercent = ((change / update.oldPrice) * 100).toFixed(1);
        const changeStr = change >= 0 ? `+₹${change} (+${changePercent}%)` : `₹${change} (${changePercent}%)`;
        console.log(`${update.id}\t${update.name.substring(0, 25).padEnd(25)}\t₹${update.oldPrice}\t₹${update.newPrice}\t${changeStr}`);
    }

    if (updates.length > 10) {
        console.log(`... and ${updates.length - 10} more products`);
    }

    console.log('─'.repeat(80));
    console.log(`\nTotal products to update: ${updates.length}`);

    const totalOldPrice = updates.reduce((sum, u) => sum + u.oldPrice, 0);
    const totalNewPrice = updates.reduce((sum, u) => sum + u.newPrice, 0);
    const totalChange = totalNewPrice - totalOldPrice;
    console.log(`Total value change: ₹${totalChange.toFixed(2)}\n`);

    if (options.dryRun) {
        console.log('✓ Dry run complete. No changes were applied.');
        console.log('Remove --dry-run flag to apply these changes.');
        process.exit(0);
    }

    // Apply updates
    console.log('🚀 Applying updates...\n');
    let successCount = 0;
    let failCount = 0;

    for (const update of updates) {
        const success = await updateProductPrice(update.id, update.newPrice);
        if (success) {
            successCount++;
            process.stdout.write(`\r✓ Updated ${successCount}/${updates.length} products`);
        } else {
            failCount++;
        }
    }

    console.log(`\n\n✅ Update complete!`);
    console.log(`   Success: ${successCount}`);
    if (failCount > 0) {
        console.log(`   Failed: ${failCount}`);
    }
}

// Run the script
main().catch(error => {
    console.error('\n❌ Unexpected error:', error.message);
    process.exit(1);
});
