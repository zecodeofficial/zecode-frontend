import { DirectusNavigationItem } from "./directus";

export type Subcategory = {
  label: string;
  href: string;
  type?: 'section' | 'link';
  items?: { label: string; href: string }[];
};

export type Category = {
  href: string;
  label: string;
  subcategories: Subcategory[];
};

export type QuickLink = {
  href: string;
  label: string;
  icon?: string;
  highlight?: boolean;
};

// Helper to process CMS navigation data into categories and quick links
export function processNavigation(items: DirectusNavigationItem[]): { categories: Category[]; quickLinks: QuickLink[] } {
  const categories: Category[] = [];
  const quickLinks: QuickLink[] = [];
  const seenCategories = new Set<string>();
  const seenQuickLinks = new Set<string>();

  // First, find all parent items (parent === null) and deduplicate by href
  const parentItems = items.filter(item => item.parent === null);
  
  // Deduplicate parent items by href (keep first occurrence)
  const uniqueParentItems = parentItems.filter((item, index, self) => 
    index === self.findIndex(p => p.href === item.href)
  );

  uniqueParentItems.forEach(parent => {
    const isCategory = ["MEN", "WOMEN", "KIDS", "FOOTWEAR"].includes(parent.label.toUpperCase());

    if (isCategory) {
      // Skip if we've already added this category
      if (seenCategories.has(parent.href)) {
        return;
      }
      seenCategories.add(parent.href);

      const children = items
        .filter(item => item.parent === parent.id)
        .sort((a, b) => (a.sort || 0) - (b.sort || 0))
        // Deduplicate children by href
        .filter((child, index, self) => 
          index === self.findIndex(c => c.href === child.href)
        )
        .map(child => {
           const grandChildren = items
             .filter(item => item.parent === child.id)
             .sort((a, b) => (a.sort || 0) - (b.sort || 0))
             // Deduplicate grandchildren by href
             .filter((grandChild, index, self) => 
               index === self.findIndex(gc => gc.href === grandChild.href)
             )
             .map(grandChild => ({
               label: grandChild.label,
               href: grandChild.href,
             }));

           return {
             label: child.label,
             href: child.href,
             type: grandChildren.length > 0 ? 'section' as const : undefined,
             items: grandChildren.length > 0 ? grandChildren : undefined,
           };
        });

      categories.push({
        href: parent.href,
        label: parent.label.toUpperCase(),
        subcategories: children,
      });
    } else {
      // Skip if we've already added this quick link
      if (seenQuickLinks.has(parent.href)) {
        return;
      }
      seenQuickLinks.add(parent.href);

      quickLinks.push({
        href: parent.href,
        label: parent.label.toUpperCase(),
        icon: parent.icon || (parent.highlight ? "🔥" : undefined),
        highlight: parent.highlight || false,
      });
    }
  });

  // Sort categories by their sort order
  categories.sort((a, b) => {
    const aItem = uniqueParentItems.find(p => p.label.toUpperCase() === a.label);
    const bItem = uniqueParentItems.find(p => p.label.toUpperCase() === b.label);
    return (aItem?.sort || 0) - (bItem?.sort || 0);
  });

  return { categories, quickLinks };
}
