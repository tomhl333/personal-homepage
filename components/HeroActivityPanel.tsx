"use client";

import { useEffect, useState } from "react";
import { activitySpotlights } from "@/data/site";
import { LineIcon } from "@/components/LineIcon";

export function HeroActivityPanel() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const active = activeIndex === null ? null : activitySpotlights[activeIndex];

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
    <>
      <div className="section-fade delay-2 relative">
        <div className="absolute -right-10 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-lake/20 blur-3xl" />
        <div className="relative h-[520px] rounded-[1.6rem] border border-white/70 bg-white/50 p-4 shadow-soft backdrop-blur-xl sm:p-5 lg:h-[500px]">
          <div className="flex items-end justify-between gap-6 border-b border-ink/10 pb-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.22em] text-clay">
                最近状态
              </p>
              <h2 className="mt-1 font-serif text-2xl font-semibold text-ink">
                正在投入的几件事
              </h2>
            </div>
            <p className="hidden max-w-40 text-right text-xs leading-5 text-ink/50 lg:block">
              点击查看记录和照片占位
            </p>
          </div>

          <div className="mt-3 grid h-[calc(100%-5.4rem)] grid-cols-2 grid-rows-4 gap-2.5 lg:grid-cols-3 lg:grid-rows-3">
            {activitySpotlights.map((item, index) => (
              <button
                className="group min-h-0 rounded-[1rem] border border-ink/10 bg-paper/60 p-2.5 text-left transition duration-300 hover:-translate-y-1 hover:border-moss/25 hover:bg-paper/85 hover:shadow-sm lg:p-3"
                key={item.title}
                onClick={() => setActiveIndex(index)}
                type="button"
              >
                <div className="flex h-full items-start gap-2.5 lg:block">
                  <span className={`icon-tile h-8 w-8 rounded-xl lg:h-9 lg:w-9 lg:rounded-2xl ${item.tone}`}>
                    <LineIcon className="h-4 w-4" name={item.icon} />
                  </span>
                  <span className="min-w-0 lg:mt-2.5 lg:block">
                    <span className="block text-[0.72rem] font-semibold text-ink/70">
                      {item.title}
                    </span>
                    <span className="mt-0.5 line-clamp-1 block text-sm font-semibold leading-5 text-ink">
                      {item.status}
                    </span>
                  </span>
                </div>
              </button>
            ))}
          </div>
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
                <div className="flex items-start gap-4">
                  <span className={`icon-tile ${active.tone}`}>
                    <LineIcon name={active.icon} />
                  </span>
                  <div>
                    <p className="text-xs font-semibold tracking-[0.22em] text-clay">
                      {active.title}
                    </p>
                    <h3 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">
                      {active.status}
                    </h3>
                    <p className="mt-3 max-w-2xl leading-7 text-ink/65">
                      {active.summary}
                    </p>
                  </div>
                </div>
                <button
                  className="shrink-0 rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold text-ink/60 transition hover:border-moss hover:text-moss"
                  onClick={() => setActiveIndex(null)}
                  type="button"
                >
                  关闭
                </button>
              </div>

              <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[0.88fr_1.12fr]">
                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] text-ink/40">
                    最近记录
                  </p>
                  <div className="mt-4 space-y-3">
                    {active.notes.map((note) => (
                      <article
                        className="rounded-2xl border border-ink/10 bg-white/50 px-4 py-3 text-sm leading-6 text-ink/70"
                        key={note}
                      >
                        {note}
                      </article>
                    ))}
                  </div>

                  <div className="mt-6 rounded-[1.35rem] border border-ink/10 bg-white/45 p-5">
                    <p className="text-xs font-semibold tracking-[0.2em] text-ink/40">
                      长记录预留
                    </p>
                    <h4 className="mt-3 font-serif text-2xl font-semibold">
                      这里以后可以放一篇完整心得
                    </h4>
                    <p className="mt-3 text-sm leading-7 text-ink/65">
                      比如一次训练复盘、一段语言学习记录、一本书的摘录，或者一组照片背后的生活片段。首页只做入口，更多内容在这个专题页里慢慢展开。
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] text-ink/40">
                    照片墙
                  </p>
                  <div className="mt-4 grid auto-rows-[120px] grid-cols-3 gap-3 sm:auto-rows-[150px]">
                    {active.photos.map((photo, index) => (
                      <div
                        className={`flex items-end rounded-2xl bg-gradient-to-br from-moss/20 via-fog to-clay/20 bg-cover bg-center p-3 text-xs font-semibold text-ink/55 ${
                          index === 0 ? "col-span-2 row-span-2" : ""
                        }`}
                        key={`${photo.label}-${index}`}
                        style={
                          photo.src
                            ? { backgroundImage: `linear-gradient(180deg, transparent 35%, rgba(36, 50, 41, 0.5)), url(${photo.src})` }
                            : undefined
                        }
                      >
                        <span className="rounded-full bg-paper/85 px-2.5 py-1 backdrop-blur">
                          {photo.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-ink/10 bg-white/45 p-4">
                      <p className="text-xs font-semibold tracking-[0.18em] text-ink/40">
                        可扩展内容
                      </p>
                      <p className="mt-2 text-sm leading-6 text-ink/65">
                        训练数据、路线、读书摘句、语言词卡都可以放进来。
                      </p>
                    </div>
                    <div className="rounded-2xl border border-ink/10 bg-white/45 p-4">
                      <p className="text-xs font-semibold tracking-[0.18em] text-ink/40">
                        后续形态
                      </p>
                      <p className="mt-2 text-sm leading-6 text-ink/65">
                        内容多了以后，可以升级成独立页面或按月份筛选。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
