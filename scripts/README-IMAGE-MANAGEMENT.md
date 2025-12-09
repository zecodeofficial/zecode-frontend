# Manual Product Image Management

This tool allows you to manually assign and verify images for each product page.

## Usage

```bash
node scripts/manage-product-images.js
```

## Features

1. **Search Products** - Find products by name, slug, or ID
2. **View Current Images** - See all images currently assigned to a product
3. **Update Images** - Manually assign new image URLs to products
4. **Clear Images** - Remove model images that don't match the product

## Workflow

### Step 1: Search for Product
Enter a product name, slug, or ID to find the product you want to manage.

### Step 2: View Current Images
The tool will display:
- Product ID, name, and slug
- Main product image
- Model images 1, 2, and 3

### Step 3: Update Images
You can:
- **Update individual images** - Enter new URLs for specific image slots
- **Keep existing images** - Press Enter to skip updating an image
- **Clear model images** - Remove all model images at once

## Example Session

```
Enter product name, slug, or ID: blue jeans

📦 Found products:
1. [ID: 153] Women's Blue Slim Jeans (womens-blue-slim-jeans-153)

Select product number: 1

============================================================
PRODUCT DETAILS
============================================================
ID: 153
Name: Women's Blue Slim Jeans
Slug: womens-blue-slim-jeans-153

CURRENT IMAGES:
Main Image: /products/extracted-products/model2_female_blue_jeans__DSC4648_Large_5.png
Model Image 1: https://res.cloudinary.com/...
Model Image 2: https://res.cloudinary.com/...
Model Image 3: https://res.cloudinary.com/...
============================================================

What would you like to do?
1. Update images
2. Clear model images
3. Back to search
```

## Tips

- **Match Session IDs**: For best results, use images from the same photo session
- **Verify Before Updating**: Double-check image URLs before confirming
- **Clear Mismatched Images**: If model images show different outfits, clear them
- **Use Absolute Paths**: Ensure image URLs are complete and accessible

## Image Sources

Images can be:
- Local paths (e.g., `/products/extracted-products/...`)
- Cloudinary URLs (e.g., `https://res.cloudinary.com/...`)
- Any accessible image URL

## Safety

- All changes require confirmation before applying
- You can cancel at any time
- Original images are preserved until you explicitly update them
