import { galleryItems } from "@/data/site";
import { SectionHeading } from "@/components/SectionHeading";
import type { CSSProperties } from "react";

const tones = [
  "from-moss/75 to-sage/70",
  "from-lake/80 to-paper",
  "from-clay/75 to-fog",
  "from-sage/80 to-paper",
  "from-ink/70 to-lake/60",
  "from-fog to-clay/50",
];

export function Gallery() {
  return (
    <section className="bg-ink px-5 py-20 text-paper sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Gallery"
          title="照片墙先留一块地方"
          description="等照片慢慢多起来，这里会像一本轻量的生活相册。"
          tone="dark"
        />
        <div className="grid auto-rows-[180px] gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {galleryItems.map((item, index) => (
            <figure
              className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${tones[index]} ${
                index === 0 || index === 3 ? "lg:col-span-3" : "lg:col-span-2"
              } ${index === 1 ? "lg:row-span-2" : ""}`}
              key={item}
              style={{ "--float-delay": `${index * 180}ms` } as CSSProperties}
            >
              <div className="gallery-frame absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.28)_0,transparent_45%),radial-gradient(circle_at_75%_25%,rgba(255,255,255,0.28),transparent_12rem)] transition duration-300 group-hover:scale-105" />
              <figcaption className="absolute bottom-4 left-4 rounded-full bg-paper/90 px-4 py-2 text-sm font-semibold text-ink">
                {item}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
