import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { fetchProductsByCategory, fetchCategories } from '@/lib/directus';

// Correctly type the props for a Next.js page component
// params is a Promise in newer Next.js versions, but for 14/15 it might be just an object.
// Safest to treat as potentially async or check Next.js version.
// Given Next.js 16.0.3 in package.json, params is a Promise.

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
    const { category } = await params;

    // Normalize category to lowercase for matching
    const normalizedCategory = category.toLowerCase();

    // Fetch category products from CMS
    const products = (await fetchProductsByCategory(normalizedCategory)) ?? [];

    // Validate category existence using CMS categories OR presence of products
    const categories = (await fetchCategories()) ?? [];
    const isValidCategory = (categories && categories.some((c) => c.slug === normalizedCategory)) || products.length > 0;

    if (!isValidCategory) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-white pt-10 pb-20">
            <div className="container mx-auto px-4">
                <h1 className="font-din text-6xl font-bold uppercase tracking-tighter mb-10 text-center">
                    {category}
                </h1>

                {products.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-xl text-gray-500">No products found in this category.</p>
                    </div>
                )}
            </div>
        </main>
    );
}
