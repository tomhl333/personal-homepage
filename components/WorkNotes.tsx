import { LineIcon } from "@/components/LineIcon";

const tags = ["项目管理", "数字化实践", "复盘与成长"];

export function WorkNotes() {
  return (
    <section className="px-5 py-16 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[1.8rem] border border-ink/10 bg-white/50 shadow-soft backdrop-blur">
        <div className="grid gap-8 p-7 sm:p-9 lg:grid-cols-[0.78fr_1.22fr] lg:p-12">
          <div className="flex flex-col justify-between gap-10">
            <div>
              <span className="icon-tile bg-clay/10 text-clay">
                <LineIcon name="briefcase" />
              </span>
              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.26em] text-clay">
                Work, but lightly
              </p>
              <h2 className="mt-4 font-serif text-3xl font-semibold text-ink sm:text-4xl">
                工作也是生活的一部分
              </h2>
            </div>
            <div className="hidden h-px bg-ink/10 lg:block" />
          </div>
          <div>
            <p className="text-base leading-9 text-ink/70 sm:text-lg">
              我从事数字化和项目管理相关工作，日常会接触系统、流程、业务和团队协同。相比展示职位和履历，我更愿意记录那些让我成长的项目经验、沟通方法和复盘思考。工作不是这个网站的主角，但它确实塑造了我看问题和做事情的方式。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {tags.map((tag) => (
                <span
                  className="rounded-full bg-moss/10 px-4 py-2 text-sm font-semibold text-moss"
                  key={tag}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

