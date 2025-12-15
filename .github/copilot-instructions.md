# Copilot Instructions for Zecode-Frontend

## Project Overview
- This is a Next.js (TypeScript) monorepo for a fashion e-commerce site, bootstrapped with `create-next-app`.
- The main app is in the `src/` directory. Data, scripts, and configuration are organized at the workspace root and in `scripts/`, `data/`, and `prisma/`.

## Key Workflows
- **Development:**
  - Start with `npm run dev` (or `yarn dev`, `pnpm dev`, `bun dev`).
  - Main entry: `src/` (look for `app/page.tsx` for the homepage).
- **Build/Deploy:**
  - Use Vercel for deployment (see `README.md`).
  - Custom build config: see `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`.
- **Data/Backend:**
  - Product and image data: `data/`, `public/`, and JSON/CSV files at root.
  - Backend schema: `prisma/schema.prisma` (see also `prisma/seed.ts`).
- **Scripts:**
  - Data processing and migration scripts are in `scripts/` (JS and Python). Example: `scripts/build_catalogue.py`.
  - Run with `node` or `python` as appropriate. Some scripts expect specific file structures in `data/` or `public/`.

## Project Conventions
- **TypeScript/Next.js:**
  - Use TypeScript for all new code in `src/`.
  - Follow Next.js app directory structure and conventions.
- **Styling:**
  - Tailwind CSS is configured (see `tailwind.config.ts`).
- **Data:**
  - Product and image data are managed as flat files (CSV, JSON) and referenced in scripts and the app.
- **Scripts:**
  - Scripts are one-off utilities; check comments for usage. Prefer updating or creating new scripts in `scripts/`.

## Integration Points
- **Vercel:**
  - Deployment is optimized for Vercel. See `vercel.json` for custom settings.
- **Cloudinary:**
  - Image management via Cloudinary (see `cloudinary-images.json`, `cloudinary-cleanup.js`).
- **Directus:**
  - Some data is exported from Directus (see `directus_products.json`, `directus_slides.json`).

## Examples
- To add a new product, update `product_catalogue.csv` and run relevant scripts in `scripts/`.
- To process images, use scripts like `scripts/analyze_images.py` or `scripts/cloudinary-cleanup.js`.

## Navigation / Header Pattern
- **Server-first navigation:** The server component `HeaderWrapper` (see [src/components/HeaderWrapper.tsx](src/components/HeaderWrapper.tsx#L1)) fetches CMS navigation via `fetchDirectusNavigation()` and uses the server-safe helper `processNavigation` in [src/lib/navigation.ts](src/lib/navigation.ts#L1) to produce `categories` and `quickLinks`.
- **Client header usage:** The client `Header` component accepts `initialCategories` and `initialQuickLinks` props (see [src/components/Header.tsx](src/components/Header.tsx#L1)) and should render purely from this serializable data. Avoid putting navigation processing logic that the server also needs into client-only files.
- **Avoid client functions on server:** If a client module exports or passes a function (for example, a client-local `processNavigation`) into a server component and the server tries to call it, Next will throw: "Attempted to call processNavigation() from the server but processNavigation is on the client...". If you see this, centralize processing in `src/lib/navigation.ts` and pass the resulting data objects instead of functions.
- **Examples to follow:** `src/lib/navigation.ts`, `src/components/HeaderWrapper.tsx`, `src/components/Header.tsx`, `src/components/v2/Header.tsx`, `src/components/v3/Header.tsx`.

## References
- See `README.md` for dev and deployment basics.
- See `prisma/`, `scripts/`, and `public/` for data and automation patterns.

---
For new patterns, document them here to help future AI agents and developers.