'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fileUrl, fetchProductCounts } from '@/lib/directus';

// Map from URL slug to CMS subcategory values
const SUBCATEGORY_TO_CMS: Record<string, string> = {
  'tshirts': 'T Shirt',
  'shirts': 'Shirt',
  'jeans': 'Jeans',
  'pants': 'Pants',
  'trousers': 'Trousers',
  'jackets': 'Jacket',
  'shoes': 'Flats',
  'accessories': 'Accessories',
  'tops': 'Top',
  'blouse': 'Blouse',
  'dresses': 'Dress',
  'skirts': 'Skirt',
  'outerwear': 'Jacket',
  'shorts': 'Shorts',
  'ethnic-wear': 'Ethnic Wear',
  // Kids-specific slugs (matching header menu)
  'boys-tshirts': 'T-Shirt',
  'girls-tops': 'Top',
  'boys-jeans': 'Jeans',
  'girls-dresses': 'Dress',
  // Footwear - gender based
  'men': 'Flats',
  'women': 'Flats',
};

// Mapping from URL slugs to normalized CMS subcategory values for matching
const SLUG_TO_CMS_SUBCATEGORY: Record<string, string[]> = {
  // Men - MUST match exact capitalization in Directus
  'tshirts': ['T', 'T-Shirt', 'Classic T-Shirt'],
  'shirts': ['Shirt', 'Casual Shirt', 'Button-Up Shirt', 'Short Sleeve Shirt'],
  'jeans': ['Jeans', 'Slim Jeans'],
  'trousers': ['Trousers', 'Pants', 'Slim Pants', 'Cargo Pants'],
  'jackets': ['Jacket', 'Casual Jacket', 'Denim Jacket', 'Varsity Jacket'],
  // Women - MUST match exact capitalization in Directus
  'tops': ['Top', 'Tops', 'Casual Top', 'Tank Top'],
  'dresses': ['Dress', 'Dresses', 'Midi Dress', 'Mini Dress', 'Slip Dress'],
  'skirts': ['Skirt', 'Skirts'],
  'shoes': ['Footwear', 'Flats', 'Sneakers', 'Formal Shoes', 'Heels', 'Mules', 'Sandals', 'Boots', 'Loafers'],
  // Kids - matching header menu (4 subcategories)
  'boys-tshirts': ['T-Shirt', 'T', 'Tshirt'],
  'girls-tops': ['Top', 'Tops', 'Casual Top'],
  'boys-jeans': ['Jeans', 'Slim Jeans', 'Bottom', 'Bottoms'],
  'girls-dresses': ['Dress', 'Dresses', 'Midi Dress'],
  // Footwear - gender-based subcategories
  'men': ['Flats', 'Mules', 'Sneakers', 'Boots', 'Loafers', 'Sandals'],
  'women': ['Flats', 'Mules', 'Heels', 'Sandals', 'Boots', 'Sneakers'],
  'shorts': ['Shorts', 'Short'],
  'ethnic-wear': ['Kurti', 'Kurta', 'Lehenga', 'Suit Set', 'Ethnic Dress'],
};

// Normalize subcategory for matching
const normalizeSub = (s?: string | null) => {
  if (!s) return "";
  return s.toString().toLowerCase().replace(/[^a-z0-9]/g, "");
};

interface SubcategoryCardProps {
  title: string;
  slug: string;
  categorySlug: string;
  products: Array<{ image_url?: string; image?: string; name: string; subcategory?: string; gender_category?: string }>;
  productCount: number;
  isLoading: boolean;
}

