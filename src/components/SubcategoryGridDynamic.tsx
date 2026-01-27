'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fileUrl, fetchProductCounts, getProductPlaceholderUrl } from '@/lib/directus';

/**
 * Mapping from URL slugs to comprehensive CMS subcategory values.
 * This ensures that a single category page (like /women/tops) can capture all 
 * variations of that category found in the Directus database.
 */
const SLUG_TO_CMS_SUBCATEGORY: Record<string, string[]> = {
  // Global / Shared
  'tshirts': ['T-Shirts', 'T-Shirt', 'T', 'Tshirt', 'Graphic Tee', 'Classic T-Shirt'],
  'shirts': ['Shirt', 'Shirts', 'Casual Shirt', 'Button-Up Shirt', 'Short Sleeve Shirt'],
  'jeans': ['Jeans', 'Denim', 'Slim Jeans', 'Wide Leg Jeans', 'Slim Pants'],
  'trousers': ['Trousers', 'Pants', 'Leggings', 'Palazzos', 'Culottes', 'Slim Pants', 'Cargo Pants'],
  'jackets': ['Jacket', 'Jackets', 'Outerwear', 'Blazer', 'Coat', 'Casual Jacket', 'Denim Jacket', 'Varsity Jacket'],
  'shoes': ['Footwear', 'Shoes', 'Flats', 'Sneakers', 'Formal Shoes', 'Heels', 'Mules', 'Sandals', 'Boots', 'Loafers'],

  // Women Specific
  'tops': ['Top', 'Tops', 'Casual Top', 'Tank Top', 'Blouse', 'Tunics'],
  'dresses': ['Dress', 'Dresses', 'Midi Dress', 'Mini Dress', 'Slip Dress', 'Maxi Dress', 'Evening Dress'],
  'skirts': ['Skirt', 'Skirts', 'Mini Skirt', 'Midi Skirt'],
  'activewear': ['Activewear', 'Sports Wear', 'Gym Wear', 'Yoga Wear', 'Leggings', 'Track Pants', 'activewear', 'ACTIVEWEAR'],
  'ethnic-wear': ['Ethnic Wear', 'Ethnic Fusion', 'Ethnic Dresses', 'Kurta', 'Kurtas', 'Kurti', 'Lehenga', 'Suit Set', 'Ethnic Dress', 'Anarkali', 'ethnic-wear'],

  // Kids Specific (matching header menu slugs)
  'boys-tshirts': ['T-Shirt', 'T', 'Tshirt', 'Boy T-Shirt'],
  'girls-tops': ['Top', 'Tops', 'Casual Top', 'Girl Top'],
  'boys-jeans': ['Jeans', 'Slim Jeans', 'Bottom', 'Bottoms'],
  'girls-dresses': ['Dress', 'Dresses', 'Midi Dress', 'Girl Dress'],

  // Footwear specific
  'men': ['Flats', 'Mules', 'Sneakers', 'Boots', 'Loafers', 'Sandals', 'Formal Shoes'],
  'women': ['Flats', 'Mules', 'Heels', 'Sandals', 'Boots', 'Sneakers', 'Mules'],
  'flats': ['Flats'],
  'mules': ['Mules'],
  'heels': ['Heels'],
  'sandals': ['Sandals'],
  'boots': ['Boots'],
  'sneakers': ['Sneakers'],
  'slides': ['Slides'],
  'clogs': ['Clogs'],
  'loafers': ['Loafers'],
  'flip-flops': ['Flip-Flops'],
  'shorts': ['Shorts', 'Short'],
};

interface SubcategoryCardProps {
  title: string;
  slug: string;
  categorySlug: string;
  href?: string;
  products: Array<{ image_url?: string; image?: string; main_image?: string; name: string; subcategory?: string; gender_category?: string }>;
  productCount: number;
  isLoading: boolean;
  priority?: boolean;
}

function SubcategoryCard({ title, slug, categorySlug, href, products, productCount, isLoading, priority = false }: SubcategoryCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
    // Check all possible image fields in priority order
    const imageToUse = product?.image || product?.image_url || (product as any)?.main_image;
    return fileUrl(imageToUse) || getProductPlaceholderUrl();
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
            className="object-cover object-center transition-opacity duration-500 opacity-100"
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
        <h3 className="text-lg font-semibold mb-1 text-white group-hover:text-yellow-400 transition-colors">
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
    href?: string;
  }>;
  variant?: 'default' | 'section';
  showDivider?: boolean;
  forcedGender?: 'Men' | 'Women' | 'Kids';
  hideSectionLabel?: boolean;
  HeadingTag?: 'h1' | 'h2';
  initialData?: Record<string, { products: any[]; count: number }>;
}

