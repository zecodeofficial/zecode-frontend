/**
 * Centralized mapping for subcategories across Header, Category Pages, and Subcategory Pages.
 * Ensures synchronization between:
 * 1. Header Navigation
 * 2. Category Grid Thumbnails
 * 3. Subcategory Page Product Fetching
 */

export interface SubcategoryMapping {
    title: string;
    slug: string;
    cmsValues: string[];
}

export const MEN_MAPPING: SubcategoryMapping[] = [
    { title: "T-SHIRTS", slug: "tshirts", cmsValues: ['T', 'T-Shirt', 'T-Shirts', 'Classic T-Shirt', 't-shirts', 't-shirt'] },
    { title: "SHIRTS", slug: "shirts", cmsValues: ['Shirt', 'Shirts', 'Casual Shirt', 'Button-Up Shirt', 'Short Sleeve Shirt', 'shirts'] },
    { title: "JEANS", slug: "jeans", cmsValues: ['Jeans', 'Slim Jeans', 'Jean'] },
    { title: "TROUSERS", slug: "trousers", cmsValues: ['Trousers', 'Trouser', 'trousers', 'Pants', 'Slim Pants', 'Cargo Pants'] },
    { title: "SHORTS", slug: "shorts", cmsValues: ['Short', 'Shorts'] },
    { title: "JACKETS", slug: "jackets", cmsValues: ['Jacket', 'Jackets', 'Casual Jacket', 'Denim Jacket', 'Varsity Jacket', 'jackets'] },
];

export const WOMEN_MAPPING: SubcategoryMapping[] = [
    // Western Wear
    { title: "TOPS", slug: "tops", cmsValues: ['Top', 'Tops', 'Casual Top', 'Tank Top', 'tops', 'Blouse', 'Tunics'] },
    { title: "T-SHIRTS", slug: "tshirts", cmsValues: ['T', 'T-Shirt', 'T-Shirts', 'Classic T-Shirt', 't-shirts'] },
    { title: "DRESSES", slug: "dresses", cmsValues: ['Dress', 'Dresses', 'Midi Dress', 'Mini Dress', 'Slip Dress', 'dresses'] },
    { title: "JEANS", slug: "jeans", cmsValues: ['Jeans', 'Slim Jeans', 'jeans'] },
    { title: "SKIRTS", slug: "skirts", cmsValues: ['Skirt', 'Skirts', 'skirts'] },
    { title: "JACKETS", slug: "jackets", cmsValues: ['Jacket', 'Jackets', 'Casual Jacket', 'Denim Jacket', 'jackets'] },
    { title: "SHORTS", slug: "shorts", cmsValues: ['Short', 'Shorts', 'shorts'] },
    // Activewear
    { title: "ACTIVEWEAR", slug: "activewear", cmsValues: ['Activewear', 'activewear', 'Hoodie', 'Sweatshirt', 'Tracksuit', 'Track'] },
    // Ethnic Fusion
    { title: "ETHNIC FUSION", slug: "ethnic-wear", cmsValues: ['Ethnic Wear', 'ethnic-wear', 'Ethnic Fusion', 'ethnic-fusion', 'Kurti', 'Kurta', 'Kurtas', 'Lehenga'] },
];

export const FOOTWEAR_MEN_MAPPING: SubcategoryMapping[] = [
    { title: "SNEAKERS", slug: "sneakers", cmsValues: ['Sneakers', 'Footwear', 'sneakers'] },
    { title: "SLIDES", slug: "slides", cmsValues: ['Slides', 'Footwear', 'slides'] },
    { title: "CLOGS", slug: "clogs", cmsValues: ['Clogs', 'Footwear', 'clogs'] },
    { title: "SANDALS", slug: "sandals", cmsValues: ['Sandals', 'Footwear', 'sandals'] },
    { title: "FLIP-FLOPS", slug: "flip-flops", cmsValues: ['Flip-Flops', 'Flip Flops', 'Footwear', 'slappers', 'flip-flops'] },
];

export const FOOTWEAR_WOMEN_MAPPING: SubcategoryMapping[] = [
    { title: "FLATS", slug: "flats", cmsValues: ['Flats', 'Footwear', 'flats'] },
    { title: "SANDALS", slug: "sandals", cmsValues: ['Sandals', 'Footwear', 'sandals'] },
    { title: "SLIDES", slug: "slides", cmsValues: ['Slides', 'Footwear', 'slides'] },
    { title: "FLIP-FLOPS", slug: "flip-flops", cmsValues: ['Flip-Flops', 'Footwear', 'flip-flops'] },
    { title: "HEELS", slug: "heels", cmsValues: ['Heels', 'Footwear', 'heels'] },
    { title: "MULES", slug: "mules", cmsValues: ['Mules', 'Footwear', 'mules'] },
    { title: "SNEAKERS", slug: "sneakers", cmsValues: ['Sneakers', 'Footwear', 'sneakers'] },
];

/**
 * Helper to get SUBCATEGORY_MAP version (Record<slug, string[]>)
 */
export function getSubcategoryMap(mappings: SubcategoryMapping[]): Record<string, string[]> {
    const map: Record<string, string[]> = {};
    mappings.forEach(m => {
        map[m.slug] = m.cmsValues;
    });
    return map;
}

/**
 * Helper to get TITLE_MAP version (Record<slug, title>)
 */
export function getTitleMap(mappings: SubcategoryMapping[]): Record<string, string> {
    const map: Record<string, string> = {};
    mappings.forEach(m => {
        map[m.slug] = m.title;
    });
    return map;
}
