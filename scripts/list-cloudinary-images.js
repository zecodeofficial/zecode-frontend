#!/usr/bin/env node
/**
 * Simple Cloudinary Image Lister
 * Lists all images in Cloudinary for manual review
 */

const https = require('https');

const CLOUDINARY_CLOUD_NAME = 'ds8llatku';
const CLOUDINARY_API_KEY = '971894795293264';
const CLOUDINARY_API_SECRET = 'WHvkWvyT05tpFizK-Uha7d2-xX4';

async function fetchCloudinaryImages() {
    return new Promise((resolve, reject) => {
        const auth = Buffer.from(`${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}`).toString('base64');

        const options = {
            hostname: 'api.cloudinary.com',
            path: `/v1_1/${CLOUDINARY_CLOUD_NAME}/resources/image?type=upload&prefix=zecode&max_results=500`,
            method: 'GET',
            headers: {
                'Authorization': `Basic ${auth}`
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve(result);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

async function main() {
    console.log('\n📦 Fetching images from Cloudinary...\n');

    try {
        const result = await fetchCloudinaryImages();
        const images = result.resources || [];

        console.log(`✓ Found ${images.length} images\n`);
        console.log('Images in Cloudinary:\n');

        let totalSize = 0;
        images.forEach((img, index) => {
            const sizeKB = (img.bytes / 1024).toFixed(2);
            totalSize += img.bytes;
            console.log(`${index + 1}. ${img.public_id}`);
            console.log(`   Size: ${sizeKB} KB`);
            console.log(`   URL: ${img.secure_url}`);
            console.log('');
        });

        console.log(`\nTotal: ${images.length} images`);
        console.log(`Total Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB\n`);

        // Save to file
        const fs = require('fs');
        const report = {
            timestamp: new Date().toISOString(),
            total_images: images.length,
            total_size_mb: (totalSize / 1024 / 1024).toFixed(2),
            images: images.map(img => ({
                public_id: img.public_id,
                url: img.secure_url,
                size_kb: (img.bytes / 1024).toFixed(2),
                created_at: img.created_at
            }))
        };

        fs.writeFileSync('cloudinary-images.json', JSON.stringify(report, null, 2));
        console.log('✓ Report saved to: cloudinary-images.json\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();
