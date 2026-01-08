
import {
  fetchFooterLinkGroups,
  fetchFooterLinks,
  fetchDirectusSocialLinks,
  fetchDirectusFooterSettings,
  fetchProductCounts,
  FooterLinkGroup,
  FooterLink,
  DirectusSocialLink,
  DirectusFooterSettings
} from "@/lib/directus";
import FooterClient from "./FooterClient";

// Mapping from URL slugs to CMS subcategory values for proper matching
const SLUG_TO_CMS_SUBCATEGORY: Record<string, string[]> = {
  // Men
  'tshirts': ['t', 'tshirt', 't-shirt'],
  'shirts': ['shirt'],
  'jeans': ['jean', 'jeans'],
  'trousers': ['trouser', 'trousers', 'pants', 'pant'],
  'jackets': ['jacket', 'outerwear'],
  'shoes': ['shoe', 'flats', 'flat'],
  // Women
  'tops': ['top', 'tops'],
  'dresses': ['dress', 'dresses'],
  'skirts': ['skirt', 'skirts'],
  // Kids - special mappings
  'boys-tshirts': ['t', 'tshirt', 't-shirt'],
  'girls-tops': ['top', 'tops'],
  'boys-jeans': ['bottom', 'bottoms', 'jean', 'jeans'],
  'girls-dresses': ['dress', 'dresses'],
  // Footwear - gender-based subcategories
  'men': ['flats', 'flat', 'mules', 'mule', 'sneakers', 'sneaker', 'boots', 'boot', 'loafers', 'loafer', 'sandals', 'sandal'],
  'women': ['flats', 'flat', 'mules', 'mule', 'heels', 'heel', 'sandals', 'sandal', 'boots', 'boot', 'sneakers', 'sneaker'],
};

// Default fallback data
const DEFAULT_LINK_GROUPS = [
  { id: 1, title: "Categories", sort: 1 },
  { id: 2, title: "Quick Links", sort: 2 },
];

const DEFAULT_LINKS: FooterLink[] = [
  { id: 1, label: "Men", href: "/men", group: 1, sort: 1, status: "published" },
  { id: 2, label: "Women", href: "/women", group: 1, sort: 2, status: "published" },
  { id: 3, label: "Kids", href: "/kids", group: 1, sort: 3, status: "published" },
  { id: 7, label: "Footwear", href: "/footwear", group: 1, sort: 4, status: "published" },
  { id: 4, label: "About Us", href: "/about", group: 2, sort: 1, status: "published" },
  { id: 5, label: "Store Locator", href: "/store-locator-map", group: 2, sort: 2, status: "published" },
  { id: 6, label: "LIT ZONE", href: "/lit-zone", group: 2, sort: 3, status: "published" },
];

const DEFAULT_SOCIALS: DirectusSocialLink[] = [
  { id: 1, platform: "facebook", url: "https://www.facebook.com/zecodeindia", sort: 1, status: "published" },
  { id: 2, platform: "instagram", url: "https://www.instagram.com/zecodeindia", sort: 2, status: "published" },
  { id: 3, platform: "twitter", url: "https://x.com/zecodeindia", sort: 3, status: "published" },
  { id: 4, platform: "youtube", url: "https://www.youtube.com/@zecodeindia", sort: 4, status: "published" },
  { id: 5, platform: "threads", url: "https://www.threads.net/@zecodeindia", sort: 5, status: "published" },
];

const DEFAULT_FOOTER_SETTINGS: DirectusFooterSettings = {
  id: 1,
  copyright_text: "2025 ZECODE. All Rights Reserved.",
  newsletter_title: "Newsletter",
  newsletter_subtitle: "Get exclusive offers & updates",
  newsletter_enabled: true,
};

