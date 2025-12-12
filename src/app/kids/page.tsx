import HeroSlider from "@/components/HeroSlider";
import SubcategoryGridDynamic from "@/components/SubcategoryGridDynamic";
import { fetchCategoryBySlug } from "@/lib/directus";
import { CATEGORY_DESCRIPTIONS } from "@/data/category-descriptions";
import DescriptionText from "@/components/DescriptionText";
import type { Metadata } from "next";

// Force dynamic rendering to prevent build-time API calls
// Use ISR - revalidate every 5 minutes
export const revalidate = 300;

// Define subcategories for Kids - matching header menu
const KIDS_SUBCATEGORIES = [
  { title: "Boys T-Shirts", slug: "boys-tshirts" },
  { title: "Girls Tops", slug: "girls-tops" },
  { title: "Boys Jeans", slug: "boys-jeans" },
  { title: "Girls Dresses", slug: "girls-dresses" },
];

// Define specific slide for Kids' category
const KIDS_SLIDE = [
  {
    id: 1,
    image: "/categories/kids.jpg",
    title: "KIDS' COLLECTION",
    subtitle: "Playful Styles • Comfortable Fits • Fun Designs",
    cta: "SHOP KIDS",
    link: "/kids",
  }
];

export async function generateMetadata(): Promise<Metadata> {
  const category = await fetchCategoryBySlug("kids");
  const title = category?.seo_title || "Kids' Fashion Collection | Zecode";
  const description = category?.seo_description || CATEGORY_DESCRIPTIONS.kids.slice(0, 160);

  return {
    title,
    description,
    alternates: {
      canonical: category?.canonical_url || "/kids",
    },
    openGraph: {
      title,
      description,
      url: "/kids",
      type: "website",
    },
  };
}

export default async function KidsPage() {
  const category = await fetchCategoryBySlug("kids");
  const description = category?.description || CATEGORY_DESCRIPTIONS.kids;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": category?.title || "Kids' Collection",
    "description": description?.slice(0, 160),
    "url": "https://zecode-frontend.vercel.app/kids",
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://zecode-frontend.vercel.app" },
        { "@type": "ListItem", "position": 2, "name": "Kids", "item": "https://zecode-frontend.vercel.app/kids" }
      ]
    }
  };

  return (
    <div style={{ minHeight: "100%", backgroundColor: "#ffffff" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HeroSlider slides={KIDS_SLIDE} />

      {/* Category Description */}
      <DescriptionText text={description} />

      <SubcategoryGridDynamic
        title="Kids"
        categorySlug="kids"
        subcategories={KIDS_SUBCATEGORIES}
      />
    </div>
  );
}

