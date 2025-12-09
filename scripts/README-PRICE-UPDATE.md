# Bulk Price Update Script

This script allows you to bulk update product prices in your Directus CMS.

## Prerequisites

1. **Node.js** installed on your system
2. **Directus admin credentials** (email/password or API token)
3. **axios package** - Install with: `npm install axios`

## Setup

### 1. Set Environment Variables

Create a `.env` file in the `scripts` directory or set these environment variables:

```bash
# Option 1: Using email/password
DIRECTUS_URL=http://127.0.0.1:8055
DIRECTUS_EMAIL=your-admin@email.com
DIRECTUS_PASSWORD=your-password

# Option 2: Using API token (recommended)
DIRECTUS_URL=http://127.0.0.1:8055
DIRECTUS_TOKEN=your-api-token
```

**To get an API token:**
1. Login to Directus admin panel
2. Go to Settings → Access Tokens
3. Create a new token with admin permissions
4. Copy the token and set it as `DIRECTUS_TOKEN`

### 2. Install Dependencies

```bash
cd scripts
npm install axios
```

## Usage Examples

### 1. Increase All Prices by 10% (Dry Run)

```bash
node scripts/bulk-update-prices.js --percentage=10 --dry-run
```

### 2. Decrease Women's Product Prices by 5%

```bash
node scripts/bulk-update-prices.js --percentage=-5 --gender=Women
```

### 3. Set All T-Shirts to ₹499

```bash
node scripts/bulk-update-prices.js --fixed-price=499 --subcategory=T-Shirt
```

### 4. Increase Prices for Products Between ₹500-₹1000 by 15%

```bash
node scripts/bulk-update-prices.js --percentage=15 --min-price=500 --max-price=1000
```

### 5. Import Prices from CSV

```bash
node scripts/bulk-update-prices.js --csv=prices.csv
```

**CSV Format:**
```csv
id,price
1,599
2,799
3,1299
```

Or using product slugs:
```csv
slug,price
blue-tshirt,599
red-dress,1299
```

## Command Line Options

### Price Update Methods (choose one)

- `--percentage=<number>` - Increase/decrease by percentage
  - Example: `--percentage=10` (10% increase)
  - Example: `--percentage=-5` (5% decrease)
  
- `--fixed-price=<number>` - Set all matching products to a fixed price
  - Example: `--fixed-price=499`
  
- `--csv=<file>` - Import prices from CSV file
  - Example: `--csv=prices.csv`

### Filters (optional)

- `--category=<category>` - Filter by category
  - Example: `--category=men`
  
- `--gender=<gender>` - Filter by gender
  - Example: `--gender=Women`
  
- `--subcategory=<subcat>` - Filter by subcategory
  - Example: `--subcategory=T-Shirt`
  
- `--min-price=<number>` - Only update products with price >= this value
  - Example: `--min-price=500`
  
- `--max-price=<number>` - Only update products with price <= this value
  - Example: `--max-price=2000`

### Other Options

- `--dry-run` - Preview changes without applying them
- `--help` - Show help message

## Common Use Cases

### Seasonal Sale (20% off on all products)

```bash
node scripts/bulk-update-prices.js --percentage=-20 --dry-run
# Review the changes, then run without --dry-run
node scripts/bulk-update-prices.js --percentage=-20
```

### Price Adjustment for Specific Category

```bash
# Increase men's jeans prices by 10%
node scripts/bulk-update-prices.js --percentage=10 --category=men --subcategory=Jeans
```

### Standardize Pricing Tiers

```bash
# Set all products under ₹600 to ₹599
node scripts/bulk-update-prices.js --fixed-price=599 --max-price=600
```

### Import Prices from Spreadsheet

1. Export your price list to CSV with columns: `id,price` or `slug,price`
2. Save as `prices.csv` in the scripts directory
3. Run:
```bash
node scripts/bulk-update-prices.js --csv=prices.csv --dry-run
# Review, then apply
node scripts/bulk-update-prices.js --csv=prices.csv
```

## Safety Tips

1. **Always use `--dry-run` first** to preview changes
2. **Backup your database** before bulk updates
3. **Test on a few products** first using filters
4. **Keep a record** of old prices (the script shows them in the preview)

## Troubleshooting

### Authentication Failed
- Check your `DIRECTUS_EMAIL` and `DIRECTUS_PASSWORD` or `DIRECTUS_TOKEN`
- Verify the `DIRECTUS_URL` is correct
- Ensure your account has admin permissions

### No Products Found
- Check your filter criteria
- Verify the category/gender/subcategory names match exactly (case-sensitive)
- Try without filters first to see all products

### CSV Import Issues
- Ensure CSV format is correct: `id,price` or `slug,price`
- Check for extra spaces or special characters
- Use the provided `example-prices.csv` as a template

## Need Help?

Run the script with `--help` for detailed usage information:
```bash
node scripts/bulk-update-prices.js --help
```
