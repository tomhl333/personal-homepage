import { statusItems } from "@/data/site";
import { LineIcon } from "@/components/LineIcon";
import { SectionHeading } from "@/components/SectionHeading";

export function StatusCards() {
  return (
    <section className="px-5 py-14 sm:px-8 lg:px-12" id="status">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          align="left"
          eyebrow="Now"
          title="最近状态"
          description="先用几张轻量卡片，把最近的运动、语言和阅读状态留在首页。"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statusItems.map((item) => (
            <article
              className="spring-card group rounded-[1.4rem] border border-ink/10 bg-white/50 p-5 shadow-sm backdrop-blur hover:border-moss/25 hover:bg-white/75"
              key={item.title}
            >
              <div className="flex items-start gap-4">
                <span className={`icon-tile ${item.tone}`}>
                  <LineIcon name={item.icon} />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/40">
                    {item.english}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-ink/70">
                    {item.detail}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
