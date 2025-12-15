"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Product } from "@/lib/directus";

const IMAGE_FIELDS = [
  { key: "image", label: "Image" },
  { key: "image_url", label: "Image URL" },
  { key: "model_image_1", label: "Model Image 1" },
  { key: "model_image_2", label: "Model Image 2" },
  { key: "model_image_3", label: "Model Image 3" },
];

async function fetchProduct(id: string): Promise<Product | null> {
  const res = await fetch(`/api/directus/items/products?filter[id][_eq]=${id}&limit=1`, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.data?.[0] ?? null;
}

export default function ProductImageManager({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [status, setStatus] = useState<string>("");
  const [busyField, setBusyField] = useState<string | null>(null);

  useEffect(() => {
    fetchProduct(params.id).then(setProduct);
  }, [params.id]);

  const handleUpload = async (field: string, file: File, name?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("field", field);
    if (name) formData.append("name", name);

    setBusyField(field);
    setStatus("Uploading...");

    const res = await fetch(`/api/product-images/${params.id}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      setStatus(err?.error || "Upload failed");
      setBusyField(null);
      return;
    }

    const data = await res.json();
    setStatus(`Updated ${field}`);
    setBusyField(null);
    setProduct((prev) => (prev ? { ...prev, [field]: data.url } as Product : prev));
  };

  if (!product) {
    return <div className="p-6">Loading product...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Manage Images for {product.name}</h1>
      {status && <div className="rounded bg-blue-50 p-2 text-blue-700">{status}</div>}
      <div className="grid gap-6 md:grid-cols-2">
        {IMAGE_FIELDS.map(({ key, label }) => (
          <div key={key} className="rounded border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium">{label}</h2>
                <p className="text-sm text-gray-500 break-all">{(product as any)?.[key] || "No image"}</p>
              </div>
              {(product as any)?.[key] && (
                <div className="relative h-20 w-20 overflow-hidden rounded bg-gray-50">
                  <Image src={(product as any)[key]} alt={label} fill className="object-cover" />
                </div>
              )}
            </div>

            <div className="mt-4 space-y-2">
              <label className="block text-sm font-medium text-gray-700">New file</label>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  const nameInput = (event.currentTarget.parentElement?.querySelector(
                    `input[data-name-for=${key}]`
                  ) as HTMLInputElement | null)?.value;
                  if (file) {
                    handleUpload(key, file, nameInput || undefined);
                    event.target.value = "";
                  }
                }}
                className="block w-full rounded border border-gray-300 p-2"
                disabled={busyField === key}
              />
              <div className="space-y-1">
                <label className="text-sm text-gray-700">Rename (optional)</label>
                <input
                  type="text"
                  data-name-for={key}
                  placeholder="e.g. summer-dress-front"
                  className="w-full rounded border border-gray-300 p-2"
                  disabled={busyField === key}
                />
              </div>
              {busyField === key && <p className="text-sm text-gray-500">Uploading and replacing on Cloudinary...</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
