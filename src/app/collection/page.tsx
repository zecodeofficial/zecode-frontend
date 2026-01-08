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

    // Group products by subcategory for the dynamic grid
    const grouped = new Map<string, { products: Product[], count: number }>();
    filteredProducts.forEach(p => {
        const sub = p.subcategory || 'Other';
        if (!grouped.has(sub)) {
            grouped.set(sub, { products: [], count: 0 });
        }
        const entry = grouped.get(sub)!;
        entry.count++;
        if (entry.products.length < 10) {
            entry.products.push(p);
        }
    });

    // Standardize slug normalization helper
    const toSlug = (s: string) => s.toLowerCase().trim().replace(/\s+/g, '-');

    // Create subcategory list for the grid component
    // Sort by count descending
    const subcategories = Array.from(grouped.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .map(([name, data]) => {
            const slug = toSlug(name);
            const sampleProduct = data.products[0];
            const category = sampleProduct?.category?.toLowerCase() || 'collection';

            return {
                title: name,
                slug: slug,
                href: `/${category}/${slug}?color=${color || ''}`
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
                        Array.from(grouped.entries()).map(([k, v]) => [toSlug(k), v])
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
