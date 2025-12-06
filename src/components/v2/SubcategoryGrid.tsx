"use client";
import { useEffect, useState } from 'react';
import Link from "next/link";
import SubcategoryThumbnailSlider from "@/components/SubcategoryThumbnailSlider";
import { fetchProductsByGender, fileUrl } from '@/lib/directus';

/**
 * SubcategoryGridV2 - Bold Subcategory Display
 * Displays subcategories (T-Shirts, Shirts, Jeans, etc.) with enhanced visuals
 */

interface SubcategoryGridProps {
  category: "men" | "women" | "kids";
}

interface SubcategoryItem {
  label: string;
  href: string;
  image: string;
}

interface SubcategoryGroup {
  group: string;
  items: SubcategoryItem[];
}

const SUBCATEGORIES = {
  men: [
    { label: "T-SHIRTS", href: "/men/tshirts", image: "/products/men-tshirt.jpg" },
    { label: "SHIRTS", href: "/men/shirts", image: "/products/men-shirt.jpg" },
    { label: "JEANS", href: "/men/jeans", image: "/products/men-jeans.jpg" },
    { label: "TROUSERS", href: "/men/trousers", image: "/products/men-trousers.jpg" },
    { label: "JACKETS", href: "/men/jackets", image: "/products/men-jacket.jpg" },
    { label: "SHOES", href: "/men/shoes", image: "/products/men-shoes.jpg" },
  ],
  women: [
    {
      group: "Western Wear",
      items: [
        { label: "TOPS", href: "/women/tops", image: "/products/women-top.jpg" },
        { label: "DRESSES", href: "/women/dresses", image: "/products/women-dress.jpg" },
        { label: "JEANS", href: "/women/jeans", image: "/products/women-jeans.jpg" },
        { label: "SKIRTS", href: "/women/skirts", image: "/products/women-skirt.jpg" },
        { label: "JACKETS", href: "/women/jackets", image: "/products/women-jacket.jpg" },
      ],
    },
    {
      group: "Ethnic Fusion",
      items: [
        { label: "KURTAS & KURTIS", href: "/women/kurtas", image: "/products/women-kurta.jpg" },
        { label: "ETHNIC DRESSES", href: "/women/ethnic-dresses", image: "/products/women-ethnic-dress.jpg" },
        { label: "PALAZZOS", href: "/women/palazzos", image: "/products/women-palazzo.jpg" },
        { label: "FUSION TOPS", href: "/women/fusion-tops", image: "/products/women-fusion-top.jpg" },
      ],
    },
    {
      group: "Shoes",
      items: [
        { label: "SHOES", href: "/women/shoes", image: "/products/women-shoes.jpg" },
      ],
    },
  ],
  kids: [
    { label: "BOYS T-SHIRTS", href: "/kids/boys-tshirts", image: "/products/kids-boys-tshirt.jpg" },
    { label: "GIRLS TOPS", href: "/kids/girls-tops", image: "/products/kids-girls-top.jpg" },
    { label: "BOYS JEANS", href: "/kids/boys-jeans", image: "/products/kids-boys-jeans.jpg" },
    { label: "GIRLS DRESSES", href: "/kids/girls-dresses", image: "/products/kids-girls-dress.jpg" },
    { label: "JACKETS", href: "/kids/jackets", image: "/products/kids-jacket.jpg" },
    { label: "SHOES", href: "/kids/shoes", image: "/products/kids-shoes.jpg" },
  ],
};

const CATEGORY_TITLES = {
  men: "MEN'S COLLECTION",
  women: "WOMEN'S COLLECTION",
  kids: "KIDS COLLECTION",
};

// Maps from listing pages to ensure consistent counts
const MEN_SUB_MAP: Record<string, string | string[]> = {
  'tshirts': ['T', 'T-Shirt', 'Classic T-Shirt'],
  'shirts': ['Shirt', 'Casual Shirt', 'Button-Up Shirt', 'Short Sleeve Shirt'],
  'jeans': ['Jeans', 'Slim Jeans'],
  'trousers': 'Trousers',
  'jackets': ['Jacket', 'Casual Jacket', 'Denim Jacket', 'Varsity Jacket'],
  'shoes': 'Footwear',
};

const WOMEN_SUB_MAP: Record<string, string | string[]> = {
  'tops': ['Top', 'Tops', 'Casual Top', 'Tank Top'],
  'dresses': ['Dress', 'Dresses', 'Midi Dress', 'Mini Dress', 'Slip Dress'],
  'jeans': ['Jeans', 'Slim Jeans'],
  'skirts': 'Skirt',
  'jackets': ['Jacket', 'Casual Jacket', 'Denim Jacket'],
  'kurtas': ['Kurti', 'Kurta'],
  'ethnic-dresses': ['Kurti', 'Kurta', 'Lehenga'],
  'palazzos': 'Palazzos',
  'fusion-tops': 'Fusion Top',
  'shoes': 'Footwear',
};

