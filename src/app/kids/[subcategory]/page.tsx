import { fetchProducts, fetchProductBySlug, fileUrl, fetchProductsByGenderAndSubcategory, hasColor, type Product } from "@/lib/directus";
import ProductCard from "@/components/ProductCard";
import ProductDetailContent from "@/components/ProductDetailContent";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { SUBCATEGORY_DESCRIPTIONS } from "@/data/subcategory-descriptions";
import DescriptionText from "@/components/DescriptionText";

// Force dynamic rendering to prevent build-time API calls
export const dynamic = 'force-dynamic';

// Helper to extract photo session ID from image path
function getSessionId(imagePath: string | null | undefined): string | null {
  if (!imagePath || typeof imagePath !== 'string') return null;

  const filename = imagePath.split('/').pop() || imagePath;

  const patterns = [
    /(SONY_ILCE[-_]7RM5[-_]\d+x\d*)/i,
    /(_DSC\d+)/i,
    /(file_\d+x\d+_\d+)/i
  ];

  for (const pattern of patterns) {
    const match = filename.match(pattern);
    if (match) {
      return match[1].toUpperCase().replace(/-/g, '_');
    }
  }
  return null;
}

// Check if two session IDs are from the same photo session
function isSameSession(sessionId1: string | null, sessionId2: string | null): boolean {
  if (!sessionId1 || !sessionId2) return false;

  const norm1 = sessionId1.toUpperCase().replace(/-/g, '_');
  const norm2 = sessionId2.toUpperCase().replace(/-/g, '_');

  if (norm1 === norm2) return true;

  if (norm1.length > 10 && norm2.length > 10) {
    const base = norm1.substring(0, Math.min(15, norm1.length));
    if (norm2.includes(base) || norm1.includes(norm2.substring(0, Math.min(15, norm2.length)))) {
      return true;
    }
  }

  return false;
}

// Build gallery with ONLY matching model images from the same photo session
// Limits to max 4 images total (1 main + up to 3 model images)
function buildMatchingGallery(product: any): string[] {
  const MAX_IMAGES = 4;

  const mainImage = product.image || product.image_url;
  const mainImageUrl = mainImage ? fileUrl(mainImage) : null;
  const mainSessionId = getSessionId(mainImage);

  const gallery: string[] = mainImageUrl ? [mainImageUrl] : [];

  const allModelImages = [
    product.model_image_1_url || product.model_image_1,
    product.model_image_2_url || product.model_image_2,
    product.model_image_3_url || product.model_image_3,
  ].filter(Boolean);

  for (const modelImg of allModelImages) {
    if (gallery.length >= MAX_IMAGES) break;

    const modelSessionId = getSessionId(modelImg);
    const isCloudinaryImage = typeof modelImg === 'string' && modelImg.includes('cloudinary.com');
    const matches = isSameSession(mainSessionId, modelSessionId);

    if (matches || isCloudinaryImage) {
      const url = fileUrl(modelImg);
      if (url && !gallery.includes(url)) {
        gallery.push(url);
      }
    }
  }

  return gallery;
}

const SUBCATEGORY_MAP: Record<string, string | string[]> = {
  // URL-friendly slugs matching Kids page
  'tshirt': 'T-Shirt',
  'jeans': 'Jeans',
  'slim-jeans': 'Slim Jeans',
  'dress': 'Dress',
  'midi-dress': 'Midi Dress',
  'casual-top': 'Casual Top',
  'hoodie': 'Hoodie',
  'tracksuit': 'Tracksuit',
  'sweatshirt': 'Sweatshirt',
  'pants': 'Pants',
  'slim-pants': 'Slim Pants',
  'jumpsuit': 'Jumpsuit',
  'kurta': 'Kurta',
  'casual-jacket': 'Casual Jacket',
  'denim-jacket': 'Denim Jacket',
  'varsity-jacket': 'Varsity Jacket',
  'flats': 'Flats',

  // Legacy plural forms for backwards compatibility
  'tshirts': ['T', 'T-Shirt', 'Classic T-Shirt'],
  'shirts': ['Shirt', 'Casual Shirt'],
  'dresses': ['Dress', 'Dresses', 'Midi Dress', 'Mini Dress'],
  'jackets': ['Jacket', 'Outerwear', 'Casual Jacket', 'Denim Jacket'],
  'shoes': ['Footwear', 'Flats', 'Flat'],
  'accessories': 'Accessories',

  // Boys/Girls specific slugs
  'boys-tshirts': ['T', 'T-Shirt', 'Classic T-Shirt'],
  'girls-tops': ['Tops', 'Top', 'Casual Top'],
  'boys-jeans': ['Bottoms', 'Jeans', 'Slim Jeans'],
  'girls-dresses': ['Dresses', 'Dress', 'Midi Dress'],

  // Additional generic subcategories
  'tops': ['Tops', 'Top', 'Casual Top'],
  'bottoms': 'Bottoms',
  'tracksuits': 'Tracksuit',
  'jumpsuits': ['Jumpsuits', 'Jumpsuit'],
  'outerwear': 'Outerwear',
  'apparel': 'Apparel',  // Generic fallback
};

