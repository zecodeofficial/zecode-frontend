import { fileUrl, fetchProductsByGenderAndSubcategory } from "@/lib/directus";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";
import { Metadata } from "next";
import { SUBCATEGORY_DESCRIPTIONS } from "@/data/subcategory-descriptions";
import DescriptionText from "@/components/DescriptionText";

// Force dynamic rendering to prevent build-time API calls
export const dynamic = 'force-dynamic';

// Map subcategory slugs to CMS subcategory values for footwear
// Use lowercase to match Directus data, include 'footwear' as fallback for generic products
const SUBCATEGORY_MAP: Record<string, string | string[]> = {
    'men': ['flats', 'mules', 'sneakers', 'boots', 'loafers', 'sandals', 'slides', 'clogs', 'footwear'],
    'women': ['flats', 'mules', 'heels', 'sandals', 'boots', 'sneakers', 'slides', 'clogs', 'footwear'],
    'sneakers': ['sneakers', 'footwear'],
    'slides': ['slides', 'footwear'],
    'clogs': ['clogs', 'footwear'],
    'flats': ['flats', 'mules', 'slides', 'footwear'],
    'mules': ['mules', 'footwear'],
    'heels': ['heels', 'footwear'],
    'sandals': ['sandals', 'footwear'],
    'boots': ['boots', 'footwear'],
    'loafers': ['loafers', 'footwear'],
    'flip-flops': ['flip-flops', 'footwear'],
};

const TITLE_MAP: Record<string, string> = {
    'men': "Men's Footwear",
    'women': "Women's Footwear",
    'shoes': 'Shoes',
    'flats': 'Flats',
    'mules': 'Mules',
    'heels': 'Heels',
    'sandals': 'Sandals',
    'boots': 'Boots',
    'sneakers': 'Sneakers',
    'loafers': 'Loafers',
    'flip-flops': 'Flip-Flops',
};

interface PageProps {
    params: Promise<{ subcategory: string; gender: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { subcategory, gender } = await params;

    let displayTitle = TITLE_MAP[subcategory] || subcategory;
    const genderLabel = gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
    displayTitle = `${genderLabel}'s ${displayTitle}`;

    const description = SUBCATEGORY_DESCRIPTIONS.footwear[subcategory] || '';

    return {
        title: `${displayTitle} | Zecode`,
        description: description.substring(0, 160),
        openGraph: {
            title: `${displayTitle} | Zecode`,
            description: description.substring(0, 160),
        }
    };
}

export default async function FootwearGenderPage({ params }: PageProps) {
    const { subcategory, gender } = await params;

    const cmsSubcategory = SUBCATEGORY_MAP[subcategory] || subcategory;
    let displayTitle = TITLE_MAP[subcategory] || subcategory;

    const genderLabel = gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
    displayTitle = `${genderLabel}'s ${displayTitle}`;

    let products: any[] = [];
    try {
        // Footwear products are distributed across 'men', 'women', and 'footwear' categories in Directus
        // Don't restrict by category - rely on subcategory + gender filtering instead
        const fetchedProducts = await fetchProductsByGenderAndSubcategory(gender, cmsSubcategory);
        if (fetchedProducts) {
            products = fetchedProducts;
        }
    } catch (error) {
        console.error("Error fetching products:", error);
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="bg-gray-50 py-4">
                <div className="max-w-7xl mx-auto px-4">
                    <nav className="flex items-center space-x-2 text-sm">
                        <Link href="/" className="text-gray-500 hover:text-gray-700">Home</Link>
                        <span className="text-gray-400">/</span>
                        <Link href="/footwear" className="text-gray-500 hover:text-gray-700">Footwear</Link>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-900 font-medium">{displayTitle}</span>
                    </nav>
                </div>
            </div>

            <div className="py-8 bg-gradient-to-r from-amber-600 to-orange-600">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{displayTitle}</h1>
                    <p className="text-amber-200">{products.length} products found</p>
                </div>
            </div>

            {/* Description Section */}
            <DescriptionText text={SUBCATEGORY_DESCRIPTIONS.footwear[subcategory]} />

            <div className="max-w-7xl mx-auto px-4 py-8">
                {products.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-gray-500 text-lg">No products found in this category.</p>
                        <Link href="/footwear" className="text-amber-600 hover:underline mt-4 inline-block">
                            ← Back to Footwear
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {products.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={{
                                    id: product.id,
                                    name: product.name,
                                    slug: product.slug || product.id.toString(),
                                    price: product.price || 0,
                                    sale_price: (product as any).sale_price,
                                    image: product.image_url || product.image || '/placeholders/product.jpg',
                                    image_url: product.image_url,
                                    category: 'footwear',
                                    subcategory: product.subcategory,
                                    gender_category: product.gender_category,
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
