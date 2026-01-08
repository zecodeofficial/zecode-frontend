import { fetchProducts } from "@/lib/directus";
import ProductCard from "@/components/ProductCard";
import Breadcrumb from "@/components/Breadcrumb";

export default async function CollectionPage({
    searchParams
}: {
    searchParams: Promise<{ color?: string }>
}) {
    const { color } = await searchParams;
    const products = await fetchProducts();

    const filteredProducts = products.filter(product => {
        if (!color) return true;
        if (!product.colors) return false;

        const productColors = Array.isArray(product.colors)
            ? product.colors.map(c => c.toLowerCase())
            : (typeof product.colors === 'string' ? (product.colors as string).split(',').map(c => c.trim().toLowerCase()) : []);

        return productColors.some(c => c.includes(color.toLowerCase()) || color.toLowerCase().includes(c));
    });

    const activeColorLabel = color ? color.charAt(0).toUpperCase() + color.slice(1) : "All";

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

            <div className="container mx-auto px-4 pt-10 pb-20">
                <div className="text-center mb-16">
                    <h1 className="font-din text-6xl font-bold uppercase tracking-tighter mb-4">
                        {activeColorLabel} COLLECTION
                    </h1>
                    <p className="text-gray-500 uppercase tracking-widest text-sm">
                        Showing {filteredProducts.length} items
                    </p>
                </div>

                {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                        {filteredProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-40 border-2 border-dashed border-gray-100 rounded-3xl">
                        <p className="font-din text-4xl text-gray-300 uppercase italic">
                            No items found in this category.
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}
