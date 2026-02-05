import { fetchProducts, fetchProductBySlug, fileUrl, fetchProductsByGenderAndSubcategory } from "@/lib/directus";
import ProductCard from "@/components/ProductCard";
import ProductDetailContent from "@/components/ProductDetailContent";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { SUBCATEGORY_DESCRIPTIONS } from "@/data/subcategory-descriptions";
import DescriptionText from "@/components/DescriptionText";

// Force dynamic rendering to prevent build-time API calls
export const dynamic = 'force-dynamic';

/**
 * Extract photo session ID from image path
 * Matches patterns like: SONY_ILCE-7RM5_6304x4180_000006, _DSC4648_Large, file_1616x1080_00132
 */
function getSessionId(imagePath: string | null | undefined): string | null {
  if (!imagePath || typeof imagePath !== 'string') return null;

  // Get just the filename
  const filename = imagePath.split('/').pop() || imagePath;

  // Match various patterns
  const patterns = [
    /(SONY_ILCE[-_]7RM5[-_]\d+x\d*)/i,  // SONY_ILCE-7RM5_6304x4180
    /(_DSC\d+)/i,                         // _DSC4648
    /(file_\d+x\d+_\d+)/i                 // file_1616x1080_00132
  ];

  for (const pattern of patterns) {
    const match = filename.match(pattern);
    if (match) {
      return match[1].toUpperCase().replace(/-/g, '_');
    }
  }
  return null;
}

/**
 * Check if two session IDs are from the same photo session
 */
function isSameSession(sessionId1: string | null, sessionId2: string | null): boolean {
  if (!sessionId1 || !sessionId2) return false;

  // Normalize for comparison
  const norm1 = sessionId1.toUpperCase().replace(/-/g, '_');
  const norm2 = sessionId2.toUpperCase().replace(/-/g, '_');

  // Direct match
  if (norm1 === norm2) return true;

  // Check if they share the same base (e.g., SONY_ILCE_7RM5_6304X matches SONY_ILCE_7RM5_6304X4180_000006)
  if (norm1.length > 10 && norm2.length > 10) {
    const base = norm1.substring(0, Math.min(15, norm1.length));
    if (norm2.includes(base) || norm1.includes(norm2.substring(0, Math.min(15, norm2.length)))) {
      return true;
    }
  }

  return false;
}

/**
 * Build gallery with ONLY matching model images from the same photo session
 * Limits to max 4 images total (1 main + up to 3 model images)
 */
function buildMatchingGallery(product: any): string[] {
  const MAX_IMAGES = 4; // 1 main + 3 model images max

  // Check all possible main image fields
  const mainImage = product.image || product.image_url || product.main_image;
  const mainImageUrl = mainImage ? fileUrl(mainImage) : null;
  const mainSessionId = getSessionId(mainImage);

  console.error(`[buildMatchingGallery] Product ${product.id}:`, {
    mainImage,
    mainImageUrl,
    mainSessionId
  });

  // Get all model images
  const allModelImages = [
    product.model_image_1_url || product.model_image_1,
    product.model_image_2_url || product.model_image_2,
    product.model_image_3_url || product.model_image_3,
  ].filter(Boolean);

  // Filter to only include model images from the SAME photo session
  const matchingModelImages: string[] = [];

  for (const modelImg of allModelImages) {
    const modelSessionId = getSessionId(modelImg);
    const matches = isSameSession(mainSessionId, modelSessionId);

    console.error(`[buildMatchingGallery] Model image check:`, {
      modelImg,
      modelSessionId,
      mainSessionId,
      matches
    });

    if (matches) {
      const url = fileUrl(modelImg);
      if (url && url !== '') {
        matchingModelImages.push(url);
      }
    }
  }

  // Build gallery: main image + matching model images only (max 4 total)
  const gallery: string[] = mainImageUrl ? [mainImageUrl] : [];

  // Add matching model images up to the limit
  for (const modelUrl of matchingModelImages) {
    if (gallery.length >= MAX_IMAGES) break;
    if (!gallery.includes(modelUrl)) {
      gallery.push(modelUrl);
    }
  }

  console.error(`[buildMatchingGallery] Final gallery for product ${product.id}:`, {
    gallery,
    galleryLength: gallery.length,
    matchingModelImagesCount: matchingModelImages.length,
    totalModelImagesCount: allModelImages.length
  });

  return gallery;
}

