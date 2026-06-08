"use client";

import { useEffect, useState } from "react";
import { activitySpotlights } from "@/data/site";
import { ImageLightbox, type LightboxImage } from "@/components/ImageLightbox";
import { SectionHeading } from "@/components/SectionHeading";
import { resolveMediaPath } from "@/lib/media";
import type { CSSProperties } from "react";
import type { PhotoItem } from "@/data/site";

type MomentTopic = {
  category: string;
  caption: string;
  detail: string;
  tone: string;
  className: string;
  photos: PhotoItem[];
};

const topicLayouts = [
  "lg:col-span-3",
  "lg:col-span-2 lg:row-span-2",
  "lg:col-span-3",
  "lg:col-span-2",
  "lg:col-span-2",
  "lg:col-span-4",
];

export function Gallery() {
  const momentTopics = buildMomentTopics();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<LightboxImage | null>(null);
  const active = activeIndex === null ? null : momentTopics[activeIndex];

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

  useEffect(() => {
    if (!active || previewImage) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveIndex(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [active, previewImage]);

  useEffect(() => {
    if (!active) {
      return;
    }

    preloadImageSources(active.photos.map((photo) => photo.src));
  }, [active]);

  return (
    <section className="px-5 py-16 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          align="left"
          eyebrow="瞬间"
          title="一些瞬间"
          description="这里会自动汇总最近状态里的照片、书封和海报。你只需要在维护台维护内容，首页会自己挑选和排版。"
        />
        <div className="grid auto-rows-[190px] gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {momentTopics.map((item, index) => {
            const cover = item.photos.find((photo) => photo.src) ?? item.photos[0];
            const isCoverTopic = item.photos.every((photo) => isCoverMedia(photo));

            return (
            <button
              className={`gallery-frame group relative overflow-hidden rounded-[1.6rem] bg-gradient-to-br text-left ${item.tone} ${item.className}`}
              key={`${item.category}-${index}`}
              onClick={() => setActiveIndex(index)}
              style={{ "--float-delay": `${index * 130}ms` } as CSSProperties}
              type="button"
            >
              {isCoverTopic ? (
                <CoverPreviewGrid photos={item.photos} title={item.category} />
              ) : (
                <>
                  <div
                    className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                    style={
                      cover?.src
                        ? {
                            backgroundImage: `url("${resolveMediaPath(cover.src)}")`,
                          }
                        : undefined
                    }
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_34%,rgba(14,22,18,0.12)_62%,rgba(14,22,18,0.58)_100%)] transition duration-500 group-hover:bg-[linear-gradient(180deg,transparent_28%,rgba(14,22,18,0.18)_58%,rgba(14,22,18,0.66)_100%)]" />
                  <div className="absolute inset-x-5 bottom-5 text-white drop-shadow-[0_2px_8px_rgba(14,22,18,0.45)] transition duration-300 group-hover:-translate-y-1">
                    <p className="text-[0.68rem] font-semibold tracking-[0.2em] text-white/70">
                      {item.category}
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6">
                      {item.caption}
                    </p>
                    {cover?.date ? (
                      <p className="mt-1 text-xs text-white/62">{cover.date}</p>
                    ) : null}
                  </div>
                </>
              )}
            </button>
            );
          })}
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
                  isCoverMedia(photo) ? (
                    <button
                      className="group rounded-2xl bg-white/35 p-3 text-center transition duration-300 hover:-translate-y-1 hover:bg-white/55"
                      key={`${photo.label}-${index}`}
                      onClick={() => setPreviewImage(photo)}
                      type="button"
                    >
                      <div
                        className="relative mx-auto flex aspect-[2/3] max-h-64 items-center justify-center overflow-hidden rounded-xl shadow-sm"
                      >
                        {photo.src ? (
                          <img
                            alt={photo.label}
                            className="h-full w-full object-contain"
                            decoding="async"
                            loading="lazy"
                            src={resolveMediaPath(photo.src)!}
                          />
                        ) : null}
                      </div>
                      <span className="mt-3 block line-clamp-2 text-sm font-semibold leading-5 text-ink/72">
                        {photo.label}
                      </span>
                    </button>
                  ) : (
                    <button
                      className={`group relative min-h-44 overflow-hidden rounded-2xl bg-gradient-to-br from-moss/20 via-fog to-clay/20 bg-cover bg-center text-left ${
                        index === 0 ? "sm:col-span-2 sm:row-span-2" : ""
                      }`}
                      key={`${photo.label}-${index}`}
                      onClick={() => setPreviewImage(photo)}
                      style={
                        photo.src
                          ? {
                              backgroundImage: `url("${resolveMediaPath(photo.src)}")`,
                            }
                          : undefined
                      }
                      type="button"
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_38%,rgba(14,22,18,0.12)_64%,rgba(14,22,18,0.68)_100%)]" />
                      <span className="absolute inset-x-4 bottom-4 text-white drop-shadow-[0_2px_8px_rgba(14,22,18,0.48)]">
                        <span className="block text-sm font-semibold leading-5">
                          {photo.label}
                        </span>
                        {photo.date ? (
                          <span className="mt-1 block text-[0.72rem] font-medium text-white/68">
                            {photo.date}
                          </span>
                        ) : null}
                        {photo.note ? (
                          <span className="mt-1 line-clamp-2 block text-xs font-medium leading-5 text-white/82">
                            {photo.note}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <ImageLightbox
        image={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </section>
  );
}

function buildMomentTopics(): MomentTopic[] {
  return activitySpotlights
    .map((item, index) => {
      const photos = sortMomentPhotos(collectMomentPhotos(item));
      const latest = photos[0];
      const latestIsCoverMedia = latest ? isCoverMedia(latest) : false;

      return {
        category: item.title,
        caption: latestIsCoverMedia ? item.summary : latest?.note ?? item.summary,
        detail: `${item.title}里的图片会从最近状态自动汇总。后续内容多了，可以继续按月份和标签筛选。`,
        tone: topicTone(item.title),
        className: topicLayouts[index % topicLayouts.length],
        photos,
      };
    })
    .filter((item) => item.photos.length > 0);
}

function collectMomentPhotos(
  item: (typeof activitySpotlights)[number],
): PhotoItem[] {
  const bookCovers =
    item.books
      ?.filter((book) => book.cover)
      .map((book) => ({
        label: book.title,
        src: book.cover,
        note: book.author,
        tags: [item.title, "书封"],
      })) ?? [];

  const showPosters =
    item.shows
      ?.filter((show) => show.poster)
      .map((show) => ({
        label: show.title,
        src: show.poster,
        note: [show.kind, show.status].filter(Boolean).join(" · "),
        tags: [item.title, "海报"],
      })) ?? [];

  const isTextOnlyArchive = Boolean(
    item.phrases?.length ||
      item.inputs?.length ||
      item.learningLogs?.length ||
      item.uploadDir === "/uploads/work-notes",
  );
  const shouldUseDirectPhotos =
    !item.books?.length && !item.shows?.length && !isTextOnlyArchive;
  const photos = shouldUseDirectPhotos
    ? item.photos
        .filter((photo) => photo.src)
        .map((photo) => ({
          ...photo,
          tags: photo.tags ?? [item.title],
        }))
    : [];

  const checkinPhotos =
    item.checkins
      ?.filter((checkin) => checkin.src)
      .map((checkin) => ({
        label: checkin.label,
        src: checkin.src,
        date: checkin.date,
        month: checkin.date?.slice(0, 7),
        note: checkin.note ?? checkin.content,
        tags: [item.title],
      })) ?? [];

  return dedupeMedia([
    ...bookCovers,
    ...showPosters,
    ...photos,
    ...checkinPhotos,
  ]);
}

function sortMomentPhotos(photos: PhotoItem[]) {
  return photos
    .map((photo, index) => ({ photo, index }))
    .sort((a, b) => {
      if (a.photo.date && b.photo.date) {
        return b.photo.date.localeCompare(a.photo.date);
      }

      return a.index - b.index;
    })
    .map(({ photo }) => photo);
}

function dedupeMedia(photos: PhotoItem[]) {
  const seen = new Set<string>();

  return photos.filter((photo) => {
    const key = photo.src ?? photo.label;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isCoverMedia(photo: PhotoItem) {
  return photo.tags?.includes("书封") || photo.tags?.includes("海报");
}

function CoverPreviewGrid({
  photos,
  title,
}: {
  photos: PhotoItem[];
  title: string;
}) {
  const previewPhotos = photos.slice(0, 4);

  return (
    <div className="absolute inset-0 flex flex-col justify-between p-4">
      <div className="grid min-h-0 flex-1 grid-cols-4 items-center gap-3">
        {previewPhotos.map((photo, index) => (
          <div
            className={`relative flex h-full min-h-0 items-center justify-center overflow-hidden rounded-xl bg-paper/45 shadow-sm transition duration-500 group-hover:-translate-y-1 ${
              index % 2 === 0 ? "rotate-[-1deg]" : "rotate-[1deg]"
            }`}
            key={`${photo.label}-${index}`}
          >
            {photo.src ? (
              <img
                alt={photo.label}
                className="h-full w-full object-contain"
                decoding="async"
                loading="lazy"
                src={resolveMediaPath(photo.src)!}
              />
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-ink/10 pt-3">
        <p className="text-xs font-semibold tracking-[0.2em] text-ink/40">
          {title}
        </p>
        <p className="text-xs font-semibold text-ink/45">
          {photos.length} 个
        </p>
      </div>
    </div>
  );
}

function topicTone(title: string) {
  if (title.includes("网球") || title.includes("练字")) {
    return "from-moss/75 via-sage/60 to-paper";
  }
  if (title.includes("游泳") || title.includes("城市")) {
    return "from-lake/80 via-fog to-paper";
  }
  if (title.includes("健身") || title.includes("工作")) {
    return "from-clay/70 via-fog to-paper";
  }
  if (title.includes("阅读")) {
    return "from-fog via-paper to-clay/30";
  }
  return "from-sage/70 via-paper to-fog";
}

function preloadImageSources(sources: Array<string | undefined>) {
  sources.slice(0, 12).forEach((source) => {
    const src = resolveMediaPath(source);
    if (!src) return;

    const image = new window.Image();
    image.decoding = "async";
    image.src = src;
  });
}
