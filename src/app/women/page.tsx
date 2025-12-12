import dynamic from "next/dynamic";
import HeroSlider from "@/components/HeroSlider";
import type { Metadata } from "next";
// Lazy load SubcategoryGrid to reduce initial bundle size
const SubcategoryGridDynamic = dynamic(() => import("@/components/SubcategoryGridDynamic"), {
  loading: () => <div className="min-h-[500px] bg-white animate-pulse" />,
});
import { fetchHeroSlides } from "@/lib/directus";
import { CATEGORY_DESCRIPTIONS } from "@/data/category-descriptions";
import DescriptionText from "@/components/DescriptionText";

// Metadata with hero image preload
export const metadata: Metadata = {
  title: "Women's Fashion Collection | Zecode",
  description: "Shop the latest women's fashion at Zecode. Trendy tops, elegant dresses, jeans, skirts, activewear, and ethnic fusion styles for the modern woman.",
  other: {
    // Preload hero image for faster LCP
    "link": "rel=preload href=/categories/women.jpg as=image fetchpriority=high",
  },
};

// Use ISR - revalidate every 5 minutes
export const revalidate = 300;

// 1. Western Wear Subcategories
const WESTERN_SUBCATEGORIES = [
  { title: "TOPS", slug: "tops" },
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

// 4. Shoes Subcategories
const SHOES_SUBCATEGORIES = [
  { title: "SHOES", slug: "shoes" },
];

// Define specific slide for Women's category
const WOMEN_SLIDE = [
  {
    id: 1,
    image: "/categories/women.jpg",
    title: "WOMEN'S COLLECTION",
    subtitle: "Chic Styles • Elegant Dresses • Modern Essentials",
    cta: "SHOP WOMEN",
    link: "/women",
  }
];

export default function WomenPage() {
  return (
    <div style={{ minHeight: "100%", backgroundColor: "#ffffff" }}>
      <HeroSlider slides={WOMEN_SLIDE} />

      {/* Category Description */}
      <DescriptionText text={CATEGORY_DESCRIPTIONS.women} />

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

      {/* 4. Shoes Section */}
      <SubcategoryGridDynamic
        title="Shoes"
        categorySlug="women"
        subcategories={SHOES_SUBCATEGORIES}
        variant="section"
        showDivider={true}
      />
    </div>
  );
}

