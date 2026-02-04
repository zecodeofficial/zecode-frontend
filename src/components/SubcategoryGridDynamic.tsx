'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fileUrl, fetchProductCounts, getProductPlaceholderUrl } from '@/lib/directus';

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
  'activewear': 'Activewear',
  // Kids-specific slugs (matching header menu)
  'boys-tshirts': 'T-Shirt',
  'girls-tops': 'Top',
  'boys-jeans': 'Jeans',
  'girls-dresses': 'Dress',
  // Footwear - gender based
  'men': 'Flats',
  'women': 'Flats',
};

// Mapping from URL slugs to standardized CMS subcategory values
const SLUG_TO_CMS_SUBCATEGORY: Record<string, string[]> = {
  // Men
  'tshirts': ['t-shirts'],
  'shirts': ['shirts'],
  'jeans': ['jeans'],
  'trousers': ['trousers'],
  'jackets': ['jackets'],
  'shorts': ['shorts'],
  // Women
  'tops': ['tops'],
  'dresses': ['dresses'],
  'skirts': ['skirts'],
  'shoes': ['shoes', 'sneakers', 'sandals', 'boots', 'loafers', 'flats', 'mules', 'heels', 'slides', 'clogs', 'flip-flops', 'footwear'],
  'activewear': ['activewear'],
  // Kids
  'boys-tshirts': ['boys-t-shirts'],
  'girls-tops': ['girls-tops'],
  'boys-jeans': ['kids-jeans'],
  'girls-dresses': ['girls-dresses'],
  // Footwear (Now using granular subcategories but keeping 'footwear' as fallback)
  'sneakers': ['sneakers', 'footwear'],
  'slides': ['slides', 'footwear'],
  'clogs': ['clogs', 'footwear'],
  'sandals': ['sandals', 'footwear'],
  'flip-flops': ['flip-flops', 'footwear', 'slappers'],
  'flats': ['flats', 'footwear'],
  'heels': ['heels', 'footwear'],
  // Others
  'ethnic-wear': ['ethnic-wear'],
  'ethnic-fusion': ['ethnic-fusion'],
  'kurtas': ['kurtas'],
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
  href?: string;
  products: Array<{ image_url?: string; image?: string; name: string; subcategory?: string; gender_category?: string }>;
  productCount: number;
  isLoading: boolean;
  priority?: boolean;
}

function SubcategoryCard({ title, slug, categorySlug, href, products, productCount, isLoading, priority = false }: SubcategoryCardProps) {
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
      return getProductPlaceholderUrl();
    }
    const product = products[currentImageIndex];
    return fileUrl(product?.image || product?.image_url) || getProductPlaceholderUrl();
  }, [products, currentImageIndex]);

  const imageUrl = getCurrentImageUrl();

  return (
    <Link
      href={href || `/${categorySlug}/${slug}`}
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
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
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
  title: string | React.ReactNode;
  categorySlug: string;
  subcategories: Array<{
    title: string;
    slug: string;
    href?: string; // Optional custom link (e.g., with query params)
  }>;
  variant?: 'default' | 'section'; // Visual styling variant
  showDivider?: boolean; // Show decorative divider above section
  forcedGender?: 'Men' | 'Women' | 'Kids'; // Explicitly override gender filtering
  /** Pre-fetched product data from server - skips client-side fetch if provided. Must be serializable (plain object). */
  initialData?: Record<string, { products: any[]; count: number }>;
  /** Optional override for the heading tag (default: h2) */
  HeadingTag?: 'h1' | 'h2' | 'h3';
  /** Optional flag to hide the "Collection" label above title in section variant */
  hideSectionLabel?: boolean;
}