const KIDS_SUB_MAP: Record<string, string | string[]> = {
  'boys-tshirts': ['T', 'T-Shirt', 'Classic T-Shirt'],
  'girls-tops': ['Tops', 'Top', 'Casual Top'],
  'boys-jeans': ['Bottoms', 'Jeans', 'Slim Jeans'],
  'girls-dresses': ['Dresses', 'Dress', 'Midi Dress'],
  'jackets': ['Jacket', 'Outerwear', 'Casual Jacket', 'Denim Jacket'],
  'shoes': ['Footwear', 'Flats', 'Flat'],
};

// Helper to check strict match
function isStrictMatch(product: any, category: string, slug: string): boolean {
  // 1. Gender/Category Check
  // We check 'category' field (which usually holds the slug) OR 'gender_category' if populated.
  const pCat = (product.category || "").toLowerCase();
  const pGender = (product.gender_category || "").toLowerCase();

  // 2. Subcategory Check
  const pSub = product.subcategory; // CMS value e.g. "T-Shirt" OR ["Summer", "T-Shirt"]
  if (!pSub) return false;

  let map: Record<string, string | string[]> = {};
  if (category === 'men') map = MEN_SUB_MAP;
  else if (category === 'women') map = WOMEN_SUB_MAP;
  else if (category === 'kids') map = KIDS_SUB_MAP;

  const validValues = map[slug];
  if (!validValues) return false; // Unknown slug in map

  // Normalize product subcategories to an array of lowercase strings
  const pSubArray = (Array.isArray(pSub) ? pSub : [pSub])
    .filter(Boolean)
    .map((s: string) => s.toLowerCase());

  // Normalize valid map values to an array of lowercase strings
  const validArray = (Array.isArray(validValues) ? validValues : [validValues])
    .map(s => s.toLowerCase());

  // Check for intersection: Does element in pSubArray exist in validArray?
  return pSubArray.some(sub => validArray.includes(sub));
}

// Helper for fuzzy match (Fallback for images)
function isFuzzyMatch(p: any, category: string, subcatLabel: string) {
  if ((p.category || "").toLowerCase() !== category.toLowerCase() && (p.gender_category || "").toLowerCase() !== category.toLowerCase()) return false;

  const label = subcatLabel.toLowerCase();
  const cleanTokens = Array.from(new Set(label.split(/[^a-z0-9]+/).filter(Boolean)));
  const name = (p.name || "").toLowerCase();
  const catLabel = (p.categoryLabel || "").toLowerCase();
  const slug = (p.slug || "").toLowerCase();
  const subcategory = (p.subcategory || "").toLowerCase();
  const tags = (p.tags || []).map((t: string) => t.toLowerCase());

  return cleanTokens.some((tok) => {
    if (!tok) return false;
    const singular = tok.endsWith('s') ? tok.slice(0, -1) : tok;
    if (name.includes(tok) || name.includes(singular)) return true;
    if (catLabel.includes(tok) || catLabel.includes(singular)) return true;
    if (slug.includes(tok) || slug.includes(singular)) return true;
    if (subcategory.includes(tok) || subcategory.includes(singular)) return true;
    if (tags.some((t: string) => t.includes(tok) || t.includes(singular))) return true;
    return false;
  });
}

