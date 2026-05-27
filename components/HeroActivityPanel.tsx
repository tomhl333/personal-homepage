"use client";

import { useEffect, useState } from "react";
import { activitySpotlights } from "@/data/site";
import { LineIcon } from "@/components/LineIcon";

export function HeroActivityPanel() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [activeBookIndex, setActiveBookIndex] = useState(0);
  const active = activeIndex === null ? null : activitySpotlights[activeIndex];
  const activeBook =
    active?.books && active.books.length > 0
      ? active.books[Math.min(activeBookIndex, active.books.length - 1)]
      : null;
  const activeShow =
    active?.shows && active.shows.length > 0
      ? active.shows[Math.min(activeBookIndex, active.shows.length - 1)]
      : null;
  const cityPhotos = active?.title === "城市生活" ? active.photos : [];

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
    setActiveBookIndex(0);
  }, [activeIndex]);

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
            <div className="flex max-h-[calc(100vh-4rem)] flex-col overflow-hidden rounded-[1.8rem] bg-paper text-ink shadow-soft">
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

              {active.books ? (
                <div className="grid min-h-0 flex-1 gap-7 p-5 sm:p-7 lg:grid-cols-[1.05fr_0.95fr]">
                  <div className="min-h-0 lg:overflow-y-auto lg:pr-2">
                    <div className="flex items-end justify-between gap-4">
                      <p className="text-xs font-semibold tracking-[0.2em] text-ink/40">
                        书架
                      </p>
                      <p className="text-xs text-ink/45">
                        点击书封查看摘抄和想法
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4 pb-1 sm:grid-cols-4">
                      {active.books.map((book, index) => (
                        <button
                          className={`group text-left transition duration-300 ${
                            index === activeBookIndex
                              ? "-translate-y-1"
                              : "hover:-translate-y-1"
                          }`}
                          key={book.title}
                          onClick={() => setActiveBookIndex(index)}
                          type="button"
                        >
                          <span
                            className={`relative block aspect-[3/4] overflow-hidden rounded-r-xl rounded-l-sm border bg-gradient-to-br ${book.coverTone} p-3 shadow-sm transition duration-300 ${
                              index === activeBookIndex
                                ? "border-moss/40 shadow-soft"
                                : "border-ink/10 group-hover:border-moss/25"
                            }`}
                            style={
                              book.cover
                                ? {
                                    backgroundImage: `linear-gradient(180deg, rgba(36, 50, 41, 0.05), rgba(36, 50, 41, 0.34)), url(${book.cover})`,
                                    backgroundPosition: "center",
                                    backgroundSize: "cover",
                                  }
                                : undefined
                            }
                          >
                            <span className="absolute inset-y-0 left-0 w-3 bg-ink/10" />
                            <span className="absolute inset-x-3 top-3 h-px bg-white/60" />
                            <span className="relative flex h-full flex-col justify-between">
                              <span className="text-[0.64rem] font-semibold tracking-[0.18em] text-ink/45">
                                {book.status}
                              </span>
                              <span
                                className={
                                  book.cover
                                    ? "rounded-xl bg-paper/82 p-2 backdrop-blur"
                                    : ""
                                }
                              >
                                <span className="block font-serif text-lg font-semibold leading-tight text-ink">
                                  {book.title}
                                </span>
                                <span className="mt-2 block text-xs leading-5 text-ink/55">
                                  {book.author}
                                </span>
                              </span>
                            </span>
                          </span>
                          <span className="mt-3 block line-clamp-2 text-sm font-semibold leading-5 text-ink/75">
                            {book.title}
                          </span>
                          <span className="mt-1 block text-xs text-ink/45">
                            {book.author}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="min-h-0 overflow-y-auto rounded-[1.4rem] border border-ink/10 bg-white/45 p-5">
                    {activeBook ? (
                      <>
                        <p className="text-xs font-semibold tracking-[0.2em] text-clay">
                          摘抄和想法
                        </p>
                        <h4 className="mt-3 font-serif text-3xl font-semibold text-ink">
                          {activeBook.title}
                        </h4>
                        <p className="mt-2 text-sm text-ink/55">
                          {activeBook.author}
                        </p>
                        <div className="mt-5 space-y-3">
                          {activeBook.notes.map((note) => (
                            <article
                              className="rounded-2xl border border-ink/10 bg-paper/70 p-4"
                              key={note.text}
                            >
                              <p className="text-xs font-semibold tracking-[0.18em] text-ink/40">
                                {note.type}
                              </p>
                              <p className="mt-2 text-sm leading-7 text-ink/70">
                                {note.text}
                              </p>
                            </article>
                          ))}
                        </div>
                        <div className="mt-5 rounded-2xl border border-dashed border-ink/15 p-4">
                          <p className="text-xs font-semibold tracking-[0.18em] text-ink/40">
                            后续维护
                          </p>
                          <p className="mt-2 text-sm leading-6 text-ink/60">
                            以后可以继续给每本书补充封面图片、摘抄、想法和阅读日期。
                          </p>
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              ) : active.shows ? (
                <div className="grid min-h-0 flex-1 gap-7 p-5 sm:p-7 lg:grid-cols-[1.08fr_0.92fr]">
                  <div className="min-h-0 overflow-y-auto pr-1">
                    <div className="flex items-end justify-between gap-4">
                      <p className="text-xs font-semibold tracking-[0.2em] text-ink/40">
                        片单
                      </p>
                      <p className="text-xs text-ink/45">
                        电视剧和电影分开记录
                      </p>
                    </div>

                    <div className="mt-4 space-y-6">
                      {["电视剧", "电影"].map((kind) => {
                        const shows = (active.shows ?? [])
                          .map((show, index) => ({ ...show, originalIndex: index }))
                          .filter((show) => show.kind === kind);

                        if (shows.length === 0) return null;

                        return (
                          <section key={kind}>
                            <div className="mb-3 flex items-center gap-3">
                              <h4 className="text-sm font-semibold text-ink">
                                {kind}
                              </h4>
                              <span className="h-px flex-1 bg-ink/10" />
                              <span className="text-xs text-ink/40">
                                {shows.length}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                              {shows.map((show) => (
                                <button
                                  className={`group text-left transition duration-300 ${
                                    show.originalIndex === activeBookIndex
                                      ? "-translate-y-1"
                                      : "hover:-translate-y-1"
                                  }`}
                                  key={show.title}
                                  onClick={() => setActiveBookIndex(show.originalIndex)}
                                  type="button"
                                >
                                  <span
                                    className={`relative block aspect-[2/3] overflow-hidden rounded-[1.25rem] border bg-gradient-to-br ${show.posterTone} p-4 shadow-sm transition duration-300 ${
                                      show.originalIndex === activeBookIndex
                                        ? "border-moss/40 shadow-soft"
                                        : "border-ink/10 group-hover:border-moss/25"
                                    }`}
                                    style={
                                      show.poster
                                        ? {
                                            backgroundImage: `linear-gradient(180deg, rgba(14, 22, 18, 0.05), rgba(14, 22, 18, 0.62)), url(${show.poster})`,
                                            backgroundPosition: "center",
                                            backgroundSize: "cover",
                                          }
                                        : undefined
                                    }
                                  >
                                    <span className="absolute inset-0 bg-[radial-gradient(circle_at_70%_15%,rgba(255,255,255,0.24),transparent_7rem),linear-gradient(160deg,transparent_35%,rgba(0,0,0,0.22))]" />
                                    <span className="relative flex h-full flex-col justify-between">
                                      <span className="text-[0.68rem] font-semibold tracking-[0.18em] text-white/70">
                                        {show.status}
                                      </span>
                                      <span>
                                        <span className="block font-serif text-2xl font-semibold leading-tight text-white drop-shadow">
                                          {show.title}
                                        </span>
                                        <span className="mt-2 block text-xs leading-5 text-white/72">
                                          {show.meta}
                                        </span>
                                      </span>
                                    </span>
                                  </span>
                                  <span className="mt-3 block line-clamp-1 text-sm font-semibold text-ink/75">
                                    {show.title}
                                  </span>
                                  <span className="mt-1 block text-xs text-ink/45">
                                    {show.creator}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </section>
                        );
                      })}
                    </div>
                  </div>

                  <div className="min-h-0 overflow-y-auto rounded-[1.4rem] border border-ink/10 bg-white/45 p-5">
                    {activeShow ? (
                      <>
                        <p className="text-xs font-semibold tracking-[0.2em] text-clay">
                          角色和剧情
                        </p>
                        <h4 className="mt-3 font-serif text-3xl font-semibold text-ink">
                          {activeShow.title}
                        </h4>
                        <p className="mt-2 text-sm text-ink/55">
                          {activeShow.kind} · {activeShow.creator} · {activeShow.meta}
                        </p>

                        <div className="mt-5">
                          <p className="text-xs font-semibold tracking-[0.18em] text-ink/40">
                            喜欢的人物
                          </p>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            {activeShow.characters.map((character) => (
                              <article
                                className="rounded-2xl border border-ink/10 bg-paper/70 p-4"
                                key={character.name}
                              >
                                <h5 className="font-semibold text-ink">
                                  {character.name}
                                </h5>
                                <p className="mt-2 text-sm leading-6 text-ink/62">
                                  {character.note}
                                </p>
                              </article>
                            ))}
                          </div>
                        </div>

                        <div className="mt-5 space-y-3">
                          {activeShow.notes.map((note) => (
                            <article
                              className="rounded-2xl border border-ink/10 bg-paper/70 p-4"
                              key={note.text}
                            >
                              <p className="text-xs font-semibold tracking-[0.18em] text-ink/40">
                                {note.type}
                              </p>
                              <p className="mt-2 text-sm leading-7 text-ink/70">
                                {note.text}
                              </p>
                            </article>
                          ))}
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              ) : active.phrases || active.inputs || active.learningLogs ? (
                <div className="grid min-h-0 flex-1 gap-5 p-5 sm:p-7 lg:grid-cols-[1fr_0.9fr_1fr]">
                  <div className="min-h-0 overflow-y-auto rounded-[1.35rem] border border-ink/10 bg-white/45 p-4">
                    <p className="text-xs font-semibold tracking-[0.2em] text-ink/40">
                      词句卡片
                    </p>
                    <div className="mt-4 space-y-3">
                      {(active.phrases ?? []).map((phrase) => (
                        <article
                          className="rounded-2xl border border-ink/10 bg-paper/70 p-4"
                          key={phrase.text}
                        >
                          <h4 className="font-serif text-2xl font-semibold text-ink">
                            {phrase.text}
                          </h4>
                          {phrase.jyutping ? (
                            <p className="mt-1 text-xs font-semibold tracking-[0.12em] text-clay">
                              {phrase.jyutping}
                            </p>
                          ) : null}
                          <p className="mt-3 text-sm leading-6 text-ink/68">
                            {phrase.meaning}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            <span className="rounded-full bg-sage/35 px-2 py-1 text-[0.68rem] font-semibold text-moss">
                              {phrase.scene}
                            </span>
                          </div>
                          {phrase.note ? (
                            <p className="mt-3 border-t border-ink/10 pt-3 text-xs leading-5 text-ink/50">
                              {phrase.note}
                            </p>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  </div>

                  <div className="min-h-0 overflow-y-auto rounded-[1.35rem] border border-ink/10 bg-white/45 p-4">
                    <p className="text-xs font-semibold tracking-[0.2em] text-ink/40">
                      输入清单
                    </p>
                    <div className="mt-4 space-y-3">
                      {(active.inputs ?? []).map((input) => (
                        <article
                          className="rounded-2xl border border-ink/10 bg-paper/70 p-4"
                          key={`${input.date}-${input.title}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="rounded-full bg-moss/10 px-2.5 py-1 text-[0.68rem] font-semibold text-moss">
                              {input.type}
                            </span>
                            <span className="text-xs text-ink/40">
                              {input.date}
                            </span>
                          </div>
                          <h4 className="mt-3 text-base font-semibold text-ink">
                            {input.title}
                          </h4>
                          <p className="mt-2 text-sm leading-6 text-ink/62">
                            {input.note}
                          </p>
                        </article>
                      ))}
                    </div>
                  </div>

                  <div className="min-h-0 overflow-y-auto rounded-[1.35rem] border border-ink/10 bg-white/45 p-4">
                    <p className="text-xs font-semibold tracking-[0.2em] text-ink/40">
                      学习记录
                    </p>
                    <div className="mt-4 space-y-3">
                      {(active.learningLogs ?? []).map((log) => (
                        <article
                          className="rounded-2xl border border-ink/10 bg-paper/70 p-4"
                          key={`${log.date}-${log.title}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="rounded-full bg-clay/10 px-2.5 py-1 text-[0.68rem] font-semibold text-clay">
                              {log.type}
                            </span>
                            <span className="text-xs text-ink/40">
                              {log.date}
                            </span>
                          </div>
                          <h4 className="mt-3 font-serif text-xl font-semibold text-ink">
                            {log.title}
                          </h4>
                          <p className="mt-2 text-sm leading-6 text-ink/62">
                            {log.summary}
                          </p>
                          {log.tags ? (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {log.tags.map((tag) => (
                                <span
                                  className="rounded-full bg-paper px-2 py-1 text-[0.68rem] font-semibold text-ink/50"
                                  key={tag}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              ) : active.plans || active.workouts ? (
                <div className="grid min-h-0 flex-1 gap-5 p-5 sm:p-7 lg:grid-cols-[0.95fr_1.05fr_0.9fr]">
                  <div className="min-h-0 overflow-y-auto rounded-[1.35rem] border border-ink/10 bg-white/45 p-4">
                    <p className="text-xs font-semibold tracking-[0.2em] text-ink/40">
                      当前计划
                    </p>
                    <div className="mt-4 space-y-3">
                      {(active.plans ?? []).map((plan) => (
                        <article
                          className="rounded-2xl border border-ink/10 bg-paper/70 p-4"
                          key={plan.title}
                        >
                          <p className="text-xs font-semibold text-clay">
                            {plan.focus}
                          </p>
                          <h4 className="mt-2 font-serif text-xl font-semibold text-ink">
                            {plan.title}
                          </h4>
                          <ul className="mt-3 space-y-2">
                            {plan.items.map((item) => (
                              <li
                                className="flex gap-2 text-sm leading-6 text-ink/65"
                                key={item}
                              >
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-clay" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </article>
                      ))}
                    </div>
                  </div>

                  <div className="min-h-0 overflow-y-auto rounded-[1.35rem] border border-ink/10 bg-white/45 p-4">
                    <p className="text-xs font-semibold tracking-[0.2em] text-ink/40">
                      最近训练
                    </p>
                    <div className="mt-4 space-y-3">
                      {(active.workouts ?? []).map((workout) => (
                        <article
                          className="rounded-2xl border border-ink/10 bg-paper/70 p-4"
                          key={`${workout.date}-${workout.title}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-semibold text-clay">
                              {workout.date}
                            </p>
                            <span className="rounded-full bg-clay/10 px-2.5 py-1 text-[0.68rem] font-semibold text-clay">
                              {workout.intensity}
                            </span>
                          </div>
                          <h4 className="mt-2 text-base font-semibold text-ink">
                            {workout.title}
                          </h4>
                          <p className="mt-2 text-sm leading-6 text-ink/62">
                            {workout.summary}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {workout.parts.map((part) => (
                              <span
                                className="rounded-full bg-sage/35 px-2 py-1 text-[0.68rem] font-semibold text-moss"
                                key={part}
                              >
                                {part}
                              </span>
                            ))}
                            <span className="rounded-full bg-paper px-2 py-1 text-[0.68rem] font-semibold text-ink/50">
                              {workout.duration}
                            </span>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>

                  <div className="min-h-0 overflow-y-auto space-y-4">
                    <div className="rounded-[1.35rem] border border-ink/10 bg-white/45 p-4">
                      <p className="text-xs font-semibold tracking-[0.2em] text-ink/40">
                        状态照片
                      </p>
                      <div className="mt-4 grid gap-3">
                        {active.photos.map((photo) => (
                          <article
                            className="rounded-2xl bg-gradient-to-br from-clay/20 via-paper to-fog p-3"
                            key={`${photo.label}-${photo.date ?? ""}`}
                          >
                            <div
                              className="flex min-h-28 items-end rounded-xl bg-cover bg-center p-3"
                              style={
                                photo.src
                                  ? {
                                      backgroundImage: `linear-gradient(180deg, transparent 25%, rgba(36, 50, 41, 0.58)), url(${photo.src})`,
                                    }
                                  : undefined
                              }
                            >
                              <div className="rounded-xl bg-paper/88 p-2 text-xs font-semibold text-ink/62 backdrop-blur">
                                <span className="block">{photo.label}</span>
                                {photo.date ? (
                                  <span className="mt-1 block text-[0.68rem] text-ink/42">
                                    {photo.date}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            {photo.note ? (
                              <p className="mt-2 text-xs leading-5 text-ink/55">
                                {photo.note}
                              </p>
                            ) : null}
                          </article>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[1.35rem] border border-ink/10 bg-white/45 p-4">
                      <p className="text-xs font-semibold tracking-[0.2em] text-ink/40">
                        长记录
                      </p>
                      <div className="mt-4 space-y-3">
                        {(active.essays ?? []).map((essay) => (
                          <article
                            className="rounded-2xl border border-ink/10 bg-paper/70 p-4"
                            key={`${essay.date}-${essay.title}`}
                          >
                            <span className="rounded-full bg-clay/10 px-2.5 py-1 text-[0.68rem] font-semibold text-clay">
                              {essay.type}
                            </span>
                            <h4 className="mt-3 font-serif text-xl font-semibold text-ink">
                              {essay.title}
                            </h4>
                            <p className="mt-2 text-sm leading-6 text-ink/62">
                              {essay.summary}
                            </p>
                          </article>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : active.title === "城市生活" ? (
                <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
                  <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="rounded-[1.5rem] border border-ink/10 bg-white/45 p-4">
                      {cityPhotos[0] ? (
                        <article className="group">
                          <div
                            className="flex min-h-[340px] items-end overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-lake/30 via-fog to-clay/20 bg-cover bg-center p-4"
                            style={
                              cityPhotos[0].src
                                ? {
                                    backgroundImage: `linear-gradient(180deg, transparent 30%, rgba(36, 50, 41, 0.56)), url(${cityPhotos[0].src})`,
                                  }
                                : undefined
                            }
                          >
                            <div className="w-full rounded-2xl bg-paper/88 p-4 backdrop-blur">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-moss/10 px-3 py-1 text-xs font-semibold text-moss">
                                  {cityPhotos[0].city ?? "城市"}
                                </span>
                                <span className="text-xs text-ink/45">
                                  {cityPhotos[0].date}
                                </span>
                              </div>
                              <h4 className="mt-3 font-serif text-2xl font-semibold text-ink">
                                {cityPhotos[0].label}
                              </h4>
                              {cityPhotos[0].note ? (
                                <p className="mt-2 leading-7 text-ink/65">
                                  {cityPhotos[0].note}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </article>
                      ) : null}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {cityPhotos.slice(1, 5).map((photo, index) => (
                        <article
                          className={`rounded-[1.3rem] border border-ink/10 bg-white/45 p-3 shadow-sm ${
                            index % 2 === 0 ? "rotate-[-1deg]" : "rotate-[1deg]"
                          }`}
                          key={`${photo.label}-${photo.date ?? index}`}
                        >
                          <div
                            className="flex min-h-44 items-end overflow-hidden rounded-2xl bg-gradient-to-br from-lake/25 via-fog to-clay/20 bg-cover bg-center p-3"
                            style={
                              photo.src
                                ? {
                                    backgroundImage: `linear-gradient(180deg, transparent 35%, rgba(36, 50, 41, 0.56)), url(${photo.src})`,
                                  }
                                : undefined
                            }
                          >
                            <div className="rounded-xl bg-paper/88 p-3 backdrop-blur">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-lake/10 px-2.5 py-1 text-[0.68rem] font-semibold text-lake">
                                  {photo.city ?? "城市"}
                                </span>
                                <span className="text-[0.68rem] text-ink/42">
                                  {photo.date}
                                </span>
                              </div>
                              <h5 className="mt-2 text-sm font-semibold text-ink">
                                {photo.label}
                              </h5>
                              {photo.note ? (
                                <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink/58">
                                  {photo.note}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="text-xs font-semibold tracking-[0.2em] text-ink/40">
                      按月份慢慢归档
                    </p>
                    <div className="mt-4 space-y-4">
                      {groupPhotosByMonth(cityPhotos).map(([month, photos]) => (
                        <section
                          className="rounded-[1.35rem] border border-ink/10 bg-white/35 p-4"
                          key={month}
                        >
                          <div className="mb-3 flex items-center gap-3">
                            <h4 className="text-sm font-semibold text-ink">
                              {month}
                            </h4>
                            <span className="h-px flex-1 bg-ink/10" />
                            <span className="text-xs text-ink/40">
                              {photos.length} 张
                            </span>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {photos.map((photo) => (
                              <article
                                className="rounded-2xl border border-ink/10 bg-paper/65 p-3"
                                key={`${photo.label}-${photo.date}`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <span className="rounded-full bg-moss/10 px-2.5 py-1 text-[0.68rem] font-semibold text-moss">
                                    {photo.city ?? "城市"}
                                  </span>
                                  <span className="text-xs text-ink/40">
                                    {photo.date}
                                  </span>
                                </div>
                                <h5 className="mt-3 text-sm font-semibold text-ink">
                                  {photo.label}
                                </h5>
                                {photo.note ? (
                                  <p className="mt-2 text-xs leading-5 text-ink/58">
                                    {photo.note}
                                  </p>
                                ) : null}
                              </article>
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  </div>
                </div>
              ) : active.checkins ? (
                <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
                  <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
                    <div className="rounded-[1.5rem] border border-ink/10 bg-white/45 p-5">
                      <p className="text-xs font-semibold tracking-[0.2em] text-ink/40">
                        本月打卡
                      </p>
                      <h4 className="mt-3 font-serif text-3xl font-semibold text-ink">
                        慢慢写稳
                      </h4>
                      <div className="mt-5 grid grid-cols-3 gap-3">
                        <div className="rounded-2xl bg-paper/70 p-4">
                          <p className="text-xs text-ink/45">打卡</p>
                          <p className="mt-2 text-2xl font-semibold text-ink">
                            {active.checkins.length}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-paper/70 p-4">
                          <p className="text-xs text-ink/45">最近</p>
                          <p className="mt-2 text-sm font-semibold leading-6 text-ink">
                            {active.checkins[0]?.date ?? "-"}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-paper/70 p-4">
                          <p className="text-xs text-ink/45">方向</p>
                          <p className="mt-2 text-sm font-semibold leading-6 text-ink">
                            {active.checkins[0]?.content ?? "基础练习"}
                          </p>
                        </div>
                      </div>

                      {active.checkins[0] ? (
                        <article className="mt-5 rounded-[1.3rem] border border-ink/10 bg-[#fbf7ef] p-5 shadow-sm">
                          <div
                            className="flex min-h-64 items-end rounded-2xl bg-[linear-gradient(90deg,rgba(36,50,41,0.05)_1px,transparent_1px),linear-gradient(rgba(36,50,41,0.05)_1px,transparent_1px)] bg-[length:28px_28px] p-4"
                            style={
                              active.checkins[0].src
                                ? {
                                    backgroundImage: `linear-gradient(180deg, transparent 35%, rgba(36, 50, 41, 0.36)), url(${active.checkins[0].src})`,
                                    backgroundPosition: "center",
                                    backgroundSize: "cover",
                                  }
                                : undefined
                            }
                          >
                            <div className="rounded-2xl bg-paper/90 p-4 backdrop-blur">
                              <p className="text-xs font-semibold text-clay">
                                {active.checkins[0].date}
                              </p>
                              <h5 className="mt-2 font-serif text-2xl font-semibold text-ink">
                                {active.checkins[0].label}
                              </h5>
                              {active.checkins[0].note ? (
                                <p className="mt-2 text-sm leading-6 text-ink/62">
                                  {active.checkins[0].note}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </article>
                      ) : null}
                    </div>

                    <div>
                      <p className="text-xs font-semibold tracking-[0.2em] text-ink/40">
                        纸页打卡墙
                      </p>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        {active.checkins.map((checkin, index) => (
                          <article
                            className={`rounded-[1.25rem] border border-ink/10 bg-[#fbf7ef] p-4 shadow-sm ${
                              index % 2 === 0 ? "rotate-[-1deg]" : "rotate-[1deg]"
                            }`}
                            key={`${checkin.date}-${checkin.label}`}
                          >
                            <div
                              className="flex min-h-44 items-end rounded-2xl bg-[linear-gradient(90deg,rgba(36,50,41,0.05)_1px,transparent_1px),linear-gradient(rgba(36,50,41,0.05)_1px,transparent_1px)] bg-[length:24px_24px] p-3"
                              style={
                                checkin.src
                                  ? {
                                      backgroundImage: `linear-gradient(180deg, transparent 35%, rgba(36, 50, 41, 0.36)), url(${checkin.src})`,
                                      backgroundPosition: "center",
                                      backgroundSize: "cover",
                                    }
                                  : undefined
                              }
                            >
                              <div className="rounded-xl bg-paper/90 p-3 text-xs backdrop-blur">
                                <p className="font-semibold text-clay">
                                  {checkin.date}
                                </p>
                                <h5 className="mt-1 text-sm font-semibold text-ink">
                                  {checkin.label}
                                </h5>
                                {checkin.content ? (
                                  <p className="mt-1 text-ink/55">
                                    {checkin.content}
                                  </p>
                                ) : null}
                                {checkin.duration ? (
                                  <p className="mt-1 text-ink/42">
                                    {checkin.duration}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                            {checkin.note ? (
                              <p className="mt-3 text-xs leading-5 text-ink/58">
                                {checkin.note}
                              </p>
                            ) : null}
                          </article>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : active.records || active.essays ? (
                <div className="grid min-h-0 flex-1 gap-5 p-5 sm:p-7 lg:grid-cols-[0.9fr_1.1fr_0.9fr]">
                  <div className="min-h-0 overflow-y-auto rounded-[1.35rem] border border-ink/10 bg-white/45 p-4">
                    <p className="text-xs font-semibold tracking-[0.2em] text-ink/40">
                      最近记录
                    </p>
                    <div className="mt-4 space-y-3">
                      {(active.records ?? []).map((record) => (
                        <article
                          className="rounded-2xl border border-ink/10 bg-paper/70 p-4"
                          key={`${record.date}-${record.title}`}
                        >
                          <p className="text-xs font-semibold text-clay">
                            {record.date}
                          </p>
                          <h4 className="mt-2 text-base font-semibold text-ink">
                            {record.title}
                          </h4>
                          <p className="mt-2 text-sm leading-6 text-ink/62">
                            {record.summary}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {record.tags.map((tag) => (
                              <span
                                className="rounded-full bg-sage/35 px-2 py-1 text-[0.68rem] font-semibold text-moss"
                                key={tag}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>

                  <div className="min-h-0 overflow-y-auto">
                    <div className="flex items-end justify-between gap-4">
                      <p className="text-xs font-semibold tracking-[0.2em] text-ink/40">
                        现场照片
                      </p>
                      <p className="text-xs text-ink/45">
                        维护台上传后自动带日期
                      </p>
                    </div>
                    <div className="mt-4 grid auto-rows-[118px] grid-cols-3 gap-3">
                      {active.photos.map((photo, index) => (
                        <article
                          className={`group flex min-h-0 flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-br from-moss/20 via-fog to-clay/20 bg-cover bg-center p-3 text-xs font-semibold text-ink/65 ${
                            index === 0 ? "col-span-2 row-span-2" : ""
                          }`}
                          key={`${photo.label}-${index}`}
                          style={
                            photo.src
                              ? {
                                  backgroundImage: `linear-gradient(180deg, transparent 25%, rgba(36, 50, 41, 0.58)), url(${photo.src})`,
                                }
                              : undefined
                          }
                        >
                          <div className="rounded-2xl bg-paper/88 p-2.5 backdrop-blur">
                            <div className="flex items-center justify-between gap-2">
                              <span>{photo.label}</span>
                              {photo.date ? (
                                <span className="text-[0.65rem] text-ink/45">
                                  {photo.date}
                                </span>
                              ) : null}
                            </div>
                            {photo.project ? (
                              <p className="mt-1 text-[0.68rem] leading-4 text-clay">
                                {photo.project}
                              </p>
                            ) : null}
                            {photo.note ? (
                              <p className="mt-1 line-clamp-2 text-[0.68rem] leading-4 text-ink/55">
                                {photo.note}
                              </p>
                            ) : null}
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>

                  <div className="min-h-0 overflow-y-auto rounded-[1.35rem] border border-ink/10 bg-white/45 p-4">
                    <p className="text-xs font-semibold tracking-[0.2em] text-ink/40">
                      长记录
                    </p>
                    <div className="mt-4 space-y-3">
                      {(active.essays ?? []).map((essay) => (
                        <article
                          className="rounded-2xl border border-ink/10 bg-paper/70 p-4"
                          key={`${essay.date}-${essay.title}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="rounded-full bg-clay/10 px-2.5 py-1 text-[0.68rem] font-semibold text-clay">
                              {essay.type}
                            </span>
                            <span className="text-xs text-ink/40">
                              {essay.date}
                            </span>
                          </div>
                          <h4 className="mt-3 font-serif text-xl font-semibold text-ink">
                            {essay.title}
                          </h4>
                          <p className="mt-2 text-sm leading-6 text-ink/62">
                            {essay.summary}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {essay.tags.map((tag) => (
                              <span
                                className="rounded-full bg-paper px-2 py-1 text-[0.68rem] font-semibold text-ink/50"
                                key={tag}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
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
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function groupPhotosByMonth<T extends { month?: string; date?: string }>(
  photos: T[],
) {
  const groups = new Map<string, T[]>();

  photos.forEach((photo) => {
    const month = photo.month ?? photo.date?.slice(0, 7) ?? "未归档";
    groups.set(month, [...(groups.get(month) ?? []), photo]);
  });

  return Array.from(groups.entries()).sort(([a], [b]) => b.localeCompare(a));
}
