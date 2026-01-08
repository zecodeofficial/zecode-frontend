import { MetadataRoute } from "next";
import { fetchProducts, fetchCategories, fetchStores } from "@/lib/directus";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = "https://zecode-frontend.vercel.app";

    // 1. Static Routes
    const staticRoutes = [
        "",
        "/about",
        "/store-locator",
        "/store-locator-map",
        "/men",
        "/women",
        "/kids",
        "/footwear",
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: route === "" ? 1 : 0.8,
    }));

    // 2. Fetch Data concurrently
    const [products, categories, stores] = await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchStores(),
    ]);

    // 3. Product Routes
    const productRoutes = (products || []).map((product) => ({
        url: `${baseUrl}/product/${product.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
    }));

    // 4. Category & Subcategory Routes
    // Note: /men, /women etc are already in static routes.
    // We need to add subcategory routes like /men/t-shirts
    const categoryRoutes: MetadataRoute.Sitemap = [];

    if (categories) {
        categories.forEach((cat) => {
            // Add main category link (e.g. /category/men if that structure existed, 
            // but here we use /men which is static. If dynamic categories exist at root level 
            // other than the main 4, we might add them, but usually they match.)

            // Add subcategories
            if (cat.subcategories) {
                cat.subcategories.forEach((sub) => {
                    // We need to know which parent gender/category this belongs to.
                    // In this app, routes are /men/[sub], /women/[sub].
                    // The API categories might simply be "Men", "Women".
                    // Let's normalize the parent slug.
                    const parentSlug = cat.slug.toLowerCase();
                    // Only add if it's one of our main route bases
                    if (['men', 'women', 'kids', 'footwear'].includes(parentSlug)) {
                        categoryRoutes.push({
                            url: `${baseUrl}/${parentSlug}/${sub.slug}`,
                            lastModified: new Date(),
                            changeFrequency: "weekly" as const,
                            priority: 0.8,
                        });
                    }
                });
            }
        });
    }

    // 5. Store Routes
    const storeRoutes = (stores || []).map((store) => ({
        url: `${baseUrl}/store/${store.id}`, // using ID as slug based on store pages check
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.6,
    }));

    return [
        ...staticRoutes,
        ...categoryRoutes,
        ...productRoutes,
        ...storeRoutes,
    ];
}
