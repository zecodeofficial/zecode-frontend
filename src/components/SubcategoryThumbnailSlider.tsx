import Image from "next/image";
import { useState, useEffect } from "react";
import { Product } from "@/lib/directus";

interface SubcategoryThumbnailSliderProps {
  images: string[];
  alt: string;
}

export default function SubcategoryThumbnailSlider({ images, alt }: SubcategoryThumbnailSliderProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [images]);

  return (
    <div className="relative w-full h-full">
      {images.map((img, idx) => (
        <Image
          key={img + idx}
          src={img}
          alt={alt}
          fill
          className={`object-cover transition-opacity duration-700 ${idx === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        />
      ))}
    </div>
  );
}