function SubcategoryCard({ title, slug, categorySlug, products, productCount, isLoading }: SubcategoryCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Removed internal fetching logic - data now passed via props

  // Image cycling effect
  useEffect(() => {
    if (products.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % products.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [products.length]);

  // Get current image URL
  const getCurrentImageUrl = useCallback(() => {
    if (products.length === 0) {
      return '/placeholders/product-placeholder.png';
    }
    const product = products[currentImageIndex];
    return fileUrl(product?.image || product?.image_url) || '/placeholders/product-placeholder.png';
  }, [products, currentImageIndex]);

  const imageUrl = getCurrentImageUrl();

  return (
    <Link
      href={`/${categorySlug}/${slug}`}
      className="group block relative overflow-hidden rounded-lg bg-gray-100 aspect-[3/4] shadow-sm hover:shadow-lg transition-all duration-300"
    >
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>
      )}

      {/* Product image */}
      {!isLoading && (
        <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover object-center transition-opacity duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </div>
      )}

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <h3 className="text-lg font-semibold mb-1 group-hover:text-yellow-400 transition-colors">
          {title}
        </h3>
        {productCount > 0 && (
          <p className="text-sm text-gray-300 mb-2">
            {productCount} products
          </p>
        )}

        {/* Image indicators */}
        {products.length > 1 && (
          <div className="flex gap-1 mt-2">
            {products.slice(0, 5).map((_, index) => (
              <div
                key={index}
                className={`h-1 w-6 rounded-full transition-all duration-300 ${index === currentImageIndex % 5 ? 'bg-white' : 'bg-white/40'
                  }`}
              />
            ))}
            {products.length > 5 && (
              <span className="text-xs text-gray-300 ml-1">+{products.length - 5}</span>
            )}
          </div>
        )}
      </div>

      {/* Shop Now button on hover */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="bg-white text-black px-6 py-2 rounded-full font-semibold transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
          Shop Now
        </span>
      </div>
    </Link>
  );
}

interface SubcategoryGridDynamicProps {
  title: string;
  categorySlug: string;
  subcategories: Array<{
    title: string;
    slug: string;
  }>;
  variant?: 'default' | 'section'; // Visual styling variant
  showDivider?: boolean; // Show decorative divider above section
}



export default function SubcategoryGridDynamic({ title, categorySlug, subcategories, variant = 'default', showDivider = false }: SubcategoryGridDynamicProps) {
  // Map of subcategory slug -> { products, count }
  const [subcategoryData, setSubcategoryData] = useState<Map<string, { products: any[]; count: number }>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    async function fetchAllSubcategories() {
      try {
        // 1. Collect all variations for all visible subcategories
        const allVariations: string[] = [];
        subcategories.forEach(subcat => {
          // Use first value logic or mapping
          const variations = SLUG_TO_CMS_SUBCATEGORY[subcat.slug] || [subcat.slug];
          allVariations.push(...variations);
        });

        // 2. Prepare batch API call
        const params = new URLSearchParams();
        // Fetch enough products to cover images for all subcategories (e.g. 10 per subcat * 20 subcats = 200)
        // We use a safe limit of 500 to be sure
        params.set('limit', '500');
        params.set('fields', 'name,image_url,image,subcategory,gender_category');
        params.set('filter[subcategory][_in]', allVariations.join(','));

        // Note: We can't strictly filter by gender here if it's mixed (e.g. footwear page might show men & women)
        // But if categorySlug matches a gender, we can pre-filter
        if (['men', 'women', 'kids'].includes(categorySlug.toLowerCase())) {
          // Basic gender mapping, might need more robust logic if API values differ
          const genderMap: Record<string, string> = { 'men': 'Men', 'women': 'Women', 'kids': 'Kids' };
          const genderVal = genderMap[categorySlug.toLowerCase()];
          if (genderVal) params.set('filter[gender_category][_eq]', genderVal);
        }

        const response = await fetch(`/api/directus/items/products?${params.toString()}`);
        let products: any[] = [];
        if (response.ok) {
          const data = await response.json();
          products = data.data || [];
          setError(null); // Clear any previous errors
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          const errorMsg = errorData.details || errorData.error || 'Failed to load products';
          console.error('API Error:', errorMsg);
          setError(errorMsg);

          // Auto-retry on server overload (max 2 retries)
          if (errorMsg.includes('Under pressure') && retryCount < 2) {
            console.log(`Retrying... (attempt ${retryCount + 1}/2)`);
            setTimeout(() => setRetryCount(prev => prev + 1), 2000); // Retry after 2 seconds
          }
        }

        // 3. Group products by subcategory slug
        const grouped = new Map();
        subcategories.forEach(subcat => {
          const variations = SLUG_TO_CMS_SUBCATEGORY[subcat.slug] || [subcat.slug];

          // Filter products matching this subcategory's variations
          // AND matching the gender logic
          const matchingProducts = products.filter(p => {
            // Check subcategory match
            if (!variations.includes(p.subcategory)) return false;

            // Check gender match (refining the query filter above)
            const pGender = p.gender_category;
            if (categorySlug === 'footwear') {
              // Footwear page has subcategories like 'men', 'women'
              if (subcat.slug === 'men' && pGender !== 'Men') return false;
              if (subcat.slug === 'women' && pGender !== 'Women') return false;
            } else {
              // Parent pages: ensure strictly matching gender
              if (categorySlug === 'men' && pGender !== 'Men') return false;
              if (categorySlug === 'women' && pGender !== 'Women') return false;
              if (categorySlug === 'kids' && pGender !== 'Kids') return false;
            }
            return true;
          });

          // For display, prefer items with images
          const withImages = matchingProducts.filter((p: any) => p.image || p.image_url);
          const displayProducts = withImages.length > 0 ? withImages : matchingProducts;

          grouped.set(subcat.slug, {
            products: displayProducts.slice(0, 10), // Keep first 10 for carousel
            count: matchingProducts.length // Total count in this batch
          });
        });

        setSubcategoryData(grouped);
      } catch (error) {
        console.error('Error fetching batch products:', error);
        setError(error instanceof Error ? error.message : 'Network error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAllSubcategories();
  }, [categorySlug, subcategories, retryCount]); // Re-run on retry

  return (
    <section className={`py-12 px-4 md:px-8 ${variant === 'section' ? 'bg-gray-50' : 'bg-white'}`}>
      {/* Optional decorative divider */}
      {showDivider && (
        <div className="max-w-7xl mx-auto mb-12">
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-gray-300"></div>
            <div className="w-2 h-2 rounded-full bg-[#C83232]"></div>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-gray-300 to-gray-300"></div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Enhanced section header */}
        <div className="text-center mb-10">
          {variant === 'section' && (
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="w-8 h-px bg-[#C83232]"></div>
              <span className="text-xs font-bold tracking-[0.2em] text-[#C83232] uppercase">Collection</span>
              <div className="w-8 h-px bg-[#C83232]"></div>
            </div>
          )}
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {title}
          </h2>
          {variant === 'section' && (
            <div className="w-20 h-1 bg-gradient-to-r from-[#C83232] to-[#e63946] mx-auto rounded-full"></div>
          )}
        </div>

        {/* Error message */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6 text-center">
            <p className="text-red-800 font-semibold mb-2">Unable to load products</p>
            <p className="text-red-600 text-sm mb-3">{error}</p>
            <button
              onClick={() => setRetryCount(prev => prev + 1)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {subcategories.map((subcategory) => {
            const data = subcategoryData.get(subcategory.slug) || { products: [], count: 0 };

            // Show loading skeletons or hide if no products (but only if no error)
            if (!isLoading && data.count === 0 && !error) return null;

            return (
              <SubcategoryCard
                key={subcategory.slug}
                title={subcategory.title}
                slug={subcategory.slug}
                categorySlug={categorySlug}
                products={data.products}
                productCount={data.count}
                isLoading={isLoading}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
