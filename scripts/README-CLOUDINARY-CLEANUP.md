# Cloudinary Cleanup Script

This script helps you identify and remove unused images from your Cloudinary account by comparing Cloudinary assets with images referenced in your Directus database.

## Prerequisites

1. **Node.js** installed
2. **Cloudinary account** with API credentials
3. **Directus admin credentials**
4. **axios package**: `npm install axios`

## Setup

### 1. Get Cloudinary API Credentials

1. Login to [Cloudinary Dashboard](https://cloudinary.com/console)
2. Go to **Settings** → **Security** → **Access Keys**
3. Copy your **API Key** and **API Secret**

### 2. Set Environment Variables

```bash
# Cloudinary credentials (required)
CLOUDINARY_CLOUD_NAME=ds8llatku
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Directus credentials (required)
DIRECTUS_URL=http://127.0.0.1:8055
DIRECTUS_TOKEN=your-admin-token
# OR
DIRECTUS_EMAIL=admin@example.com
DIRECTUS_PASSWORD=your-password
```

## Usage

### Step 1: List All Cloudinary Images

```bash
node scripts/cloudinary-cleanup.js --list-only
```

This shows all images in your Cloudinary `zecode` folder.

### Step 2: Analyze (Dry Run)

```bash
node scripts/cloudinary-cleanup.js --dry-run
```

This will:
- Fetch all images from Cloudinary
- Fetch all image references from Directus (products, hero slides)
- Compare and identify unused images
- Show potential storage savings
- **NOT delete anything**

### Step 3: Export Detailed Report

```bash
node scripts/cloudinary-cleanup.js --export-report --dry-run
```

Creates a JSON file with:
- List of all unused images
- Storage savings calculation
- Image URLs and sizes
- Timestamps

### Step 4: Delete Unused Images

**⚠️ IMPORTANT: Always run with `--dry-run` first!**

```bash
# First, preview what will be deleted
node scripts/cloudinary-cleanup.js --delete-unused --dry-run

# Then, actually delete
node scripts/cloudinary-cleanup.js --delete-unused
```

## Command Line Options

- `--help` - Show help message
- `--dry-run` - Preview changes without deleting
- `--list-only` - Only list Cloudinary images
- `--delete-unused` - Delete unused images
- `--export-report` - Export detailed JSON report
- `--folder=<name>` - Cloudinary folder to analyze (default: `zecode`)

## Examples

### Find Unused Images in Specific Folder

```bash
node scripts/cloudinary-cleanup.js --folder=products --dry-run
```

### Complete Cleanup Workflow

```bash
# 1. Analyze and export report
node scripts/cloudinary-cleanup.js --export-report --dry-run

# 2. Review the JSON report file

# 3. Delete unused images
node scripts/cloudinary-cleanup.js --delete-unused
```

## What Gets Checked

The script checks for image references in:
- **Products**: `image`, `image_url`, `model_image_1`, `model_image_2`, `model_image_3`
- **Hero Slides**: `image`

Images not referenced in any of these fields are considered unused.

## Safety Features

1. **Dry-run mode** - Preview before deleting
2. **Detailed reporting** - See exactly what will be deleted
3. **Batch processing** - Handles large numbers of images
4. **Error handling** - Continues even if some deletions fail

## Output Example

```
🧹 Cloudinary Cleanup Tool

Cloud: ds8llatku
Folder: zecode

📦 Fetching images from Cloudinary folder: zecode...
✓ Total images in Cloudinary: 1,234

📋 Fetching image references from Directus...
✓ Checked 856 products
✓ Checked 5 hero slides
✓ Total unique image references: 789

🔍 Comparing Cloudinary images with Directus references...

📊 Analysis Results:

  Total images in Cloudinary: 1,234
  Used images (referenced): 789
  Unused images: 445
  Storage savings: 125.5 MB

🗑️  Unused Images (sample):
  - zecode/products/old_tshirt_001 (45.2 KB)
  - zecode/products/deleted_item_123 (67.8 KB)
  ... and 443 more

💡 To delete these unused images, run with --delete-unused flag
   (Always use --dry-run first!)
```

## Troubleshooting

### Authentication Failed
- Verify your Cloudinary API Key and Secret
- Check Directus credentials
- Ensure admin permissions

### No Images Found
- Check the `--folder` parameter
- Verify images exist in Cloudinary
- Check folder name matches (case-sensitive)

### Images Still Showing as Unused
- The script only checks products and hero slides
- If images are used elsewhere (categories, stores), they'll show as unused
- Review the report before deleting

## Important Notes

1. **Always backup** before bulk deletions
2. **Test with `--dry-run`** first
3. **Review the report** to ensure no important images are deleted
4. **Deletions are permanent** - Cloudinary doesn't have a recycle bin
5. **Consider keeping** some images for future use

## Need Help?

Run with `--help` for detailed usage information:
```bash
node scripts/cloudinary-cleanup.js --help
```