import {
  WOMEN_MAPPING,
  getSubcategoryMap,
  getTitleMap
} from "@/data/subcategory-mapping";

const SUBCATEGORY_MAP: Record<string, string[]> = getSubcategoryMap(WOMEN_MAPPING);
const TITLE_MAP: Record<string, string> = getTitleMap(WOMEN_MAPPING);

// Reverse mapping from CMS subcategory values to route slugs
function getSubcategorySlug(cmsSubcategory: string | null | undefined): string {
  if (!cmsSubcategory) return 'women';
  const lowerSub = cmsSubcategory.toLowerCase();
  for (const [slug, cmsValues] of Object.entries(SUBCATEGORY_MAP)) {
    if (cmsValues.some(v => v.toLowerCase() === lowerSub)) return slug;
  }
  return 'women'; // fallback
}

// Get display title from CMS subcategory
function getSubcategoryTitle(cmsSubcategory: string | null | undefined): string {
  const slug = getSubcategorySlug(cmsSubcategory);
  return TITLE_MAP[slug] || cmsSubcategory || 'Women';
}

interface PageProps {
  params: Promise<{ subcategory: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subcategory } = await params;
  const displayTitle = TITLE_MAP[subcategory] || subcategory;
  const description = SUBCATEGORY_DESCRIPTIONS.women[subcategory] || '';

  return {
    title: `Women's ${displayTitle} | Zecode`,
    description: description.substring(0, 160),
    openGraph: {
      title: `Women's ${displayTitle} | Zecode`,
      description: description.substring(0, 160),
    }
  };
}

