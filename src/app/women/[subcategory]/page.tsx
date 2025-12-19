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
 * Extract photo session ID from image path (e.g., "__DSC4648_Large" from the filename)
 * This helps match model images with the correct product
 */
function getSessionId(imagePath: string | null | undefined): string | null {
  if (!imagePath || typeof imagePath !== 'string') return null;
  // Match patterns like __DSC1234 or _DSC1234
  const match = imagePath.match(/_?_?(DSC\d+)/i);
  return match ? match[1] : null;
}

/**
 * Build gallery with model images
 * Simply includes all available images for the product
 */
function buildMatchingGallery(product: any): string[] {
  // Check all possible main image fields
  const mainImage = product.image || product.image_url || product.main_image;
  // Convert to URLs - fileUrl handles strings, objects, and null
  const mainImageUrl = mainImage ? fileUrl(mainImage) : null;

  console.error(`[buildMatchingGallery] Product ${product.id}:`, {
    mainImage: mainImage,
    mainImageType: typeof mainImage,
    mainImageIsObject: mainImage && typeof mainImage === 'object',
    mainImageId: mainImage?.id || 'no-id',
    mainImageUrl: mainImageUrl,
    mainImageUrlType: typeof mainImageUrl,
    mainImageUrlIsEmpty: mainImageUrl === '',
    model_image_1: product.model_image_1,
    model_image_1_url: product.model_image_1_url,
    model_image_2: product.model_image_2,
    model_image_2_url: product.model_image_2_url,
    model_image_3: product.model_image_3,
    model_image_3_url: product.model_image_3_url
  });
  
  // CRITICAL: If fileUrl returned null for mainImage, log a warning
  if (mainImage && !mainImageUrl) {
    console.error(`[buildMatchingGallery] ⚠️ CRITICAL: fileUrl returned null for mainImage!`, {
      mainImage,
      mainImageType: typeof mainImage,
      mainImageId: mainImage?.id,
      mainImageData: mainImage?.data
    });
  }

  // Check both _url fields (from Directus) and direct relation fields
  const modelImages = [
    product.model_image_1_url || product.model_image_1,
    product.model_image_2_url || product.model_image_2,
    product.model_image_3_url || product.model_image_3,
  ]
    .filter(Boolean)
    .map(img => {
      // Always pass through fileUrl - it will handle Directus URLs and convert them to proxy
      // fileUrl also handles Cloudinary URLs, local paths, and Directus IDs
      // CRITICAL: Don't fall back to Directus URLs - fileUrl must convert them
      const url = fileUrl(img);
      console.error(`[buildMatchingGallery] Converting image:`, { input: img, output: url });
      return url;
    })
    .filter((url): url is string => url !== null && url !== '');

  const gallery: string[] = mainImageUrl ? [mainImageUrl, ...modelImages] : modelImages;

  console.error(`[buildMatchingGallery] Final gallery for product ${product.id}:`, {
    gallery,
    galleryLength: gallery.length,
    galleryItems: gallery.map((url, idx) => ({ index: idx, url, type: typeof url, isEmpty: url === '' })),
    mainImageUrl,
    modelImagesLength: modelImages.length,
    modelImages
  });
  
  // CRITICAL: If gallery is empty, log a severe warning
  if (gallery.length === 0) {
    console.error(`[buildMatchingGallery] ⚠️⚠️⚠️ CRITICAL: Gallery is EMPTY for product ${product.id}!`, {
      product,
      mainImage,
      mainImageUrl,
      modelImages
    });
  }

  return gallery;
}

