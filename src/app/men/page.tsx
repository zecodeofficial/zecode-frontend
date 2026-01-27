import HeroSlider from "@/components/HeroSlider";
import SubcategoryGridDynamic from "@/components/SubcategoryGridDynamic";
import { fetchCategoryBySlug } from "@/lib/directus";
import { CATEGORY_DESCRIPTIONS } from "@/data/category-descriptions";
import DescriptionText from "@/components/DescriptionText";
import type { Metadata } from "next";
import { type HeroSlide } from "@/lib/directus";

// Force dynamic rendering to prevent build-time API calls
// Use ISR - revalidate every 5 minutes
export const revalidate = 300;

// Define subcategories for Men
const MEN_SUBCATEGORIES = [
  { title: "T-Shirts", slug: "tshirts" },
  { title: "Shirts", slug: "shirts" },
  { title: "Jeans", slug: "jeans" },
  { title: "Jackets", slug: "jackets" },
];

// Define specific slide for Men's category
const MEN_SLIDE: HeroSlide[] = [
  {
    id: 1,
    image: "/local-assets/hero_men_indian.png",
    title: "MEN'S COLLECTION",
    subtitle: "Bold Streetwear • Casual Essentials • Urban Edge",
    cta: "SHOP MEN",
    link: "/men",
    variant: 'split'
  }
];

export async function generateMetadata(): Promise<Metadata> {
  const category = await fetchCategoryBySlug("men");
  const title = category?.seo_title || "Men's Fashion Collection | Zecode";
  const description = category?.seo_description || CATEGORY_DESCRIPTIONS.men.slice(0, 160);

  return {
    title,
    description,
    alternates: {
      canonical: category?.canonical_url || "/men",
    },
    openGraph: {
      title,
      description,
      url: "/men",
      type: "website",
    },
  };
}

export default async function MenPage() {
  const category = await fetchCategoryBySlug("men");
  const description = category?.description || CATEGORY_DESCRIPTIONS.men;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": category?.title || "Men's Collection",
    "description": description?.slice(0, 160),
    "url": "https://zecode-frontend.vercel.app/men",
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://zecode-frontend.vercel.app" },
        { "@type": "ListItem", "position": 2, "name": "Men", "item": "https://zecode-frontend.vercel.app/men" }
      ]
    }
  };

  return (
    <div style={{ minHeight: "100%", backgroundColor: "#ffffff" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HeroSlider slides={MEN_SLIDE} />

      {/* Category Description */}
      <DescriptionText text={description} />

      <SubcategoryGridDynamic
        title="Men"
        categorySlug="men"
        subcategories={MEN_SUBCATEGORIES}
      />
    </div>
  );
}

