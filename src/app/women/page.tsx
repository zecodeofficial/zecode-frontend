import dynamic from "next/dynamic";
import HeroSlider from "@/components/HeroSlider";
import type { Metadata } from "next";
import { fetchCategoryBySlug, type HeroSlide } from "@/lib/directus";
// Lazy load SubcategoryGrid to reduce initial bundle size
const SubcategoryGridDynamic = dynamic(() => import("@/components/SubcategoryGridDynamic"), {
  loading: () => <div className="min-h-[500px] bg-white animate-pulse" />,
});

import { CATEGORY_DESCRIPTIONS } from "@/data/category-descriptions";
import DescriptionText from "@/components/DescriptionText";

// Metadata with hero image preload
export async function generateMetadata(): Promise<Metadata> {
  const category = await fetchCategoryBySlug("women");
  const title = category?.seo_title || "Women's Fashion Collection | Zecode";
  const description = category?.seo_description || "Shop the latest women's fashion at Zecode. Trendy tops, elegant dresses, jeans, skirts, activewear, and ethnic fusion styles for the modern woman.";

  return {
    title,
    description,
    other: {
      "link": "rel=preload href=/local-assets/women.jpg as=image fetchpriority=high",
    },
    alternates: {
      canonical: category?.canonical_url || "/women",
    },
    openGraph: {
      title,
      description,
      url: "/women",
      type: "website",
    },
  };
}

// Use ISR - revalidate every 5 minutes
export const revalidate = 300;

// 1. Western Wear Subcategories
const WESTERN_SUBCATEGORIES = [
  { title: "TOPS", slug: "tops" },
  { title: "T-SHIRTS", slug: "tshirts" },
  { title: "DRESSES", slug: "dresses" },
  { title: "JEANS", slug: "jeans" },
  { title: "SKIRTS", slug: "skirts" },
  { title: "JACKETS", slug: "jackets" },
  { title: "SHORTS", slug: "shorts" },
];

// 2. Activewear Subcategories
const ACTIVEWEAR_SUBCATEGORIES = [
  { title: "ACTIVEWEAR", slug: "activewear" },
];

// 3. Ethnic Fusion Subcategories
const ETHNIC_SUBCATEGORIES = [
  { title: "ETHNIC FUSION", slug: "ethnic-wear" },
];


// Define specific slide for Women's category
const WOMEN_SLIDE: HeroSlide[] = [
  {
    id: 1,
    image: "/local-assets/hero_women_indian.png",
    title: "WOMEN'S COLLECTION",
    subtitle: "Chic Styles • Elegant Dresses • Modern Essentials",
    cta: "SHOP WOMEN",
    link: "/women",
    variant: 'split'
  }
];

export default async function WomenPage() {
  const category = await fetchCategoryBySlug("women");
  const description = category?.description || CATEGORY_DESCRIPTIONS.women;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": category?.title || "Women's Collection",
    "description": description?.slice(0, 160),
    "url": "https://zecode-frontend.vercel.app/women",
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://zecode-frontend.vercel.app" },
        { "@type": "ListItem", "position": 2, "name": "Women", "item": "https://zecode-frontend.vercel.app/women" }
      ]
    }
  };

  return (
    <div style={{ minHeight: "100%", backgroundColor: "#ffffff" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HeroSlider slides={WOMEN_SLIDE} />

      {/* Category Description */}
      <DescriptionText text={description} />

      {/* 1. Western Wear Section */}
      <SubcategoryGridDynamic
        title="Western Wear"
        categorySlug="women"
        subcategories={WESTERN_SUBCATEGORIES}
        variant="section"
      />

      {/* 2. Activewear Section */}
      <SubcategoryGridDynamic
        title="Activewear"
        categorySlug="women"
        subcategories={ACTIVEWEAR_SUBCATEGORIES}
        variant="section"
        showDivider={true}
      />

      {/* 3. Ethnic Fusion Section */}
      <SubcategoryGridDynamic
        title="Ethnic Fusion"
        categorySlug="women"
        subcategories={ETHNIC_SUBCATEGORIES}
        variant="section"
        showDivider={true}
      />

    </div>
  );
}