const SUBCATEGORY_MAP: Record<string, string | string[]> = {
  'tops': ['Top', 'Tops', 'Casual Top', 'Tank Top'],
  'blouses': 'Blouse',
  'dresses': ['Dress', 'Dresses', 'Midi Dress', 'Mini Dress', 'Slip Dress'],
  'jeans': ['Jeans', 'Slim Jeans'],
  'pants': ['Pants', 'Slim Pants', 'Cargo Pants'],
  'skirts': 'Skirt',
  'jackets': ['Jacket', 'Casual Jacket', 'Denim Jacket'],
  'shoes': ['Footwear', 'Flats', 'Sneakers', 'Formal Shoes', 'Heels', 'Mules', 'Sandals', 'Boots', 'Loafers'],
  'accessories': 'Accessories',
  'tshirts': ['T', 'T-Shirt', 'T-Shirts', 'Classic T-Shirt'],
  'shirts': ['Shirt', 'Casual Shirt'],
  'shorts': 'Shorts',
  'tunics': 'Tunic',
  'hoodies': 'Hoodie',
  'tanks': ['Tank', 'Tank Top'],
  'sweaters': 'Sweater',
  'sweatpants': 'Sweatpants',
  'sweatshirts': 'Sweatshirt',
  'tracksuits': ['Track', 'Tracksuit'],
  'vests': 'Vest',
  'visors': 'Visor',
  'backpacks': 'Backpack',
  'flats': 'Flats',
  'mules': 'Mules',
  'heels': 'Heels',
  'jumpsuits': 'Jumpsuit',
  'apparel': 'Apparel',  // Generic fallback
  // Ethnic wear
  'kurti': 'Kurti',
  'kurta': 'Kurta',
  'lehenga': 'Lehenga',
  'ethnic-wear': ['Kurti', 'Kurta', 'Lehenga', 'ethnic-wear'],
  'activewear': ['Activewear', 'activewear'],
};

const TITLE_MAP: Record<string, string> = {
  'tops': 'Tops',
  'blouses': 'Blouses',
  'dresses': 'Dresses',
  'jeans': 'Jeans',
  'pants': 'Pants',
  'skirts': 'Skirts',
  'jackets': 'Jackets',
  'shoes': 'Shoes',
  'accessories': 'Accessories',
  'tshirts': 'T-Shirts',
  'shirts': 'Shirts',
  'shorts': 'Shorts',
  'tunics': 'Tunics',
  'hoodies': 'Hoodies',
  'tanks': 'Tank Tops',
  'sweaters': 'Sweaters',
  'sweatpants': 'Sweatpants',
  'sweatshirts': 'Sweatshirts',
  'tracksuits': 'Tracksuits',
  'vests': 'Vests',
  'visors': 'Visors',
  'backpacks': 'Backpacks',
  'flats': 'Flats',
  'mules': 'Mules',
  'apparel': 'Apparel',
  'ethnic-wear': 'Ethnic Fusion',
  'activewear': 'Activewear',
};

// Reverse mapping from CMS subcategory values to route slugs
function getSubcategorySlug(cmsSubcategory: string | null | undefined): string {
  if (!cmsSubcategory) return 'women';
  const lowerSub = cmsSubcategory.toLowerCase();
  for (const [slug, cmsValues] of Object.entries(SUBCATEGORY_MAP)) {
    if (Array.isArray(cmsValues)) {
      if (cmsValues.some(v => v.toLowerCase() === lowerSub)) return slug;
    } else if (cmsValues.toLowerCase() === lowerSub) {
      return slug;
    }
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
    console.error(`[WomenSubcategoryPage] Product ${product.id} - Gallery:`, {
      galleryLength: gallery.length,
      gallery: gallery,
      galleryItems: gallery.map((url, idx) => ({ index: idx, url, type: typeof url, isEmpty: url === '' })),
      modelImagesLength: modelImages.length,
      modelImages: modelImages,
      productImage: product.image,
      productImageType: typeof product.image,
      productImageIsObject: product.image && typeof product.image === 'object',
      productImageId: product.image?.id || 'no-id',
      productImageUrl: product.image_url,
      modelImage1: product.model_image_1,
      modelImage1Url: product.model_image_1_url
    });

    // CRITICAL: Ensure gallery is never empty if we have a valid image
    // If gallery is empty but we have a main image, add it to the gallery
    const filteredGallery = gallery.filter((url): url is string => url !== null && url !== '' && typeof url === 'string');
    const finalImage = (filteredGallery.length > 0 && filteredGallery[0]) ? filteredGallery[0] : '';
    
    // If we have a main image but gallery is empty, something went wrong - log it
    if (mainImage && filteredGallery.length === 0) {
      console.error(`[WomenSubcategoryPage] ⚠️⚠️⚠️ CRITICAL: Gallery is empty but mainImage exists!`, {
        productId: product.id,
        mainImage,
        mainImageUrl,
        gallery,
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