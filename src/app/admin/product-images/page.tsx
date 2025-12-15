import { Suspense } from "react";
import { ProductImagesEntry } from "./ProductImagesEntry";

export default function ProductImagesPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading product images...</div>}>
      <ProductImagesEntry />
    </Suspense>
  );
}
