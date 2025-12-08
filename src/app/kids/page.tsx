import HeroSlider from "@/components/HeroSlider";
import SubcategoryGridDynamic from "@/components/SubcategoryGridDynamic";
import { fetchHeroSlides } from "@/lib/directus";

// Force dynamic rendering to prevent build-time API calls
// Use ISR - revalidate every 5 minutes
export const revalidate = 300;

// Define subcategories for Kids - using actual Directus subcategory values
const KIDS_SUBCATEGORIES = [
  { title: "T-Shirts", slug: "T-Shirt" },
  { title: "Jeans", slug: "Jeans" },
  { title: "Slim Jeans", slug: "Slim Jeans" },
  { title: "Dresses", slug: "Dress" },
  { title: "Midi Dresses", slug: "Midi Dress" },
  { title: "Casual Tops", slug: "Casual Top" },
  { title: "Hoodies", slug: "Hoodie" },
  { title: "Tracksuits", slug: "Tracksuit" },
  { title: "Sweatshirts", slug: "Sweatshirt" },
  { title: "Pants", slug: "Pants" },
  { title: "Slim Pants", slug: "Slim Pants" },
  { title: "Jumpsuits", slug: "Jumpsuit" },
  { title: "Kurtas", slug: "Kurta" },
  { title: "Casual Jackets", slug: "Casual Jacket" },
  { title: "Denim Jackets", slug: "Denim Jacket" },
  { title: "Varsity Jackets", slug: "Varsity Jacket" },
  { title: "Flats", slug: "Flats" },
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

