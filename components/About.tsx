import { SectionHeading } from "@/components/SectionHeading";

export function About() {
  return (
    <section className="px-5 py-20 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="About"
          title="不是简历，是生活的索引"
          description="这里收集一些真实的兴趣、长期的练习，以及偶尔冒出来的想法。"
        />
        <div className="grid gap-6 rounded-[2rem] border border-ink/10 bg-white/50 p-6 shadow-soft backdrop-blur sm:p-8 lg:grid-cols-[0.85fr_1.15fr] lg:p-10">
          <div className="flex min-h-72 flex-col justify-between rounded-[1.5rem] bg-ink p-7 text-paper">
            <p className="text-sm uppercase tracking-[0.24em] text-paper/60">
              Current mood
            </p>
            <p className="font-serif text-4xl leading-tight">
              自律一点，
              <br />
              也松弛一点。
            </p>
          </div>
          <div className="space-y-5 text-base leading-9 text-ink/70 sm:text-lg">
            <p>
              我是一个喜欢运动、喜欢学习、也喜欢把生活慢慢记录下来的人。
            </p>
            <p>
              平时打网球、游泳、健身，也在学习粤语和西班牙语。喜欢阅读，喜欢观察城市里的细节，也会折腾一些 AI 工具和小项目。
            </p>
            <p>
              工作是生活的一部分，我也会记录一些项目管理、数字化实践和个人成长的思考，但这里不想做成一份简历。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
