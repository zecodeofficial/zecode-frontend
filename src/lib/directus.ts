import axios from "axios";
import { unstable_cache } from "next/cache";
import { cache } from "react";

const DIRECTUS = process.env.NEXT_PUBLIC_DIRECTUS_URL || "http://127.0.0.1:8055";

/**
 * Cache Strategy:
 * - Products: 5 minutes (frequently viewed, balance between freshness and speed)
 * - Hero slides: 10 minutes (rarely changes)
 * - Stores: 30 minutes (very stable data)
 * - Categories: 10 minutes (rarely changes)
 * 
 * All caches use stale-while-revalidate pattern on Vercel
 */
const CACHE_PRODUCTS = 300;      // 5 minutes
const CACHE_HERO = 600;          // 10 minutes  
const CACHE_STORES = false;      // disabled
const CACHE_CATEGORIES = 600;    // 10 minutes

// Request timeout - increased for Render cold starts
const TIMEOUT_DEFAULT = 30000;   // 30 seconds
const TIMEOUT_PRODUCTS = 60000;  // 60 seconds for products

// Helper to get the correct URL - uses proxy on client-side to avoid CORS
function getApiUrl(path: string): string {
  if (typeof window !== 'undefined') {
    // Client-side: use local API proxy to avoid CORS issues
    return `/api/directus${path}`;
  }
  // Server-side: call Directus directly
  return `${DIRECTUS}${path}`;
}

export type GlobalSettings = {
  site_name?: string;
  site_logo?: string; // ID of the file
  header_nav?: { label: string; href: string }[];
  footer_nav?: { label: string; href: string }[];
  social_links?: { label: string; href: string; icon?: string }[];
  footer_text?: string;
  seo_title?: string;
  seo_description?: string;
  canonical_url?: string;
};

export type HeroSlide = {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  cta: string;
  link: string;
  sort?: number;
  variant?: 'center' | 'split';
};

export type Category = {
  id: number;
  title: string;
  slug: string;
  image: string;
  link: string;
  sort?: number;
  subcategories?: Subcategory[];
  description?: string;
  seo_title?: string;
  seo_description?: string;
  canonical_url?: string;
};

export type Subcategory = {
  id: number;
  title: string;
  slug: string;
  image: string;
  link: string;
  category_id?: number;
  sort?: number;
  description?: string;
  seo_title?: string;
  seo_description?: string;
  canonical_url?: string;
};

/**
 * fetchPage - safe fetch of page by slug
 * returns page object or null (never throws)
 */
/**
 * fetchPage - safe fetch of page by slug
 * returns page object or null (never throws)
 */
async function _fetchPage(slug: string) {
  try {
    const url = getApiUrl("/items/pages");
    const res = await axios.get(url, {
      params: { "filter[slug][_eq]": slug, limit: 1 },
      timeout: TIMEOUT_DEFAULT,
    });
    return res?.data?.data?.[0] ?? null;
  } catch (err: any) {
    console.error("Directus fetchPage error:", err?.response?.data ?? err.message ?? err);
    return null;
  }
}

// Cached version of fetchPage
export const fetchPage = typeof window === 'undefined'
  ? (slug: string) => cache(
    unstable_cache(
      () => _fetchPage(slug),
      [`page-${slug}`],
      { revalidate: 300, tags: ['pages'] }
    )
  )()
  : _fetchPage;

/**
 * fetchGlobalSettings - fetch global site settings (header, footer, etc.)
 * Assumes a singleton collection named 'globals'
 */
export async function _fetchGlobalSettings(): Promise<GlobalSettings | null> {
  try {
    const url = getApiUrl("/items/globals");
    const res = await axios.get(url, {
      timeout: TIMEOUT_DEFAULT,
    });
    return res?.data?.data ?? null;
  } catch (err: any) {
    // Silent fail or log if needed, but don't crash app
    // console.warn("Directus fetchGlobalSettings error (backend might not be ready):", err.message);
    return null;
  }
}

// Cached version of fetchGlobalSettings
export const fetchGlobalSettings = typeof window === 'undefined'
  ? unstable_cache(_fetchGlobalSettings, ['global-settings'], { revalidate: 3600, tags: ['globals'] })
  : _fetchGlobalSettings;

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'ds8llatku';
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/** 
 * Transform local path to Cloudinary URL
 * /products/image.jpg → https://res.cloudinary.com/ds8llatku/image/upload/f_auto,q_auto/zecode/products/image
 */
