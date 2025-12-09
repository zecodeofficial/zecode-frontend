#!/usr/bin/env node
/**
 * Fetch all image references from Directus
 * This will show us which Cloudinary images are actually in use
 */

const https = require('https');

const DIRECTUS_URL = 'https://zecode-directus.onrender.com';

async function fetchFromDirectus(endpoint) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint, DIRECTUS_URL);

        const options = {
            hostname: url.hostname,
            port: url.port || 80,
            path: url.pathname + url.search,
            method: 'GET',
        };

        const req = (url.protocol === 'https:' ? https : require('http')).request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function main() {
    console.log('\n📋 Fetching image references from Directus...\n');

    const imageReferences = new Set();

    try {
        // Fetch products
        console.log('Fetching products...');
        const productsData = await fetchFromDirectus('/items/products?limit=-1&fields=id,name,image,image_url,model_image_1,model_image_2,model_image_3');
        const products = productsData.data || [];

        console.log(`✓ Found ${products.length} products\n`);

        // Extract image paths
        products.forEach(product => {
            [product.image, product.image_url, product.model_image_1, product.model_image_2, product.model_image_3]
                .filter(Boolean)
                .forEach(img => {
                    if (typeof img === 'string') {
                        // Extract the path from Cloudinary URL or local path
                        if (img.includes('cloudinary.com')) {
                            const match = img.match(/\/zecode\/(.+?)(?:\?|$)/);
                            if (match) {
                                imageReferences.add(`zecode/${match[1]}`);
                            }
                        } else if (img.startsWith('/')) {
                            const cleanPath = img.replace(/^\//, '').replace(/\.[^.]+$/, '');
                            imageReferences.add(cleanPath);
                        }
                    }
                });
        });

        // Fetch hero slides
        console.log('Fetching hero slides...');
        const heroData = await fetchFromDirectus('/items/hero_slides?limit=-1&fields=image');
        const heroSlides = heroData.data || [];

        console.log(`✓ Found ${heroSlides.length} hero slides\n`);

        heroSlides.forEach(slide => {
            if (slide.image && typeof slide.image === 'string') {
                if (slide.image.includes('cloudinary.com')) {
                    const match = slide.image.match(/\/zecode\/(.+?)(?:\?|$)/);
                    if (match) {
                        imageReferences.add(`zecode/${match[1]}`);
                    }
                } else if (slide.image.startsWith('/')) {
                    const cleanPath = slide.image.replace(/^\//, '').replace(/\.[^.]+$/, '');
                    imageReferences.add(cleanPath);
                }
            }
        });

        console.log(`\n📊 Summary:\n`);
        console.log(`Total unique image references in Directus: ${imageReferences.size}\n`);

        console.log('Referenced images:');
        const sortedRefs = Array.from(imageReferences).sort();
        sortedRefs.forEach(ref => {
            console.log(`  - ${ref}`);
        });

        // Save to file
        const fs = require('fs');
        fs.writeFileSync('directus-image-references.json', JSON.stringify({
            timestamp: new Date().toISOString(),
            total_references: imageReferences.size,
            references: sortedRefs
        }, null, 2));

        console.log(`\n✓ Saved to: directus-image-references.json\n`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();
