import { tags } from "@/data/site";

const navItems = [
  { href: "#interests", label: "兴趣" },
  { href: "#journal", label: "记录" },
  { href: "#projects", label: "小项目" },
  { href: "#contact", label: "联系" },
];

export function Hero() {
  return (
    <section className="relative isolate px-5 pb-20 pt-6 sm:px-8 lg:px-12">
      <div className="scroll-film" aria-hidden="true">
        <div className="film-strip" />
      </div>
      <nav className="mx-auto flex max-w-6xl items-center justify-between border-b border-ink/10 pb-5">
        <a className="font-serif text-lg font-semibold text-ink" href="#">
          Still Curious
        </a>
        <div className="hidden items-center gap-7 text-sm text-ink/70 sm:flex">
          {navItems.map((item) => (
            <a
              className="transition hover:text-moss"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="mx-auto grid max-w-6xl gap-12 pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:pt-28">
        <div className="section-fade">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.28em] text-clay">
            A personal life journal
          </p>
          <h1 className="max-w-3xl font-serif text-5xl font-semibold leading-tight text-ink sm:text-6xl lg:text-7xl">
            人到中途，仍然好奇
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-9 text-ink/70 sm:text-xl">
            打球、游泳、健身，学粤语和西班牙语，读一点书，记录城市和生活，也认真做一些有意思的事。
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a
              className="spring-link rounded-full bg-moss px-6 py-3 text-center text-sm font-semibold text-paper shadow-soft hover:bg-ink"
              href="#interests"
            >
              看看我的兴趣
            </a>
            <a
              className="spring-link rounded-full border border-ink/20 px-6 py-3 text-center text-sm font-semibold text-ink hover:border-moss hover:text-moss"
              href="#journal"
            >
              看看我的记录
            </a>
            <a
              className="spring-link rounded-full border border-ink/20 px-6 py-3 text-center text-sm font-semibold text-ink hover:border-clay hover:text-clay"
              href="#projects"
            >
              看看我做的小东西
            </a>
          </div>
        </div>

        <div className="section-fade delay-2 relative min-h-[420px]">
          <div className="absolute right-0 top-0 h-72 w-56 rounded-t-full bg-moss/90 shadow-soft sm:h-80 sm:w-64" />
          <div className="absolute bottom-8 left-0 h-72 w-56 rounded-b-full bg-lake/80 shadow-soft sm:h-80 sm:w-64" />
          <div className="cinematic-card absolute inset-x-8 top-20 rounded-[2rem] border border-paper/80 bg-paper/80 p-6 shadow-soft backdrop-blur">
            <p className="font-serif text-2xl text-ink">Life, notes, tools.</p>
            <p className="mt-4 text-sm leading-7 text-ink/70">
              一点训练，一点语言，一点阅读。把日子过成可以回看的材料。
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3 text-sm">
              <span className="border-t border-ink/10 pt-3 text-ink/70">
                Routine
              </span>
              <span className="border-t border-ink/10 pt-3 text-ink/70">
                Curiosity
              </span>
              <span className="border-t border-ink/10 pt-3 text-ink/70">
                Practice
              </span>
              <span className="border-t border-ink/10 pt-3 text-ink/70">
                Reflection
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="section-fade delay-3 mx-auto mt-12 flex max-w-6xl flex-wrap gap-3">
        {tags.map((tag) => (
          <span
            className="magnetic-tag rounded-full border border-ink/10 bg-white/50 px-4 py-2 text-xs font-medium text-ink/70 backdrop-blur"
            key={tag}
          >
            {tag}
          </span>
        ))}
      </div>
    </section>
  );
}