function getCloudinaryUrl(localPath: string): string {
  // Remove leading slash. Cloudinary works fine without extensions when using f_auto.
  const cleanPath = localPath.replace(/^\//, '');
  // Add auto format and quality optimization
  return `${CLOUDINARY_BASE_URL}/f_auto,q_auto/zecode/${cleanPath}`;
}

/**
 * Get Cloudinary URL for product placeholder image
 */
export function getProductPlaceholderUrl(): string {
  return getCloudinaryUrl('/placeholders/product-placeholder.png');
}

/** 
 * Transform local path to Cloudinary URL
 * /products/image.jpg → https://res.cloudinary.com/ds8llatku/image/upload/f_auto,q_auto/zecode/products/image
 */


/**
 * Check if a URL is a proxy route (needs unoptimized prop in Next.js Image)
 */
export function isProxyRoute(url: string | null): boolean {
  if (!url) return false;
  return typeof url === 'string' && url.startsWith('/api/directus/assets/');
}

/** fileUrl helper */
export function fileUrl(file: any) {
  if (!file) return null;
  const id = typeof file === "string" ? file : (file?.id ?? file?.data?.id);
  if (!id) return null;

  // If it's already a full URL (http/https), check if it's a Directus URL
  if (typeof id === 'string' && id.startsWith('http')) {
    // Check if it's a Directus files/assets URL - extract the file ID and use proxy
    const directusFilesMatch = id.match(/\/files\/([a-f0-9-]{36})/i);
    const directusAssetsMatch = id.match(/\/assets\/([a-f0-9-]{36})/i);

    if (directusFilesMatch || directusAssetsMatch) {
      const fileId = directusFilesMatch?.[1] || directusAssetsMatch?.[1];
      if (fileId) {
        // Convert Directus URL to use our proxy with relative path
        // Next.js Image optimization doesn't support same-origin API routes,
        // so we'll use unoptimized prop for these images
        return `/api/directus/assets/${fileId}`;
      }
    }

    // If it's not a Directus URL (e.g., Cloudinary), return as is
    return id;
  }

  // Check if it's a Cloudinary path (with or without leading slash)
  // Paths like: /products/... or products/... should go to Cloudinary directly
  if (typeof id === 'string') {
    const normalizedPath = id.startsWith('/') ? id : `/${id}`;

    // Check if it's one of our image folders
    if (normalizedPath.startsWith('/products/') || normalizedPath.startsWith('/categories/') ||
      normalizedPath.startsWith('/hero/') || normalizedPath.startsWith('/brand/') ||
      normalizedPath.startsWith('/placeholders/')) {
      return getCloudinaryUrl(normalizedPath);
    }

    // If it starts with /, it's a local path (like fonts) - keep as-is
    if (id.startsWith('/')) {
      return id;
    }
  }

  // Otherwise treat as Directus asset ID (UUID)
  // WORKAROUND: Use Next.js API proxy to bypass Directus assets endpoint 403 bug
  // The proxy authenticates server-side and fetches the asset
  // Use relative path - Next.js Image will need unoptimized prop for these
  return `/api/directus/assets/${id}`;
}

/**
 * fetchHeroSlides - fetch all hero slider images and content (cached)
 */
async function _fetchHeroSlides(): Promise<HeroSlide[] | null> {
  try {
    const url = getApiUrl("/items/hero_slides");
    const res = await axios.get(url, {
      params: { sort: "sort" },
      timeout: TIMEOUT_DEFAULT,
    });
    return res?.data?.data ?? null;
  } catch (err: any) {
    console.error("Directus fetchHeroSlides error:", err.message);
    return null;
  }
}

// Cached version of fetchHeroSlides
export const fetchHeroSlides = typeof window === 'undefined'
  ? unstable_cache(_fetchHeroSlides, ['hero-slides-v1'], { revalidate: CACHE_HERO, tags: ['hero'] })
  : _fetchHeroSlides;

/**
 * fetchCategories - fetch all main categories with their subcategories
 */
/**
 * fetchCategories - fetch all main categories with their subcategories
 */
async function _fetchCategories(): Promise<Category[] | null> {
  try {
    const url = getApiUrl("/items/cms_categories");
    const res = await axios.get(url, {
      params: {
        sort: "sort",
        fields: "*,subcategories.*"
      },
      timeout: TIMEOUT_DEFAULT,
    });
    const data = res?.data?.data ?? null;
    if (Array.isArray(data)) {
      return data.map((item: any) => ({ ...item, title: item.name, subcategories: item.subcategories?.map((s: any) => ({ ...s, title: s.name })) }));
    }
    return data;
  } catch (err: any) {
    console.error("Directus fetchCategories error:", err.message);
    return null;
  }
}

// Cached version of fetchCategories
export const fetchCategories = typeof window === 'undefined'
  ? cache(
    unstable_cache(
      _fetchCategories,
      ['categories-list'],
      { revalidate: CACHE_CATEGORIES, tags: ['categories'] }
    )
  )
  : _fetchCategories;

/**
 * fetchCategoryBySlug - fetch a specific category with subcategories
 */
/**
 * fetchCategoryBySlug - fetch a specific category with subcategories
 */
async function _fetchCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const url = getApiUrl("/items/cms_categories");
    const res = await axios.get(url, {
      params: {
        "filter[slug][_eq]": slug,
        fields: "*,subcategories.*",
        limit: 1
      },
      timeout: TIMEOUT_DEFAULT,
    });
    const item = res?.data?.data?.[0] ?? null;
    if (item) {
      item.title = item.name;
      if (Array.isArray(item.subcategories)) {
        item.subcategories = item.subcategories.map((s: any) => ({ ...s, title: s.name }));
      }
    }
    return item;
  } catch (err: any) {
    console.error("Directus fetchCategoryBySlug error:", err.message);
    return null;
  }
}

