"use client";

import { useState } from "react";
import Image from "next/image";

interface Props {
  images: string[];
  title: string;
}

export function ImageGallery({ images, title }: Props) {
  const [selected, setSelected] = useState(0);
  const mainSrc = images[selected] ?? images[0];

  if (!mainSrc) return null;

  return (
    <div className="space-y-3">
      {/* Imagen principal */}
      <div className="relative h-[360px] overflow-hidden rounded-md border border-pp-ink bg-pp-bg2 md:h-[480px]">
        <Image
          src={mainSrc}
          alt={`${title} — imagen ${selected + 1}`}
          fill
          className="object-contain"
          priority
          sizes="(min-width: 1024px) 60vw, 100vw"
        />
      </div>

      {/* Thumbnails (solo si hay más de una imagen) */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => setSelected(i)}
              aria-label={`Ver imagen ${i + 1}`}
              className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded border-2 transition-all ${
                i === selected
                  ? "border-pp-ink"
                  : "border-pp-border hover:border-pp-ink2"
              }`}
            >
              <Image
                src={src}
                alt={`${title} ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
