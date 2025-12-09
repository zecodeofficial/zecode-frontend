#!/usr/bin/env node
/**
 * Compare Cloudinary images with Directus references
 * Identify unused images
 */

const fs = require('fs');
const path = require('path');

// Helper to extract filename without extension from a path string (handling forward slashes)
function getFilenameNoExt(filePath) {
    if (!filePath) return '';
    const name = filePath.split('/').pop(); // Get last segment
    // Remove extension if present
    const lastDotIndex = name.lastIndexOf('.');
    if (lastDotIndex === -1) return name;
    return name.substring(0, lastDotIndex);
}

// Load the data
try {
    const cloudinaryData = JSON.parse(fs.readFileSync('cloudinary-images.json', 'utf-8'));
    const directusData = JSON.parse(fs.readFileSync('directus-image-references.json', 'utf-8'));

    const cloudinaryImages = cloudinaryData.images.map(img => img.public_id);
    const directusReferences = new Set(directusData); // Expecting array of strings from directus-image-references.json

    // Build a Set of normalized Directus filenames (no extension)
    const directusFilenames = new Set();
    directusReferences.forEach(ref => {
        const filename = getFilenameNoExt(ref);
        if (filename) directusFilenames.add(filename);
    });

    console.log('\n🔍 Comparing Cloudinary images with Directus references...\n');
    console.log(`Cloudinary images: ${cloudinaryImages.length}`);
    console.log(`Directus references: ${directusReferences.size}`);
    console.log(`Directus unique filenames: ${directusFilenames.size}\n`);

    const unused = [];
    const used = [];

    cloudinaryData.images.forEach(img => {
        let isUsed = false;
        let matchReason = '';

        // 1. Exact match check
        if (directusReferences.has(img.public_id)) {
            isUsed = true;
            matchReason = 'Exact match';
        }

        // 2. Filename match (loose matching to handle path differences)
        if (!isUsed) {
            // Cloudinary public_id like 'folder/image.jpg' or 'folder/image'
            const publicIdFilename = getFilenameNoExt(img.public_id);

            if (directusFilenames.has(publicIdFilename)) {
                isUsed = true;
                matchReason = `Filename match (${publicIdFilename})`;
            }
        }

        if (isUsed) {
            used.push({
                public_id: img.public_id,
                reason: matchReason
            });
        } else {
            unused.push(img.public_id);
        }
    });

    console.log(`✓ Used images: ${used.length}`);
    console.log(`✓ Unused images: ${unused.length}\n`);

    if (unused.length > 0) {
        console.log('🗑️  Unused Images (not referenced in Directus):\n');

        // Group by folder
        const byFolder = {};
        unused.forEach(imgId => {
            const folder = imgId.split('/').slice(0, -1).join('/');
            if (!byFolder[folder]) byFolder[folder] = [];
            byFolder[folder].push(imgId);
        });

        Object.keys(byFolder).sort().forEach(folder => {
            console.log(`\n${folder}/ (${byFolder[folder].length} images):`);
            byFolder[folder].slice(0, 5).forEach(imgId => {
                const basename = imgId.split('/').pop();
                console.log(`  - ${basename}`);
            });
            if (byFolder[folder].length > 5) {
                console.log(`  ... and ${byFolder[folder].length - 5} more`);
            }
        });

        // Calculate size savings
        const unusedImagesFull = cloudinaryData.images.filter(img => unused.includes(img.public_id));
        const totalSize = unusedImagesFull.reduce((sum, img) => sum + parseFloat(img.size_kb), 0);

        console.log(`\n💾 Potential storage savings: ${(totalSize / 1024).toFixed(2)} MB\n`);

        // Save report
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total_cloudinary: cloudinaryImages.length,
                used: used.length,
                unused: unused.length,
                savings_mb: (totalSize / 1024).toFixed(2)
            },
            unused_images: unusedImagesFull.map(img => ({
                public_id: img.public_id,
                url: img.url,
                size_kb: img.size_kb
            })),
            unused_by_folder: byFolder
        };

        fs.writeFileSync('unused-images-report.json', JSON.stringify(report, null, 2));
        console.log('✓ Detailed report saved to: unused-images-report.json\n');

        // Create deletion list
        fs.writeFileSync('images-to-delete.txt', unused.join('\n'));
        console.log('✓ Deletion list saved to: images-to-delete.txt\n');
    } else {
        console.log('✨ No unused images found! Your library is clean.\n');
    }

    console.log('✅ Analysis complete!\n');

} catch (err) {
    console.error('Error reading files or processing:', err);
}
