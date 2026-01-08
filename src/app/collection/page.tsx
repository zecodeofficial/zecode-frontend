import { fetchProducts, hasColor, type Product } from "@/lib/directus";
import Breadcrumb from "@/components/Breadcrumb";
import SubcategoryGridDynamic from "@/components/SubcategoryGridDynamic";

export default async function CollectionPage({
    searchParams
}: {
    searchParams: Promise<{ color?: string }>
}) {
    const { color } = await searchParams;
    const products = await fetchProducts();

    if (!products) {
        return (
            <main className="min-h-screen bg-white flex items-center justify-center">
                <p className="text-gray-500">Failed to load collection. Please try again later.</p>
            </main>
        );
    }

    const filteredProducts = products.filter((product: Product) => {
        if (!color) return true;
        return hasColor(product, color);
    });

    const activeColorLabel = color ? color.charAt(0).toUpperCase() + color.slice(1) : "All";

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
            const subSlug = toSlug(data.sub);

            // Map main category to the correct base URL path
            const basePath = mainSlug === 'footwear' ? 'footwear' : (mainSlug === 'kids' ? 'kids' : mainSlug);

            return {
                title: name, // e.g., "Men - Trousers" or "Footwear - Sandals"
                slug: `${mainSlug}-${subSlug}`,
                href: `/${basePath}/${subSlug}?color=${color || ''}`
            };
        });

    return (
        <main className="min-h-screen bg-white">
            {/* Breadcrumb Section */}
            <div className="max-w-7xl mx-auto px-4 pt-10">
                <Breadcrumb
                    items={[
                        { label: 'Home', href: '/' },
                        { label: 'Collection', href: '/collection' },
                        ...(color ? [{ label: activeColorLabel }] : [])
                    ]}
                />
            </div>

            <div className="pb-20">
                <SubcategoryGridDynamic
                    title={`${activeColorLabel} COLLECTION`}
                    categorySlug="collection"
                    subcategories={subcategories}
                    initialData={Object.fromEntries(
                        Array.from(grouped.values()).map(v => [`${toSlug(v.main)}-${toSlug(v.sub)}`, v])
                    )}
                    variant="section"
                />

                {filteredProducts.length === 0 && (
                    <div className="container mx-auto px-4">
                        <div className="text-center py-40 border-2 border-dashed border-gray-100 rounded-3xl">
                            <p className="font-din text-4xl text-gray-300 uppercase italic">
                                No items found in this color.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
