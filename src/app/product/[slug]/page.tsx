import ProductDetailContent from '@/components/ProductDetailContent';
import { fetchProductBySlug, fileUrl, type Product } from '@/lib/directus';
import { notFound } from 'next/navigation';

// Revalidate product pages every 10 seconds for faster updates during debugging
export const revalidate = 10;

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

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
    console.error(`[ProductPage] ⚠️ Product object BEFORE normalization:`, {
        id: product?.id,
        model_image_1: product?.model_image_1,
        model_image_1_type: typeof product?.model_image_1,
        model_image_1_isObject: product?.model_image_1 && typeof product?.model_image_1 === 'object',
        model_image_1_hasId: product?.model_image_1 && typeof product?.model_image_1 === 'object' && 'id' in product.model_image_1,
        model_image_1_keys: product?.model_image_1 && typeof product?.model_image_1 === 'object' ? Object.keys(product.model_image_1) : null,
        model_image_1_full: JSON.stringify(product?.model_image_1),
        model_image_2: product?.model_image_2,
        model_image_2_keys: product?.model_image_2 && typeof product?.model_image_2 === 'object' ? Object.keys(product.model_image_2) : null,
        model_image_3: product?.model_image_3,
        model_image_3_keys: product?.model_image_3 && typeof product?.model_image_3 === 'object' ? Object.keys(product.model_image_3) : null
    });

    // Normalize Directus Product -> ProductDetailContent shape
    console.log(`[ProductPage] About to start normalization for product ${product?.id}`);
    
    const normalized = ((): any => {
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
        // Handle both UUID strings and full file objects from Directus
        console.error(`[Product ${p.id}] ⚠️ PROCESSING MODEL IMAGES - raw values:`, {
            model_image_1: p.model_image_1,
            model_image_1_type: typeof p.model_image_1,
            model_image_2: p.model_image_2,
            model_image_2_type: typeof p.model_image_2,
            model_image_3: p.model_image_3,
            model_image_3_type: typeof p.model_image_3
        });
        
        // CRITICAL: Check if model images exist before processing
        const modelImagesArray = [p.model_image_1, p.model_image_2, p.model_image_3];
        console.log(`[Product ${p.id}] Model images array before filter:`, {
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
                console.log(`[Product ${p.id}] Processing model_image_${idx + 1}:`, {
                    type: typeof img,
                    isObject: typeof img === 'object',
                    hasId: img && typeof img === 'object' && 'id' in img,
                    value: img
                });
                
                // If it's already a string (UUID), use it directly
                if (typeof img === 'string') {
                    const url = fileUrl(img);
                    console.log(`[Product ${p.id}] model_image_${idx + 1} is string, converted to:`, url);
                    return url;
                }
                // If it's an object (full file from Directus), extract the ID
                if (img && typeof img === 'object' && img !== null) {
                    console.error(`[Product ${p.id}] ⚠️ model_image_${idx + 1} is object, inspecting structure:`, {
                        keys: Object.keys(img),
                        hasId: 'id' in img,
                        hasData: 'data' in img,
                        idValue: (img as any)?.id,
                        dataIdValue: (img as any)?.data?.id,
                        fullObject: JSON.stringify(img)
                    });
                    
                    // Try multiple ways to get the ID
                    const fileId = (img as any)?.id ?? (img as any)?.data?.id ?? null;
                    if (fileId) {
                        const url = fileUrl(fileId);
                        console.error(`[Product ${p.id}] ⚠️ model_image_${idx + 1} extracted ID ${fileId}, converted to:`, url);
                        return url;
                    } else {
                        console.error(`[Product ${p.id}] ⚠️ model_image_${idx + 1} object has no ID field!`);
                    }
                }
                console.log(`[Product ${p.id}] model_image_${idx + 1} could not be processed`);
                return null;
            })
            .filter((url): url is string => typeof url === 'string' && url !== null);
        
        console.log(`[Product ${p.id}] Model images after processing:`, {
            count: modelImageFields.length,
            urls: modelImageFields
        });
        
        // Add model images that aren't already in the gallery
        console.log(`[Product ${p.id}] Adding model images to gallery:`, {
            modelImageFieldsCount: modelImageFields.length,
            modelImageFields,
            galleryRawBefore: galleryRaw.length,
            galleryRawBeforeItems: galleryRaw
        });
        
        modelImageFields.forEach((modelImg, idx) => {
            if (modelImg && !galleryRaw.includes(modelImg)) {
                console.log(`[Product ${p.id}] Adding model image ${idx + 1} to gallery:`, modelImg);
                galleryRaw.push(modelImg);
            } else {
                console.log(`[Product ${p.id}] Skipping model image ${idx + 1}:`, {
                    modelImg,
                    alreadyInGallery: galleryRaw.includes(modelImg)
                });
            }
        });
        
        console.log(`[Product ${p.id}] Gallery after adding model images:`, {
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
