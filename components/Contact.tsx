const contacts = [
  "邮箱占位",
  "微信二维码占位",
  "GitHub 占位",
  "小红书 / 公众号 / LinkedIn 占位",
];

export function Contact() {
  return (
    <section className="px-5 pb-10 pt-20 sm:px-8 lg:px-12" id="contact">
      <div className="mx-auto max-w-6xl rounded-[2rem] bg-moss p-7 text-paper shadow-soft sm:p-10 lg:p-14">
        <div className="grid gap-10 md:grid-cols-[1fr_1.2fr] md:items-end">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.26em] text-paper/60">
              Contact
            </p>
            <h2 className="font-serif text-3xl font-semibold sm:text-4xl">
              有空可以聊聊生活
            </h2>
          </div>
          <p className="text-base leading-9 text-paper/80 sm:text-lg">
            如果你也喜欢运动、语言、阅读、AI，或者只是想聊聊生活，欢迎找到我。
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {contacts.map((item) => (
            <div
              className="rounded-2xl border border-paper/20 bg-paper/10 p-5 backdrop-blur"
              key={item}
            >
              <p className="text-sm text-paper/60">Find me via</p>
              <p className="mt-2 font-semibold">{item}</p>
            </div>
          ))}
        </div>
        <footer className="mt-12 border-t border-paper/20 pt-6 text-sm text-paper/50">
          © 2026 Still Curious. Built with Next.js, TypeScript and Tailwind CSS.
        </footer>
      </div>
    </section>
  );
}