// Cached version of fetchCategoryBySlug
export const fetchCategoryBySlug = typeof window === 'undefined'
  ? (slug: string) => cache(
    unstable_cache(
      () => _fetchCategoryBySlug(slug),
      [`category-${slug}`],
      { revalidate: CACHE_CATEGORIES, tags: ['categories'] }
    )
  )()
  : _fetchCategoryBySlug;

// =============================================
// STORES
// =============================================

export type Store = {
  id: number;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  opening_hours?: string;
  opened_date?: string;
  place_id?: string;
  tags?: string[] | string;
  photos?: string[] | string;
  description?: string;
  image?: string;
  status?: string;
  sort?: number;
};

/**
 * fetchStores - fetch all store locations (cached)
 */
async function _fetchStores(): Promise<Store[] | null> {
  try {
    const url = getApiUrl("/items/stores");
    const res = await axios.get(url, {
      params: {
        sort: "sort,name",
        "filter[status][_eq]": "published",
        fields: "*", // Get all fields including new ones
        _t: new Date().getTime(), // Cache buster
      },
      timeout: TIMEOUT_DEFAULT,
    });
    return res?.data?.data ?? null;
  } catch (err: any) {
    console.error("Directus fetchStores error:", err.message);
    return null;
  }
}

// Cached version of fetchStores
export const fetchStores = typeof window === 'undefined'
  ? unstable_cache(_fetchStores, ['stores-v1'], { revalidate: CACHE_STORES, tags: ['stores'] })
  : _fetchStores;

/**
 * fetchStoreById - fetch a single store by ID
 */
export async function fetchStoreById(id: number | string): Promise<Store | null> {
  try {
    const url = getApiUrl(`/items/stores/${id}`);
    const res = await axios.get(url, { timeout: TIMEOUT_DEFAULT });
    return res?.data?.data ?? null;
  } catch (err: any) {
    console.error("Directus fetchStoreById error:", err.message);
    return null;
  }
}

// =============================================
// PRODUCTS
// =============================================

export type Product = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  sale_price?: number;
  image?: string;
  image_url?: string;
  main_image?: string;
  model_image_1?: string;
  model_image_2?: string;
  model_image_3?: string;
  model_image_1_url?: string;
  model_image_2_url?: string;
  model_image_3_url?: string;
  images?: string[];
  category?: string;
  subcategory?: string;
  gender_category?: string;
  sizes?: string[];
  colors?: string[] | string;
  color?: string;
  status?: string;
  featured?: boolean;
  sort?: number;
  seo_title?: string;
  seo_description?: string;
  canonical_url?: string;
};

export type ProductCount = {
  subcategory?: string | null;
  gender_category?: string | null;
  count: number;
};

/**
 * fetchProducts - fetch all products (cached with retry)
 */
async function _fetchProducts(): Promise<Product[] | null> {
  const maxRetries = 2;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const url = getApiUrl("/items/products");
      if (attempt > 1) {
        console.log(`[Directus] Retrying products fetch (attempt ${attempt})...`);
      }
      const res = await axios.get(url, {
        params: {
          sort: "sort,name",
          "filter[status][_eq]": "published",
          fields: "*", // Optimized depth (all fields but no M2M nesting)
          limit: -1,  // Get all products
        },
        timeout: TIMEOUT_PRODUCTS,
      });
      const products = res?.data?.data ?? null;
      if (products && Array.isArray(products)) {
        console.log(`[Directus] Fetched ${products.length} products`);
        return products;
      }
      // Empty response, try again
      lastError = new Error('Empty response');
    } catch (err: any) {
      lastError = err;
      console.warn(`[Directus] fetchProducts attempt ${attempt} failed:`, err.message);
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
  }

  console.error("[Directus] fetchProducts failed after retries:", lastError?.message);
  return null;
}

// Cached version of fetchProducts
export const fetchProducts = typeof window === 'undefined'
  ? unstable_cache(_fetchProducts, ['products-v3'], { revalidate: CACHE_PRODUCTS, tags: ['products'] })
  : _fetchProducts;

/**
 * Known data errors in the CMS that need overrides
 */
