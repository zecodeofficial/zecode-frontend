import ProductDetailContent from '@/components/ProductDetailContent';
import { fetchProductBySlug } from '@/lib/directus';
import { notFound } from 'next/navigation';

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const productSlug = slug;
    const product = await fetchProductBySlug(productSlug);

    if (!product) {
        notFound();
    }

    return <ProductDetailContent product={product} />;
}
