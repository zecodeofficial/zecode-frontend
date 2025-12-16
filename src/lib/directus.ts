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
const TIMEOUT_DEFAULT = 15000;   // 15 seconds
const TIMEOUT_PRODUCTS = 30000;  // 30 seconds for products (larger payload)

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
  // Remove leading slash and file extension
  const cleanPath = localPath.replace(/^\//, '').replace(/\.[^.]+$/, '');
  // Add auto format and quality optimization
  return `${CLOUDINARY_BASE_URL}/f_auto,q_auto/zecode/${cleanPath}`;
}

/** 
 * Transform local path to Cloudinary URL
 * /products/image.jpg → https://res.cloudinary.com/ds8llatku/image/upload/f_auto,q_auto/zecode/products/image
 */


/** fileUrl helper */
export function fileUrl(file: any) {
  if (!file) return null;
  const id = typeof file === "string" ? file : (file?.id ?? file?.data?.id);
  if (!id) return null;

  // If it's already a full URL (http/https), return as is
  if (typeof id === 'string' && id.startsWith('http')) {
    return id;
  }

  // If it's a local path (starts with /), transform to Cloudinary URL
  if (typeof id === 'string' && id.startsWith('/')) {
    // Check if it's one of our image folders
    if (id.startsWith('/products/') || id.startsWith('/categories/') ||
      id.startsWith('/hero/') || id.startsWith('/brand/') ||
      id.startsWith('/placeholders/')) {
      return getCloudinaryUrl(id);
    }
    // Other local paths (like fonts) stay as-is
    return id;
  }

  // Otherwise treat as Directus asset ID
  // Use Cloudinary Fetch to proxy and optimize Directus images
  // Format: https://res.cloudinary.com/<cloud_name>/image/fetch/<options>/<remote_url>
  const directusUrl = `${DIRECTUS}/assets/${id}`;
  return `${CLOUDINARY_BASE_URL.replace('/upload', '/fetch')}/f_auto,q_auto/${directusUrl}`;
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
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  hours?: string;
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
  model_image_1?: string;
  model_image_2?: string;
  model_image_3?: string;
  images?: string[];
  category?: string;
  subcategory?: string;
  gender_category?: string;
  sizes?: string[];
  colors?: string[];
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
          fields: "*.*", // Deep fetch for M2M
          limit: -1,  // Get all products
        },
        timeout: TIMEOUT_PRODUCTS,
      });
      const products = res?.data?.data ?? null;
      if (products && products.length > 0) {
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
async function _fetchProductsByGenderAndSubcategory(gender: string | null, subcategory: string | string[]): Promise<Product[] | null> {
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

    const res = await axios.get(url, {
      params: {
        sort: "sort,name",
        filter: JSON.stringify(filter),
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
  ? (gender: string | null, subcategory: string | string[]) => {
    const cacheKey = `products-${gender || 'all'}-${Array.isArray(subcategory) ? subcategory.join('-') : subcategory}`;
    return unstable_cache(
      () => _fetchProductsByGenderAndSubcategory(gender, subcategory),
      [cacheKey],
      { revalidate: CACHE_PRODUCTS, tags: ['products'] }
    )();
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
        fields: "*.*", // Fetch relations deep
        limit: 1,
        _t: cacheBuster // Cache buster
      },
      timeout: TIMEOUT_DEFAULT,
    });
    
    const product = res?.data?.data?.[0] ?? null;
    
    if (product) {
      console.log(`[Directus] Product ${product.id} fetched:`, {
        hasModelImage1: !!product.model_image_1,
        hasModelImage2: !!product.model_image_2,
        hasModelImage3: !!product.model_image_3,
        modelImage1Type: typeof product.model_image_1,
        modelImage1IsObject: product.model_image_1 && typeof product.model_image_1 === 'object'
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

