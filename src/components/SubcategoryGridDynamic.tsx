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
  // Kids-specific slugs
  'boys-tshirts': 'T',
  'girls-tops': 'Tops',
  'boys-jeans': 'Bottoms',
  'girls-dresses': 'Dresses',
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
  'shoes': ['Footwear', 'Flats', 'Sneakers', 'Formal Shoes'],
  // Women - MUST match exact capitalization in Directus
  'tops': ['Top', 'Tops', 'Casual Top', 'Tank Top'],
  'dresses': ['Dress', 'Dresses', 'Midi Dress', 'Mini Dress', 'Slip Dress'],
  'skirts': ['Skirt', 'Skirts'],
  // Kids - special mappings
  'boys-tshirts': ['T', 'T-Shirt'],
  'girls-tops': ['Top', 'Tops'],
  'boys-jeans': ['Bottoms', 'Jeans'],
  'girls-dresses': ['Dress', 'Dresses'],
  // Footwear - gender-based subcategories
  'men': ['Flats', 'Mules', 'Sneakers', 'Boots', 'Loafers', 'Sandals'],
  'women': ['Flats', 'Mules', 'Heels', 'Sandals', 'Boots', 'Sneakers'],
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
}



export default function SubcategoryGridDynamic({ title, categorySlug, subcategories }: SubcategoryGridDynamicProps) {
  // Map of subcategory slug -> { products, count }
  const [subcategoryData, setSubcategoryData] = useState<Map<string, { products: any[]; count: number }>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

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
        // Sort by date to get newest items
        params.set('sort', '-date_created');

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
      } finally {
        setIsLoading(false);
      }
    }

    fetchAllSubcategories();
  }, [categorySlug, subcategories]);

  return (
    <section className="py-12 px-4 md:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
          Shop {title}&apos;s Collection
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {subcategories.map((subcategory) => {
            const data = subcategoryData.get(subcategory.slug) || { products: [], count: 0 };

            // Optional: Hide if 0 products found (after loading)
            if (!isLoading && data.count === 0) return null;

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
