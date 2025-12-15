import ProductDetailContent from '@/components/ProductDetailContent';
import { fetchProductBySlug, fileUrl, type Product } from '@/lib/directus';
import { notFound } from 'next/navigation';

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const productSlug = slug;
    const product = await fetchProductBySlug(productSlug);

    if (!product) {
        notFound();
    }

    // Normalize Directus Product -> ProductDetailContent shape
    const normalized = ((): any => {
        const p: Product = product as Product;

        // LEGACY: p.images is string[] (URLs)
        // NEW: p.product_gallery is M2M array [{ directus_files_id: "uuid" }]

        let galleryRaw: (string | undefined)[] = [];

        // 1. Prioritize uploaded M2M images (New System - Repeater)
        if (p.product_gallery && Array.isArray(p.product_gallery) && p.product_gallery.length > 0) {
            p.product_gallery
                .map(item => item.directus_file)
                .filter((fileId): fileId is string => fileId != null && typeof fileId === 'string')
                .forEach((fileId) => {
                    // Convert UUID to full URL for consistency
                    galleryRaw.push(fileUrl(fileId));
                });
        }

        // 2. Add legacy images (URLs/Strings)
        if (p.images && Array.isArray(p.images) && p.images.length > 0) {
            galleryRaw = [...galleryRaw, ...p.images];
        }

        // 3. Fallback to main image (if not in gallery)
        const mainImage = p.image || p.image_url;
        if (mainImage && !galleryRaw.includes(mainImage)) {
            galleryRaw.unshift(mainImage);
        }

        // 4. Fallback: Use AI model images only if no gallery images exist
        if (galleryRaw.length === 0) {
            if (p.model_image_1) galleryRaw.push(p.model_image_1);
            if (p.model_image_2) galleryRaw.push(p.model_image_2);
            if (p.model_image_3) galleryRaw.push(p.model_image_3);
        }

        // Filter out nulls/undefined and duplicates
        const uniqueGallery = Array.from(new Set(galleryRaw.filter(Boolean)));

        // Determine main display image (first in gallery or fallback)
        const displayImage = uniqueGallery[0] || mainImage || '/placeholders/product-placeholder.png';

        return {
            id: p.id,
            name: p.name,
            // prefer category, fallback to gender or a safe string
            category: (p.category || p.gender_category || 'product') as string,
            categoryLabel: p.subcategory ?? undefined,
            price: (typeof p.sale_price === 'number' ? p.sale_price : (typeof p.price === 'number' ? p.price : null)),
            originalPrice: typeof p.price === 'number' ? p.price : undefined,
            image: fileUrl(displayImage),
            gallery: uniqueGallery.map((g) => fileUrl(g) || g),
            description: p.description ?? '',
            sizes: p.sizes ?? undefined,
            rating: undefined,
            reviewCount: undefined,
        };
    })();

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Product",
                        "name": normalized.name,
                        "image": normalized.image ? [`https://zecode-frontend.vercel.app${normalized.image}`] : [],
                        "description": normalized.description,
                        "brand": {
                            "@type": "Brand",
                            "name": "ZECODE"
                        },
                        "offers": {
                            "@type": "Offer",
                            "url": `https://zecode-frontend.vercel.app/product/${slug}`,
                            "priceCurrency": "INR", // Assumption as per verifying with user
                            "price": normalized.price,
                            "availability": "https://schema.org/InStock", // Defaulting to InStock as we don't have explicit inventory count in types
                            "itemCondition": "https://schema.org/NewCondition"
                        }
                    })
                }}
            />
            <ProductDetailContent product={normalized} />
        </>
    );
}