const DATA_CORRECTIONS: Record<string, Partial<Product>> = {
  'womens-pink-tank-top-dsc4404': {
    color: 'Light Blue',
    name: "Women's Light Blue Casual Jacket"
  },
  'womens-purple-zip-up-knit-jacket-dsc4404': { // Derived slug for ID 45
    color: 'Light Blue'
  },
  // Blue collection false positives (identified by ID)
  '291': { color: 'Green', name: "Men's Green Army Pants" }, // male_dark_green_t_shirt_graphic
  '292': { color: 'White', name: "Men's White Short Sleeve Shirt" }, // male_white_short_sleeve_shirt
  '294': { color: 'Green', name: "Men's Olive Green Short Sleeve Shirt" }, // male_olive_green_short_sleeve_shirt
  '300': { color: 'Grey', name: "Men's Grey Jacket" },  // male_grey_jacket_outer
  '308': { color: 'Black', name: "Women's Black Pants" }, // model2_female_black_pants
  '309': { color: 'White', name: "Men's Off-White Button Up Shirt" }, // male_off-white_button_up_shirt
  '338': { color: 'Grey', name: "Women's Grey Sleeveless Top" },  // female_light_grey_sleeveless_top
  '341': { color: 'Beige', name: "Women's Beige T-Shirt" }, // female_beige_t_shirt_graphic
  '342': { color: 'Black', name: "Women's Black Striped Sweater" }, // female_black_sweater_striped
  '346': { color: 'Black', name: "Women's Black Polo Shirt" }, // female_black_polo_shirt
};

/**
 * Exclusions for name-based color matching to avoid false positives
 * (e.g. avoiding "Gold Buckle" matching the Yellow collection)
 */
const COLOR_MATCH_EXCLUSIONS: Record<string, string[]> = {
  'yellow': [
    'gold buckle', 'gold-buckle', 'gold detail', 'gold-detail',
    'gold accent', 'gold-accent', 'gold trim', 'gold-trim',
    'gold hardware', 'gold-hardware', 'gold accessory',
    'gold chain', 'gold-chain', 'gold finish', 'gold-finish',
    'rose gold', 'rose-gold'
  ],
  'blue': [], // Empty for now, blue should include its shades in the shop-by-colour page
  'pink': ['light pink', 'hot pink']
};

/**
 * getCorrectedProduct - Applies manual overrides to a product's data
 */
function getCorrectedProduct(product: Product): Product {
  const slugCorrection = product.slug ? DATA_CORRECTIONS[product.slug] : null;
  const idCorrection = product.id ? DATA_CORRECTIONS[product.id.toString()] : null;

  const correction = slugCorrection || idCorrection;
  if (correction) {
    return { ...product, ...correction };
  }
  return product;
}

/**
 * hasColor - check if a product has a specific color (handles corrections and name-based fallback)
 */
export function hasColor(product: Product, targetColor: string): boolean {
  if (!targetColor) return true;
  const correctedProduct = getCorrectedProduct(product);
  const target = targetColor.toLowerCase();

  // Mapping for synonymous or subset colors
  const colorMappings: Record<string, string[]> = {
    'yellow': ['yellow', 'gold', 'mustard', 'lemon'],
    'blue': ['blue', 'navy', 'azure', 'cobalt'],
    'pink': ['pink', 'rose', 'fuchsia', 'magenta'],
    'green': ['green', 'olive', 'emerald', 'teal'],
  };

  const searchTerms = colorMappings[target] || [target];

  // 1. Check 'color' field (string)
  if (correctedProduct.color) {
    const pColor = correctedProduct.color.toLowerCase();
    if (searchTerms.some(term => pColor.includes(term))) return true;
  }

  // 2. Check 'colors' field (array or comma string)
  if (correctedProduct.colors) {
    const productColors = Array.isArray(correctedProduct.colors)
      ? correctedProduct.colors
      : (typeof correctedProduct.colors === 'string' ? correctedProduct.colors.split(',').map(c => c.trim().toLowerCase()) : []);

    if (productColors.some((c: string) => searchTerms.some(term => c.includes(term)))) return true;
  }

  // 3. Fallback: Check product name (especially for untagged items like Yellow/Gold)
  if (correctedProduct.name) {
    const pName = correctedProduct.name.toLowerCase();

    // Check for exclusions first (e.g. "Gold Buckle" shouldn't match "Yellow")
    const exclusions = COLOR_MATCH_EXCLUSIONS[target] || [];
    if (exclusions.some(ex => pName.includes(ex))) return false;

    // Use regex for whole-word matching to avoid partial matches
    return searchTerms.some(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'i');
      return regex.test(pName);
    });
  }

  return false;
}

/**
 * fetchActiveColors - Extracts all unique colors from published products
 */
