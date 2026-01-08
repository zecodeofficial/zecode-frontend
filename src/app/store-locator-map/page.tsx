import type { Metadata } from "next";
import StoreLocatorMapClient from "@/components/StoreLocatorMapClient";

export const metadata: Metadata = {
    title: "Store Map | Zecode",
    description: "View Zecode store locations on an interactive map.",
    openGraph: {
        title: "Store Map | Zecode",
        description: "View Zecode store locations on an interactive map.",
        url: "/store-locator-map",
        type: "website",
    },
    alternates: {
        canonical: "/store-locator-map",
    },
};

export default function StoreLocatorMapPage() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Store Map",
        "description": "View Zecode store locations on an interactive map.",
        "url": "https://zecode-frontend.vercel.app/store-locator-map"
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <StoreLocatorMapClient />
        </>
    );
}
