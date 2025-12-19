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

// Helper to extract photo session ID (e.g., DSC1234) from image path
function getSessionId(imagePath: string | null | undefined): string | null {
  if (!imagePath || typeof imagePath !== 'string') return null;
  // Match patterns like __DSC1234 or _DSC1234 in the filename
  const match = imagePath.match(/_?_?(DSC\d+)/i);
  return match ? match[1] : null;
}

// Build gallery with model images - include AI-generated images from Cloudinary
function buildMatchingGallery(product: any): string[] {
  const mainImage = product.image || product.image_url;
  // Convert main image to URL - fileUrl handles strings, objects, and null
  const mainImageUrl = mainImage ? (fileUrl(mainImage) || (typeof mainImage === 'string' && mainImage.startsWith('http') ? mainImage : null)) : null;
  const mainSessionId = getSessionId(mainImageUrl);

  // Start with just the main product image (as URL)
  const gallery: string[] = mainImageUrl ? [mainImageUrl] : [];

  // Add model images - either matching session ID or AI-generated (Cloudinary URLs)
  const modelImages = [product.model_image_1, product.model_image_2, product.model_image_3].filter(Boolean);

  for (const modelImg of modelImages) {
    // Convert UUID/object to URL - fileUrl handles strings, objects, and null
    const modelImgUrl = modelImg ? (fileUrl(modelImg) || (typeof modelImg === 'string' && modelImg.startsWith('http') ? modelImg : null)) : null;
    if (!modelImgUrl || typeof modelImgUrl !== 'string') continue;

    const modelSessionId = getSessionId(modelImgUrl);
    // Include if: session IDs match OR it's an AI-generated image (Cloudinary URL or no session ID)
    const isCloudinaryImage = modelImgUrl.includes('cloudinary.com');
    const isMatchingSession = mainSessionId && modelSessionId && mainSessionId === modelSessionId;

    if (isCloudinaryImage || isMatchingSession) {
      gallery.push(modelImgUrl);
    }
  }

  return gallery;
}

const SUBCATEGORY_MAP: Record<string, string | string[]> = {
  'tshirts': ['T', 'T-Shirt', 'T-Shirts', 'Classic T-Shirt', 'Classic T-Shirts'],
  'shirts': ['Shirt', 'Shirts', 'Casual Shirt', 'Casual Shirts', 'Button-Up Shirt', 'Button-Up Shirts', 'Short Sleeve Shirt', 'Short Sleeve Shirts'],
  'jeans': ['Jeans', 'Slim Jeans', 'Jean', 'Slim Jean'], // Add singular just in case
  'pants': ['Pants', 'Slim Pants', 'Cargo Pants', 'Pant', 'Slim Pant', 'Cargo Pant'],
  'trousers': ['Trousers', 'Trouser'],
  'jackets': ['Jacket', 'Jackets', 'Casual Jacket', 'Casual Jackets', 'Denim Jacket', 'Denim Jackets', 'Varsity Jacket', 'Varsity Jackets'],
  'shoes': ['Footwear', 'Shoe', 'Shoes'],
  'accessories': ['Accessories', 'Accessory'],
  'shorts': ['Short', 'Shorts'],
  'hoodies': ['Hoodie', 'Hoodies'],
  'sweatshirts': ['Sweatshirt', 'Sweatshirts'],
  'backpacks': ['Backpack', 'Backpacks'],
  'polos': ['Polo Shirt', 'Polo Shirts', 'Polo'],
  'apparel': 'Apparel',  // Generic fallback
};

const TITLE_MAP: Record<string, string> = {
  'tshirts': 'T-Shirts',
  'shirts': 'Shirts',
  'jeans': 'Jeans',
  'pants': 'Pants',
  'trousers': 'Trousers',
  'jackets': 'Jackets',
  'shoes': 'Shoes',
  'accessories': 'Accessories',
  'shorts': 'Shorts',
  'hoodies': 'Hoodies',
  'sweatshirts': 'Sweatshirts',
  'backpacks': 'Backpacks',
  'apparel': 'Apparel',
};