export async function fetchActiveColors(): Promise<string[]> {
  const products = await fetchProducts();
  if (!products) return [];

  const colorSet = new Set<string>();
  const CORE_COLORS = ["BLACK", "WHITE", "NAVY", "BLUE", "RED", "GREEN", "YELLOW", "PINK", "PURPLE", "BEIGE", "BROWN", "GREY"];

  products.forEach((p: Product) => {
    const corrected = getCorrectedProduct(p);
    let foundAnyColor = false;

    if (corrected.color) {
      colorSet.add(corrected.color.trim().toUpperCase());
      foundAnyColor = true;
    }
    if (corrected.colors) {
      const colors = Array.isArray(corrected.colors)
        ? corrected.colors
        : (typeof corrected.colors === 'string' ? corrected.colors.split(',') : []);

      colors.forEach(c => {
        if (typeof c === 'string' && c.trim()) {
          colorSet.add(c.trim().toUpperCase());
          foundAnyColor = true;
        }
      });
    }

    // Fallback for untagged products: check name for core colors
    if (!foundAnyColor && corrected.name) {
      const pName = corrected.name.toLowerCase();

      CORE_COLORS.forEach(coreColor => {
        const lowerCore = coreColor.toLowerCase();

        // Check exclusions (e.g. don't add YELLOW for "Gold Buckle")
        const exclusions = COLOR_MATCH_EXCLUSIONS[lowerCore] || [];
        if (exclusions.some(ex => pName.includes(ex))) return;

        // Whole word check
        const regex = new RegExp(`\\b${lowerCore}\\b`, 'i');
        if (regex.test(pName)) {
          colorSet.add(coreColor);
        }
      });

      // Special check for GOLD -> YELLOW (with exclusions)
      const yellowExclusions = COLOR_MATCH_EXCLUSIONS['yellow'] || [];
      if (!yellowExclusions.some(ex => pName.includes(ex))) {
        const goldRegex = /\bgold\b/i;
        if (goldRegex.test(pName)) {
          colorSet.add('YELLOW');
        }
      }
    }
  });

  const activeColors = Array.from(colorSet).sort();
  console.log(`[Directus] Found ${activeColors.length} active colors across published products`);
  return activeColors;
}

/**
 * fetchProductsByCategory - fetch products by category slug (cached)
 */
async function _fetchProductsByCategory(categorySlug: string): Promise<Product[] | null> {
  try {
    const url = getApiUrl("/items/products");
    const res = await axios.get(url, {
      params: {
        sort: "sort,name",
        "filter[category][_eq]": categorySlug,
        "filter[status][_eq]": "published",
        fields: "*,main_image",
        limit: -1,
      },
      timeout: TIMEOUT_DEFAULT,
    });
    return res?.data?.data ?? null;
  } catch (err: any) {
    console.error("Directus fetchProductsByCategory error:", err.message);
    return null;
  }
}

// Cached version of fetchProductsByCategory
export const fetchProductsByCategory = typeof window === 'undefined'
  ? (categorySlug: string) => unstable_cache(
    () => _fetchProductsByCategory(categorySlug),
    [`products-cat-${categorySlug}`],
    { revalidate: CACHE_PRODUCTS, tags: ['products'] }
  )()
  : _fetchProductsByCategory;

/**
 * fetchProductsByGender - fetch products by gender_category (cached)
 * This aligns with how listing pages filter products.
 */
async function _fetchProductsByGender(gender: string): Promise<Product[] | null> {
  try {
    const url = getApiUrl("/items/products");
    const res = await axios.get(url, {
      params: {
        sort: "sort,name",
        "filter[gender_category][_istarts_with]": gender, // Matches "Women", "Women's", etc.
        "filter[status][_eq]": "published",
        fields: "*,main_image",
        limit: -1,
      },
      timeout: TIMEOUT_DEFAULT,
    });
    return res?.data?.data ?? null;
  } catch (err: any) {
    console.error("Directus fetchProductsByGender error:", err.message);
    return null;
  }
}

export const fetchProductsByGender = typeof window === 'undefined'
  ? (gender: string) => unstable_cache(
    () => _fetchProductsByGender(gender),
    [`products-gender-${gender}`],
    { revalidate: CACHE_PRODUCTS, tags: ['products'] }
  )()
  : _fetchProductsByGender;

/**
 * fetchProductsByGenderAndSubcategory - optimized fetch with server-side filtering
 * Internal implementation (uncached)
 */
async function _fetchProductsByGenderAndSubcategory(gender: string | null, subcategory: string | string[], category?: string): Promise<Product[] | null> {
  try {
    const url = getApiUrl("/items/products");

    // Build filter object for Directus
    // Match products where subcategory OR category matches the given value (case-insensitive)
    const subcatValues = Array.isArray(subcategory) ? subcategory : [subcategory];

    // Include original value, lowercase, sentence case, and uppercase
    const allCaseValues = subcatValues.flatMap(v => [
      v,
      v.toLowerCase(),
      v.charAt(0).toUpperCase() + v.slice(1).toLowerCase(),
      v.toUpperCase()
    ]);
    const uniqueValues = [...new Set(allCaseValues)];

    // Create OR filter: match subcategory OR category field (case-insensitive)
    const filter: any = {
      _and: [
        { status: { _eq: "published" } },
        {
          _or: [
            { subcategory: { _in: uniqueValues } },
            { category: { _in: uniqueValues } }
          ]
        }
      ]
    };

    // Apply gender filter only if provided
    if (gender) {
      filter._and.push({ gender_category: { _istarts_with: gender } });
    }

    // Apply category filter if provided (e.g., 'Footwear')
    if (category) {
      filter._and.push({ category: { _in: [category, category.toLowerCase(), category.toUpperCase()] } });
    }

    const res = await axios.get(url, {
      params: {
        sort: "sort,name",
        filter: JSON.stringify(filter),
        fields: "*,image,image_url,main_image",
      },
      timeout: TIMEOUT_DEFAULT,
    });

    let products = res?.data?.data ?? [];

    return products;
  } catch (err: any) {
    console.error("Directus fetchProductsByGenderAndSubcategory error:", err.message);
    return null; // Return null so caller can try fallback if needed
  }
}

