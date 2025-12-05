/*
 * mock-data.ts — DEPRECATED
 * This project previously embedded MOCK_DATA in source. All live pages/components
 * should now use Directus fetch helpers in src/lib/directus.ts. Keep this file
 * around only as a deprecated placeholder until it can be removed safely.
 */

export const MOCK_DATA = {
    header: { links: [] },
    hero: { title: '', subtitle: '', image: '', cta: '' },
    categories: [],
    products: []
                {
                    id: 11,
                    title: "T-SHIRTS",
                    image: "/categories/men-tshirts.png",
                    link: "/men/tshirts",
                },
                {
                    id: 12,
                    title: "SHIRTS",
                    image: "/categories/men-shirts.png",
                    link: "/men/shirts",
                },
                {
                    id: 13,
                    title: "JEANS",
                    image: "/categories/men-jeans.png",
                    link: "/men/jeans",
                },
                {
                    id: 14,
                    title: "TROUSERS",
                    image: "/categories/men-trousers.png",
                    link: "/men/trousers",
                },
                {
                    id: 15,
                    title: "JACKETS",
                    image: "/categories/men-jackets.png",
                    link: "/men/jackets",
                },
                {
                    id: 16,
                    title: "SHOES",
                    image: "/categories/men-shoes.png",
                    link: "/men/shoes",
                },
            ],
        },
        {
            id: 2,
            title: "WOMEN",
            image: "/categories/women.png",
            link: "/women",
            subcategories: [
                {
                    id: 21,
                    title: "TOPS",
                    image: "/categories/women-tops.png",
                    link: "/women/tops",
                },
                {
                    id: 22,
                    title: "DRESSES",
                    image: "/categories/women-dresses.png",
                    link: "/women/dresses",
                },
                {
                    id: 23,
                    title: "JEANS",
                    image: "/categories/women-jeans.png",
                    link: "/women/jeans",
                },
                {
                    id: 24,
                    title: "SKIRTS",
                    image: "/categories/women-skirts.png",
                    link: "/women/skirts",
                },
                {
                    id: 25,
                    title: "JACKETS",
                    image: "/categories/women-jackets.png",
                    link: "/women/jackets",
                },
                {
                    id: 26,
                    title: "SHOES",
                    image: "/categories/women-shoes.png",
                    link: "/women/shoes",
                },
            ],
        },
        {
            id: 3,
            title: "KIDS",
            image: "/categories/kids.png",
            link: "/kids",
            subcategories: [
                {
                    id: 31,
                    title: "BOYS T-SHIRTS",
                    image: "/categories/kids-boys-tshirts.png",
                    link: "/kids/boys-tshirts",
                },
                {
                    id: 32,
                    title: "GIRLS TOPS",
                    image: "/categories/kids-girls-tops.png",
                    link: "/kids/girls-tops",
                },
                {
                    id: 33,
                    title: "BOYS JEANS",
                    image: "/categories/kids-boys-jeans.png",
                    link: "/kids/boys-jeans",
                },
                {
                    id: 34,
                    title: "GIRLS DRESSES",
                    image: "/categories/kids-girls-dresses.png",
                    link: "/kids/girls-dresses",
                },
                {
                    id: 35,
                    title: "JACKETS",
                    image: "/categories/kids-jackets.png",
                    link: "/kids/jackets",
                },
                {
                    id: 36,
                    title: "SHOES",
                    image: "/categories/kids-shoes.png",
                    link: "/kids/shoes",
                },
            ],
        },
    ],
    footer: {
        links: [
            { label: "About Us", href: "/about" },
            { label: "Store Locator", href: "/store-locator" },
        ],
    },
    products: [],
};
