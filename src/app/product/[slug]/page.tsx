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
    
    // Log after fetch - CRITICAL: Log URL fields to verify they're present
    console.error(`[ProductPage] ⚠️ Product details:`, {
        id: product?.id,
        name: product?.name,
        hasModelImage1: !!product?.model_image_1,
        hasModelImage2: !!product?.model_image_2,
        hasModelImage3: !!product?.model_image_3,
        modelImage1Type: typeof product?.model_image_1,
        modelImage1IsObject: product?.model_image_1 && typeof product?.model_image_1 === 'object',
        hasModelImage1Url: !!(product as any)?.model_image_1_url,
        hasModelImage2Url: !!(product as any)?.model_image_2_url,
        hasModelImage3Url: !!(product as any)?.model_image_3_url,
        modelImage1Url: (product as any)?.model_image_1_url || 'MISSING',
        modelImage2Url: (product as any)?.model_image_2_url || 'MISSING',
        modelImage3Url: (product as any)?.model_image_3_url || 'MISSING'
    });

    if (!product) {
        console.error(`[ProductPage] ⚠️ PRODUCT NOT FOUND - calling notFound()`);
        notFound();
    }
    
    console.error(`[ProductPage] ⚠️ PRODUCT EXISTS - proceeding to normalization`);

    // CRITICAL: Verify model image URLs exist BEFORE normalization
    const modelUrlsBeforeNormalization = [
        (product as any).model_image_1_url,
        (product as any).model_image_2_url,
        (product as any).model_image_3_url
    ].filter((url): url is string => typeof url === 'string' && url.length > 0 && url.startsWith('http'));
    
    console.error(`[ProductPage] ⚠️⚠️⚠️ BEFORE NORMALIZATION: Found ${modelUrlsBeforeNormalization.length} model image URLs in product object`);
    if (modelUrlsBeforeNormalization.length > 0) {
        modelUrlsBeforeNormalization.forEach((url, idx) => {
            console.error(`[ProductPage] ⚠️ Model image ${idx + 1}: ${url.substring(0, 100)}...`);
        });
    } else {
        console.error(`[ProductPage] ⚠️⚠️⚠️ CRITICAL: No model image URLs found in product object BEFORE normalization!`);
        console.error(`[ProductPage] ⚠️⚠️⚠️ Product object keys:`, Object.keys(product || {}));
        console.error(`[ProductPage] ⚠️⚠️⚠️ Raw _url fields:`, {
            model_image_1_url: (product as any).model_image_1_url,
            model_image_2_url: (product as any).model_image_2_url,
            model_image_3_url: (product as any).model_image_3_url
        });
    }

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
        // Use 'any' to access URL fields that might not be in Product type
        const p: any = product;

        // CRITICAL: Log model image URLs at the very start to verify they exist
        const modelUrlsAtStart = [
            p.model_image_1_url,
            p.model_image_2_url,
            p.model_image_3_url
        ].filter((url): url is string => typeof url === 'string' && url.length > 0 && url.startsWith('http'));
        
        console.error(`[Product ${p.id}] ⚠️ STARTING NORMALIZATION:`, {
            hasModelImage1: !!p.model_image_1,
            hasModelImage2: !!p.model_image_2,
            hasModelImage3: !!p.model_image_3,
            modelImage1Value: p.model_image_1,
            modelImage1Type: typeof p.model_image_1,
            modelImage1IsObject: p.model_image_1 && typeof p.model_image_1 === 'object',
            modelImage1HasId: p.model_image_1 && typeof p.model_image_1 === 'object' && 'id' in p.model_image_1,
            modelImage1Url: p.model_image_1_url || 'MISSING',
            modelImage2Url: p.model_image_2_url || 'MISSING',
            modelImage3Url: p.model_image_3_url || 'MISSING',
            modelUrlsAtStartCount: modelUrlsAtStart.length,
            modelUrlsAtStart: modelUrlsAtStart
        });

        // Build gallery from image fields
        let galleryRaw: (string | undefined)[] = [];

        // 0. FIRST PRIORITY: Add model images from URL fields directly (most reliable)
        // This ensures model images are always included even if UUID processing fails
        const modelUrlsFromFields = [
            p.model_image_1_url,
            p.model_image_2_url,
            p.model_image_3_url
        ].filter((url): url is string => typeof url === 'string' && url.length > 0 && url.startsWith('http'));
        
        console.error(`[Product ${p.id}] ⚠️ Model URLs from fields: ${modelUrlsFromFields.length} URLs found`);
        if (modelUrlsFromFields.length === 0) {
            console.error(`[Product ${p.id}] ⚠️⚠️⚠️ CRITICAL: No model image URLs found at start of normalization!`);
            console.error(`[Product ${p.id}] ⚠️⚠️⚠️ Raw values:`, {
                model_image_1_url: p.model_image_1_url,
                model_image_2_url: p.model_image_2_url,
                model_image_3_url: p.model_image_3_url,
                types: {
                    model_image_1_url: typeof p.model_image_1_url,
                    model_image_2_url: typeof p.model_image_2_url,
                    model_image_3_url: typeof p.model_image_3_url
                }
            });
        }
        
        if (modelUrlsFromFields.length > 0) {
            console.error(`[Product ${p.id}] ⚠️⚠️⚠️ DIRECT ADD: Found ${modelUrlsFromFields.length} model image URLs, adding directly to gallery`);
            galleryRaw.push(...modelUrlsFromFields);
        } else {
            console.error(`[Product ${p.id}] ⚠️⚠️⚠️ WARNING: No model image URLs found in _url fields!`);
        }

        // 1. Add legacy images array (URLs/Strings) if present
        if (p.images && Array.isArray(p.images) && p.images.length > 0) {
            galleryRaw = [...galleryRaw, ...p.images];
        }

        // 2. Add main image (prioritize UUID field, fallback to URL field)
        const mainImage = p.image || p.image_url;
        const mainImageUrl = mainImage ? (fileUrl(mainImage) || mainImage) : null;
        if (mainImageUrl && !galleryRaw.includes(mainImageUrl)) {
            galleryRaw.unshift(mainImageUrl); // Put main image first
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
        // Handle empty objects {} as falsy values - they should fall back to _url fields
        const getModelImageValue = (uuidField: any, urlField: string | undefined, fieldName: string): any => {
            console.error(`[Product ${p.id}] ⚠️ getModelImageValue for ${fieldName}:`, {
                uuidField,
                uuidFieldType: typeof uuidField,
                uuidFieldIsNull: uuidField === null,
                uuidFieldIsEmptyObject: typeof uuidField === 'object' && uuidField !== null && Object.keys(uuidField).length === 0,
                urlField,
                urlFieldType: typeof urlField
            });
            
            // If URL field exists, prefer it when UUID is empty/invalid
            if (urlField && typeof urlField === 'string' && urlField.length > 0) {
                // Check if UUID is null, undefined, or empty object
                const isUuidEmpty = uuidField === null || 
                    uuidField === undefined ||
                    (typeof uuidField === 'object' && uuidField !== null && Object.keys(uuidField).length === 0);
                
                if (isUuidEmpty) {
                    // UUID is empty/invalid, use URL field
                    console.error(`[Product ${p.id}] ⚠️ ${fieldName}: UUID is empty, using URL field:`, urlField);
                    return urlField;
                }
                
                // If UUID is a valid string, use UUID
                if (typeof uuidField === 'string' && uuidField.length > 0) {
                    console.error(`[Product ${p.id}] ⚠️ ${fieldName}: UUID is valid string, using UUID:`, uuidField);
                    return uuidField;
                }
                
                // If UUID is an object with id/data, use UUID
                if (uuidField && typeof uuidField === 'object' && uuidField !== null && ('id' in uuidField || 'data' in uuidField)) {
                    console.error(`[Product ${p.id}] ⚠️ ${fieldName}: UUID is valid object with id/data, using UUID`);
                    return uuidField;
                }
                
                // Fallback to URL if UUID is invalid
                console.error(`[Product ${p.id}] ⚠️ ${fieldName}: UUID is invalid, falling back to URL:`, urlField);
                return urlField;
            }
            // No URL field, use UUID if it exists
            console.error(`[Product ${p.id}] ⚠️ ${fieldName}: No URL field, using UUID:`, uuidField);
            return uuidField || null;
        };
        
        const modelImagesArray = [
            getModelImageValue(p.model_image_1, p.model_image_1_url, 'model_image_1'),
            getModelImageValue(p.model_image_2, p.model_image_2_url, 'model_image_2'),
            getModelImageValue(p.model_image_3, p.model_image_3_url, 'model_image_3')
        ];
        
        console.error(`[Product ${p.id}] ⚠️ Model images array before filter:`, {
            length: modelImagesArray.length,
            items: modelImagesArray.map((img, idx) => ({
                index: idx,
                exists: !!img,
                type: typeof img,
                isObject: img && typeof img === 'object',
                hasId: img && typeof img === 'object' && 'id' in img,
                isUrl: typeof img === 'string' && img.startsWith('http'),
                value: typeof img === 'string' ? img.substring(0, 100) : img
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
        console.error(`[Product ${p.id}] ⚠️⚠️⚠️ CRITICAL: Adding model images to gallery:`, {
            modelImageFieldsCount: modelImageFields.length,
            modelImageFields: JSON.stringify(modelImageFields),
            galleryRawBefore: galleryRaw.length,
            galleryRawBeforeItems: JSON.stringify(galleryRaw)
        });
        
        if (modelImageFields.length === 0) {
            console.error(`[Product ${p.id}] ⚠️⚠️⚠️ CRITICAL ERROR: modelImageFields is EMPTY! This means getModelImageValue returned no valid URLs!`);
            console.error(`[Product ${p.id}] ⚠️⚠️⚠️ Check getModelImageValue logs above to see why URLs weren't returned.`);
        }
        
        modelImageFields.forEach((modelImg, idx) => {
            if (modelImg && typeof modelImg === 'string' && modelImg.length > 0) {
                if (!galleryRaw.includes(modelImg)) {
                    console.error(`[Product ${p.id}] ⚠️⚠️⚠️ CRITICAL: Adding model image ${idx + 1} to gallery:`, modelImg.substring(0, 100));
                    galleryRaw.push(modelImg);
                } else {
                    console.error(`[Product ${p.id}] ⚠️ Skipping model image ${idx + 1} (already in gallery):`, modelImg.substring(0, 100));
                }
            } else {
                console.error(`[Product ${p.id}] ⚠️⚠️⚠️ CRITICAL: Skipping model image ${idx + 1} (invalid):`, modelImg, `type: ${typeof modelImg}`);
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
        // If gallery is empty, try to use mainImage, otherwise use placeholder
        const displayImage = uniqueGallery[0] || mainImage || '/placeholders/product-placeholder.png';
        
        // If displayImage is a local path that might not exist, try to convert it
        // but if conversion fails or returns null, use placeholder
        const displayImageUrl = displayImage ? (fileUrl(displayImage) || displayImage) : '/placeholders/product-placeholder.png';

        // Convert gallery URLs (handle both UUIDs and already-converted URLs)
        // Note: Direct Cloudinary URLs from _url fields are already full URLs and should not be modified
        const galleryUrls = uniqueGallery
            .map((g) => {
                if (!g) return null;
                // If already a full URL (http/https), return as-is without modification
                // This preserves direct Cloudinary URLs from model_image_X_url fields
                if (typeof g === 'string' && g.startsWith('http')) {
                    return g;
                }
                // Otherwise, convert using fileUrl (handles UUIDs, local paths, etc.)
                const url = fileUrl(g) || (typeof g === 'string' ? g : null);
                return url;
            })
            .filter((url): url is string => typeof url === 'string' && url !== null);

        // Use displayImageUrl instead of converting displayImage again
        const finalGallery = galleryUrls.length > 0 ? galleryUrls : [displayImageUrl].filter(Boolean);
        const finalImage = displayImageUrl;

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

        // CRITICAL: Ensure gallery is always an array with at least the main image
        // If finalGallery is empty or only has 1 image, try to rebuild it with model images
        let finalGalleryArray = Array.isArray(finalGallery) ? finalGallery : [finalImage].filter(Boolean);
        
        // If gallery only has 1 image, check if we have model image URLs to add
        if (finalGalleryArray.length <= 1) {
            console.error(`[Product ${p.id}] ⚠️⚠️⚠️ CRITICAL: finalGallery only has ${finalGalleryArray.length} image!`);
            console.error(`[Product ${p.id}] ⚠️⚠️⚠️ Checking for model image URLs...`);
            
            // Try to get model images from modelImageFields first
            if (modelImageFields.length > 0) {
                console.error(`[Product ${p.id}] ⚠️⚠️⚠️ Found ${modelImageFields.length} model images in modelImageFields, rebuilding gallery...`);
                finalGalleryArray = [finalImage, ...modelImageFields].filter(Boolean);
                console.error(`[Product ${p.id}] ⚠️⚠️⚠️ Rebuilt gallery now has ${finalGalleryArray.length} images`);
            } else {
                // Fallback: Try to get URLs directly from _url fields
                const modelUrls = [
                    p.model_image_1_url,
                    p.model_image_2_url,
                    p.model_image_3_url
                ].filter((url): url is string => typeof url === 'string' && url.length > 0);
                
                if (modelUrls.length > 0) {
                    console.error(`[Product ${p.id}] ⚠️⚠️⚠️ Found ${modelUrls.length} model image URLs in _url fields, rebuilding gallery...`);
                    finalGalleryArray = [finalImage, ...modelUrls].filter(Boolean);
                    console.error(`[Product ${p.id}] ⚠️⚠️⚠️ Rebuilt gallery now has ${finalGalleryArray.length} images`);
                } else {
                    console.error(`[Product ${p.id}] ⚠️⚠️⚠️ No model images found in modelImageFields or _url fields!`);
                    console.error(`[Product ${p.id}] ⚠️⚠️⚠️ modelImageFields:`, modelImageFields);
                    console.error(`[Product ${p.id}] ⚠️⚠️⚠️ _url fields:`, {
                        model_image_1_url: p.model_image_1_url,
                        model_image_2_url: p.model_image_2_url,
                        model_image_3_url: p.model_image_3_url
                    });
                }
            }
        }
        
        // SIMPLIFIED APPROACH: Build final gallery directly from model image URLs
        // This ensures model images are ALWAYS included, regardless of earlier normalization steps
        const modelImageUrls = [
            p.model_image_1_url,
            p.model_image_2_url,
            p.model_image_3_url
        ].filter((url): url is string => typeof url === 'string' && url.length > 0 && url.startsWith('http'));
        
        console.error(`[Product ${p.id}] ⚠️ FINAL GALLERY BUILD - Model URLs:`, {
            modelImageUrlsCount: modelImageUrls.length,
            modelImageUrls: modelImageUrls,
            finalImage: finalImage,
            finalGalleryArrayBefore: finalGalleryArray
        });
        
        // Build final gallery: main image + model images (simple and direct)
        const finalGallerySimple = [
            finalImage,
            ...modelImageUrls
        ].filter(Boolean);
        
        // Deduplicate (in case main image is already in model images)
        const finalGalleryFinal = Array.from(new Set(finalGallerySimple));
        
        console.error(`[Product ${p.id}] ⚠️ FINAL GALLERY FINAL:`, {
            finalGalleryFinalCount: finalGalleryFinal.length,
            finalGalleryFinal: finalGalleryFinal
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
            gallery: finalGalleryFinal, // Simple: main image + model images
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
        
        // CRITICAL: ALWAYS ensure model images from URL fields are included
        // This is a final safeguard to ensure model images are never lost
        // Access fields using (p as any) to ensure TypeScript doesn't block access
        const modelUrlsFromDirectus = [
            (p as any).model_image_1_url,
            (p as any).model_image_2_url,
            (p as any).model_image_3_url
        ].filter((url): url is string => typeof url === 'string' && url.length > 0 && url.startsWith('http'));
        
        console.error(`[Product ${p.id}] ⚠️ SAFEGUARD CHECK: Found ${modelUrlsFromDirectus.length} model image URLs from Directus`);
        if (modelUrlsFromDirectus.length > 0) {
            modelUrlsFromDirectus.forEach((url, idx) => {
                console.error(`[Product ${p.id}] ⚠️ Model image ${idx + 1}: ${url.substring(0, 100)}...`);
            });
        } else {
            console.error(`[Product ${p.id}] ⚠️⚠️⚠️ WARNING: No model image URLs found! Raw values:`, {
                model_image_1_url: (p as any).model_image_1_url,
                model_image_2_url: (p as any).model_image_2_url,
                model_image_3_url: (p as any).model_image_3_url
            });
        }
        
        if (modelUrlsFromDirectus.length > 0) {
            // Check if model images are already in gallery
            const missingModelImages = modelUrlsFromDirectus.filter(url => !normalizedProduct.gallery.includes(url));
            
            console.error(`[Product ${p.id}] ⚠️ SAFEGUARD: ${missingModelImages.length} model images missing from gallery (out of ${modelUrlsFromDirectus.length} total)`);
            
            if (missingModelImages.length > 0) {
                console.error(`[Product ${p.id}] ⚠️⚠️⚠️ CRITICAL: Found ${missingModelImages.length} model images missing from gallery!`);
                console.error(`[Product ${p.id}] ⚠️⚠️⚠️ Missing URLs:`, JSON.stringify(missingModelImages, null, 2));
                console.error(`[Product ${p.id}] ⚠️⚠️⚠️ Current gallery:`, JSON.stringify(normalizedProduct.gallery, null, 2));
                
                // Add missing model images to gallery
                normalizedProduct.gallery = [
                    normalizedProduct.image,
                    ...normalizedProduct.gallery.filter(url => url !== normalizedProduct.image), // Keep existing images except main
                    ...missingModelImages // Add missing model images
                ].filter(Boolean);
                
                // Deduplicate
                normalizedProduct.gallery = Array.from(new Set(normalizedProduct.gallery));
                
                console.error(`[Product ${p.id}] ⚠️⚠️⚠️ Fixed gallery now has ${normalizedProduct.gallery.length} images`);
            } else {
                console.error(`[Product ${p.id}] ⚠️ All ${modelUrlsFromDirectus.length} model images are already in gallery`);
            }
        }
        
        // FINAL FORCE REBUILD: If gallery still only has 1 image, force rebuild with model images
        // This is the absolute last resort to ensure model images are included
        if (normalizedProduct.gallery.length <= 1) {
            console.error(`[Product ${p.id}] ⚠️⚠️⚠️ CRITICAL: Gallery only has ${normalizedProduct.gallery.length} image! Force rebuilding...`);
            
            // Try to get model images from multiple sources
            const forceModelUrls = modelUrlsFromDirectus.length > 0 
                ? modelUrlsFromDirectus 
                : [
                    (p as any).model_image_1_url,
                    (p as any).model_image_2_url,
                    (p as any).model_image_3_url
                  ].filter((url): url is string => typeof url === 'string' && url.length > 0);
            
            if (forceModelUrls.length > 0) {
                console.error(`[Product ${p.id}] ⚠️⚠️⚠️ FORCE REBUILD: Using ${forceModelUrls.length} model image URLs`);
                normalizedProduct.gallery = [normalizedProduct.image, ...forceModelUrls].filter(Boolean);
                console.error(`[Product ${p.id}] ⚠️⚠️⚠️ Force-rebuilt gallery now has ${normalizedProduct.gallery.length} images`);
                console.error(`[Product ${p.id}] ⚠️⚠️⚠️ Force-rebuilt gallery:`, JSON.stringify(normalizedProduct.gallery, null, 2));
            } else {
                console.error(`[Product ${p.id}] ⚠️⚠️⚠️ ERROR: No model image URLs available for force rebuild!`);
            }
        }
        
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
    
    // CRITICAL: ALWAYS check and ensure model images are included
    // This runs regardless of current gallery length to catch any edge cases
    const modelUrlsFromProduct = [
        (product as any).model_image_1_url,
        (product as any).model_image_2_url,
        (product as any).model_image_3_url
    ].filter((url): url is string => typeof url === 'string' && url.length > 0 && url.startsWith('http'));
    
    console.error(`[ProductPage] ⚠️ FINAL CHECK: Found ${modelUrlsFromProduct.length} model image URLs in product object`);
    if (modelUrlsFromProduct.length > 0) {
        modelUrlsFromProduct.forEach((url, idx) => {
            console.error(`[ProductPage] ⚠️ Model image ${idx + 1}: ${url.substring(0, 100)}...`);
        });
        
        // Check if model images are missing from gallery
        const missingModelImages = modelUrlsFromProduct.filter(url => !normalized.gallery?.includes(url));
        
        if (missingModelImages.length > 0) {
            console.error(`[ProductPage] ⚠️⚠️⚠️ CRITICAL: Found ${missingModelImages.length} model images missing from gallery!`);
            console.error(`[ProductPage] ⚠️⚠️⚠️ Missing URLs:`, JSON.stringify(missingModelImages, null, 2));
            console.error(`[ProductPage] ⚠️⚠️⚠️ Current gallery:`, JSON.stringify(normalized.gallery, null, 2));
            
            // Force add missing model images
            normalized.gallery = [
                normalized.image,
                ...(normalized.gallery || []).filter((url: string) => url !== normalized.image),
                ...missingModelImages
            ].filter(Boolean);
            
            // Deduplicate
            normalized.gallery = Array.from(new Set(normalized.gallery));
            
            console.error(`[ProductPage] ⚠️⚠️⚠️ FIXED: Gallery now has ${normalized.gallery.length} images`);
            console.error(`[ProductPage] ⚠️⚠️⚠️ Fixed gallery:`, JSON.stringify(normalized.gallery, null, 2));
        } else {
            console.error(`[ProductPage] ⚠️ All ${modelUrlsFromProduct.length} model images are already in gallery`);
        }
    } else {
        console.error(`[ProductPage] ⚠️⚠️⚠️ WARNING: No model image URLs found in product object!`);
        console.error(`[ProductPage] ⚠️⚠️⚠️ Product object check:`, {
            hasModelImage1Url: !!(product as any).model_image_1_url,
            hasModelImage2Url: !!(product as any).model_image_2_url,
            hasModelImage3Url: !!(product as any).model_image_3_url,
            modelImage1Url: (product as any).model_image_1_url || 'MISSING',
            modelImage2Url: (product as any).model_image_2_url || 'MISSING',
            modelImage3Url: (product as any).model_image_3_url || 'MISSING'
        });
    }
    
    // Final check - if gallery still only has 1 image, force rebuild
    if (normalized.gallery?.length <= 1 && modelUrlsFromProduct.length > 0) {
        console.error(`[ProductPage] ⚠️⚠️⚠️ CRITICAL: Gallery still only has ${normalized.gallery?.length || 0} image after all fixes!`);
        console.error(`[ProductPage] ⚠️⚠️⚠️ Force rebuilding gallery with ${modelUrlsFromProduct.length} model images...`);
        normalized.gallery = [normalized.image, ...modelUrlsFromProduct].filter(Boolean);
        console.error(`[ProductPage] ⚠️⚠️⚠️ Force-rebuilt gallery now has ${normalized.gallery.length} images`);
        console.error(`[ProductPage] ⚠️⚠️⚠️ Force-rebuilt gallery:`, JSON.stringify(normalized.gallery, null, 2));
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
