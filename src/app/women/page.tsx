import dynamic from "next/dynamic";
import HeroSlider from "@/components/HeroSlider";
// Lazy load SubcategoryGrid to reduce initial bundle size
const SubcategoryGridDynamic = dynamic(() => import("@/components/SubcategoryGridDynamic"), {
  loading: () => <div className="min-h-[500px] bg-white animate-pulse" />,
});
import { fetchHeroSlides } from "@/lib/directus";

// Force dynamic rendering to prevent build-time API calls
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

// 2. Ethnic Fusion Subcategories
const ETHNIC_SUBCATEGORIES = [
  { title: "ETHNIC FUSION", slug: "ethnic-wear" },
];

// 3. Shoes Subcategories
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

      {/* 1. Western Wear Section */}
      <SubcategoryGridDynamic
        title="Western Wear"
        categorySlug="women"
        subcategories={WESTERN_SUBCATEGORIES}
        variant="section"
      />

      {/* 2. Ethnic Fusion Section */}
      <SubcategoryGridDynamic
        title="Ethnic Fusion"
        categorySlug="women"
        subcategories={ETHNIC_SUBCATEGORIES}
        variant="section"
        showDivider={true}
      />

      {/* 3. Shoes Section */}
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

