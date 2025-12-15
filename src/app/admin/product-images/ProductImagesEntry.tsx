"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ProductImageManager } from "./ProductImageManager";

export function ProductImagesEntry() {
  const params = useSearchParams();
  const [productId, setProductId] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const initialId = params.get("id");
    if (initialId) {
      setProductId(initialId);
      setActiveId(initialId);
    }
  }, [params]);

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

      <form onSubmit={handleSubmit} className="max-w-lg space-y-3 rounded border border-gray-200 bg-white p-4 shadow-sm">
        <label className="block text-sm font-medium text-gray-700" htmlFor="product-id">
          Product ID
        </label>
        <input
          id="product-id"
          type="text"
          value={productId}
          onChange={(event) => setProductId(event.target.value)}
          placeholder="Enter a Directus product ID (e.g. 1)"
          className="w-full rounded border border-gray-300 p-2"
        />
        <p className="text-xs text-gray-500">You can copy the ID from the Directus product edit URL.</p>
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