/**
 * fetchProductsByGenderAndSubcategory - cached version for fast page loads
 * Cache key includes gender and subcategory for precise cache hits
 */
export const fetchProductsByGenderAndSubcategory = typeof window === 'undefined'
  ? (gender: string | null, subcategory: string | string[], category?: string) => {
    const cacheKey = `products-${gender || 'all'}-${Array.isArray(subcategory) ? subcategory.join('-') : subcategory}${category ? '-' + category : ''}-v3`;
    return unstable_cache(
      async () => {
        const data = await _fetchProductsByGenderAndSubcategory(gender, subcategory, category);
        if (data === null) throw new Error("Fetch failed, do not cache");
        return data;
      },
      [cacheKey],
      { revalidate: CACHE_PRODUCTS, tags: ['products'] }
    )().catch((err: any) => {
      console.error("Cached fetch wrapper error:", err);
      return null;
    });
  }
  : _fetchProductsByGenderAndSubcategory;

/**
 * fetchProductBySlug - fetch a single product by slug (internal, uncached)
 */
async function _fetchProductBySlug(slug: string): Promise<Product | null> {
  try {
    const url = getApiUrl("/items/products");

    // Add cache-busting parameter to ensure fresh data
    const cacheBuster = Date.now();

    console.log(`[Directus] Fetching product by slug: ${slug} (cache-buster: ${cacheBuster})`);

    const res = await axios.get(url, {
      params: {
        "filter[slug][_eq]": slug,
        // Request all image fields explicitly to ensure they're included
        fields: "*,main_image,model_image_1,model_image_2,model_image_3,model_image_1_url,model_image_2_url,model_image_3_url",
        limit: 1,
        _t: cacheBuster // Cache buster
      },
      timeout: TIMEOUT_DEFAULT,
    });

    const product = res?.data?.data?.[0] ?? null;

    if (product) {
      console.error(`[Directus] Product ${product.id} fetched - Image fields:`, {
        hasImage: !!product.image,
        hasImageUrl: !!product.image_url,
        hasMainImage: !!(product as any).main_image,
        image: product.image || 'null',
        image_url: product.image_url || 'null',
        main_image: (product as any).main_image || 'null',
        hasModelImage1: !!product.model_image_1,
        hasModelImage2: !!product.model_image_2,
        hasModelImage3: !!product.model_image_3,
        modelImage1Type: typeof product.model_image_1,
        modelImage1IsObject: product.model_image_1 && typeof product.model_image_1 === 'object',
        hasModelImage1Url: !!(product as any).model_image_1_url,
        hasModelImage2Url: !!(product as any).model_image_2_url,
        hasModelImage3Url: !!(product as any).model_image_3_url,
        modelImage1Url: (product as any).model_image_1_url || 'null',
        modelImage2Url: (product as any).model_image_2_url || 'null',
        modelImage3Url: (product as any).model_image_3_url || 'null',
        // Log first 100 chars of URLs to see what they contain
        imageUrlPreview: product.image_url ? (product.image_url as string).substring(0, 100) : 'null',
        modelImage1UrlPreview: (product as any).model_image_1_url ? ((product as any).model_image_1_url as string).substring(0, 100) : 'null'
      });
    }

    return product;
  } catch (err: any) {
    console.error("Directus fetchProductBySlug error:", err.message);
    return null;
  }
}

// Cached version of fetchProductBySlug
// DISABLED CACHE for debugging - always fetch fresh data
export const fetchProductBySlug = typeof window === 'undefined'
  ? _fetchProductBySlug // Direct call, no cache
  : _fetchProductBySlug;

/**
 * fetchProductCounts - aggregate product counts grouped by subcategory and gender
 * Returns an array of { subcategory, gender_category, count }
 */
// Cached version of fetchProductCounts to prevent heavy aggregation on every page load
export async function _fetchProductCounts(): Promise<ProductCount[] | null> {
  try {
    const url = getApiUrl("/items/products");
    // Directus aggregation: aggregate[count]=id&groupBy[]=subcategory&groupBy[]=gender_category
    const res = await axios.get(url, {
      params: {
        "aggregate[count]": "id",
        "groupBy[]": ["subcategory", "gender_category"],
      },
      timeout: 15000,
    });

    // Directus returns aggregated results inside res.data?.data
    // Normalise to array of { subcategory, gender_category, count }
    const raw = res?.data?.data ?? null;
    if (!raw) return null;

    // raw may be an array of objects where count is under count, count.id, count(id), or count__id
    const parsed: ProductCount[] = raw.map((r: any) => {
      // find numeric value inside object - Directus returns { count: { id: "12" } }
      let count = 0;
      if (typeof r.count === 'number') count = r.count;
      else if (r.count && typeof r.count === 'object' && 'id' in r.count) count = parseInt(r.count.id, 10) || 0;
      else if (typeof r["count(id)"] === 'number') count = r["count(id)"];
      else if (typeof r["count__id"] === 'number') count = r["count__id"];

      return {
        subcategory: r.subcategory ?? null,
        gender_category: r.gender_category ?? null,
        count,
      };
    });

    return parsed;
  } catch (err: any) {
    console.error('fetchProductCounts failed, utilizing fallback logic if possible', err.message);
    return null;
  }
}

