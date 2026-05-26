import { projects } from "@/data/site";
import { LineIcon } from "@/components/LineIcon";
import { SectionHeading } from "@/components/SectionHeading";

export function Projects() {
  return (
    <section className="px-5 py-16 sm:px-8 lg:px-12" id="projects">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          align="left"
          eyebrow="Small Projects"
          title="我折腾过的小东西"
          description="不是正式作品集，更像把生活里的小想法做成可以使用、可以继续迭代的工具。"
        />
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <article
              className="spring-card group rounded-[1.6rem] border border-ink/10 bg-white/50 p-6 shadow-sm backdrop-blur hover:border-moss/25 hover:bg-white/75 hover:shadow-soft"
              key={project.title}
            >
              <div className="flex items-start justify-between gap-4">
                <span className="icon-tile bg-moss/10 text-moss">
                  <LineIcon name="spark" />
                </span>
                <span className="rounded-full bg-clay/10 px-3 py-1 text-xs font-semibold text-clay">
                  {project.status}
                </span>
              </div>
              <h3 className="mt-8 font-serif text-2xl font-semibold text-ink">
                {project.title}
              </h3>
              <p className="mt-4 leading-8 text-ink/70">
                {project.description}
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    className="rounded-full border border-ink/10 bg-paper/60 px-3 py-1.5 text-xs font-semibold text-ink/60"
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
    </section>
  );
}

