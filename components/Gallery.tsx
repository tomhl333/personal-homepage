"use client";

import { useEffect, useState } from "react";
import { galleryItems } from "@/data/site";
import { SectionHeading } from "@/components/SectionHeading";
import type { CSSProperties } from "react";

export function Gallery() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const active = activeIndex === null ? null : galleryItems[activeIndex];

  useEffect(() => {
    if (!active) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [active]);

  return (
    <section className="px-5 py-16 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          align="left"
          eyebrow="瞬间"
          title="一些瞬间"
          description="先做成可点击的照片专题入口。后续你把真实图片放进项目里，再在数据里写标题和说明，我来负责排版。"
        />
        <div className="grid auto-rows-[190px] gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {galleryItems.map((item, index) => (
            <button
              className={`gallery-frame group relative overflow-hidden rounded-[1.6rem] bg-gradient-to-br text-left ${item.tone} ${item.className}`}
              key={`${item.category}-${index}`}
              onClick={() => setActiveIndex(index)}
              style={{ "--float-delay": `${index * 130}ms` } as CSSProperties}
              type="button"
            >
              <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.32)_0,transparent_42%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.36),transparent_10rem)] transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-x-4 bottom-4 rounded-[1.1rem] border border-white/60 bg-paper/85 p-4 text-ink shadow-sm backdrop-blur transition duration-300 group-hover:-translate-y-1">
                <p className="text-xs font-semibold tracking-[0.2em] text-ink/40">
                  {item.category}
                </p>
                <p className="mt-2 text-sm font-semibold leading-6">
                  {item.caption}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {active ? (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-ink/35 px-4 py-6 backdrop-blur-sm sm:px-6 sm:py-8"
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveIndex(null)}
        >
          <div
            className="mx-auto min-h-full w-full max-w-5xl py-2"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="overflow-hidden rounded-[1.8rem] bg-paper text-ink shadow-soft">
              <div className="sticky top-0 z-10 flex items-start justify-between gap-5 border-b border-ink/10 bg-paper/92 p-5 backdrop-blur sm:p-7">
                <div>
                  <p className="text-xs font-semibold tracking-[0.22em] text-clay">
                    {active.category}
                  </p>
                  <h3 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">
                    {active.caption}
                  </h3>
                  <p className="mt-3 max-w-2xl leading-7 text-ink/65">
                    {active.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold text-ink/60 transition hover:border-moss hover:text-moss"
                  onClick={() => setActiveIndex(null)}
                  type="button"
                >
                  关闭
                </button>
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-4">
                {active.photos.map((photo, index) => (
                  <figure
                    className={`group flex min-h-44 items-end overflow-hidden rounded-2xl bg-gradient-to-br from-moss/20 via-fog to-clay/20 bg-cover bg-center p-4 ${
                      index === 0 ? "sm:col-span-2 sm:row-span-2" : ""
                    }`}
                    key={`${photo.label}-${index}`}
                    style={
                      photo.src
                        ? { backgroundImage: `linear-gradient(180deg, transparent 35%, rgba(36, 50, 41, 0.52)), url(${photo.src})` }
                        : undefined
                    }
                  >
                    <figcaption className="rounded-full bg-paper/85 px-3 py-1.5 text-xs font-semibold text-ink/60 backdrop-blur">
                      {photo.label}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
