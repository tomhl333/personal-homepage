type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  tone?: "light" | "dark";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  tone = "light",
}: SectionHeadingProps) {
  const isDark = tone === "dark";

  return (
    <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-14">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.26em] text-clay">
        {eyebrow}
      </p>
      <h2
        className={`font-serif text-3xl font-semibold sm:text-4xl ${
          isDark ? "text-paper" : "text-ink"
        }`}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={`mt-4 text-base leading-8 sm:text-lg ${
            isDark ? "text-paper/70" : "text-ink/70"
          }`}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