const TITLE_MAP: Record<string, string> = {
  // URL-friendly slugs matching Kids page
  'tshirt': 'T-Shirts',
  'jeans': 'Jeans',
  'slim-jeans': 'Slim Jeans',
  'dress': 'Dresses',
  'midi-dress': 'Midi Dresses',
  'casual-top': 'Casual Tops',
  'hoodie': 'Hoodies',
  'tracksuit': 'Tracksuits',
  'sweatshirt': 'Sweatshirts',
  'pants': 'Pants',
  'slim-pants': 'Slim Pants',
  'jumpsuit': 'Jumpsuits',
  'kurta': 'Kurtas',
  'casual-jacket': 'Casual Jackets',
  'denim-jacket': 'Denim Jackets',
  'varsity-jacket': 'Varsity Jackets',
  'flats': 'Flats',

  // Legacy plural forms
  'tshirts': 'T-Shirts',
  'shirts': 'Shirts',
  'dresses': 'Dresses',
  'jackets': 'Jackets',
  'shoes': 'Shoes',
  'accessories': 'Accessories',

  // Boys/Girls specific slugs
  'boys-tshirts': "Boys' T-Shirts",
  'girls-tops': "Girls' Tops",
  'boys-jeans': "Boys' Jeans",
  'girls-dresses': "Girls' Dresses",

  // Additional generic subcategories
  'tops': 'Tops',
  'bottoms': 'Bottoms',
  'tracksuits': 'Tracksuits',
  'jumpsuits': 'Jumpsuits',
  'outerwear': 'Outerwear',
  'apparel': 'Apparel',
};

// Reverse mapping from CMS subcategory values to route slugs
function getSubcategorySlug(cmsSubcategory: string | null | undefined): string {
  if (!cmsSubcategory) return 'kids';
  const lowerSub = cmsSubcategory.toLowerCase();
  for (const [slug, cmsValues] of Object.entries(SUBCATEGORY_MAP)) {
    if (Array.isArray(cmsValues)) {
      if (cmsValues.some(v => v.toLowerCase() === lowerSub)) return slug;
    } else if (cmsValues.toLowerCase() === lowerSub) {
      return slug;
    }
  }
  return 'kids'; // fallback
}

// Get display title from CMS subcategory
function getSubcategoryTitle(cmsSubcategory: string | null | undefined): string {
  const slug = getSubcategorySlug(cmsSubcategory);
  return TITLE_MAP[slug] || cmsSubcategory || 'Kids';
}

interface PageProps {
  params: Promise<{ subcategory: string }>;
  searchParams: Promise<{ color?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subcategory } = await params;
  const displayTitle = TITLE_MAP[subcategory] || subcategory;
  const description = SUBCATEGORY_DESCRIPTIONS.kids[subcategory] || '';

  return {
    title: `Kids' ${displayTitle} | Zecode`,
    description: description.substring(0, 160),
    openGraph: {
      title: `Kids' ${displayTitle} | Zecode`,
      description: description.substring(0, 160),
    }
  };
}

export default async function KidsSubcategoryPage({ params, searchParams }: PageProps) {
  const { subcategory } = await params;
  const { color } = await searchParams;

  // 1. Check if it's a known subcategory
  if (SUBCATEGORY_MAP[subcategory]) {
    const cmsSubcategory = SUBCATEGORY_MAP[subcategory];
    const displayTitle = TITLE_MAP[subcategory] || subcategory;

    let products: any[] = [];
    try {
      // Optimized fetch: Filter by gender and subcategory at the API level
      // This prevents fetching ALL products and filtering in memory
      const fetchedProducts = await fetchProductsByGenderAndSubcategory("kids", cmsSubcategory);
      if (fetchedProducts) {
        // Apply color filter locally
        products = fetchedProducts.filter((p: Product) => !color || hasColor(p, color));
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
              <Link href="/kids" className="text-gray-500 hover:text-gray-700">Kids</Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 font-medium">{displayTitle}</span>
            </nav>
          </div>
        </div>

        <div className="py-8 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Kids&apos; {displayTitle} {color && <span className="text-blue-200">- {color.charAt(0).toUpperCase() + color.slice(1)}</span>}
            </h1>
            <p className="text-blue-200">{products.length} products found</p>
          </div>
        </div>

        {/* Description Section */}
        <DescriptionText text={SUBCATEGORY_DESCRIPTIONS.kids[subcategory]} />

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
              <Link href="/kids" className="mt-4 inline-block text-blue-600 hover:underline">Browse all Kids' products</Link>
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
      category: `kids/${subcategorySlug}`,  // Route path like "kids/tshirts"
      categoryLabel: subcategoryTitle,       // Display title like "T-Shirts"
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