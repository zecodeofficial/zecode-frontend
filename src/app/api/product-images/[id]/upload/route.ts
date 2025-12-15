import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || "http://localhost:8055";
const DIRECTUS_TOKEN = process.env.DIRECTUS_API_TOKEN;

function ensureEnv() {
  if (!process.env.CLOUDINARY_URL && (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET)) {
    throw new Error("Cloudinary credentials are not configured");
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

async function fetchProduct(id: string) {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (DIRECTUS_TOKEN) {
    headers["Authorization"] = `Bearer ${DIRECTUS_TOKEN}`;
  }

  const response = await fetch(`${DIRECTUS_URL}/items/products/${id}`, { headers, cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load product ${id}: ${await response.text()}`);
  }
  const json = await response.json();
  return json?.data ?? null;
}

async function updateProductImage(id: string, field: string, value: string) {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (DIRECTUS_TOKEN) {
    headers["Authorization"] = `Bearer ${DIRECTUS_TOKEN}`;
  }

  const response = await fetch(`${DIRECTUS_URL}/items/products/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ [field]: value }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update product ${id}: ${await response.text()}`);
  }
}

function extractPublicId(url?: string | null) {
  if (!url) return null;
  const match = url.match(/\/upload\/v\d+\/(.+?)(\.[^.]+)?$/);
  return match?.[1] || null;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    ensureEnv();

    const formData = await request.formData();
    const file = formData.get("file");
    const field = formData.get("field")?.toString();
    const desiredName = formData.get("name")?.toString();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    if (!field) {
      return NextResponse.json({ error: "Missing field" }, { status: 400 });
    }

    const { id } = await context.params;
    const product = await fetchProduct(id);
    const currentUrl = product?.[field];

    // Remove existing image if present
    const currentPublicId = extractPublicId(currentUrl);
    if (currentPublicId) {
      await cloudinary.uploader.destroy(currentPublicId, { invalidate: true }).catch(() => undefined);
    }

    const folderBase = "zecode/products";
    const publicId = desiredName?.trim()
      ? `${folderBase}/${desiredName.trim()}`
      : `${folderBase}/product-${id}/${field}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded: any = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({
        public_id: publicId,
        overwrite: true,
        resource_type: "image",
      }, (error, result) => {
        if (error || !result?.secure_url) return reject(error || new Error("Upload failed"));
        resolve(result);
      });
      stream.end(buffer);
    });

    await updateProductImage(id, field, uploaded.secure_url);

    return NextResponse.json({
      success: true,
      url: uploaded.secure_url,
      public_id: uploaded.public_id,
    });
  } catch (error: any) {
    console.error("Image upload error:", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
