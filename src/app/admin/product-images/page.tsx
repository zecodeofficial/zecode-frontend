"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function ProductImagesEntry() {
  const [productId, setProductId] = useState("");
  const router = useRouter();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = productId.trim();
    if (!trimmed) return;
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
        <button
          type="submit"
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          disabled={!productId.trim()}
        >
          Go to upload page
        </button>
      </form>
    </div>
  );
}