export const fetchProductCounts = typeof window === 'undefined'
  ? unstable_cache(_fetchProductCounts, ['product-counts'], { revalidate: 3600, tags: ['products'] })
  : _fetchProductCounts;

// =============================================
// NAVIGATION & SETTINGS
// =============================================

export type NavigationItem = {
  id: number;
  label: string;
  href: string;
  icon?: string;
  parent_id?: number;
  children?: NavigationItem[];
  sort?: number;
};

export type SiteSettings = {
  id: number;
  site_name?: string;
  site_tagline?: string;
  logo?: string;
  favicon?: string;
  primary_color?: string;
  secondary_color?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
};

export type HeaderSettings = {
  id: number;
  promo_banner_text?: string;
  promo_banner_link?: string;
  promo_banner_enabled?: boolean;
  logo?: string;
};

export type FooterSettings = {
  id: number;
  copyright_text?: string;
  newsletter_title?: string;
  newsletter_description?: string;
  show_newsletter?: boolean;
};

export type SocialLink = {
  id: number;
  platform: string;
  url: string;
  icon?: string;
  sort?: number;
};

/**
 * fetchNavigationMenu - fetch navigation menu items
 */
export async function fetchNavigationMenu(): Promise<NavigationItem[] | null> {
  try {
    const url = getApiUrl("/items/navigation_menu");
    const res = await axios.get(url, {
      params: { sort: "sort" },
      timeout: TIMEOUT_DEFAULT,
    });
    return res?.data?.data ?? null;
  } catch (err: any) {
    console.error("Directus fetchNavigationMenu error:", err.message);
    return null;
  }
}

/**
 * fetchSiteSettings - fetch global site settings (singleton)
 */
export async function fetchSiteSettings(): Promise<SiteSettings | null> {
  try {
    const url = getApiUrl("/items/site_settings");
    const res = await axios.get(url, { timeout: TIMEOUT_DEFAULT });
    return res?.data?.data ?? null;
  } catch (err: any) {
    console.error("Directus fetchSiteSettings error:", err.message);
    return null;
  }
}

/**
 * fetchHeaderSettings - fetch header configuration (singleton)
 */
export async function fetchHeaderSettings(): Promise<HeaderSettings | null> {
  try {
    const url = getApiUrl("/items/header_settings");
    const res = await axios.get(url, { timeout: TIMEOUT_DEFAULT });
    return res?.data?.data ?? null;
  } catch (err: any) {
    console.error("Directus fetchHeaderSettings error:", err.message);
    return null;
  }
}

/**
 * fetchFooterSettings - fetch footer configuration (singleton)
 */
export async function fetchFooterSettings(): Promise<FooterSettings | null> {
  try {
    const url = getApiUrl("/items/footer_settings");
    const res = await axios.get(url, { timeout: TIMEOUT_DEFAULT });
    return res?.data?.data ?? null;
  } catch (err: any) {
    console.error("Directus fetchFooterSettings error:", err.message);
    return null;
  }
}

// Cached version of fetchSocialLinks
export const fetchSocialLinks = typeof window === 'undefined'
  ? unstable_cache(_fetchSocialLinks, ['social-links'], { revalidate: 3600, tags: ['social'] })
  : _fetchSocialLinks;

/**
 * fetchSocialLinks - fetch social media links
 */
export async function _fetchSocialLinks(): Promise<SocialLink[] | null> {
  try {
    const url = getApiUrl("/items/social_links");
    const res = await axios.get(url, {
      params: { sort: "sort" },
      timeout: TIMEOUT_DEFAULT,
    });
    return res?.data?.data ?? null;
  } catch (err: any) {
    console.error("Directus fetchSocialLinks error:", err.message);
    return null;
  }
}

export type FooterLinkGroup = {
  id: number;
  title: string;
  sort?: number;
  status?: string;
};

export type FooterLink = {
  id: number;
  label: string;
  href: string;
  group: number;
  sort?: number;
  status?: string;
  open_in_new_tab?: boolean;
};

export type DirectusSocialLink = {
  id: number;
  platform: string;
  url: string;
  custom_icon?: string;
  sort?: number;
  status?: string;
};

// Cached version of fetchFooterLinkGroups
export const fetchFooterLinkGroups = typeof window === 'undefined'
  ? unstable_cache(_fetchFooterLinkGroups, ['footer-groups'], { revalidate: 3600, tags: ['footer'] })
  : _fetchFooterLinkGroups;

/**
 * fetchFooterLinkGroups - fetch footer link groups
 */
