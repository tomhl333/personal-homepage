export function WorkNotes() {
  return (
    <section className="px-5 py-20 sm:px-8 lg:px-12">
      <div className="mx-auto grid max-w-6xl gap-10 rounded-[2rem] border border-ink/10 bg-white/50 p-7 shadow-soft backdrop-blur md:grid-cols-[0.9fr_1.1fr] md:p-10">
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.26em] text-clay">
            Work, but lightly
          </p>
          <h2 className="font-serif text-3xl font-semibold text-ink sm:text-4xl">
            工作也是生活的一部分
          </h2>
        </div>
        <div>
          <p className="text-base leading-9 text-ink/70 sm:text-lg">
            我从事数字化和项目管理相关工作，日常会接触系统、流程、业务和团队协同。相比展示职位和履历，我更愿意记录那些让我成长的项目经验、沟通方法和复盘思考。
          </p>
          <p className="mt-4 text-base leading-9 text-ink/70 sm:text-lg">
            工作不是这个网站的主角，但它确实塑造了我看问题和做事情的方式。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {["项目管理", "数字化实践", "复盘与成长"].map((tag) => (
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
    </section>
  );
}
