"use client";

import Image from "next/image";
import { useEffect } from "react";
import { resolveMediaPath } from "@/lib/media";

export type LightboxImage = {
  date?: string;
  label: string;
  note?: string;
  src?: string;
};

type ImageLightboxProps = {
  image: LightboxImage | null;
  onClose: () => void;
};

export function ImageLightbox({ image, onClose }: ImageLightboxProps) {
  useEffect(() => {
    if (!image?.src) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [image?.src, onClose]);

  if (!image?.src) return null;

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/70 px-4 py-6 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
    >
      <figure
        className="relative max-h-full max-w-5xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="absolute right-3 top-3 z-10 rounded-full border border-white/25 bg-ink/45 px-4 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur transition hover:bg-ink/65"
          onClick={onClose}
          type="button"
        >
          关闭
        </button>
        <Image
          alt={image.label}
          className="max-h-[82vh] max-w-[92vw] rounded-[1.4rem] object-contain shadow-2xl"
          height={1200}
          src={resolveMediaPath(image.src)!}
          width={1600}
        />
        <figcaption className="mx-auto mt-3 max-w-3xl rounded-2xl bg-paper/92 px-4 py-3 text-center text-ink shadow-soft backdrop-blur">
          <p className="text-sm font-semibold">{image.label}</p>
          {image.date ? (
            <p className="mt-1 text-xs text-ink/45">{image.date}</p>
          ) : null}
          {image.note ? (
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink/62 [overflow-wrap:anywhere]">
              {image.note}
            </p>
          ) : null}
        </figcaption>
      </figure>
    </div>
  );
}
