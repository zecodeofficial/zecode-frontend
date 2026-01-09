import Header, { DEFAULT_CATEGORIES, DEFAULT_QUICK_LINKS } from "./Header";
import { processNavigation, Category, QuickLink } from "@/lib/navigation";
import { fetchDirectusNavigation, fetchActiveColors } from "@/lib/directus";

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
            } catch (error) {
                console.error("Error processing navigation:", error);
            }
        }

        // If no categories from CMS, use defaults so we can still inject dynamic colors
        if (!categories) {
            // Using JSON stringify/parse for a deep copy to avoid mutations affecting subsequent renders
            categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
            quickLinks = JSON.parse(JSON.stringify(DEFAULT_QUICK_LINKS));
        }

        if (categories) {
            // Inject dynamic colors into the COLORS/SHOP BY COLOUR category
            const colorCategory = categories.find(c =>
                c.label.toUpperCase() === "COLORS" ||
                c.label.toUpperCase() === "SHOP BY COLOUR" ||
                c.href.includes("shop-by-colour")
            );

            if (colorCategory) {
                if (activeColors && activeColors.length > 0) {
                    colorCategory.subcategories = activeColors.map((color: string) => ({
                        label: color.toUpperCase(),
                        href: `/shop-by-colour/${color.toLowerCase()}`,
                        type: 'link'
                    }));
                } else {
                    // If no active colors, clear the subcategories so we don't show empty links/defaults
                    colorCategory.subcategories = [];
                }
            }
        }

        return <Header initialCategories={categories} initialQuickLinks={quickLinks} />;
    } catch (error) {
        console.error("Error in HeaderWrapper:", error);
        // Return header with defaults if fetch fails
        return <Header />;
    }
}
