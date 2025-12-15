import { ProductImageManager } from "../ProductImageManager";

export default function ProductImagePage({ params }: { params: { id: string } }) {
  return (
    <div className="p-6">
      <ProductImageManager productId={params.id} />
    </div>
  );
}