// Reverse mapping from CMS subcategory values to route slugs
function getSubcategorySlug(cmsSubcategory: string | null | undefined): string {
  if (!cmsSubcategory) return 'men';
  const lowerSub = cmsSubcategory.toLowerCase();
  for (const [slug, cmsValues] of Object.entries(SUBCATEGORY_MAP)) {
    if (Array.isArray(cmsValues)) {
      if (cmsValues.some(v => v.toLowerCase() === lowerSub)) return slug;
    } else if (cmsValues.toLowerCase() === lowerSub) {
      return slug;
    }
  }
  return 'men'; // fallback
}

// Get display title from CMS subcategory
function getSubcategoryTitle(cmsSubcategory: string | null | undefined): string {
  const slug = getSubcategorySlug(cmsSubcategory);
  return TITLE_MAP[slug] || cmsSubcategory || 'Men';
}

interface PageProps {
  params: Promise<{ subcategory: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subcategory } = await params;
  const displayTitle = TITLE_MAP[subcategory] || subcategory;
  const description = SUBCATEGORY_DESCRIPTIONS.men[subcategory] || '';

  return {
    title: `Men's ${displayTitle} | Zecode`,
    description: description.substring(0, 160),
    openGraph: {
      title: `Men's ${displayTitle} | Zecode`,
      description: description.substring(0, 160),
    }
  };
}

export default async function MenSubcategoryPage({ params }: PageProps) {
  const { subcategory } = await params;

  // 1. Check if it's a known subcategory
  if (SUBCATEGORY_MAP[subcategory]) {
    const cmsSubcategory = SUBCATEGORY_MAP[subcategory];
    const displayTitle = TITLE_MAP[subcategory] || subcategory;

    let products: any[] = [];
    try {
      // Optimized fetch: Filter by gender and subcategory at the API level
      // This prevents fetching ALL products and filtering in memory
      const fetchedProducts = await fetchProductsByGenderAndSubcategory("men", cmsSubcategory);
      if (fetchedProducts) {
        products = fetchedProducts;
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }




    // ... existing imports ...

    // ... (inside component)

    return (
      <div className="min-h-screen bg-white">
        <div className="bg-gray-50 py-4">
          <div className="max-w-7xl mx-auto px-4">
            <nav className="flex items-center space-x-2 text-sm">
              <Link href="/" className="text-gray-500 hover:text-gray-700">Home</Link>
              <span className="text-gray-400">/</span>
              <Link href="/men" className="text-gray-500 hover:text-gray-700">Men</Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 font-medium">{displayTitle}</span>
            </nav>
          </div>
        </div>

        <div className="py-8 bg-gradient-to-r from-gray-900 to-gray-700">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Men&apos;s {displayTitle}</h1>
            <p className="text-gray-300">{products.length} products found</p>
          </div>
        </div>

        {/* Description Section */}
        <DescriptionText text={SUBCATEGORY_DESCRIPTIONS.men[subcategory]} />

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
              <Link href="/men" className="mt-4 inline-block text-blue-600 hover:underline">Browse all Men&apos;s products</Link>
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
    // Build gallery with matching model images from the same photo session
    const mainImage = product.image || product.image_url;
    const matchingGallery = buildMatchingGallery(product);

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

    const productDetail = {
      id: product.id,
      name: product.name,
      category: `men/${subcategorySlug}`,  // Route path like "men/tshirts"
      categoryLabel: subcategoryTitle,      // Display title like "T-Shirts"
      price: product.price,
      originalPrice: product.sale_price,
      image: fileUrl(mainImage) || '',
      gallery: matchingGallery.map(img => fileUrl(img) || ''),
      modelImages: modelImages, // Pass model images explicitly
      description: product.description || '',
      sizes: product.sizes || [],
      rating: 4.5, // Mock rating
      reviewCount: 10 // Mock review count
    };

    return <ProductDetailContent product={productDetail} />;
  }

  // 3. If neither, 404
  notFound();
}

export async function generateStaticParams() {
  return Object.keys(SUBCATEGORY_MAP).map((subcategory) => ({ subcategory }));
}