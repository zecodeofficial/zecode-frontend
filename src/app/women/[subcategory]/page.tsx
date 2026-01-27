import { fetchProductsByGenderAndSubcategory, hasColor } from "@/lib/directus";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import { SUBCATEGORY_DESCRIPTIONS } from "@/data/subcategory-descriptions";
import DescriptionText from "@/components/DescriptionText";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Mapping from URL slug to CMS subcategory variations.
 * Consolidated with the global mapping for consistency.
 */
const SUBCATEGORY_MAP: Record<string, string[]> = {
  'tops': ['Top', 'Tops', 'Casual Top', 'Tank Top', 'Blouse', 'Tunics'],
  'tshirts': ['T-Shirts', 'T-Shirt', 'T', 'Tshirt', 'Graphic Tee', 'Classic T-Shirt'],
  'dresses': ['Dress', 'Dresses', 'Midi Dress', 'Mini Dress', 'Slip Dress', 'Maxi Dress', 'Evening Dress'],
  'skirts': ['Skirt', 'Skirts', 'Mini Skirt', 'Midi Skirt'],
  'jeans': ['Jeans', 'Denim', 'Slim Jeans', 'Wide Leg Jeans'],
  'trousers': ['Trousers', 'Pants', 'Leggings', 'Palazzos', 'Culottes'],
  'jackets': ['Jacket', 'Jackets', 'Outerwear', 'Blazer', 'Coat'],
  'activewear': ['Activewear', 'Sports Wear', 'Gym Wear', 'Yoga Wear', 'Leggings', 'Track Pants'],
  'ethnic-wear': ['Ethnic Wear', 'Ethnic Fusion', 'Ethnic Dresses', 'Kurta', 'Kurtas', 'Kurti', 'Lehenga', 'Suit Set', 'Ethnic Dress', 'Anarkali'],
  'shoes': ['Footwear', 'Shoes', 'Flats', 'Sneakers', 'Formal Shoes', 'Heels', 'Mules', 'Sandals', 'Boots', 'Loafers'],
};

const TITLE_MAP: Record<string, string> = {
  'tops': 'Tops',
  'tshirts': 'T-Shirts',
  'dresses': 'Dresses',
  'skirts': 'Skirts',
  'jeans': 'Jeans',
  'trousers': 'Trousers & Pants',
  'jackets': 'Jackets',
  'activewear': 'Activewear',
  'ethnic-wear': 'Ethnic Fusion',
  'shoes': 'Shoes',
};

interface PageProps {
  params: Promise<{ subcategory: string }>;
  searchParams: Promise<{ color?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subcategory } = await params;
  const displayTitle = TITLE_MAP[subcategory] || subcategory;
  const description = SUBCATEGORY_DESCRIPTIONS.women[subcategory] || `Shop Women's ${displayTitle} collection at Zecode.`;

  return {
    title: `Women's ${displayTitle} | Zecode`,
    description: description.substring(0, 160),
  };
}

export default async function WomenSubcategoryPage({ params, searchParams }: PageProps) {
  const { subcategory } = await params;
  const { color } = await searchParams;

  // 1. If it's a known subcategory
  if (SUBCATEGORY_MAP[subcategory]) {
    const cmsSubcategories = SUBCATEGORY_MAP[subcategory];
    const displayTitle = TITLE_MAP[subcategory] || subcategory;

    const fetchedProducts = await fetchProductsByGenderAndSubcategory("women", cmsSubcategories);
    if (!fetchedProducts) {
      return <div className="py-20 text-center">Failed to load products.</div>;
    }

    const filteredProducts = fetchedProducts.filter(p => !color || hasColor(p, color));

    return (
      <div className="min-h-screen bg-white">
        {/* Breadcrumbs */}
        <div className="bg-gray-50 py-4">
          <div className="max-w-7xl mx-auto px-4">
            <nav className="flex items-center space-x-2 text-sm text-gray-500">
              <Link href="/" className="hover:text-black">Home</Link>
              <span>/</span>
              <Link href="/women" className="hover:text-black">Women</Link>
              <span>/</span>
              <span className="text-black font-medium uppercase">{displayTitle}</span>
            </nav>
          </div>
        </div>

        {/* Hero / Header */}
        <div className="py-12 bg-black text-white">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-tight mb-4">
              {displayTitle}
            </h1>
            <p className="text-gray-400 text-lg">
              {filteredProducts.length} items found
              {color && <span className="ml-2">• Color: {color}</span>}
            </p>
          </div>
        </div>

        {/* Description */}
        <DescriptionText text={SUBCATEGORY_DESCRIPTIONS.women[subcategory]} />

        {/* Product Grid */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
              {filteredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 4} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <p className="text-gray-500 text-lg mb-4">No products found matching your criteria.</p>
              <Link href="/women" className="text-black font-bold border-b-2 border-black hover:pb-1 transition-all">
                Browse All Women's Fashion
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. If it's not a subcategory, check if it's a product and redirect
  // This cleans up the routing by moving product details to /product/[slug]
  return redirect(`/product/${subcategory}`);
}