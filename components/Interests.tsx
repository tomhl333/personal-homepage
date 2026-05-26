import { interests } from "@/data/site";
import { LineIcon } from "@/components/LineIcon";
import { SectionHeading } from "@/components/SectionHeading";

export function Interests() {
  return (
    <section className="px-5 py-16 sm:px-8 lg:px-12" id="interests">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          align="left"
          eyebrow="Interests Map"
          title="我正在投入的事"
          description="这些不是履历条目，更像一张生活版图：有训练、有语言、有阅读，也有一点工具和工作方法。"
        />
        <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {interests.map((item) => (
            <article
              className={`spring-card group flex min-h-64 flex-col justify-between rounded-[1.6rem] border border-ink/10 bg-white/50 p-6 shadow-sm backdrop-blur hover:border-moss/25 hover:bg-white/75 hover:shadow-soft ${item.className}`}
              key={item.title}
            >
              <div className="flex items-start justify-between gap-4">
                <span className={`icon-tile ${item.tone}`}>
                  <LineIcon name={item.icon} />
                </span>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/30">
                  {item.english}
                </p>
              </div>
              <div className="mt-8">
                <h3 className="font-serif text-2xl font-semibold text-ink">
                  {item.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-ink/70">
                  {item.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

