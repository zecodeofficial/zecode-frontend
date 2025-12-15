import { fetchDirectusNavigation } from "@/lib/directus";
import Header from "./Header";
import { processNavigation, Category, QuickLink } from "@/lib/navigation";

export default async function HeaderWrapper() {
    // Fetch navigation data from Directus (cached)
    const navItems = await fetchDirectusNavigation();

    let categories: Category[] | undefined = undefined;
    let quickLinks: QuickLink[] | undefined = undefined;

    if (navItems && navItems.length > 0) {
        const processed = processNavigation(navItems);
        categories = processed.categories;
        quickLinks = processed.quickLinks;
    }

    return <Header initialCategories={categories} initialQuickLinks={quickLinks} />;
}
