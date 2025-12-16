import ProductDetailContent from '@/components/ProductDetailContent';
import { fetchProductBySlug, fileUrl, type Product } from '@/lib/directus';
import { notFound } from 'next/navigation';

// Revalidate product pages every 5 minutes (300 seconds)
export const revalidate = 300;

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

        // Build gallery from image fields
        let galleryRaw: (string | undefined)[] = [];

        // 1. Add legacy images array (URLs/Strings) if present
        if (p.images && Array.isArray(p.images) && p.images.length > 0) {
            galleryRaw = [...galleryRaw, ...p.images];
        }

        // 2. Add main image (prioritize UUID field, fallback to URL field)
        const mainImage = p.image || p.image_url;
        const mainImageUrl = mainImage ? (fileUrl(mainImage) || mainImage) : null;
        if (mainImageUrl && !galleryRaw.includes(mainImageUrl)) {
            galleryRaw.unshift(mainImageUrl);
        }

        // 3. Always include model images (uploaded via Directus) in the gallery
        const modelImages = [p.model_image_1, p.model_image_2, p.model_image_3]
            .filter(Boolean)
            .map(img => fileUrl(img) || img)
            .filter((url): url is string => typeof url === 'string' && url !== null);
        
        // Add model images that aren't already in the gallery
        modelImages.forEach(modelImg => {
            if (modelImg && !galleryRaw.includes(modelImg)) {
                galleryRaw.push(modelImg);
            }
        });

        // Filter out nulls/undefined and duplicates
        const uniqueGallery = Array.from(new Set(galleryRaw.filter(Boolean)));

        // Determine main display image (first in gallery or fallback)
        const displayImage = uniqueGallery[0] || mainImage || '/placeholders/product-placeholder.png';

        // Convert gallery URLs (handle both UUIDs and already-converted URLs)
        const galleryUrls = uniqueGallery
            .map((g) => {
                if (!g) return null;
                // If already a URL, return as-is; otherwise convert
                const url = typeof g === 'string' && g.startsWith('http') ? g : (fileUrl(g) || g);
                return url;
            })
            .filter((url): url is string => typeof url === 'string' && url !== null);

        return {
            id: p.id,
            name: p.name,
            // prefer category, fallback to gender or a safe string
            category: (p.category || p.gender_category || 'product') as string,
            categoryLabel: p.subcategory ?? undefined,
            price: (typeof p.sale_price === 'number' ? p.sale_price : (typeof p.price === 'number' ? p.price : null)),
            originalPrice: typeof p.price === 'number' ? p.price : undefined,
            image: fileUrl(displayImage) || displayImage,
            gallery: galleryUrls.length > 0 ? galleryUrls : [fileUrl(displayImage) || displayImage].filter(Boolean),
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
