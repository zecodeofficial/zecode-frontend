import { fetchDirectusNavigation } from "@/lib/directus";
import Header from "./Header";
import { processNavigation, Category, QuickLink } from "@/lib/navigation";

export default async function HeaderWrapper() {
    try {
        // Fetch navigation data from Directus (cached)
        const navItems = await fetchDirectusNavigation();

        let categories: Category[] | undefined = undefined;
        let quickLinks: QuickLink[] | undefined = undefined;

        if (navItems && navItems.length > 0) {
            try {
                const processed = processNavigation(navItems);
                categories = processed.categories;
                quickLinks = processed.quickLinks;
            } catch (error) {
                console.error("Error processing navigation:", error);
                // Fall back to defaults (undefined will use defaults in Header)
            }
        }

        return <Header initialCategories={categories} initialQuickLinks={quickLinks} />;
    } catch (error) {
        console.error("Error in HeaderWrapper:", error);
        // Return header with defaults if fetch fails
        return <Header />;
    }
}
