import { tags } from "@/data/site";
import { ContactPanel } from "@/components/ContactPanel";

const navItems = [
  { href: "#interests", label: "兴趣" },
  { href: "#journal", label: "记录" },
  { href: "#projects", label: "小项目" },
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
        <div className="flex items-center gap-3 sm:gap-7">
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
          <ContactPanel />
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

        <div className="section-fade delay-2 relative min-h-[460px]">
          <div className="scene-stage absolute inset-0 overflow-hidden rounded-[2rem] bg-ink shadow-soft">
            <div className="scene-light" />
            <div className="scene-window" />
            <div className="scene-card cinematic-card">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-paper/40">
                WANG-13
              </p>
              <p className="mt-5 font-serif text-4xl font-semibold leading-none text-paper">
                Still
                <br />
                Curious
              </p>
              <div className="mt-8 h-24 rounded-2xl border border-paper/20 bg-paper/10" />
              <div className="mt-5 space-y-2">
                <span className="block h-2 w-24 rounded-full bg-paper/70" />
                <span className="block h-2 w-32 rounded-full bg-paper/40" />
                <span className="block h-2 w-20 rounded-full bg-clay/80" />
              </div>
            </div>
            <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-5">
              <p className="max-w-xs font-serif text-2xl leading-tight text-paper sm:text-3xl">
                Same life.
                <br />
                Different notes.
              </p>
              <span className="rounded-full border border-paper/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-paper/70">
                Scroll
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
