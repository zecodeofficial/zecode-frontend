import { DirectusNavigationItem } from "@/lib/directus";

export type Subcategory = {
  label: string;
  href: string;
  type?: "section" | "link";
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

export function processNavigation(
  items: DirectusNavigationItem[],
): { categories: Category[]; quickLinks: QuickLink[] } {
  const categories: Category[] = [];
  const quickLinks: QuickLink[] = [];

  const parentItems = items.filter((item) => item.parent === null);

  parentItems.forEach((parent) => {
    const isCategory = ["MEN", "WOMEN", "KIDS", "FOOTWEAR"].includes(
      parent.label.toUpperCase(),
    );

    if (isCategory) {
      const children = items
        .filter((item) => item.parent === parent.id)
        .sort((a, b) => (a.sort || 0) - (b.sort || 0))
        .map((child) => ({
          label: child.label,
          href: child.href,
        }));

      categories.push({
        href: parent.href,
        label: parent.label.toUpperCase(),
        subcategories: children,
      });
    } else {
      quickLinks.push({
        href: parent.href,
        label: parent.label.toUpperCase(),
        icon: parent.icon || (parent.highlight ? "🔥" : undefined),
        highlight: parent.highlight || false,
      });
    }
  });

  categories.sort((a, b) => {
    const aItem = parentItems.find((p) => p.label.toUpperCase() === a.label);
    const bItem = parentItems.find((p) => p.label.toUpperCase() === b.label);
    return (aItem?.sort || 0) - (bItem?.sort || 0);
  });

  return { categories, quickLinks };
}
