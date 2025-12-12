import HeroSlider from "@/components/HeroSlider";
import SubcategoryGridDynamic from "@/components/SubcategoryGridDynamic";
import { fetchCategoryBySlug } from "@/lib/directus";
import { CATEGORY_DESCRIPTIONS } from "@/data/category-descriptions";
import DescriptionText from "@/components/DescriptionText";
import type { Metadata } from "next";

// Force dynamic rendering to prevent build-time API calls
// Use ISR - revalidate every 5 minutes
export const revalidate = 300;

// Define subcategories for Footwear - by gender
const FOOTWEAR_SUBCATEGORIES = [
  { title: "Men's Footwear", slug: "men" },
  { title: "Women's Footwear", slug: "women" },
];

// Define specific slide for Footwear category
const FOOTWEAR_SLIDE = [
  {
    id: 1,
    image: "/categories/footwear_collage.jpg",
    title: "FOOTWEAR COLLECTION",
    subtitle: "Step Up Your Style • Comfort Meets Fashion • Walk With Confidence",
    cta: "SHOP FOOTWEAR",
    link: "/footwear",
  }
];

export async function generateMetadata(): Promise<Metadata> {
  const category = await fetchCategoryBySlug("footwear");
  const title = category?.seo_title || "Premium Footwear Collection | Zecode";
  const description = category?.seo_description || CATEGORY_DESCRIPTIONS.footwear.slice(0, 160);

  return {
    title,
    description,
    alternates: {
      canonical: category?.canonical_url || "/footwear",
    },
    openGraph: {
      title,
      description,
      url: "/footwear",
      type: "website",
    },
  };
}

export default async function FootwearPage() {
  const category = await fetchCategoryBySlug("footwear");
  const description = category?.description || CATEGORY_DESCRIPTIONS.footwear;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": category?.title || "Footwear Collection",
    "description": description?.slice(0, 160),
    "url": "https://zecode-frontend.vercel.app/footwear",
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://zecode-frontend.vercel.app" },
        { "@type": "ListItem", "position": 2, "name": "Footwear", "item": "https://zecode-frontend.vercel.app/footwear" }
      ]
    }
  };

  return (
    <div style={{ minHeight: "100%", backgroundColor: "#ffffff" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HeroSlider slides={FOOTWEAR_SLIDE} />

      {/* Category Description */}
      <DescriptionText text={description} />

      <SubcategoryGridDynamic
        title="Footwear"
        categorySlug="footwear"
        subcategories={FOOTWEAR_SUBCATEGORIES}
      />
    </div>
  );
}

