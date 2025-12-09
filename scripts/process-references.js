const fs = require('fs');
const path = require('path');

const PRODUCTS_FILE = 'directus_products.json';
const SLIDES_FILE = 'directus_slides.json';
const OUTPUT_FILE = 'directus-image-references.json';

function normalizePath(urlOrPath) {
    if (!urlOrPath) return null;
    let cleanPath = urlOrPath;

    // Handle full URLs
    if (urlOrPath.startsWith('http')) {
        try {
            const urlObj = new URL(urlOrPath);
            // If it's cloudinary, extract the path after /upload/v<version>/
            if (urlObj.hostname.includes('cloudinary.com')) {
                const parts = urlObj.pathname.split('/upload/');
                if (parts.length > 1) {
                    const pathParts = parts[1].split('/');
                    // Remove version if present (starts with v)
                    if (pathParts[0].startsWith('v')) {
                        pathParts.shift();
                    }
                    cleanPath = pathParts.join('/');
                }
            } else {
                cleanPath = urlObj.pathname;
            }
        } catch (e) {
            // keep original if parsing fails
        }
    }

    // Remove leading slash
    if (cleanPath.startsWith('/')) {
        cleanPath = cleanPath.substring(1);
    }

    // Remove 'v' version prefix if it exists at the start of a path segment (Cloudinary specific)
    // Actually, Cloudinary paths usually don't have the version in the public_id itself

    return cleanPath;
}

try {
    const productsData = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
    const slidesData = JSON.parse(fs.readFileSync(SLIDES_FILE, 'utf8'));

    const references = new Set();

    // Process Products
    if (productsData.data) {
        productsData.data.forEach(product => {
            const fields = ['image', 'image_url', 'model_image_1', 'model_image_2', 'model_image_3'];
            fields.forEach(field => {
                const val = product[field];
                if (val && typeof val === 'string') {
                    const normalized = normalizePath(val);
                    if (normalized) references.add(normalized);
                } else if (val && typeof val === 'object' && val.id) {
                    // Handle directus file object if expanded
                    references.add(val.id);
                }
            });
        });
    }

    // Process Slides
    if (slidesData.data) {
        slidesData.data.forEach(slide => {
            const val = slide.image;
            if (val && typeof val === 'string') {
                const normalized = normalizePath(val);
                if (normalized) references.add(normalized);
            } else if (val && typeof val === 'object' && val.id) {
                references.add(val.id);
            }
        });
    }

    const sortedReferences = Array.from(references).sort();

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(sortedReferences, null, 2));

    console.log(`Successfully extracted ${sortedReferences.length} unique image references to ${OUTPUT_FILE}`);

} catch (err) {
    console.error('Error processing files:', err);
    process.exit(1);
}
