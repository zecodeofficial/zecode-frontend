"use client";

import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
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

type ImageField = (typeof IMAGE_FIELDS)[number];

function ImageFieldCard({
  field,
  value,
  busy,
  onUpload,
}: {
  field: ImageField;
  value?: string | null;
  busy: boolean;
  onUpload: (file: File, name?: string) => Promise<void>;
}) {
  const [rename, setRename] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await onUpload(file, rename || undefined);
    event.target.value = "";
  };

  return (
    <div className="rounded border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">{field.label}</h2>
          <p className="text-sm text-gray-500 break-all">{value || "No image"}</p>
        </div>
        {value && (
          <div className="relative h-20 w-20 overflow-hidden rounded bg-gray-50">
            <Image src={value} alt={field.label} fill className="object-cover" />
          </div>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Rename (optional)</label>
          <input
            type="text"
            value={rename}
            onChange={(event) => setRename(event.target.value)}
            placeholder="e.g. summer-dress-front"
            className="w-full rounded border border-gray-300 p-2"
            disabled={busy}
          />
          <p className="text-xs text-gray-500">Provide a new filename before uploading to replace the Cloudinary asset.</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={busy}
          />
          <button
            type="button"
            onClick={handleButtonClick}
            disabled={busy}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {busy ? "Uploading..." : `Upload ${field.label}`}
          </button>
          {busy && <span className="text-sm text-gray-500">Replacing on Cloudinary and updating Directus...</span>}
        </div>
      </div>
    </div>
  );
}

export default function ProductImageManager({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [status, setStatus] = useState<string>("");
  const [busyField, setBusyField] = useState<string | null>(null);

  useEffect(() => {
    fetchProduct(params.id).then(setProduct);
  }, [params.id]);

  const productImages = useMemo(() => {
    if (!product) return {} as Record<string, string | null | undefined>;
    return IMAGE_FIELDS.reduce<Record<string, string | null | undefined>>((acc, field) => {
      acc[field.key] = (product as any)?.[field.key] as string | null | undefined;
      return acc;
    }, {});
  }, [product]);

  const handleUpload = async (field: string, file: File, name?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("field", field);
    if (name) formData.append("name", name);

    setBusyField(field);
    setStatus(`Uploading ${field}...`);

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
        {IMAGE_FIELDS.map((field) => (
          <ImageFieldCard
            key={field.key}
            field={field}
            value={productImages[field.key] as string | null | undefined}
            busy={busyField === field.key}
            onUpload={(file, name) => handleUpload(field.key, file, name)}
          />
        ))}
      </div>
    </div>
  );
}
