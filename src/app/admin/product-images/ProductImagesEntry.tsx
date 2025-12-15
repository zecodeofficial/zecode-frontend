"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ProductImageManager } from "./ProductImageManager";

type ProductImagesEntryProps = {
  initialProductId?: string;
  initialDirectusUrl?: string;
};

export function ProductImagesEntry({
  initialProductId,
  initialDirectusUrl,
}: ProductImagesEntryProps) {
  const [productId, setProductId] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [directusUrl, setDirectusUrl] = useState("");
  const router = useRouter();

  const parseProductIdFromUrl = (url: string) => {
    try {
      const parsed = new URL(url, "https://placeholder.local");
      const segments = parsed.pathname.split("/").filter(Boolean);
      const idFromPath = segments[segments.length - 1];
      if (idFromPath && /^\d+$/.test(idFromPath)) {
        return idFromPath;
      }
    } catch (error) {
      console.warn("Unable to parse Directus URL", error);
    }
    return "";
  };

  useEffect(() => {
    const candidateDirectusUrl = initialDirectusUrl || "";
    if (candidateDirectusUrl) {
      setDirectusUrl(candidateDirectusUrl);
      const extracted = parseProductIdFromUrl(candidateDirectusUrl);
      if (extracted) {
        setProductId(extracted);
        setActiveId(extracted);
        return;
      }
    }

    if (initialProductId) {
      setProductId(initialProductId);
      setActiveId(initialProductId);
    }
  }, [initialDirectusUrl, initialProductId]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = productId.trim();
    if (!trimmed) return;
    setActiveId(trimmed);
    router.push(`/admin/product-images/${trimmed}`);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Product image uploader</h1>
        <p className="text-gray-600 mt-2 max-w-2xl">
          Jump straight to a product to use the upload buttons for the Image, Image URL, Model Image 1,
          Model Image 2, and Model Image 3 fields. Replacing an image will overwrite the Cloudinary asset
          and update the Directus record automatically.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-3 rounded border border-gray-200 bg-white p-4 shadow-sm">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700" htmlFor="directus-url">
            Directus product URL (paste from the admin page)
          </label>
          <input
            id="directus-url"
            type="url"
            value={directusUrl}
            onChange={(event) => {
              const url = event.target.value;
              setDirectusUrl(url);
              const extracted = parseProductIdFromUrl(url);
              if (extracted) {
                setProductId(extracted);
                setActiveId(extracted);
              }
            }}
            placeholder="https://zecode-directus.onrender.com/admin/content/products/45"
            className="w-full rounded border border-gray-300 p-2"
          />
          <p className="text-xs text-gray-500">
            Pasting the Directus product URL auto-fills the ID so you can jump to the uploader without guessing.
          </p>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700" htmlFor="product-id">
            Product ID
          </label>
          <input
            id="product-id"
            type="text"
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            placeholder="Enter a Directus product ID (e.g. 45)"
            className="w-full rounded border border-gray-300 p-2"
          />
          <p className="text-xs text-gray-500">The uploader will replace Cloudinary assets for this product.</p>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            disabled={!productId.trim()}
          >
            Load image fields
          </button>
          {activeId && (
            <Link
              href={`/admin/product-images/${activeId}`}
              className="rounded border border-indigo-200 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
            >
              Open dedicated page
            </Link>
          )}
        </div>
      </form>

      {activeId && (
        <div className="rounded border border-gray-200 bg-white shadow-sm">
          <ProductImageManager key={activeId} productId={activeId} />
        </div>
      )}
    </div>
  );
}
