import { fetchDirectusNavigation, fetchActiveColors } from "@/lib/directus";
import Header from "./Header";
import { processNavigation, Category, QuickLink } from "@/lib/navigation";

export default async function HeaderWrapper() {
    try {
        const [navItems, activeColors] = await Promise.all([
            fetchDirectusNavigation(),
            fetchActiveColors()
        ]);

        let categories: Category[] | undefined = undefined;
        let quickLinks: QuickLink[] | undefined = undefined;

        if (navItems && navItems.length > 0) {
            try {
                const processed = processNavigation(navItems);
                categories = processed.categories;
                quickLinks = processed.quickLinks;

                // Inject dynamic colors into the COLORS category
                const colorCategory = categories.find(c => c.label === "COLORS");
                if (colorCategory && activeColors && activeColors.length > 0) {
                    colorCategory.subcategories = activeColors.map((color: string) => ({
                        label: color.toUpperCase(),
                        href: `/shop-by-colour/${color.toLowerCase()}`,
                        type: 'link'
                    }));
                }
            } catch (error) {
                console.error("Error processing navigation:", error);
            }
        }

        return <Header initialCategories={categories} initialQuickLinks={quickLinks} />;
    } catch (error) {
        console.error("Error in HeaderWrapper:", error);
        // Return header with defaults if fetch fails
        return <Header />;
    }
}
