import ProductDetailContent from '@/components/ProductDetailContent';
import { fetchProductBySlug, fileUrl, type Product } from '@/lib/directus';
import { notFound } from 'next/navigation';

// Revalidate product pages every 10 seconds for faster updates during debugging
export const revalidate = 10;

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const productSlug = slug;
    
    // Log before fetch
    console.log(`[ProductPage] Fetching product with slug: ${productSlug}`);
    
    const product = await fetchProductBySlug(productSlug);
    
    // Log after fetch
    console.log(`[ProductPage] Product fetched:`, {
        id: product?.id,
        name: product?.name,
        hasModelImage1: !!product?.model_image_1,
        hasModelImage2: !!product?.model_image_2,
        hasModelImage3: !!product?.model_image_3,
        modelImage1Type: typeof product?.model_image_1,
        modelImage1IsObject: product?.model_image_1 && typeof product?.model_image_1 === 'object'
    });

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
        // Handle both UUID strings and full file objects from Directus
        const modelImageFields = [p.model_image_1, p.model_image_2, p.model_image_3]
            .filter(Boolean)
            .map(img => {
                // If it's already a string (UUID), use it directly
                if (typeof img === 'string') {
                    return fileUrl(img);
                }
                // If it's an object (full file from Directus), extract the ID
                if (img && typeof img === 'object' && img !== null && 'id' in img) {
                    const fileObj = img as { id: string };
                    return fileUrl(fileObj.id);
                }
                return null;
            })
            .filter((url): url is string => typeof url === 'string' && url !== null);
        
        // Add model images that aren't already in the gallery
        modelImageFields.forEach(modelImg => {
            if (modelImg && !galleryRaw.includes(modelImg)) {
                galleryRaw.push(modelImg);
            }
        });

        // Debug: Log raw model image data - ALWAYS log (not just dev)
        console.log(`[Product ${p.id}] Raw model images:`, {
            model_image_1: p.model_image_1,
            model_image_1_type: typeof p.model_image_1,
            model_image_1_has_id: p.model_image_1 && typeof p.model_image_1 === 'object' && 'id' in p.model_image_1,
            model_image_2: p.model_image_2,
            model_image_2_type: typeof p.model_image_2,
            model_image_2_has_id: p.model_image_2 && typeof p.model_image_2 === 'object' && 'id' in p.model_image_2,
            model_image_3: p.model_image_3,
            model_image_3_type: typeof p.model_image_3,
            model_image_3_has_id: p.model_image_3 && typeof p.model_image_3 === 'object' && 'id' in p.model_image_3,
            modelImageFieldsCount: modelImageFields.length,
            modelImageFields
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

        const finalGallery = galleryUrls.length > 0 ? galleryUrls : [fileUrl(displayImage) || displayImage].filter(Boolean);
        const finalImage = fileUrl(displayImage) || displayImage;

        // Debug logging - always log to help diagnose production issues
        console.log(`[Product ${p.id}] Final gallery:`, {
            galleryRawCount: galleryRaw.length,
            uniqueGalleryCount: uniqueGallery.length,
            galleryUrlsCount: galleryUrls.length,
            finalGalleryCount: finalGallery.length,
            finalGallery,
            finalImage
        });
        
        // CRITICAL: If gallery is empty or only has 1 image, log warning
        if (finalGallery.length <= 1) {
            console.error(`[Product ${p.id}] WARNING: Gallery only has ${finalGallery.length} image(s)!`, {
                model_image_1_type: typeof p.model_image_1,
                model_image_1_value: p.model_image_1,
                model_image_2_type: typeof p.model_image_2,
                model_image_2_value: p.model_image_2,
                model_image_3_type: typeof p.model_image_3,
                model_image_3_value: p.model_image_3,
                modelImageFields,
                galleryRaw,
                uniqueGallery,
                galleryUrls
            });
        }

        // Debug logging - always log to help diagnose production issues
        console.log(`[Product ${p.id}] Image normalization:`, {
            rawModelImages: {
                model_image_1: p.model_image_1,
                model_image_2: p.model_image_2,
                model_image_3: p.model_image_3,
            },
            modelImageFields,
            galleryRaw: galleryRaw.length,
            uniqueGallery: uniqueGallery.length,
            galleryUrls: galleryUrls.length,
            finalGallery: finalGallery.length,
            finalImage
        });

        const normalizedProduct = {
            id: p.id,
            name: p.name,
            // prefer category, fallback to gender or a safe string
            category: (p.category || p.gender_category || 'product') as string,
            categoryLabel: p.subcategory ?? undefined,
            price: (typeof p.sale_price === 'number' ? p.sale_price : (typeof p.price === 'number' ? p.price : null)),
            originalPrice: typeof p.price === 'number' ? p.price : undefined,
            image: finalImage,
            gallery: finalGallery,
            description: p.description ?? '',
            sizes: p.sizes ?? undefined,
            rating: undefined,
            reviewCount: undefined,
        };

        // Final check - log what we're actually returning
        console.log(`[Product ${p.id}] Returning normalized product:`, {
            galleryLength: normalizedProduct.gallery.length,
            gallery: normalizedProduct.gallery,
            image: normalizedProduct.image
        });

        return normalizedProduct;
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
