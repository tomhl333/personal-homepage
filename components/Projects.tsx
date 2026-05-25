import { projects } from "@/data/site";
import { SectionHeading } from "@/components/SectionHeading";

export function Projects() {
  return (
    <section className="px-5 py-20 sm:px-8 lg:px-12" id="projects">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Projects"
          title="折腾一些有意思的小东西"
          description="不一定宏大，但希望每个项目都和真实生活有一点关系。"
        />
        <div className="grid gap-5 md:grid-cols-2">
          {projects.map((project, index) => (
            <article
              className="spring-card rounded-2xl border border-ink/10 bg-white/50 p-7 hover:bg-white/75 hover:shadow-soft"
              key={project.title}
            >
              <p className="mb-8 font-serif text-5xl text-clay/40">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="text-xl font-semibold text-ink">{project.title}</h3>
              <p className="mt-4 leading-8 text-ink/70">{project.description}</p>
              <p className="mt-8 text-sm font-semibold text-moss">
                Personal experiment
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
