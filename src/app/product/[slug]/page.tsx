import ProductDetailContent from '@/components/ProductDetailContent';
import { fetchProductBySlug, fileUrl, getProductPlaceholderUrl, type Product } from '@/lib/directus';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

// Revalidate product pages every 5 minutes
export const revalidate = 300;

/**
 * Normalizes Directus product data into the shape expected by ProductDetailContent
 */
function normalizeProduct(p: any) {
    if (!p) return null;

    // 1. Build Image Gallery
    // Priority: main image, followed by model images
    const images = new Set<string>();

    // Add main image first
    const mainImg = p.main_image || p.image || p.image_url || p.product_image_url;
    const mainImgUrl = mainImg ? fileUrl(mainImg) : null;
    if (mainImgUrl) images.add(mainImgUrl);

    // Add model images from UUID fields
    [p.model_image_1, p.model_image_2, p.model_image_3].forEach(img => {
        const url = img ? fileUrl(img) : null;
        if (url) images.add(url);
    });

    // Add model images from URL fields (Cloudinary fallbacks)
    [p.model_image_1_url, p.model_image_2_url, p.model_image_3_url].forEach(url => {
        const normalizedUrl = url ? fileUrl(url) : null;
        if (normalizedUrl) images.add(normalizedUrl);
    });

    // Add legacy images array
    if (Array.isArray(p.images)) {
        p.images.forEach((img: any) => {
            const url = img ? fileUrl(img) : null;
            if (url) images.add(url);
        });
    }

    const gallery = Array.from(images);
    const primaryImage = gallery[0] || getProductPlaceholderUrl();

    return {
        id: p.id,
        name: p.name || 'Untitled Product',
        slug: p.slug,
        category: p.category || p.gender_category || 'Fashion',
        categoryLabel: p.subcategory || p.category || 'Product',
        price: typeof p.sale_price === 'number' ? p.sale_price : (typeof p.price === 'number' ? p.price : 0),
        originalPrice: typeof p.price === 'number' ? p.price : undefined,
        image: primaryImage,
        gallery: gallery.length > 0 ? gallery : [primaryImage],
        description: p.description || '',
        sizes: Array.isArray(p.sizes) ? p.sizes : undefined,
        colors: Array.isArray(p.colors) ? p.colors : (typeof p.colors === 'string' ? p.colors.split(',') : undefined),
        color: p.color,
        featured: !!p.featured,
        status: p.status
    };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const product = await fetchProductBySlug(slug);

    if (!product) {
        return { title: 'Product Not Found | Zecode' };
    }

    return {
        title: `${product.name} | Zecode Fashion`,
        description: product.description?.slice(0, 160) || `Buy ${product.name} at Zecode.`,
        openGraph: {
            title: product.name,
            description: product.description,
            images: [(product as any).image_url || '/logo.png'],
        },
    };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const rawProduct = await fetchProductBySlug(slug);

    if (!rawProduct) {
        notFound();
    }

    const product = normalizeProduct(rawProduct);

    if (!product) {
        notFound();
    }

    return (
        <div className="bg-white min-h-screen pt-20 pb-12">
            <ProductDetailContent product={product as any} />
        </div>
    );
}
