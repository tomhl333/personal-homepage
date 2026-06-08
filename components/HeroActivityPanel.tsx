"use client";

import { useEffect, useState, type CSSProperties, type TouchEvent } from "react";
import { ImageLightbox, type LightboxImage } from "@/components/ImageLightbox";
import { activitySpotlights } from "@/data/site";
import { LineIcon } from "@/components/LineIcon";
import { resolveMediaPath } from "@/lib/media";
import type { PhotoItem } from "@/data/site";

export function HeroActivityPanel() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [activeBookIndex, setActiveBookIndex] = useState(0);
  const [coverTouchStart, setCoverTouchStart] = useState<number | null>(null);
  const [coverDragOffset, setCoverDragOffset] = useState(0);
  const [previewImage, setPreviewImage] = useState<LightboxImage | null>(null);
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
  const isWorkNotesActive = active?.uploadDir === "/uploads/work-notes";
  const isSimpleSportActive =
    active?.uploadDir === "/uploads/tennis" ||
    active?.uploadDir === "/uploads/swimming";
  const hidesLongRecords = isSimpleSportActive || isWorkNotesActive;
  const readableTextClass = "whitespace-pre-line [overflow-wrap:anywhere]";

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
    setActiveBookIndex(0);
  }, [activeIndex]);

  function changeActiveCover(step: number, total: number) {
    if (total <= 0) return;
    setActiveBookIndex((index) =>
      Math.min(total - 1, Math.max(0, index + step)),
    );
  }

  function handleCoverTouchEnd(
    event: TouchEvent<HTMLDivElement>,
    total: number,
  ) {
    if (coverTouchStart === null) return;
    const delta = event.changedTouches[0].clientX - coverTouchStart;
    setCoverTouchStart(null);
    setCoverDragOffset(0);
    if (Math.abs(delta) < 32) return;
    const distance = Math.min(3, Math.max(1, Math.floor(Math.abs(delta) / 72)));
    changeActiveCover(delta < 0 ? distance : -distance, total);
  }

  function handleCoverTouchMove(
    event: TouchEvent<HTMLDivElement>,
    total: number,
  ) {
    if (coverTouchStart === null) return;
    const delta = event.touches[0].clientX - coverTouchStart;
    if ((activeBookIndex === 0 && delta > 0) || (activeBookIndex >= total - 1 && delta < 0)) {
      setCoverDragOffset(0);
      return;
    }
    setCoverDragOffset(Math.max(-112, Math.min(112, delta)));
  }

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
              点击查看记录和照片
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
          className="fixed inset-0 z-50 overflow-x-hidden overflow-y-auto bg-ink/35 px-4 py-6 backdrop-blur-sm sm:px-6 sm:py-8"
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveIndex(null)}
        >
          <div
            className="mx-auto min-h-full w-full max-w-5xl py-1 sm:py-2"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex min-h-[calc(100dvh-1.5rem)] min-w-0 flex-col overflow-x-hidden overflow-y-visible rounded-[1.25rem] bg-paper text-ink shadow-soft sm:max-h-[calc(100vh-4rem)] sm:min-h-0 sm:overflow-hidden sm:rounded-[1.8rem]">
              <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-ink/10 bg-paper/92 p-4 backdrop-blur sm:gap-5 sm:p-7">
                <div className="flex items-start gap-4">
                  <span className={`icon-tile hidden sm:grid ${active.tone}`}>
                    <LineIcon name={active.icon} />
                  </span>
                  <div>
                    <p className="text-xs font-semibold tracking-[0.22em] text-clay">
                      {active.title}
                    </p>
                    <h3 className="mt-2 font-serif text-2xl font-semibold leading-tight sm:text-4xl">
                      {active.status}
                    </h3>
                    <p className={`mt-2 max-w-2xl text-sm leading-6 text-ink/65 sm:mt-3 sm:text-base sm:leading-7 ${readableTextClass}`}>
                      {active.summary}
                    </p>
                  </div>
                </div>
                <button
                  className="shrink-0 rounded-full border border-ink/10 px-3 py-2 text-sm font-semibold text-ink/60 transition hover:border-moss hover:text-moss sm:px-4"
                  onClick={() => setActiveIndex(null)}
                  type="button"
                >
                  关闭
                </button>
              </div>

              {active.books ? (
                <div className="grid min-h-0 min-w-0 flex-1 gap-5 p-4 sm:gap-7 sm:p-7 lg:grid-cols-[1.05fr_0.95fr]">
                  <div className="min-h-0 lg:overflow-y-auto lg:pr-2">
                    <div className="flex items-end justify-between gap-4">
                      <p className="text-xs font-semibold tracking-[0.2em] text-ink/40">
                        书架
                      </p>
                      <p className="text-xs text-ink/45">
                        点击书封查看摘抄和想法
                      </p>
                    </div>

                    <div
                      className="relative mt-4 h-[18.5rem] w-full max-w-full touch-pan-y select-none overflow-hidden sm:grid sm:h-auto sm:grid-cols-4 sm:gap-4 sm:overflow-visible"
                      onTouchEnd={(event) =>
                        handleCoverTouchEnd(event, active.books?.length ?? 0)
                      }
                      onTouchMove={(event) =>
                        handleCoverTouchMove(event, active.books?.length ?? 0)
                      }
                      onTouchStart={(event) =>
                        setCoverTouchStart(event.touches[0].clientX)
                      }
                      style={coverFlowStyle(coverDragOffset)}
                    >
                      {active.books.map((book, index) => (
                        <button
                          className={`group absolute left-1/2 top-0 w-36 text-center sm:static sm:w-auto sm:text-left ${coverTouchStart === null ? "transition-[opacity,transform] duration-500 ease-out" : "transition-none"} ${coverFlowClass(index - activeBookIndex)}`}
                          key={book.title}
                          onClick={() => setActiveBookIndex(index)}
                          type="button"
                        >
                          <span
                            className={`relative block aspect-[3/4] overflow-hidden rounded-r-xl rounded-l-sm border bg-gradient-to-br ${book.coverTone} shadow-sm transition duration-300 ${
                              index === activeBookIndex
                                ? "border-moss/40 shadow-soft"
                                : "border-ink/10 group-hover:border-moss/25"
                            }`}
                            style={
                              book.cover
                                ? {
                                    backgroundImage: `url(${resolveMediaPath(book.cover)})`,
                                    backgroundPosition: "center",
                                    backgroundSize: "cover",
                                  }
                                : undefined
                            }
                          >
                            {book.cover ? null : (
                              <span className="relative flex h-full flex-col justify-between p-3">
                                <span className="text-[0.64rem] font-semibold tracking-[0.18em] text-ink/45">
                                  {book.status}
                                </span>
                                <span>
                                  <span className="absolute inset-y-0 left-0 w-3 bg-ink/10" />
                                  <span className="absolute inset-x-3 top-3 h-px bg-white/60" />
                                <span className="block font-serif text-lg font-semibold leading-tight text-ink">
                                  {book.title}
                                </span>
                                <span className="mt-2 block text-xs leading-5 text-ink/55">
                                  {book.author}
                                </span>
                              </span>
                              </span>
                            )}
                          </span>
                          <span className="mt-2 block line-clamp-2 text-xs font-semibold leading-5 text-ink/75 sm:mt-3 sm:text-sm">
                            {book.title}
                          </span>
                          <span className="mt-1 block truncate text-xs text-ink/45">
                            {book.author}
                          </span>
                        </button>
                      ))}
                      {active.books.length > 1 ? (
                        <>
                          <button
                            aria-label="上一本"
                            className="absolute left-0 top-[5.2rem] z-20 grid h-10 w-10 place-items-center rounded-full border border-ink/10 bg-paper/80 text-lg font-semibold text-ink/60 shadow-sm backdrop-blur transition disabled:pointer-events-none disabled:opacity-25 sm:hidden"
                            disabled={activeBookIndex === 0}
                            onClick={() => changeActiveCover(-1, active.books?.length ?? 0)}
                            type="button"
                          >
                            ‹
                          </button>
                          <button
                            aria-label="下一本文"
                            className="absolute right-0 top-[5.2rem] z-20 grid h-10 w-10 place-items-center rounded-full border border-ink/10 bg-paper/80 text-lg font-semibold text-ink/60 shadow-sm backdrop-blur transition disabled:pointer-events-none disabled:opacity-25 sm:hidden"
                            disabled={activeBookIndex >= active.books.length - 1}
                            onClick={() => changeActiveCover(1, active.books?.length ?? 0)}
                            type="button"
                          >
                            ›
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="min-h-0 min-w-0 max-w-full overflow-hidden rounded-[1.4rem] border border-ink/10 bg-white/45 p-4 sm:overflow-y-auto sm:p-5">
                    {activeBook ? (
                      <>
                        <p className="text-xs font-semibold tracking-[0.2em] text-clay">
                          摘抄和想法
                        </p>
                        <h4 className="mt-3 font-serif text-2xl font-semibold text-ink sm:text-3xl">
                          {activeBook.title}
                        </h4>
                        <p className="mt-2 text-sm text-ink/55">
                          {activeBook.author}
                        </p>
                        {activeBook.notes.length > 0 ? (
                          <div className="mt-5 space-y-3">
                            {activeBook.notes.map((note) => (
                              <article
                                className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-ink/10 bg-paper/70 p-4"
                                key={note.text}
                              >
                                <p className="text-xs font-semibold tracking-[0.18em] text-ink/40">
                                  {note.type}
                                </p>
                                <p className={`mt-2 text-sm leading-7 text-ink/70 ${readableTextClass}`}>
                                  {note.text}
                                </p>
                              </article>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-5 min-w-0 max-w-full overflow-hidden rounded-2xl border border-ink/10 bg-paper/55 p-5">
                            <p className={`text-sm leading-7 text-ink/58 ${readableTextClass}`}>
                              这本书还没留下摘抄。先放在书架上，等读到有意思的句子再慢慢补上。
                            </p>
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>
              ) : active.shows ? (
                <div className="grid min-h-0 min-w-0 flex-1 gap-5 p-4 sm:gap-7 sm:p-7 lg:grid-cols-[1.08fr_0.92fr]">
                  <div className="min-h-0 lg:overflow-y-auto lg:pr-1">
                    <div className="space-y-6">
                      <section>
                        <div
                          className="relative h-[20.5rem] w-full max-w-full touch-pan-y select-none overflow-hidden sm:grid sm:h-auto sm:grid-cols-3 sm:gap-4 sm:overflow-visible"
                          onTouchEnd={(event) =>
                            handleCoverTouchEnd(event, active.shows?.length ?? 0)
                          }
                          onTouchMove={(event) =>
                            handleCoverTouchMove(event, active.shows?.length ?? 0)
                          }
                          onTouchStart={(event) =>
                            setCoverTouchStart(event.touches[0].clientX)
                          }
                          style={coverFlowStyle(coverDragOffset)}
                        >
                              {active.shows.map((show, index) => (
                                <button
                                  className={`group absolute left-1/2 top-0 w-40 text-center sm:static sm:w-auto sm:text-left ${coverTouchStart === null ? "transition-[opacity,transform] duration-500 ease-out" : "transition-none"} ${coverFlowClass(index - activeBookIndex)}`}
                                  key={show.title}
                                  onClick={() => setActiveBookIndex(index)}
                                  type="button"
                                >
                                  <span
                                    className={`relative block aspect-[2/3] overflow-hidden rounded-[1.25rem] border bg-gradient-to-br ${show.posterTone} shadow-sm transition duration-300 ${
                                      index === activeBookIndex
                                        ? "border-moss/40 shadow-soft"
                                        : "border-ink/10 group-hover:border-moss/25"
                                    }`}
                                    style={
                                      show.poster
                                        ? {
                                            backgroundImage: `url(${resolveMediaPath(show.poster)})`,
                                            backgroundPosition: "center",
                                            backgroundSize: "cover",
                                          }
                                        : undefined
                                    }
                                  >
                                    <span className="absolute left-2 top-2 z-10 rounded-full border border-white/70 bg-paper/95 px-2.5 py-1 text-[0.64rem] font-black text-moss shadow-sm backdrop-blur">
                                      {show.kind === "电影" ? "电影" : "剧集"}
                                    </span>
                                    {show.poster ? null : (
                                      <>
                                        <span className="absolute inset-0 bg-[radial-gradient(circle_at_70%_15%,rgba(255,255,255,0.24),transparent_7rem),linear-gradient(160deg,transparent_35%,rgba(0,0,0,0.22))]" />
                                        <span className="relative flex h-full flex-col justify-between p-4">
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
                                      </>
                                    )}
                                  </span>
                                  <span className="mt-2 block line-clamp-1 text-xs font-semibold text-ink/75 sm:mt-3 sm:text-sm">
                                    {show.title}
                                  </span>
                                  <span className="mt-1 block text-xs text-ink/45">
                                    {show.creator}
                                  </span>
                                </button>
                              ))}
                          {active.shows.length > 1 ? (
                            <>
                              <button
                                aria-label="上一部"
                                className="absolute left-0 top-[6.2rem] z-20 grid h-10 w-10 place-items-center rounded-full border border-ink/10 bg-paper/80 text-lg font-semibold text-ink/60 shadow-sm backdrop-blur transition disabled:pointer-events-none disabled:opacity-25 sm:hidden"
                                disabled={activeBookIndex === 0}
                                onClick={() => changeActiveCover(-1, active.shows?.length ?? 0)}
                                type="button"
                              >
                                ‹
                              </button>
                              <button
                                aria-label="下一部"
                                className="absolute right-0 top-[6.2rem] z-20 grid h-10 w-10 place-items-center rounded-full border border-ink/10 bg-paper/80 text-lg font-semibold text-ink/60 shadow-sm backdrop-blur transition disabled:pointer-events-none disabled:opacity-25 sm:hidden"
                                disabled={activeBookIndex >= active.shows.length - 1}
                                onClick={() => changeActiveCover(1, active.shows?.length ?? 0)}
                                type="button"
                              >
                                ›
                              </button>
                            </>
                          ) : null}
                        </div>
                      </section>
                    </div>
                  </div>

                  <div className="min-h-0 min-w-0 max-w-full overflow-hidden rounded-[1.4rem] border border-ink/10 bg-white/45 p-4 sm:overflow-y-auto sm:p-5">
                    {activeShow ? (
                      <>
                        <p className="text-xs font-semibold tracking-[0.2em] text-clay">
                          角色和剧情
                        </p>
                        <h4 className="mt-3 font-serif text-2xl font-semibold text-ink sm:text-3xl">
                          {activeShow.title}
                        </h4>
                        {formatShowMeta(activeShow).length > 0 ? (
                          <p className="mt-2 text-sm text-ink/55">
                            {formatShowMeta(activeShow)}
                          </p>
                        ) : null}

                        {activeShow.characters.length > 0 ? (
                          <div className="mt-5">
                            <p className="text-xs font-semibold tracking-[0.18em] text-ink/40">
                              喜欢的人物
                            </p>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              {activeShow.characters.map((character) => (
                                <article
                                  className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-ink/10 bg-paper/70 p-4"
                                  key={character.name}
                                >
                                  <h5 className="font-semibold text-ink">
                                    {character.name}
                                  </h5>
                                  <p className={`mt-2 text-sm leading-6 text-ink/62 ${readableTextClass}`}>
                                    {character.note}
                                  </p>
                                </article>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {activeShow.notes.length > 0 ? (
                          <div className="mt-5 space-y-3">
                            {activeShow.notes.map((note) => (
                              <article
                                className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-ink/10 bg-paper/70 p-4"
                                key={note.text}
                              >
                                <p className="text-xs font-semibold tracking-[0.18em] text-ink/40">
                                  {note.type}
                                </p>
                                <p className={`mt-2 text-sm leading-7 text-ink/70 ${readableTextClass}`}>
                                  {note.text}
                                </p>
                              </article>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-5 min-w-0 max-w-full overflow-hidden rounded-2xl border border-ink/10 bg-paper/55 p-5">
                            <p className={`text-sm leading-7 text-ink/58 ${readableTextClass}`}>
                              这部还没写下记录。先留在片单里，等哪一段人物或台词打动我再补上。
                            </p>
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>
              ) : active.phrases || active.learningLogs ? (
                <div className="grid min-h-0 flex-1 gap-5 p-5 sm:p-7 lg:grid-cols-2">
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
                          <p className={`mt-3 text-sm leading-6 text-ink/68 ${readableTextClass}`}>
                            {phrase.meaning}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            <span className="rounded-full bg-sage/35 px-2 py-1 text-[0.68rem] font-semibold text-moss">
                              {phrase.scene}
                            </span>
                          </div>
                          {phrase.note ? (
                            <p className={`mt-3 border-t border-ink/10 pt-3 text-xs leading-5 text-ink/50 ${readableTextClass}`}>
                              {phrase.note}
                            </p>
                          ) : null}
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
                          <p className={`mt-2 text-sm leading-6 text-ink/62 ${readableTextClass}`}>
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
                <div className="grid min-h-0 flex-1 gap-5 p-5 sm:p-7 lg:grid-cols-2">
                  <div className="min-h-0 overflow-y-auto rounded-[1.35rem] border border-ink/10 bg-white/45 p-4">
                    <p className="text-xs font-semibold tracking-[0.2em] text-ink/40">
                      纯文字训练
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
                          <p className={`mt-2 text-sm leading-6 text-ink/62 ${readableTextClass}`}>
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

                  <div className="min-h-0 overflow-y-auto rounded-[1.35rem] border border-ink/10 bg-white/45 p-4">
                    <p className="text-xs font-semibold tracking-[0.2em] text-ink/40">
                      带照片训练
                    </p>
                    <div className="mt-4 grid gap-3">
                      {active.photos.filter(hasRealPhoto).map((photo) => (
                        <article
                          className="rounded-2xl border border-ink/10 bg-paper/70 p-3"
                          key={`${photo.label}-${photo.date ?? ""}`}
                        >
                          <PhotoPreviewButton
                            className="min-h-36"
                            key={`${photo.label}-${photo.date ?? ""}`}
                            onOpen={setPreviewImage}
                            photo={photo}
                          />
                          {photo.note ? (
                            <p className={`mt-3 text-sm leading-6 text-ink/62 ${readableTextClass}`}>
                              {photo.note}
                            </p>
                          ) : null}
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {photo.tags?.map((tag) => (
                              <span
                                className="rounded-full bg-sage/35 px-2 py-1 text-[0.68rem] font-semibold text-moss"
                                key={tag}
                              >
                                {tag}
                              </span>
                            ))}
                            {photo.date ? (
                              <span className="rounded-full bg-paper px-2 py-1 text-[0.68rem] font-semibold text-ink/50">
                                {photo.date}
                              </span>
                            ) : null}
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>

                </div>
              ) : active.title === "城市生活" ? (
                <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
                  <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="rounded-[1.5rem] border border-ink/10 bg-white/45 p-4">
                      {cityPhotos[0] ? (
                        <PhotoPreviewButton
                          className="min-h-[340px] rounded-[1.25rem]"
                          eyebrow={cityPhotos[0].city}
                          onOpen={setPreviewImage}
                          photo={cityPhotos[0]}
                        />
                      ) : null}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {cityPhotos.slice(1, 5).map((photo, index) => (
                        <div
                          className={`rounded-[1.3rem] border border-ink/10 bg-white/45 p-3 shadow-sm ${
                            index % 2 === 0 ? "rotate-[-1deg]" : "rotate-[1deg]"
                          }`}
                          key={`${photo.label}-${photo.date ?? index}`}
                        >
                          <PhotoPreviewButton
                            className="min-h-44"
                            eyebrow={photo.city}
                            onOpen={setPreviewImage}
                            photo={photo}
                          />
                        </div>
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
                                  <p className={`mt-2 text-xs leading-5 text-ink/58 ${readableTextClass}`}>
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
                          <PhotoPreviewButton
                            className="min-h-64 rounded-2xl"
                            onOpen={setPreviewImage}
                            photo={checkinToPhoto(active.checkins[0])}
                          />
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
                            <PhotoPreviewButton
                              className="min-h-44"
                              onOpen={setPreviewImage}
                              photo={checkinToPhoto(checkin)}
                            />
                            {checkin.note ? (
                              <p className={`mt-3 text-xs leading-5 text-ink/58 ${readableTextClass}`}>
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
                isWorkNotesActive ? (
                <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-7">
                  <div className="mx-auto max-w-3xl">
                    <div className="flex items-end justify-between gap-4">
                      <p className="text-xs font-semibold tracking-[0.2em] text-ink/40">
                        文字札记
                      </p>
                      <p className="text-xs text-ink/45">
                        摘抄、感悟和小观察
                      </p>
                    </div>
                    <div className="mt-5 space-y-6">
                      {groupPhotosByMonth(active.records ?? []).map(([month, records]) => (
                        <section key={month}>
                          <div className="mb-3 flex items-center gap-3">
                            <h4 className="text-sm font-semibold text-ink">
                              {month}
                            </h4>
                            <span className="h-px flex-1 bg-ink/10" />
                            <span className="text-xs text-ink/40">
                              {records.length} 条
                            </span>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {records.map((record) => (
                              <article
                                className="rounded-[1.25rem] border border-ink/10 bg-paper/70 p-4"
                                key={`${record.date}-${record.title}`}
                              >
                                <p className="text-xs font-semibold text-clay">
                                  {record.date}
                                </p>
                                <h4 className="mt-2 text-lg font-semibold text-ink">
                                  {record.title}
                                </h4>
                                <p className={`mt-3 text-sm leading-7 text-ink/68 ${readableTextClass}`}>
                                  {record.summary}
                                </p>
                                <div className="mt-4 flex flex-wrap gap-1.5">
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
                        </section>
                      ))}
                    </div>
                  </div>
                </div>
                ) : (
                <div className={`grid min-h-0 flex-1 gap-4 p-4 sm:gap-5 sm:p-7 ${
                  hidesLongRecords
                    ? "lg:grid-cols-[0.95fr_1.05fr]"
                    : "lg:grid-cols-[0.9fr_1.1fr_0.9fr]"
                }`}>
                  <div className="min-h-0 rounded-[1.35rem] border border-ink/10 bg-white/45 p-4 lg:overflow-y-auto">
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
                          <p className={`mt-2 text-sm leading-6 text-ink/62 ${readableTextClass}`}>
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

                  <div className="min-h-0 lg:overflow-y-auto">
                    <div className="flex items-end justify-between gap-4">
                      <p className="text-xs font-semibold tracking-[0.2em] text-ink/40">
                        {isSimpleSportActive ? "训练照片" : isWorkNotesActive ? "随手照片" : "现场照片"}
                      </p>
                      <p className="text-xs text-ink/45">
                        维护台上传后自动带日期
                      </p>
                    </div>
                    <div className="mt-4 grid auto-rows-[96px] grid-cols-2 gap-3 sm:auto-rows-[118px] sm:grid-cols-3">
                      {active.photos.filter(hasRealPhoto).map((photo, index) => (
                        <PhotoPreviewButton
                          className={`min-h-0 ${
                            index === 0 ? "col-span-2 row-span-2 sm:col-span-2" : ""
                          }`}
                          key={`${photo.label}-${index}`}
                          eyebrow={photo.project}
                          onOpen={setPreviewImage}
                          photo={photo}
                        />
                      ))}
                    </div>
                  </div>

                  {hidesLongRecords ? null : <div className="min-h-0 rounded-[1.35rem] border border-ink/10 bg-white/45 p-4 lg:overflow-y-auto">
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
                          <p className={`mt-2 text-sm leading-6 text-ink/62 ${readableTextClass}`}>
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
                  </div>}
                </div>
                )
              ) : (
              <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[0.88fr_1.12fr]">
                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] text-ink/40">
                    最近记录
                  </p>
                  <div className="mt-4 space-y-3">
                    {active.notes.map((note) => (
                      <article
                        className={`rounded-2xl border border-ink/10 bg-white/50 px-4 py-3 text-sm leading-6 text-ink/70 ${readableTextClass}`}
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
                    <p className={`mt-3 text-sm leading-7 text-ink/65 ${readableTextClass}`}>
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
                      <PhotoPreviewButton
                        className={`${
                          index === 0 ? "col-span-2 row-span-2" : ""
                        }`}
                        key={`${photo.label}-${index}`}
                        onOpen={setPreviewImage}
                        photo={photo}
                      />
                    ))}
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-ink/10 bg-white/45 p-4">
                      <p className="text-xs font-semibold tracking-[0.18em] text-ink/40">
                        可扩展内容
                      </p>
                      <p className={`mt-2 text-sm leading-6 text-ink/65 ${readableTextClass}`}>
                        训练数据、路线、读书摘句、语言词卡都可以放进来。
                      </p>
                    </div>
                    <div className="rounded-2xl border border-ink/10 bg-white/45 p-4">
                      <p className="text-xs font-semibold tracking-[0.18em] text-ink/40">
                        后续形态
                      </p>
                      <p className={`mt-2 text-sm leading-6 text-ink/65 ${readableTextClass}`}>
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
      <ImageLightbox
        image={previewImage}
        onClose={() => setPreviewImage(null)}
      />
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

function formatShowMeta(show: {
  kind?: string;
  creator?: string;
  meta?: string;
}) {
  return [show.kind, show.creator, show.meta]
    .map((item) => item?.trim())
    .filter(Boolean)
    .join(" · ");
}

function coverFlowClass(position: number) {
  if (position === 0) {
    return "z-20 translate-x-[calc(-50%+var(--cover-drag))] scale-100 opacity-100 sm:translate-x-0";
  }

  if (position === -1) {
    return "z-10 translate-x-[calc(-118%+var(--cover-drag))] scale-90 opacity-80 sm:translate-x-0 sm:scale-100 sm:opacity-100";
  }

  if (position === 1) {
    return "z-10 translate-x-[calc(18%+var(--cover-drag))] scale-90 opacity-80 sm:translate-x-0 sm:scale-100 sm:opacity-100";
  }

  if (position === -2) {
    return "z-0 translate-x-[calc(-178%+var(--cover-drag))] scale-75 opacity-35 sm:translate-x-0 sm:scale-100 sm:opacity-100";
  }

  if (position === 2) {
    return "z-0 translate-x-[calc(78%+var(--cover-drag))] scale-75 opacity-35 sm:translate-x-0 sm:scale-100 sm:opacity-100";
  }

  return "pointer-events-none z-0 translate-x-[calc(-50%+var(--cover-drag))] scale-75 opacity-0 sm:pointer-events-auto sm:translate-x-0 sm:scale-100 sm:opacity-100";
}

function coverFlowStyle(offset: number) {
  return { "--cover-drag": `${offset}px` } as CSSProperties;
}

function hasRealPhoto(photo: PhotoItem) {
  return Boolean(resolveMediaPath(photo.src));
}

function PhotoPreviewButton({
  className = "",
  eyebrow,
  onOpen,
  photo,
}: {
  className?: string;
  eyebrow?: string;
  onOpen: (image: LightboxImage) => void;
  photo: PhotoItem;
}) {
  const src = resolveMediaPath(photo.src);
  const hasImage = Boolean(src);
  const meta = [eyebrow, photo.date].filter(Boolean).join(" · ");

  return (
    <button
      className={`group relative block min-h-40 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-moss/20 via-fog to-clay/20 bg-cover bg-center text-left shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-soft ${hasImage ? "cursor-zoom-in" : "cursor-default"} ${className}`}
      onClick={() => {
        if (src) {
          onOpen({
            date: photo.date,
            label: photo.label,
            note: photo.note,
            src,
          });
        }
      }}
      style={
        src
          ? {
              backgroundImage: `url("${src}")`,
            }
          : undefined
      }
      type="button"
    >
      {src ? null : (
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.34),transparent_7rem),linear-gradient(135deg,rgba(49,80,68,0.22),rgba(201,111,50,0.14))]" />
      )}
      <span className="absolute inset-0 z-10 bg-[linear-gradient(180deg,transparent_45%,rgba(14,22,18,0.10)_68%,rgba(14,22,18,0.64)_100%)] transition duration-300 group-hover:bg-[linear-gradient(180deg,transparent_38%,rgba(14,22,18,0.14)_64%,rgba(14,22,18,0.72)_100%)]" />
      <span className="absolute inset-x-3 bottom-3 z-20 block text-white drop-shadow-[0_2px_8px_rgba(14,22,18,0.5)]">
        {meta ? (
          <span className="mb-1 block text-[0.68rem] font-semibold tracking-[0.08em] text-white/70">
            {meta}
          </span>
        ) : null}
        <span className="block text-sm font-semibold leading-5">
          {photo.label}
        </span>
        {photo.note ? (
          <span className="mt-1 line-clamp-2 block text-xs font-medium leading-5 text-white/82">
            {photo.note}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function checkinToPhoto(checkin: {
  content?: string;
  date: string;
  label: string;
  note?: string;
  src?: string;
}): PhotoItem {
  return {
    date: checkin.date,
    label: checkin.label,
    note: checkin.note ?? checkin.content,
    src: checkin.src,
  };
}