export default function SubcategoryGridDynamic({
  title,
  categorySlug,
  subcategories,
  variant = 'default',
  showDivider = false,
  forcedGender,
  initialData,
  HeadingTag = 'h2',
  hideSectionLabel = false
}: SubcategoryGridDynamicProps) {
  // Map of subcategory slug -> { products, count }
  // Use initialData if provided, otherwise start with empty Map
  const [subcategoryData, setSubcategoryData] = useState<Map<string, { products: any[]; count: number }>>(
    initialData ? new Map(Object.entries(initialData)) : new Map()
  );
  const [isLoading, setIsLoading] = useState(!initialData); // Skip loading if data provided
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Skip client-side fetch if data was prefetched server-side
    if (initialData && Object.keys(initialData).length > 0) {
      return;
    }

    async function fetchAllSubcategories() {
      try {
        setIsLoading(true);

        // OPTIMIZATION: Instead of one massive fetch that strains the server and hits limits,
        // we fire parallel, targeted requests for specific subcategories.
        // This is much faster for the DB (indexed lookup) and lighter on bandwidth.

        const fetchPromises = subcategories.map(async (subcat) => {
          // 1. Determine which CMS subcategories map to this slug
          const variations = SLUG_TO_CMS_SUBCATEGORY[subcat.slug] || [subcat.slug];

          // 2. Build targeted query params
          const params = new URLSearchParams();
          params.set('limit', '10'); // We only show ~10 items, so don't fetch 200!
          params.set('fields', 'name,image_url,image,subcategory,category,gender_category,slug');
          params.set('filter[status][_eq]', 'published');
          // 3. Category & Subcategory Filter
          // For the 'footwear' page, products might be in 'men', 'women' or 'footwear' categories
          // but will have subcategories like 'sneakers', 'sandals', or 'footwear'.
          if (categorySlug === 'footwear') {
            ['footwear', 'men', 'women'].forEach(c => params.append('filter[category][_in]', c));
          } else {
            params.set('filter[category][_eq]', categorySlug.toLowerCase());
          }

          // Always add subcategory filters
          variations.forEach(v => params.append('filter[subcategory][_in]', v));

          try {
            const response = await fetch(`/api/directus/items/products?${params.toString()}`);
            if (!response.ok) return { slug: subcat.slug, products: [], count: 0 };

            const data = await response.json();
            let products = data.data || [];

            // 4. Client-side refinement (Double check gender/fallback logic)
            // This is still needed because of the 'footwear' generic category/gender issue
            products = products.filter((p: any) => {
              // Gender Logic
              let productGender = p.gender_category;
              if (!productGender && (p.name || p.slug)) {
                const nameLower = (p.name || '').toLowerCase();
                const slugLower = (p.slug || '').toLowerCase();
                if (nameLower.includes("men's") || nameLower.startsWith("mens") || slugLower.includes("mens-")) productGender = 'Men';
                else if (nameLower.includes("women's") || nameLower.startsWith("womens") || slugLower.includes("womens-")) productGender = 'Women';
                else if (nameLower.includes("kid") || slugLower.includes("kid")) productGender = 'Kids';
              }

              if (forcedGender && productGender !== forcedGender) return false;
              if (categorySlug === 'footwear') {
                if (subcat.slug === 'men' && productGender !== 'Men') return false;
                if (subcat.slug === 'women' && productGender !== 'Women') return false;
              }
              return true;
            });

            return {
              slug: subcat.slug,
              products: products,
              count: products.length // approximate count from this slice
            };
          } catch (e) {
            console.warn(`Failed to fetch for ${subcat.slug}`, e);
            return { slug: subcat.slug, products: [], count: 0 };
          }
        });

        const results = await Promise.all(fetchPromises);

        // Assemble results into Map
        const grouped = new Map();
        results.forEach(res => {
          grouped.set(res.slug, { products: res.products, count: res.count });
        });

        setSubcategoryData(grouped);
        setError(null);
      } catch (error) {
        console.error('Error in parallel fetch:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAllSubcategories();
  }, [categorySlug, subcategories, initialData, forcedGender]);

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
          {variant === 'section' && !hideSectionLabel && (
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="w-8 h-px bg-[#C83232]"></div>
              <span className="text-xs font-bold tracking-[0.2em] text-[#C83232] uppercase">Collection</span>
              <div className="w-8 h-px bg-[#C83232]"></div>
            </div>
          )}
          <HeadingTag className={`${HeadingTag === 'h1' ? 'text-4xl md:text-5xl' : 'text-3xl md:text-4xl'} font-bold text-gray-900 mb-2`}>
            {title}
          </HeadingTag>
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
          {subcategories.map((subcategory, index) => {
            const data = subcategoryData.get(subcategory.slug) || { products: [], count: 0 };

            // Show loading skeletons or hide if no products (but only if no error)
            if (!isLoading && data.count === 0 && !error) return null;

            return (
              <SubcategoryCard
                key={subcategory.slug}
                title={subcategory.title}
                slug={subcategory.slug}
                categorySlug={categorySlug}
                href={subcategory.href}
                products={data.products}
                productCount={data.count}
                isLoading={isLoading}
                priority={index < 6}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
