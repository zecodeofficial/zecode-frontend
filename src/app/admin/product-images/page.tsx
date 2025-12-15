import { ProductImagesEntry } from "./ProductImagesEntry";

export default function ProductImagesPage({
  searchParams,
}: {
  searchParams: { id?: string; directus?: string };
}) {
  const initialId = searchParams?.id;
  const initialDirectusUrl = searchParams?.directus;

  return (
    <ProductImagesEntry
      initialProductId={initialId}
      initialDirectusUrl={initialDirectusUrl}
    />
  );
}
