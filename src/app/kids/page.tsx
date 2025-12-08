import HeroSlider from "@/components/HeroSlider";
import SubcategoryGridDynamic from "@/components/SubcategoryGridDynamic";
import { fetchHeroSlides } from "@/lib/directus";

// Force dynamic rendering to prevent build-time API calls
// Use ISR - revalidate every 5 minutes
export const revalidate = 300;

// Define subcategories for Kids - using URL-friendly slugs
const KIDS_SUBCATEGORIES = [
  { title: "T-Shirts", slug: "tshirt" },
  { title: "Jeans", slug: "jeans" },
  { title: "Slim Jeans", slug: "slim-jeans" },
  { title: "Dresses", slug: "dress" },
  { title: "Midi Dresses", slug: "midi-dress" },
  { title: "Casual Tops", slug: "casual-top" },
  { title: "Hoodies", slug: "hoodie" },
  { title: "Tracksuits", slug: "tracksuit" },
  { title: "Sweatshirts", slug: "sweatshirt" },
  { title: "Pants", slug: "pants" },
  { title: "Slim Pants", slug: "slim-pants" },
  { title: "Jumpsuits", slug: "jumpsuit" },
  { title: "Kurtas", slug: "kurta" },
  { title: "Casual Jackets", slug: "casual-jacket" },
  { title: "Denim Jackets", slug: "denim-jacket" },
  { title: "Varsity Jackets", slug: "varsity-jacket" },
  { title: "Flats", slug: "flats" },
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

export default function KidsPage() {
  return (
    <div style={{ minHeight: "100%", backgroundColor: "#ffffff" }}>
      <HeroSlider slides={KIDS_SLIDE} />
      <SubcategoryGridDynamic
        title="Kids"
        categorySlug="kids"
        subcategories={KIDS_SUBCATEGORIES}
      />
    </div>
  );
}

