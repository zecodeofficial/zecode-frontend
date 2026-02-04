"use client";

import { useState, useEffect } from "react";
import ShopByColor from "./ShopByColor";
import type { Product } from "@/lib/directus";

export default function ShopByColorWrapper() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchProducts() {
            try {
                const res = await fetch('/api/directus/items/products?limit=200&fields=id,name,slug,image_url,image,price,color,colors,category,subcategory&filter[status][_eq]=published');
                if (res.ok) {
                    const data = await res.json();
                    setProducts(data.data || []);
                }
            } catch (error) {
                console.error('Failed to fetch products for Shop by Color:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchProducts();
    }, []);

    if (isLoading) {
        return (
            <section className="py-16 px-4 md:px-8 bg-white">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="animate-pulse">
                        <div className="h-12 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
                        <div className="h-6 bg-gray-100 rounded w-96 mx-auto mb-12"></div>
                        <div className="flex justify-center gap-8 mb-12">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="w-16 h-16 bg-gray-200 rounded-full"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (products.length === 0) {
        return null;
    }

    return <ShopByColor products={products} />;
}
