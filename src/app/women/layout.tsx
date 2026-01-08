// Women's category layout with LCP optimization
import Script from "next/script";

export default function WomenLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {/* Preload hero image for faster LCP */}
            <link
                rel="preload"
                href="/local-assets/women.jpg"
                as="image"
                fetchPriority="high"
            />
            {children}
        </>
    );
}