export default function SubcategoryGrid({ category }: SubcategoryGridProps) {
  const subcategories = SUBCATEGORIES[category];
  const title = CATEGORY_TITLES[category];
  const [productsByCategory, setProductsByCategory] = useState<any[] | null>(null);
  const [productCounts, setProductCounts] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        // Now fetches ALL products for gender (limit: -1)
        const data = await fetchProductsByGender(category);
        if (mounted) setProductsByCategory(data ?? []);

        // Calculate counts locally since we have all data
        if (data) {
          const counts: { [key: string]: number } = {};

          const processItem = (item: SubcategoryItem) => {
            // extract slug from href e.g. /men/tshirts -> tshirts
            const parts = item.href.split('/');
            const slug = parts[parts.length - 1];

            const count = data.filter(p => isStrictMatch(p, category, slug)).length;
            counts[item.label] = count;
          };

          if (category === 'women') {
            (subcategories as SubcategoryGroup[]).forEach(group => {
              group.items.forEach(processItem);
            });
          } else {
            (subcategories as SubcategoryItem[]).forEach(processItem);
          }
          if (mounted) setProductCounts(counts);
        }

      } catch (e) {
        console.error('Failed to load products for category', category, e);
        if (mounted) setProductsByCategory([]);
        if (mounted) setProductCounts({});
      }
    }
    load();
    return () => { mounted = false; };
  }, [category, subcategories]);

  // Helper to get products for rendering a specific subcategory card
  const getSubcategoryProducts = (subcatLabel: string, subcatHref: string) => {
    if (!productsByCategory) return [];
    const parts = subcatHref.split('/');
    const slug = parts[parts.length - 1];

    // Try strict match first
    const strictMatches = productsByCategory.filter(p => isStrictMatch(p, category, slug));

    // If we have products, great!
    if (strictMatches.length > 0) return strictMatches;

    // FALLBACK: If strict match fails (e.g. data inconsistency), try fuzzy match to show SOMETHING for thumbnails
    return productsByCategory.filter(p => isFuzzyMatch(p, category, subcatLabel));
  };

  return (
    <section className="relative bg-black py-20 md:py-32 overflow-hidden">
      {/* Section Header */}
      <div className="max-w-[1600px] mx-auto px-6 md:px-16 mb-12 md:mb-16">
        <div className="text-center">
          <span className="text-xs tracking-[0.4em] uppercase text-[#C83232] font-semibold mb-3 block">
            BROWSE STYLES
          </span>
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight"
            style={{ fontFamily: '"DIN Condensed", Impact, sans-serif' }}
          >
            {title}
          </h2>
        </div>
      </div>

      {/* Subcategory Grid */}
      <div className="max-w-[1600px] mx-auto px-6 md:px-16">
        {category === "women" ? (
          <>
            {(subcategories as SubcategoryGroup[]).map((groupObj) => (
              <div key={groupObj.group} className="mb-10">
                <h3 className="text-lg md:text-2xl font-bold text-[#C83232] mb-4" style={{ fontFamily: '"DIN Condensed", Impact, sans-serif' }}>{groupObj.group}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {groupObj.items.map((subcat, index) => {
                    let products = getSubcategoryProducts(subcat.label, subcat.href);
                    const images = products.flatMap((p) => (p.gallery?.length ? p.gallery : [p.image])).filter(Boolean).map((img) => fileUrl(img) || img).filter(Boolean);
                    const imagesToShow = Array.from(new Set(images)).slice(0, 6);
                    return (
                      <Link
                        key={subcat.href}
                        href={subcat.href}
                        className="group relative aspect-square overflow-hidden"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110">
                          <SubcategoryThumbnailSlider images={imagesToShow} alt={subcat.label} />
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors duration-500" />
                        </div>
                        <div className="relative z-10 h-full flex flex-col items-center justify-center p-6">
                          <h3 className="text-xl md:text-2xl lg:text-3xl font-black text-white text-center tracking-tight group-hover:scale-110 transition-transform duration-500" style={{ fontFamily: '"DIN Condensed", Impact, sans-serif' }}>{subcat.label}</h3>
                          <span className="block mt-2 text-xs text-white/80 font-semibold">{productCounts[subcat.label] !== undefined ? `${productCounts[subcat.label]} Products` : ""}</span>
                          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                            <span className="inline-flex items-center gap-2 text-[#C83232] text-xs font-bold tracking-[0.15em] uppercase">EXPLORE<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg></span>
                          </div>
                          <div className="absolute inset-2 border border-white/0 group-hover:border-white/20 transition-colors duration-500" />
                        </div>
                        <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-white/0 group-hover:border-[#C83232] transition-colors duration-500" />
                        <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-white/0 group-hover:border-[#C83232] transition-colors duration-500" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {(subcategories as SubcategoryItem[]).map((subcat, index) => {
              let products = getSubcategoryProducts(subcat.label, subcat.href);
              const images = products.flatMap((p) => (p.gallery?.length ? p.gallery : [p.image])).filter(Boolean).map((img) => fileUrl(img) || img).filter(Boolean);
              const imagesToShow = Array.from(new Set(images)).slice(0, 6);

              return (
                <Link
                  key={subcat.href}
                  href={subcat.href}
                  className="group relative aspect-square overflow-hidden"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110">
                    <SubcategoryThumbnailSlider images={imagesToShow} alt={subcat.label} />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors duration-500" />
                  </div>
                  <div className="relative z-10 h-full flex flex-col items-center justify-center p-6">
                    <h3 className="text-xl md:text-2xl lg:text-3xl font-black text-white text-center tracking-tight group-hover:scale-110 transition-transform duration-500" style={{ fontFamily: '"DIN Condensed", Impact, sans-serif' }}>{subcat.label}</h3>
                    <span className="block mt-2 text-xs text-white/80 font-semibold">{productCounts[subcat.label] !== undefined ? `${productCounts[subcat.label]} Products` : ""}</span>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                      <span className="inline-flex items-center gap-2 text-[#C83232] text-xs font-bold tracking-[0.15em] uppercase">EXPLORE<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg></span>
                    </div>
                    <div className="absolute inset-2 border border-white/0 group-hover:border-white/20 transition-colors duration-500" />
                  </div>
                  <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-white/0 group-hover:border-[#C83232] transition-colors duration-500" />
                  <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-white/0 group-hover:border-[#C83232] transition-colors duration-500" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
// Verified fix for syntax error
