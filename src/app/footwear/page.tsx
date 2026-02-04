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

// Define subcategories for Footwear - Men
const MEN_FOOTWEAR_SUBCATEGORIES = [
  { title: "SNEAKERS", slug: "sneakers", href: "/footwear/sneakers/men" },
  { title: "SLIDES", slug: "slides", href: "/footwear/slides/men" },
  { title: "CLOGS", slug: "clogs", href: "/footwear/clogs/men" },
  { title: "SANDALS", slug: "sandals", href: "/footwear/sandals/men" },
  { title: "FLIP-FLOPS", slug: "flip-flops", href: "/footwear/flip-flops/men" },
];

// Define subcategories for Footwear - Women
const WOMEN_FOOTWEAR_SUBCATEGORIES = [
  { title: "FLATS", slug: "flats", href: "/footwear/flats/women" },
  { title: "SANDALS", slug: "sandals", href: "/footwear/sandals/women" },
  { title: "SLIDES", slug: "slides", href: "/footwear/slides/women" },
  { title: "FLIP-FLOPS", slug: "flip-flops", href: "/footwear/flip-flops/women" },
  { title: "HEELS", slug: "heels", href: "/footwear/heels/women" },
  { title: "MULES", slug: "mules", href: "/footwear/mules/women" },
  { title: "SNEAKERS", slug: "sneakers", href: "/footwear/sneakers/women" },
];

// Define specific slide for Footwear category
const FOOTWEAR_SLIDE: HeroSlide[] = [
  {
    id: 1,
    image: "/local-assets/hero_footwear_indian.png",
    title: "FOOTWEAR COLLECTION",
    subtitle: "Step Up Your Style • Comfort Meets Fashion • Walk With Confidence",
    cta: "SHOP FOOTWEAR",
    link: "/footwear",
    variant: 'split',
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

      {/* Men's Footwear Section */}
      <SubcategoryGridDynamic
        title="MEN'S FOOTWEAR"
        categorySlug="footwear"
        subcategories={MEN_FOOTWEAR_SUBCATEGORIES}
        variant="section"
        forcedGender="Men"
      />

      {/* Women's Footwear Section */}
      <SubcategoryGridDynamic
        title="WOMEN'S FOOTWEAR"
        categorySlug="footwear"
        subcategories={WOMEN_FOOTWEAR_SUBCATEGORIES}
        variant="section"
        showDivider={true}
        forcedGender="Women"
      />
    </div>
  );
}

