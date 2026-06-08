"use client";

import { useEffect, useState } from "react";
import { journalPosts } from "@/data/site";
import { LineIcon } from "@/components/LineIcon";
import { SectionHeading } from "@/components/SectionHeading";

const categoryTones: Record<string, string> = {
  健身: "bg-clay/10 text-clay",
  城市生活: "bg-lake/10 text-lake",
  游泳: "bg-lake/10 text-lake",
  粤语: "bg-sage/20 text-moss",
  网球: "bg-moss/10 text-moss",
  西班牙语: "bg-paper text-ink/70",
};

export function Journal() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const active = activeIndex === null ? null : journalPosts[activeIndex];

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
    if (!active) {
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
  }, [active]);

  return (
    <section className="bg-fog/60 px-5 py-16 sm:px-8 lg:px-12" id="journal">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          align="left"
          eyebrow="Journal"
          title="最近记录"
          description="首页只放一些预览。它们可以是训练日志、语言笔记、读书摘记，也可以只是城市里一个很小的瞬间。"
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {journalPosts.map((post, index) => (
            <button
              className="spring-card group flex min-h-72 flex-col justify-between rounded-[1.6rem] border border-ink/10 bg-paper/72 p-6 text-left shadow-sm hover:border-moss/25 hover:bg-paper hover:shadow-soft"
              key={post.title}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <div>
                <div className="flex items-center justify-between gap-4">
                  <span className={`icon-tile ${categoryTones[post.category] ?? "bg-paper text-ink/70"}`}>
                    <LineIcon name={post.icon} />
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/30">
                    {post.date}
                  </p>
                </div>
                <span
                  className={`mt-6 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    categoryTones[post.category] ?? "bg-paper text-ink/70"
                  }`}
                >
                  {post.category}
                </span>
                <h3 className="mt-4 font-serif text-2xl font-semibold leading-tight text-ink">
                  {post.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-ink/70">
                  {post.summary}
                </p>
              </div>
              <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-ink/40">
                Read note
              </p>
            </button>
          ))}
        </div>
      </div>

      {active ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-ink/35 px-4 py-6 backdrop-blur-sm sm:px-6 sm:py-8"
          onClick={() => setActiveIndex(null)}
          role="dialog"
        >
          <article
            className="mx-auto w-full max-w-3xl overflow-hidden rounded-[1.8rem] bg-paper text-ink shadow-soft"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-5 border-b border-ink/10 p-5 sm:p-7">
              <div>
                <p className="text-xs font-semibold tracking-[0.22em] text-clay">
                  {active.date} · {active.category}
                </p>
                <h3 className="mt-3 font-serif text-3xl font-semibold leading-tight sm:text-4xl">
                  {active.title}
                </h3>
                <p className="mt-4 leading-7 text-ink/65">{active.summary}</p>
              </div>
              <button
                className="shrink-0 rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold text-ink/60 transition hover:border-moss hover:text-moss"
                onClick={() => setActiveIndex(null)}
                type="button"
              >
                关闭
              </button>
            </div>
            <div className="space-y-5 whitespace-pre-wrap p-5 text-base leading-9 text-ink/75 sm:p-7">
              {active.body}
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}