export default function SubcategoryGridDynamic({ title, categorySlug, subcategories, variant = 'default', showDivider = false, forcedGender, initialData, hideSectionLabel = false, HeadingTag = 'h2' }: SubcategoryGridDynamicProps) {
  const [subcategoryData, setSubcategoryData] = useState<Map<string, { products: any[]; count: number }>>(
    new Map(Object.entries(initialData || {}))
  );
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (initialData) {
      setSubcategoryData(new Map(Object.entries(initialData)));
      setIsLoading(false);
    }
  }, [initialData]);

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) return;

    async function fetchAllSubcategories() {
      try {
        const params = new URLSearchParams();
        params.set('limit', '-1');
        // Request all relevant fields including variants found in CMS
        params.set('fields', 'name,image_url,image,main_image,subcategory,category,gender_category');
        params.set('filter[status][_eq]', 'published');

        // Robust gender filtering
        const genderMap: Record<string, string> = { 'men': 'Men', 'women': 'Women', 'kids': 'Kids' };
        const genderVal = forcedGender || genderMap[categorySlug.toLowerCase()];
        if (genderVal) {
          params.set('filter[gender_category][_istarts_with]', genderVal);
        }

        const response = await fetch(`/api/directus/items/products?${params.toString()}`);
        let products: any[] = [];

        if (response.ok) {
          const data = await response.json();
          products = data.data || [];
          setError(null);
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          setError(errorData.details || errorData.error || 'Failed to load products');

          if (retryCount < 2) {
            setTimeout(() => setRetryCount(prev => prev + 1), 2000);
          }
        }

        // Group products by subcategory slug using the mapping defined above
        const grouped = new Map();
        subcategories.forEach(subcat => {
          const variations = SLUG_TO_CMS_SUBCATEGORY[subcat.slug] || [subcat.slug];
          const variationsLower = variations.map(v => v.toLowerCase());

          const matchingProducts = products.filter(p => {
            const pSub = (p.subcategory || "").toLowerCase();
            const pCat = (p.category || "").toLowerCase();

            // Check if product's subcategory or category matches any of our known variations
            const isMatch = variationsLower.includes(pSub) || variationsLower.includes(pCat);
            if (!isMatch) return false;

            // Extra gender safety for footwear
            if (categorySlug === 'footwear' && !forcedGender) {
              const pGender = (p.gender_category || "");
              if (subcat.slug === 'men' && !pGender.startsWith('Men')) return false;
              if (subcat.slug === 'women' && !pGender.startsWith('Women')) return false;
            }

            return true;
          });

          // Prefer items with any kind of image for display
          const displayProducts = matchingProducts.filter(p => p.image || p.image_url || p.main_image);
          const finalProducts = displayProducts.length > 0 ? displayProducts : matchingProducts;

          grouped.set(subcat.slug, {
            products: finalProducts.slice(0, 10),
            count: matchingProducts.length
          });
        });

        setSubcategoryData(grouped);
      } catch (err) {
        console.error('Error fetching batch products:', err);
        setError('Network error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAllSubcategories();
  }, [categorySlug, subcategories, retryCount, initialData, forcedGender]);

  return (
    <section className={`py-12 px-4 md:px-8 ${variant === 'section' ? 'bg-gray-50' : 'bg-white'}`}>
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
        <div className="text-center mb-10">
          {variant === 'section' && !hideSectionLabel && (
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="w-8 h-px bg-[#C83232]"></div>
              <span className="text-xs font-bold tracking-[0.2em] text-[#C83232] uppercase">Collection</span>
              <div className="w-8 h-px bg-[#C83232]"></div>
            </div>
          )}
          <HeadingTag className={`${HeadingTag === 'h1' ? 'text-4xl md:text-6xl uppercase tracking-tighter' : 'text-3xl md:text-4xl'} font-bold text-gray-900 mb-2`}>
            {title}
          </HeadingTag>
          {variant === 'section' && (
            <div className="w-20 h-1 bg-gradient-to-r from-[#C83232] to-[#e63946] mx-auto rounded-full"></div>
          )}
        </div>

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
                priority={index < 4}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
