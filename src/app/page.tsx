import HeroSlider from "@/components/HeroSlider";
import ShopByColorWrapper from "@/components/ShopByColorWrapper";
import { fetchHeroSlides } from "@/lib/directus";

// Use ISR - revalidate every 5 minutes for fresh content without cold starts
export const revalidate = 300;

export default async function Home() {
  // Fetch data from Directus (with error handling)
  let heroSlides = null;

  try {
    heroSlides = await fetchHeroSlides();
  } catch (error) {
    console.error("Failed to fetch homepage data:", error);
  }

  return (
    <div style={{ width: '100%', backgroundColor: '#ffffff', minHeight: '100%' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": "https://zecode-frontend.vercel.app/#organization",
                "name": "ZECODE",
                "url": "https://zecode-frontend.vercel.app",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://zecode-frontend.vercel.app/brand/zecode-logo.png",
                  "width": 112,
                  "height": 112
                },
                "sameAs": [
                  "https://instagram.com/zecode.kids",
                  "https://facebook.com/zecode.kids"
                ]
              },
              {
                "@type": "WebSite",
                "@id": "https://zecode-frontend.vercel.app/#website",
                "url": "https://zecode-frontend.vercel.app",
                "name": "ZECODE",
                "publisher": {
                  "@id": "https://zecode-frontend.vercel.app/#organization"
                },
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": "https://zecode-frontend.vercel.app/search?q={search_term_string}",
                  "query-input": "required name=search_term_string"
                }
              }
            ]
          })
        }}
      />
      <HeroSlider slides={heroSlides || undefined} />

      {/* Shop by Color Section - fetches products client-side */}
      <ShopByColorWrapper />
    </div>
  );
}
