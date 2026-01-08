import type { Metadata } from "next";
import StoreLocatorClient from "@/components/StoreLocatorClient";

export const metadata: Metadata = {
    title: "Store Locator | Zecode",
    description: "Find a Zecode store near you. Experience our collections in person at one of our many locations.",
    openGraph: {
        title: "Store Locator | Zecode",
        description: "Find a Zecode store near you. Experience our collections in person at one of our many locations.",
        url: "/store-locator",
        type: "website",
    },
    alternates: {
        canonical: "/store-locator",
    },
};

export default function StoreLocatorPage() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Store Locator",
        "description": "Find a Zecode store near you.",
        "url": "https://zecode-frontend.vercel.app/store-locator"
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <StoreLocatorClient />
        </>
    );
}
