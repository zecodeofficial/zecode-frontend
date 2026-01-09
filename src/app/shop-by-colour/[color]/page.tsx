import { fetchProducts, hasColor, type Product } from "@/lib/directus";
import Breadcrumb from "@/components/Breadcrumb";
import SubcategoryGridDynamic from "@/components/SubcategoryGridDynamic";
import DescriptionText from "@/components/DescriptionText";
import { COLOR_DESCRIPTIONS } from "@/data/color-descriptions";
import { Metadata } from "next";

const COLOR_MAP: Record<string, string> = {
    "BLACK": "#1A1A1A",
    "WHITE": "#FFFFFF",
    "NAVY": "#000080",
    "BLUE": "#3b82f6",
    "RED": "#C83232",
    "GREEN": "#046307",
    "YELLOW": "#eab308",
    "PINK": "#ec4899",
    "PURPLE": "#a855f7",
    "BEIGE": "#f5f5dc",
    "BROWN": "#78350f",
    "GREY": "#6b7280",
};

interface PageProps {
    params: Promise<{ color: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { color } = await params;
    const activeColorLabel = color.charAt(0).toUpperCase() + color.slice(1);
    const description = COLOR_DESCRIPTIONS[color.toLowerCase()] || "";

    return {
        title: `${activeColorLabel} Collection | Shop By Colour | Zecode`,
        description: description.substring(0, 160),
        openGraph: {
            title: `${activeColorLabel} Collection | Shop By Colour | Zecode`,
            description: description.substring(0, 160),
        }
    };
}

export default async function ShopByColourPage({ params }: PageProps) {
    const { color } = await params;
    const products = await fetchProducts();

    if (!products) {
        return (
            <main className="min-h-screen bg-white flex items-center justify-center">
                <p className="text-gray-500">Failed to load collection. Please try again later.</p>
            </main>
        );
    }

    const filteredProducts = products.filter((product: Product) => {
        return hasColor(product, color);
    });

    const activeColorLabel = color.charAt(0).toUpperCase() + color.slice(1);

    // Replicate canonical slug mappings from category pages
    const MAPPINGS: Record<string, Record<string, string | string[]>> = {
        men: {
            'tshirts': ['T', 'T-Shirt', 'T-Shirts', 'Classic T-Shirt', 'Classic T-Shirts', 't-shirts', 't-shirt'],
            'shirts': ['Shirt', 'Shirts', 'Casual Shirt', 'Casual Shirts', 'Button-Up Shirt', 'Button-Up Shirts', 'Short Sleeve Shirt', 'Short Sleeve Shirts', 'shirts'],
            'jeans': ['Jeans', 'Slim Jeans', 'Jean', 'Slim Jean'],
            'pants': ['Pants', 'Slim Pants', 'Cargo Pants', 'Pant', 'Slim Pant', 'Cargo Pant'],
            'trousers': ['Trousers', 'Trouser', 'trousers'],
            'jackets': ['Jacket', 'Jackets', 'Casual Jacket', 'Casual Jackets', 'Denim Jacket', 'Denim Jackets', 'Varsity Jacket', 'Varsity Jackets', 'jackets'],
            'shoes': ['Footwear', 'Shoe', 'Shoes'],
            'accessories': ['Accessories', 'Accessory', 'Backpack', 'Backpacks'],
            'shorts': ['Short', 'Shorts'],
            'hoodies': ['Hoodie', 'Hoodies'],
            'sweatshirts': ['Sweatshirt', 'Sweatshirts'],
            'backpacks': ['Backpack', 'Backpacks'],
            'polos': ['Polo Shirt', 'Polo Shirts', 'Polo'],
        },
        women: {
            'tops': ['Top', 'Tops', 'Casual Top', 'Tank Top'],
            'blouses': 'Blouse',
            'dresses': ['Dress', 'Dresses', 'Midi Dress', 'Mini Dress', 'Slip Dress'],
            'jeans': ['Jeans', 'Slim Jeans'],
            'pants': ['Pants', 'Slim Pants', 'Cargo Pants'],
            'skirts': 'Skirt',
            'jackets': ['Jacket', 'Casual Jacket', 'Denim Jacket'],
            'shoes': ['Footwear', 'Flats', 'Sneakers', 'Formal Shoes', 'Heels', 'Mules', 'Sandals', 'Boots', 'Loafers'],
            'accessories': 'Accessories',
            'tshirts': ['T', 'T-Shirt', 'T-Shirts', 'Classic T-Shirt'],
            'shirts': ['Shirt', 'Casual Shirt'],
            'shorts': 'Shorts',
            'tunics': 'Tunic',
            'hoodies': 'Hoodie',
            'tanks': ['Tank', 'Tank Top'],
            'sweaters': 'Sweater',
            'sweatpants': 'Sweatpants',
            'sweatshirts': 'Sweatshirt',
            'tracksuits': ['Track', 'Tracksuit'],
            'vests': 'Vest',
            'visors': 'Visor',
            'backpacks': 'Backpack',
            'flats': 'Flats',
            'mules': 'Mules',
            'heels': 'Heels',
            'jumpsuits': 'Jumpsuit',
            'activewear': ['Activewear', 'activewear'],
        },
        kids: {
            'tshirt': 'T-Shirt',
            'jeans': 'Jeans',
            'slim-jeans': 'Slim Jeans',
            'dress': 'Dress',
            'midi-dress': 'Midi Dress',
            'casual-top': 'Casual Top',
            'hoodie': 'Hoodie',
            'tracksuit': 'Tracksuit',
            'sweatshirt': 'Sweatshirt',
            'pants': 'Pants',
            'slim-pants': 'Slim Pants',
            'jumpsuit': 'Jumpsuit',
            'kurta': 'Kurta',
            'casual-jacket': 'Casual Jacket',
            'denim-jacket': 'Denim Jacket',
            'varsity-jacket': 'Varsity Jacket',
            'flats': 'Flats',
            'boys-tshirts': ['T', 'T-Shirt', 'Classic T-Shirt'],
            'girls-tops': ['Tops', 'Top', 'Casual Top'],
            'boys-jeans': ['Bottoms', 'Jeans', 'Slim Jeans'],
            'girls-dresses': ['Dresses', 'Dress', 'Midi Dress'],
        },
        footwear: {
            'flats': 'Flats',
            'mules': 'Mules',
            'heels': 'Heels',
            'sandals': 'Sandals',
            'boots': 'Boots',
            'sneakers': 'Sneakers',
            'loafers': 'Loafers',
            'flip-flops': 'Flip-Flops',
        }
    };

    const getCanonicalSlug = (mainCat: string, subCat: string): string => {
        const catMap = MAPPINGS[mainCat.toLowerCase()];
        if (!catMap) return subCat.toLowerCase().trim().replace(/\s+/g, '-');

        const lowerSub = subCat.toLowerCase();
        for (const [slug, values] of Object.entries(catMap)) {
            if (Array.isArray(values)) {
                if (values.some(v => v.toLowerCase() === lowerSub)) return slug;
            } else if (values.toLowerCase() === lowerSub) {
                return slug;
            }
        }
        return subCat.toLowerCase().trim().replace(/\s+/g, '-');
    };

    // Group products by Main Category + Subcategory for the dynamic grid
    const grouped = new Map<string, { products: Product[], count: number, main: string, sub: string }>();
    filteredProducts.forEach((p: Product) => {
        // Determine "Main" category: Footwear and Kids take precedence over Gender
        let main = p.gender_category || 'Other';
        if (p.category === 'Footwear') main = 'Footwear';
        else if (p.category === 'Kids') main = 'Kids';

        const sub = p.subcategory || 'Other';

        // Final key for grouping and display
        const key = `${main} - ${sub}`;

        if (!grouped.has(key)) {
            grouped.set(key, { products: [], count: 0, main, sub });
        }
        const entry = grouped.get(key)!;
        entry.count++;
        if (entry.products.length < 10) {
            entry.products.push(p);
        }
    });

    // Standardize slug normalization helper
    const toSlug = (s: string) => s.toLowerCase().trim().replace(/\s+/g, '-');

    // Create subcategory list for the grid component
    // Sort logically: Men, Women, Kids, Footwear
    const orderMap: Record<string, number> = { 'Men': 1, 'Women': 2, 'Kids': 3, 'Footwear': 4 };
    const subcategories = Array.from(grouped.entries())
        .sort((a, b) => {
            const orderA = orderMap[a[1].main] || 99;
            const orderB = orderMap[b[1].main] || 99;
            if (orderA !== orderB) return orderA - orderB;
            return b[1].count - a[1].count;
        })
        .map(([name, data]) => {
            const mainSlug = toSlug(data.main);
            const subSlug = getCanonicalSlug(data.main, data.sub);

            // Map main category to the correct base URL path
            const basePath = mainSlug === 'footwear' ? 'footwear' : (mainSlug === 'kids' ? 'kids' : mainSlug);

            return {
                title: name, // e.g., "Men - Trousers" or "Footwear - Sandals"
                slug: `${mainSlug}-${subSlug}`,
                // Maintain color parameter even on sub-links for consistency if user wants to browse deeper by color
                href: `/${basePath}/${subSlug}?color=${color.toLowerCase()}`
            };
        });

    return (
        <main className="min-h-screen bg-white">
            {/* Breadcrumb Section */}
            <div className="max-w-7xl mx-auto px-4 pt-10">
                <Breadcrumb
                    items={[
                        { label: 'Home', href: '/' },
                        { label: 'Shop By Colour', href: '#' },
                        { label: activeColorLabel }
                    ]}
                />
            </div>

            <div className="pb-8">

                <DescriptionText text={COLOR_DESCRIPTIONS[color.toLowerCase()] || ""} />

                <SubcategoryGridDynamic
                    title={
                        <>
                            Explore The <span
                                style={{
                                    color: COLOR_MAP[color.toUpperCase()] || '#000',
                                    backgroundColor: color.toLowerCase() === 'white' ? '#1A1A1A' : 'transparent',
                                    padding: color.toLowerCase() === 'white' ? '2px 12px' : '0',
                                    borderRadius: '6px',
                                    border: color.toLowerCase() === 'white' ? '1px solid #ddd' : 'none'
                                }}
                            >
                                {color.toUpperCase()}
                            </span> Collection By Category
                        </>
                    }
                    categorySlug="shop-by-colour"
                    hideSectionLabel={true}
                    HeadingTag="h1"
                    subcategories={subcategories}
                    initialData={Object.fromEntries(
                        Array.from(grouped.values()).map(v => [`${toSlug(v.main)}-${toSlug(v.sub)}`, v])
                    )}
                    variant="section"
                />

                {filteredProducts.length === 0 && (
                    <div className="container mx-auto px-4 mt-12">
                        <div className="text-center py-40 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                            <p className="font-din text-4xl text-gray-300 uppercase italic">
                                No items found in {activeColorLabel}.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

export async function generateStaticParams() {
    // Basic colors we definitely support
    const colors = ["black", "white", "navy", "blue", "red", "green", "yellow", "pink", "purple", "beige", "brown", "grey"];
    return colors.map((color) => ({ color }));
}
