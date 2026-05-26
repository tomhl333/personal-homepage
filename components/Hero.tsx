import { hero, heroTags } from "@/data/site";
import { ContactLanyard } from "@/components/ContactLanyard";
import { HeroActivityPanel } from "@/components/HeroActivityPanel";

export function Hero() {
  return (
    <section className="relative isolate px-5 pb-10 pt-5 sm:px-8 lg:min-h-screen lg:px-12">
      <div className="scroll-film" aria-hidden="true">
        <div className="film-strip" />
      </div>
      <ContactLanyard />

      <div className="mx-auto grid max-w-6xl gap-8 pt-5 lg:min-h-[calc(100vh-3rem)] lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-12 lg:pt-0">
        <div className="section-fade lg:-translate-y-5">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-clay sm:text-sm">
            {hero.eyebrow}
          </p>
          <h1 className="max-w-3xl font-serif text-[3.15rem] font-semibold leading-[0.98] text-ink sm:text-7xl lg:text-[5.35rem]">
            {hero.title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-ink/70 sm:text-lg sm:leading-9">
            {hero.description}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {heroTags.map((tag) => (
              <span
                className="magnetic-tag rounded-full border border-ink/10 bg-white/50 px-4 py-2 text-xs font-semibold text-ink/60 backdrop-blur"
                key={tag}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <HeroActivityPanel />
      </div>
    </section>
  );
}
