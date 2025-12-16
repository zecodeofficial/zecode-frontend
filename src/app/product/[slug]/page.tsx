import ProductDetailContent from '@/components/ProductDetailContent';
import { fetchProductBySlug, fileUrl, type Product } from '@/lib/directus';
import { notFound } from 'next/navigation';

// Revalidate product pages every 10 seconds for faster updates during debugging
export const revalidate = 0; // Disable caching completely for debugging

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

// Ensure Node.js runtime
export const runtime = 'nodejs';

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
    console.error(`[ProductPage] ⚠️ COMPONENT STARTED - About to await params`);
    
    const { slug } = await params;
    const productSlug = slug;
    
    console.error(`[ProductPage] ⚠️ PARAMS RECEIVED - slug: ${productSlug}`);
    
    // Log before fetch
    console.error(`[ProductPage] ⚠️ About to fetch product with slug: ${productSlug}`);
    
    const product = await fetchProductBySlug(productSlug);
    
    console.error(`[ProductPage] ⚠️ PRODUCT FETCHED - id: ${product?.id}, exists: ${!!product}`);
    
    // Log after fetch
    console.error(`[ProductPage] ⚠️ Product details:`, {
        id: product?.id,
        name: product?.name,
        hasModelImage1: !!product?.model_image_1,
        hasModelImage2: !!product?.model_image_2,
        hasModelImage3: !!product?.model_image_3,
        modelImage1Type: typeof product?.model_image_1,
        modelImage1IsObject: product?.model_image_1 && typeof product?.model_image_1 === 'object'
    });

    if (!product) {
        console.error(`[ProductPage] ⚠️ PRODUCT NOT FOUND - calling notFound()`);
        notFound();
    }
    
    console.error(`[ProductPage] ⚠️ PRODUCT EXISTS - proceeding to normalization`);

    // Log product BEFORE normalization to see what we have
    const modelImage1 = product?.model_image_1;
    const modelImage2 = product?.model_image_2;
    const modelImage3 = product?.model_image_3;
    
    console.error(`[ProductPage] ⚠️ Product object BEFORE normalization:`, {
        id: product?.id,
        model_image_1: modelImage1,
        model_image_1_type: typeof modelImage1,
        model_image_1_isObject: modelImage1 && typeof modelImage1 === 'object',
        model_image_1_hasId: modelImage1 && typeof modelImage1 === 'object' && 'id' in modelImage1,
        model_image_1_keys: modelImage1 && typeof modelImage1 === 'object' ? Object.keys(modelImage1) : null,
        model_image_1_full: JSON.stringify(modelImage1),
        model_image_2: modelImage2,
        model_image_2_keys: modelImage2 && typeof modelImage2 === 'object' ? Object.keys(modelImage2) : null,
        model_image_3: modelImage3,
        model_image_3_keys: modelImage3 && typeof modelImage3 === 'object' ? Object.keys(modelImage3) : null
    });

    // Normalize Directus Product -> ProductDetailContent shape
    console.error(`[ProductPage] ⚠️ About to start normalization for product ${product?.id}`);
    
    let normalized: any;
    try {
        normalized = ((): any => {
        const p: Product = product as Product;

        // Log at start of normalization - USE console.error to ensure it shows
        console.error(`[Product ${p.id}] ⚠️ STARTING NORMALIZATION:`, {
            hasModelImage1: !!p.model_image_1,
            hasModelImage2: !!p.model_image_2,
            hasModelImage3: !!p.model_image_3,
            modelImage1Value: p.model_image_1,
            modelImage1Type: typeof p.model_image_1,
            modelImage1IsObject: p.model_image_1 && typeof p.model_image_1 === 'object',
            modelImage1HasId: p.model_image_1 && typeof p.model_image_1 === 'object' && 'id' in p.model_image_1
        });

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
        // Handle both UUID strings, full file objects, and URL fields from Directus
        console.error(`[Product ${p.id}] ⚠️ PROCESSING MODEL IMAGES - raw values:`, {
            model_image_1: p.model_image_1,
            model_image_1_type: typeof p.model_image_1,
            model_image_1_url: p.model_image_1_url,
            model_image_2: p.model_image_2,
            model_image_2_type: typeof p.model_image_2,
            model_image_2_url: p.model_image_2_url,
            model_image_3: p.model_image_3,
            model_image_3_type: typeof p.model_image_3,
            model_image_3_url: p.model_image_3_url
        });
        
        // CRITICAL: Check if model images exist before processing
        // Priority: UUID fields first, then URL fields as fallback
        const modelImagesArray = [
            p.model_image_1 || p.model_image_1_url,
            p.model_image_2 || p.model_image_2_url,
            p.model_image_3 || p.model_image_3_url
        ];
        console.error(`[Product ${p.id}] ⚠️ Model images array before filter:`, {
            length: modelImagesArray.length,
            items: modelImagesArray.map((img, idx) => ({
                index: idx,
                exists: !!img,
                type: typeof img,
                isObject: img && typeof img === 'object',
                hasId: img && typeof img === 'object' && 'id' in img
            }))
        });
        
        const modelImageFields = modelImagesArray
            .filter(Boolean)
            .map((img, idx) => {
                console.error(`[Product ${p.id}] ⚠️ Processing model_image_${idx + 1}:`, {
                    type: typeof img,
                    isObject: typeof img === 'object',
                    hasId: img && typeof img === 'object' && 'id' in img,
                    value: img,
                    isNull: img === null,
                    isUndefined: img === undefined,
                    isUrl: typeof img === 'string' && img.startsWith('http')
                });
                
                // If it's already a full URL (from _url fields), return it directly
                if (typeof img === 'string' && img.startsWith('http')) {
                    console.error(`[Product ${p.id}] ⚠️ model_image_${idx + 1} is already a URL:`, img);
                    return img;
                }
                
                // If it's already a string (UUID), use it directly
                if (typeof img === 'string') {
                    const url = fileUrl(img);
                    console.error(`[Product ${p.id}] ⚠️ model_image_${idx + 1} is string "${img}", converted to:`, url);
                    if (!url) {
                        console.error(`[Product ${p.id}] ⚠️ CRITICAL: fileUrl returned NULL for string "${img}"!`);
                    }
                    return url;
                }
                // If it's an object (full file from Directus), extract the ID
                if (img && typeof img === 'object' && img !== null) {
                    const keys = Object.keys(img);
                    
                    // CRITICAL: The object has an 'id' field directly (confirmed by Directus structure check)
                    // Extract ID - try multiple ways but prioritize direct 'id' field
                    const fileId = (img as any)?.id ?? (img as any)?.data?.id ?? (img as any)?.directus_files_id ?? null;
                    
                    if (fileId && typeof fileId === 'string') {
                        const url = fileUrl(fileId);
                        if (url) {
                            // SUCCESS - return the URL
                            return url;
                        } else {
                            // fileUrl returned null - this shouldn't happen but log it
                            console.error(`[Product ${p.id}] ⚠️ CRITICAL: fileUrl returned NULL for ID "${fileId}"!`);
                        }
                    } else {
                        // No valid ID found
                        console.error(`[Product ${p.id}] ⚠️ CRITICAL: model_image_${idx + 1} object has no valid ID! Keys: ${keys.join(', ')}, fileId: ${fileId}`);
                    }
                }
                console.error(`[Product ${p.id}] ⚠️ model_image_${idx + 1} could not be processed - type: ${typeof img}, value:`, img);
                return null;
            })
            .filter((url): url is string => typeof url === 'string' && url !== null);
        
        console.error(`[Product ${p.id}] ⚠️ Model images after processing:`, {
            count: modelImageFields.length,
            urls: modelImageFields
        });
        
        // CRITICAL: Add model images that aren't already in the gallery
        console.error(`[Product ${p.id}] ⚠️ Adding model images to gallery:`, {
            modelImageFieldsCount: modelImageFields.length,
            modelImageFields,
            galleryRawBefore: galleryRaw.length,
            galleryRawBeforeItems: galleryRaw
        });
        
        modelImageFields.forEach((modelImg, idx) => {
            if (modelImg && typeof modelImg === 'string' && modelImg.length > 0) {
                if (!galleryRaw.includes(modelImg)) {
                    console.error(`[Product ${p.id}] ⚠️ Adding model image ${idx + 1} to gallery:`, modelImg);
                    galleryRaw.push(modelImg);
                } else {
                    console.error(`[Product ${p.id}] ⚠️ Skipping model image ${idx + 1} (already in gallery):`, modelImg);
                }
            } else {
                console.error(`[Product ${p.id}] ⚠️ Skipping model image ${idx + 1} (invalid):`, modelImg);
            }
        });
        
        console.error(`[Product ${p.id}] ⚠️ Gallery after adding model images:`, {
            galleryRawCount: galleryRaw.length,
            galleryRawItems: galleryRaw
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

        // CRITICAL CHECK: If gallery only has 1 image, log everything
        if (normalizedProduct.gallery.length <= 1) {
            console.error(`[Product ${p.id}] ⚠️ CRITICAL: Gallery only has ${normalizedProduct.gallery.length} image!`, {
                normalizedProduct,
                rawProduct: {
                    model_image_1: p.model_image_1,
                    model_image_2: p.model_image_2,
                    model_image_3: p.model_image_3
                },
                modelImageFields,
                galleryRaw,
                uniqueGallery,
                galleryUrls,
                finalGallery
            });
        }

        console.error(`[Product ${p.id}] ⚠️ NORMALIZATION COMPLETE - Returning product with ${normalizedProduct.gallery.length} images`);
        console.error(`[Product ${p.id}] ⚠️ FINAL GALLERY DUMP:`, JSON.stringify(normalizedProduct.gallery, null, 2));
        return normalizedProduct;
    })();
    } catch (error: any) {
        console.error(`[ProductPage] ⚠️ CRITICAL ERROR IN NORMALIZATION:`, error);
        console.error(`[ProductPage] ⚠️ ERROR STACK:`, error?.stack);
        console.error(`[ProductPage] ⚠️ ERROR MESSAGE:`, error?.message);
        throw error; // Re-throw to see the error in Vercel
    }
    
    console.error(`[ProductPage] ⚠️ NORMALIZED PRODUCT RECEIVED - Gallery has ${normalized.gallery?.length || 0} images`);
    console.error(`[ProductPage] ⚠️ FINAL NORMALIZED PRODUCT DUMP:`, JSON.stringify({
        id: normalized.id,
        name: normalized.name,
        image: normalized.image,
        gallery: normalized.gallery,
        galleryLength: normalized.gallery?.length || 0
    }, null, 2));
    
    // CRITICAL: If gallery only has 1 image, log a warning that will definitely appear
    if (normalized.gallery?.length <= 1) {
        console.error(`[ProductPage] ⚠️⚠️⚠️ CRITICAL WARNING: Gallery only has ${normalized.gallery?.length || 0} image(s)! This should have 4 images (1 main + 3 model images).`);
        console.error(`[ProductPage] ⚠️⚠️⚠️ Gallery contents:`, normalized.gallery);
    }

    // DEBUG: Output raw product data in HTML comment for inspection
    const debugData = {
        productId: product.id,
        hasModelImage1: !!product.model_image_1,
        hasModelImage2: !!product.model_image_2,
        hasModelImage3: !!product.model_image_3,
        modelImage1Type: typeof product.model_image_1,
        modelImage1Keys: product.model_image_1 && typeof product.model_image_1 === 'object' ? Object.keys(product.model_image_1) : null,
        modelImage1Id: product.model_image_1 && typeof product.model_image_1 === 'object' ? (product.model_image_1 as any)?.id : null,
        normalizedGalleryLength: normalized.gallery?.length || 0,
        normalizedGallery: normalized.gallery
    };

    return (
        <>
            {/* DEBUG DATA - Remove after fixing */}
            <script
                dangerouslySetInnerHTML={{
                    __html: `window.__DEBUG_PRODUCT_DATA = ${JSON.stringify(debugData, null, 2)};`
                }}
            />
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
