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
  'tshirts': ['T-Shirts', 'T-Shirt', 'T', 'Tshirt', 'Graphic Tee', 'Classic T-Shirt'],
  'shirts': ['Shirt', 'Shirts', 'Casual Shirt', 'Button-Up Shirt', 'Short Sleeve Shirt'],
  'jeans': ['Jeans', 'Denim', 'Slim Jeans', 'Wide Leg Jeans'],
  'trousers': ['Trousers', 'Pants', 'Slim Pants', 'Cargo Pants'],
  'jackets': ['Jacket', 'Jackets', 'Outerwear', 'Blazer', 'Coat'],
  'shoes': ['Footwear', 'Shoes', 'Sneakers', 'Formal Shoes', 'Boots', 'Loafers', 'Sandals'],
  'accessories': ['Accessories', 'Accessory', 'Backpack', 'Backpacks'],
  'shorts': ['Short', 'Shorts'],
  'hoodies': ['Hoodie', 'Hoodies', 'Sweatshirt', 'Sweatshirts'],
};

const TITLE_MAP: Record<string, string> = {
  'tshirts': 'T-Shirts',
  'shirts': 'Shirts',
  'jeans': 'Jeans',
  'trousers': 'Trousers',
  'jackets': 'Jackets',
  'shoes': 'Shoes',
  'accessories': 'Accessories',
  'shorts': 'Shorts',
  'hoodies': 'Hoodies & Sweatshirts',
};

interface PageProps {
  params: Promise<{ subcategory: string }>;
  searchParams: Promise<{ color?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subcategory } = await params;
  const displayTitle = TITLE_MAP[subcategory] || subcategory;
  const description = SUBCATEGORY_DESCRIPTIONS.men[subcategory] || `Shop Men's ${displayTitle} collection at Zecode.`;

  return {
    title: `Men's ${displayTitle} | Zecode`,
    description: description.substring(0, 160),
  };
}

export default async function MenSubcategoryPage({ params, searchParams }: PageProps) {
  const { subcategory } = await params;
  const { color } = await searchParams;

  // 1. If it's a known subcategory
  if (SUBCATEGORY_MAP[subcategory]) {
    const cmsSubcategories = SUBCATEGORY_MAP[subcategory];
    const displayTitle = TITLE_MAP[subcategory] || subcategory;

    const fetchedProducts = await fetchProductsByGenderAndSubcategory("men", cmsSubcategories);
    if (!fetchedProducts) {
      return <div className="py-20 text-center text-gray-500">Failed to load products.</div>;
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
              <Link href="/men" className="hover:text-black">Men</Link>
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
        <DescriptionText text={SUBCATEGORY_DESCRIPTIONS.men[subcategory]} />

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
              <Link href="/men" className="text-black font-bold border-b-2 border-black hover:pb-1 transition-all">
                Browse All Men's Fashion
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. If it's not a subcategory, check if it's a product and redirect
  return redirect(`/product/${subcategory}`);
}