export default async function WomenSubcategoryPage({ params }: PageProps) {
  const { subcategory } = await params;

  // 1. Check if it's a known subcategory
  if (SUBCATEGORY_MAP[subcategory]) {
    const cmsSubcategory = SUBCATEGORY_MAP[subcategory];
    const displayTitle = TITLE_MAP[subcategory] || subcategory;

    let products: any[] = [];
    try {
      // Optimized fetch: Filter by gender and subcategory at the API level
      // This prevents fetching ALL products and filtering in memory
      const fetchedProducts = await fetchProductsByGenderAndSubcategory("women", cmsSubcategory);
      if (fetchedProducts) {
        products = fetchedProducts;
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }

    return (
      <div className="min-h-screen bg-white">
        <div className="bg-gray-50 py-4">
          <div className="max-w-7xl mx-auto px-4">
            <nav className="flex items-center space-x-2 text-sm">
              <Link href="/" className="text-gray-500 hover:text-gray-700">Home</Link>
              <span className="text-gray-400">/</span>
              <Link href="/women" className="text-gray-500 hover:text-gray-700">Women</Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 font-medium">{displayTitle}</span>
            </nav>
          </div>
        </div>

        <div className="py-8 bg-gradient-to-r from-pink-900 to-pink-700">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Women&apos;s {displayTitle}</h1>
            <p className="text-pink-200">{products.length} products found</p>
          </div>
        </div>

        {/* Description Section */}
        <DescriptionText text={SUBCATEGORY_DESCRIPTIONS.women[subcategory]} />

        <div className="max-w-7xl mx-auto px-4 py-12">
          {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
              {products
                .filter(product => product && product.id)
                .map((product, index) => (
                  <ProductCard key={product.id} product={product} priority={index < 4} />
                ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">No products found in this category.</p>
              <Link href="/women" className="mt-4 inline-block text-pink-600 hover:underline">Browse all Women&apos;s products</Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. If not a subcategory, try to fetch as product
  const product = await fetchProductBySlug(subcategory);

  if (product) {
    // Map Directus product to ProductDetail interface
    // Build gallery with matching model images (same photo session)
    const gallery = buildMatchingGallery(product);

    // Extract model images separately for the dedicated section
    // Check both standard relation fields and direct URL fields
    const modelImages = [
      product.model_image_1_url || product.model_image_1,
      product.model_image_2_url || product.model_image_2,
      product.model_image_3_url || product.model_image_3,
    ]
      .filter(Boolean)
      .map(img => {
        // Always pass through fileUrl - it will handle Directus URLs and convert them to proxy
        // fileUrl also handles Cloudinary URLs, local paths, and Directus IDs
        return fileUrl(img);
      })
      .filter((url): url is string => url !== null);

    // Get proper subcategory slug and title
    const subcategorySlug = getSubcategorySlug(product.subcategory);
    const subcategoryTitle = getSubcategoryTitle(product.subcategory);

    // Debug logging to diagnose image issues
    const productImage = product.image as any; // Type assertion needed because Product type has image as string, but Directus returns object
    console.error(`[WomenSubcategoryPage] Product ${product.id} - Gallery:`, {
      galleryLength: gallery.length,
      gallery: gallery,
      galleryItems: gallery.map((url, idx) => ({ index: idx, url, type: typeof url, isEmpty: url === '' })),
      modelImagesLength: modelImages.length,
      modelImages: modelImages,
      productImage: productImage,
      productImageType: typeof productImage,
      productImageIsObject: productImage && typeof productImage === 'object',
      productImageId: (productImage && typeof productImage === 'object' ? productImage.id : null) || 'no-id',
      productImageUrl: product.image_url,
      modelImage1: product.model_image_1,
      modelImage1Url: product.model_image_1_url
    });

    // CRITICAL: Ensure gallery is never empty if we have a valid image
    // Filter gallery to remove nulls and empty strings
    const filteredGallery = gallery.filter((url): url is string => url !== null && url !== '' && typeof url === 'string');
    const finalImage = (filteredGallery.length > 0 && filteredGallery[0]) ? filteredGallery[0] : '';

    // If gallery is empty but we have product image data, something went wrong - log it
    if (filteredGallery.length === 0 && (product.image || product.image_url || product.main_image)) {
      console.error(`[WomenSubcategoryPage] ⚠️⚠️⚠️ CRITICAL: Gallery is empty but product has image data!`, {
        productId: product.id,
        productImage: product.image,
        productImageUrl: product.image_url,
        productMainImage: product.main_image,
        originalGallery: gallery,
        filteredGallery
      });
    }

    const productDetail = {
      id: product.id,
      name: product.name,
      category: `women/${subcategorySlug}`,  // Route path like "women/dresses"
      categoryLabel: subcategoryTitle,        // Display title like "Dresses"
      price: product.price,
      originalPrice: product.sale_price,
      // Gallery already contains converted URLs from buildMatchingGallery, don't process again
      // CRITICAL: Ensure we have a valid image URL, not an empty string
      image: finalImage,
      gallery: filteredGallery.length > 0 ? filteredGallery : (finalImage ? [finalImage] : []),
      modelImages: modelImages, // Pass model images explicitly
      description: product.description || '',
      sizes: product.sizes || [],
      rating: 4.5, // Mock rating
      reviewCount: 10 // Mock review count
    };

    console.error(`[WomenSubcategoryPage] ProductDetail for ${product.id}:`, {
      image: productDetail.image,
      imageType: typeof productDetail.image,
      imageIsEmpty: productDetail.image === '',
      galleryLength: productDetail.gallery.length,
      gallery: productDetail.gallery,
      galleryItems: productDetail.gallery.map((url, idx) => ({ index: idx, url, type: typeof url, isEmpty: url === '' })),
      modelImagesLength: productDetail.modelImages.length,
      modelImages: productDetail.modelImages
    });

    return <ProductDetailContent product={productDetail} />;
  }

  // 3. If neither, 404
  notFound();
}

export async function generateStaticParams() {
  return Object.keys(SUBCATEGORY_MAP).map((subcategory) => ({ subcategory }));
}