import ProductDetailContent from '@/components/ProductDetailContent';
import { fetchProductBySlug, fileUrl, type Product } from '@/lib/directus';
import { notFound } from 'next/navigation';

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const productSlug = slug;
    const product = await fetchProductBySlug(productSlug);

    if (!product) {
        notFound();
    }

    // Normalize Directus Product -> ProductDetailContent shape
    const normalized = ((): any => {
        const p: Product = product as Product;
        const imageId = p.image || p.image_url || (p.images && p.images[0]) || null;

        let galleryRaw: (string | undefined)[] = [];

        // 1. Prioritize real photo session images (Directus M2M)
        if (p.images && p.images.length > 0) {
            galleryRaw = [...p.images];
        }

        // 2. Add Main Image if not already detected
        if (imageId && !galleryRaw.includes(imageId)) {
            galleryRaw.unshift(imageId);
        }

        // 3. Fallback: Use AI model images only if no Photo Session images exist
        if ((!p.images || p.images.length === 0)) {
            if (p.model_image_1) galleryRaw.push(p.model_image_1);
            if (p.model_image_2) galleryRaw.push(p.model_image_2);
            if (p.model_image_3) galleryRaw.push(p.model_image_3);
        }

        // Filter out nulls/undefined and duplicates
        const uniqueGallery = Array.from(new Set(galleryRaw.filter(Boolean)));

        const gallery = (uniqueGallery.length > 0)
            ? uniqueGallery
            : imageId
                ? [imageId]
                : [];

        return {
            id: p.id,
            name: p.name,
            // prefer category, fallback to gender or a safe string
            category: (p.category || p.gender_category || 'product') as string,
            categoryLabel: p.subcategory ?? undefined,
            price: (typeof p.sale_price === 'number' ? p.sale_price : (typeof p.price === 'number' ? p.price : null)),
            originalPrice: typeof p.price === 'number' ? p.price : undefined,
            image: fileUrl(imageId) || '/placeholders/product-placeholder.png',
            gallery: gallery.map((g) => fileUrl(g) || g),
            description: p.description ?? '',
            sizes: p.sizes ?? undefined,
            rating: undefined,
            reviewCount: undefined,
        };
    })();

    return <ProductDetailContent product={normalized} />;
}
