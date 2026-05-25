import { journalPosts } from "@/data/site";
import { SectionHeading } from "@/components/SectionHeading";

export function Journal() {
  return (
    <section className="bg-fog/70 px-5 py-20 sm:px-8 lg:px-12" id="journal">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Journal"
          title="一些可以慢慢翻的记录"
          description="文章先放占位标题，后续可以变成训练日志、语言笔记、读书摘记和生活观察。"
        />
        <div className="grid gap-4 md:grid-cols-2">
          {journalPosts.map((title, index) => (
            <article
              className="spring-card group flex items-center justify-between gap-5 rounded-2xl border border-ink/10 bg-paper/70 p-5 hover:border-moss/30 hover:bg-paper"
              key={title}
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-clay">
                  Note {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm text-ink/50">
                  运动 / 语言 / 阅读 / 城市 / 工作复盘
                </p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/10 text-ink/50 transition group-hover:border-moss group-hover:text-moss">
                →
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
