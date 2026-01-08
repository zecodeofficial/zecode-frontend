"use client";

import { useState, useMemo } from "react";
import { type Product, hasColor } from "@/lib/directus";
import ProductCard from "./ProductCard";

interface ColorOption {
    name: string;
    hex: string;
    label: string;
}

const COLORS: ColorOption[] = [
    { name: "black", hex: "#1A1A1A", label: "Black" },
    { name: "white", hex: "#FFFFFF", label: "White" },
    { name: "navy", hex: "#000080", label: "Navy" },
    { name: "blue", hex: "#3b82f6", label: "Blue" },
    { name: "red", hex: "#C83232", label: "Red" },
    { name: "green", hex: "#046307", label: "Green" },
    { name: "yellow", hex: "#eab308", label: "Yellow" },
    { name: "pink", hex: "#ec4899", label: "Pink" },
    { name: "purple", hex: "#a855f7", label: "Purple" },
    { name: "beige", hex: "#f5f5dc", label: "Beige" },
    { name: "brown", hex: "#78350f", label: "Brown" },
    { name: "grey", hex: "#6b7280", label: "Grey" },
];

interface ShopByColorProps {
    products: Product[];
}

export default function ShopByColor({ products }: ShopByColorProps) {
    const [selectedColor, setSelectedColor] = useState<string>("black");

    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            return hasColor(product, selectedColor);
        }).slice(0, 8); // Show top 8 for each color on homepage
    }, [products, selectedColor]);

    return (
        <section id="shop-by-color" className="py-16 px-4 md:px-8 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="font-din text-4xl md:text-5xl font-bold uppercase tracking-tighter text-black mb-4">
                        SHOP BY COLOR
                    </h2>
                    <p className="font-sans text-gray-500 max-w-2xl mx-auto">
                        Find the perfect outfit matching your mood and style. Choose a color to explore our collection.
                    </p>
                </div>

                {/* Color Swatches */}
                <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-12">
                    {COLORS.map((color) => (
                        <button
                            key={color.name}
                            onClick={() => setSelectedColor(color.name)}
                            className={`group flex flex-col items-center gap-2 transition-transform duration-300 ${selectedColor === color.name ? "scale-110" : "hover:scale-105"
                                }`}
                        >
                            <div
                                className={`w-12 h-12 md:w-16 md:h-16 rounded-full border-2 transition-all duration-300 ${selectedColor === color.name
                                    ? "border-black ring-2 ring-offset-2 ring-gray-300"
                                    : "border-gray-200 group-hover:border-gray-400"
                                    }`}
                                style={{
                                    backgroundColor: color.hex,
                                    boxShadow: color.name === 'white' ? 'inset 0 0 1px #ccc' : 'none'
                                }}
                            />
                            <span className={`text-xs md:text-sm font-bold uppercase tracking-widest font-din ${selectedColor === color.name ? "text-black" : "text-gray-400"
                                }`}>
                                {color.label}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Products Grid */}
                {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                        {filteredProducts.map((product) => (
                            <div key={product.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <ProductCard product={product} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <p className="font-din text-2xl text-gray-400 uppercase italic">
                            No outfits found in this color yet.
                        </p>
                        <p className="text-gray-400 mt-2">Try another color or check back later!</p>
                    </div>
                )}

                {/* View All Button */}
                {filteredProducts.length > 0 && (
                    <div className="mt-12 text-center">
                        <Link
                            href={`/collection?color=${selectedColor}`}
                            className="inline-block border-2 border-black px-8 py-3 font-din font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all duration-300 transform hover:-translate-y-1"
                        >
                            View All {COLORS.find(c => c.name === selectedColor)?.label} Outfits →
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
}

import Link from "next/link";