export async function _fetchFooterLinkGroups(): Promise<FooterLinkGroup[] | null> {
  try {
    const url = getApiUrl("/items/footer_link_groups");
    const res = await axios.get(url, {
      params: {
        sort: "sort",
        "filter[status][_eq]": "published"
      },
      timeout: TIMEOUT_DEFAULT,
    });
    return res?.data?.data ?? null;
  } catch (err: any) {
    console.error("Directus fetchFooterLinkGroups error:", err.message);
    return null;
  }
}

// Cached version of fetchFooterLinks
export const fetchFooterLinks = typeof window === 'undefined'
  ? unstable_cache(_fetchFooterLinks, ['footer-links'], { revalidate: 3600, tags: ['footer'] })
  : _fetchFooterLinks;

/**
 * fetchFooterLinks - fetch all footer links
 */
export async function _fetchFooterLinks(): Promise<FooterLink[] | null> {
  try {
    const url = getApiUrl("/items/footer_links");
    const res = await axios.get(url, {
      params: {
        sort: "group,sort",
        "filter[status][_eq]": "published"
      },
      timeout: TIMEOUT_DEFAULT,
    });
    return res?.data?.data ?? null;
  } catch (err: any) {
    console.error("Directus fetchFooterLinks error:", err.message);
    return null;
  }
}

/**
 * fetchDirectusSocialLinks - fetch social links from social_links collection
 */
export async function fetchDirectusSocialLinks(): Promise<DirectusSocialLink[] | null> {
  try {
    const url = getApiUrl("/items/social_links");
    const res = await axios.get(url, {
      params: {
        sort: "sort",
        "filter[status][_eq]": "published"
      },
      timeout: TIMEOUT_DEFAULT,
    });
    return res?.data?.data ?? null;
  } catch (err: any) {
    console.error("Directus fetchDirectusSocialLinks error:", err.message);
    return null;
  }
}

export type DirectusNavigationItem = {
  id: number;
  label: string;
  href: string;
  parent: number | null;
  icon?: string;
  highlight?: boolean;
  sort?: number;
  status?: string;
};

// Cached version of fetchDirectusNavigation
export const fetchDirectusNavigation = typeof window === 'undefined'
  ? unstable_cache(_fetchDirectusNavigation, ['nav-menu'], { revalidate: 3600, tags: ['navigation'] })
  : _fetchDirectusNavigation;

/**
 * fetchDirectusNavigation - fetch full navigation menu with parent/child structure
 */
export async function _fetchDirectusNavigation(): Promise<DirectusNavigationItem[] | null> {
  try {
    const url = getApiUrl("/items/navigation_menu");
    const res = await axios.get(url, {
      params: {
        sort: "parent,sort",
        "filter[status][_eq]": "published"
      },
      timeout: TIMEOUT_DEFAULT,
    });
    return res?.data?.data ?? null;
  } catch (err: any) {
    console.error("Directus fetchDirectusNavigation error:", err.message);
    return null;
  }
}

export type DirectusFooterSettings = {
  id: number;
  footer_bg_color?: string;
  copyright_text?: string;
  newsletter_title?: string;
  newsletter_subtitle?: string;
  newsletter_enabled?: boolean;
};

/**
 * fetchDirectusFooterSettings - fetch footer settings (singleton)
 */
export async function fetchDirectusFooterSettings(): Promise<DirectusFooterSettings | null> {
  try {
    const url = getApiUrl("/items/footer_settings");
    const res = await axios.get(url, { timeout: TIMEOUT_DEFAULT });
    return res?.data?.data ?? null;
  } catch (err: any) {
    console.error("Directus fetchDirectusFooterSettings error:", err.message);
    return null;
  }
}

// =============================================
// HOMEPAGE SECTIONS
// =============================================

export type HomepageSection = {
  id: number;
  section_key: string;
  title?: string;
  subtitle?: string;
  description?: string;
  cta_text?: string;
  cta_link?: string;
  image?: string;
  background_color?: string;
  text_color?: string;
  status?: string;
  sort?: number;
};

/**
 * fetchHomepageSections - fetch homepage content sections
 */
export async function fetchHomepageSections(): Promise<HomepageSection[] | null> {
  try {
    const url = getApiUrl("/items/homepage_sections");
    const res = await axios.get(url, {
      params: {
        sort: "sort",
        "filter[status][_eq]": "published"
      },
      timeout: TIMEOUT_DEFAULT,
    });
    return res?.data?.data ?? null;
  } catch (err: any) {
    console.error("Directus fetchHomepageSections error:", err.message);
    return null;
  }
}

/**
 * fetchHomepageSection - fetch a specific section by key
 */
export async function fetchHomepageSection(sectionKey: string): Promise<HomepageSection | null> {
  try {
    const url = getApiUrl("/items/homepage_sections");
    const res = await axios.get(url, {
      params: {
        "filter[section_key][_eq]": sectionKey,
        limit: 1
      },
      timeout: TIMEOUT_DEFAULT,
    });
    return res?.data?.data?.[0] ?? null;
  } catch (err: any) {
    console.error("Directus fetchHomepageSection error:", err.message);
    return null;
  }
}