export default async function Footer() {
  // Fetch footer data from CMS (Server Side)
  const [groups, fetchedFooterLinks, socials, settings, counts] = await Promise.all([
    fetchFooterLinkGroups(),
    fetchFooterLinks(),
    fetchDirectusSocialLinks(),
    fetchDirectusFooterSettings(),
    fetchProductCounts(),
  ]);

  let links = fetchedFooterLinks && fetchedFooterLinks.length > 0 ? fetchedFooterLinks : DEFAULT_LINKS;

  // Filter links based on product counts (Server Side Logic)
  // Only apply filtering if we have valid product counts
  if (Array.isArray(counts) && counts.length > 0 && fetchedFooterLinks && fetchedFooterLinks.length > 0) {
    // Normalize CMS subcategory: lowercase, remove non-alphanum
    const normalizeCmsSub = (s?: string | null) => {
      if (!s) return "";
      return s.toString().toLowerCase().replace(/[^a-z0-9]/g, "");
    };

    // Build a map of gender||normalizedSub -> count (only counts > 0)
    const countsByGenderSub = new Map<string, number>();
    const availableGenders = new Set<string>();
    counts.forEach(c => {
      const count = c.count || 0;
      if (count <= 0) return; // Skip subcategories with 0 products

      const gender = (c.gender_category || "").toString().toLowerCase();
      const sub = normalizeCmsSub(c.subcategory || "");
      const key = `${gender}||${sub}`;
      countsByGenderSub.set(key, (countsByGenderSub.get(key) || 0) + count);
      if (gender) availableGenders.add(gender);
    });

    // Helper to check if a link's subcategory has products
    const hasProducts = (gender: string, slug: string) => {
      const cmsMappings = SLUG_TO_CMS_SUBCATEGORY[slug] || [normalizeCmsSub(slug)];
      return cmsMappings.some(cmsVal => {
        const key = `${gender}||${cmsVal}`;
        return (countsByGenderSub.get(key) || 0) > 0;
      });
    };

    // Helper to check if footwear category has any products
    const hasFootwearProducts = () => {
      const footwearTypes = ['flats', 'flat', 'mules', 'mule', 'heels', 'heel', 'sandals', 'sandal', 'boots', 'boot', 'sneakers', 'sneaker', 'loafers', 'loafer'];
      const hasMensFootwear = footwearTypes.some(type => (countsByGenderSub.get(`men||${type}`) || 0) > 0);
      const hasWomensFootwear = footwearTypes.some(type => (countsByGenderSub.get(`women||${type}`) || 0) > 0);
      return hasMensFootwear || hasWomensFootwear;
    };

    const filtered = fetchedFooterLinks.filter(link => {
      // Keep non-category quick links as-is
      if (!link.href.startsWith('/men') && !link.href.startsWith('/women') && !link.href.startsWith('/kids') && !link.href.startsWith('/footwear')) return true;

      // Special handling for footwear category
      if (link.href.startsWith('/footwear')) {
        return hasFootwearProducts();
      }

      // For top-level category links like '/men', '/women', '/kids' - use exact gender match
      const parts = link.href.split('/').filter(Boolean);
      const gender = (parts[0] || '').toLowerCase();
      if (parts.length === 1) {
        // Check if this gender has any products
        return availableGenders.has(gender);
      }

      // For deeper links like /men/tshirts, check using the slug mapping
      const slug = parts.slice(1).join('-');
      return hasProducts(gender, slug);
    });

    // Ensure Footwear link is always included if it has products or if it was in default
    const hasFootwearLink = filtered.some(link => link.href === '/footwear');

    if (!hasFootwearLink && hasFootwearProducts()) {
      // Try to find original link or fallback
      const originalFootwear = fetchedFooterLinks.find(link => link.href === '/footwear') || DEFAULT_LINKS.find(link => link.href === '/footwear');
      if (originalFootwear) {
        links = [...filtered, originalFootwear];
      } else {
        links = filtered;
      }
    } else if (!hasFootwearLink && !hasFootwearProducts()) {
      // If no products, we don't add it. But check if it was missing just because filtering removed it incorrectly?
      // Logic above is correct. If no products, it should be hidden essentially.
      // However, default behavior was:
      // "If no product counts - ensure Footwear is included"
      // Here we HAVE product counts. So hiding it is correct behavior.
      links = filtered;
    } else {
      links = filtered;
    }
  } else {
    // Fallback logic when no counts available: Ensure Footwear is there if it exists in source
    if (fetchedFooterLinks && fetchedFooterLinks.length > 0) {
      const hasFootwearLink = fetchedFooterLinks.some(link => link.href === '/footwear');
      if (!hasFootwearLink) {
        const defaultFootwearLink = DEFAULT_LINKS.find(link => link.href === '/footwear');
        if (defaultFootwearLink) {
          links = [...fetchedFooterLinks, defaultFootwearLink];
        }
      }
    }
  }

  const finalLinkGroups = (groups && groups.length > 0) ? groups : DEFAULT_LINK_GROUPS;
  const finalSocials = (socials && socials.length > 0) ? socials : DEFAULT_SOCIALS;
  const finalSettings = settings || DEFAULT_FOOTER_SETTINGS;

  return (
    <FooterClient
      linkGroups={finalLinkGroups}
      links={links}
      socialLinks={finalSocials}
      footerSettings={finalSettings}
    />
  );
}
