import { interests } from "@/data/site";
import { SectionHeading } from "@/components/SectionHeading";

export function Interests() {
  return (
    <section className="px-5 py-20 sm:px-8 lg:px-12" id="interests">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Interests"
          title="认真生活，也认真好玩"
          description="这些兴趣不需要立刻产生成果，它们更像是让生活保持流动的方式。"
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {interests.map((item, index) => (
            <article
              className="spring-card group min-h-64 rounded-2xl border border-ink/10 bg-white/60 p-6 shadow-sm hover:bg-white/75 hover:shadow-soft"
              key={item.title}
            >
              <div
                className={`mb-8 inline-flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold ${item.accent}`}
              >
                {String(index + 1).padStart(2, "0")}
              </div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-ink/40">
                {item.english}
              </p>
              <h3 className="font-serif text-2xl font-semibold text-ink">
                {item.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-ink/70">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
