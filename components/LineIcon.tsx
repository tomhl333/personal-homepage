export type IconName =
  | "ai"
  | "book"
  | "briefcase"
  | "city"
  | "coffee"
  | "contact"
  | "dumbbell"
  | "globe"
  | "language"
  | "note"
  | "spark"
  | "swim"
  | "tennis";

type LineIconProps = {
  name: IconName;
  className?: string;
};

const commonProps = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  strokeWidth: 1.8,
};

export function LineIcon({ name, className = "h-5 w-5" }: LineIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      {...commonProps}
    >
      {icons[name]}
    </svg>
  );
}

const icons: Record<IconName, JSX.Element> = {
  ai: (
    <>
      <path d="M12 3.5v3" />
      <path d="M12 17.5v3" />
      <path d="M3.5 12h3" />
      <path d="M17.5 12h3" />
      <path d="m6.7 6.7 2.1 2.1" />
      <path d="m15.2 15.2 2.1 2.1" />
      <path d="m17.3 6.7-2.1 2.1" />
      <path d="m8.8 15.2-2.1 2.1" />
      <circle cx="12" cy="12" r="3.1" />
    </>
  ),
  book: (
    <>
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H7.5A2.5 2.5 0 0 0 5 21.5z" />
      <path d="M5 5.5v16" />
      <path d="M8 7h8" />
      <path d="M8 11h6" />
    </>
  ),
  briefcase: (
    <>
      <rect height="13" rx="2.5" width="18" x="3" y="7" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M3 12.5h18" />
      <path d="M10 12.5v2h4v-2" />
    </>
  ),
  city: (
    <>
      <path d="M4 20V8l5-3v15" />
      <path d="M9 20V4l6 4v12" />
      <path d="M15 20v-8l5-2v10" />
      <path d="M6.5 10h.1" />
      <path d="M6.5 14h.1" />
      <path d="M12 9h.1" />
      <path d="M12 13h.1" />
      <path d="M18 14h.1" />
    </>
  ),
  coffee: (
    <>
      <path d="M5 8h10v6.5A3.5 3.5 0 0 1 11.5 18h-3A3.5 3.5 0 0 1 5 14.5z" />
      <path d="M15 10h1.5a2 2 0 0 1 0 4H15" />
      <path d="M7 3.5c.8.7.8 1.5 0 2.2" />
      <path d="M11 3.5c.8.7.8 1.5 0 2.2" />
      <path d="M4 21h14" />
    </>
  ),
  contact: (
    <>
      <rect height="14" rx="2.5" width="18" x="3" y="5" />
      <path d="m4 7 8 6 8-6" />
      <path d="m8 13-4 4" />
      <path d="m16 13 4 4" />
    </>
  ),
  dumbbell: (
    <>
      <path d="M6 7v10" />
      <path d="M18 7v10" />
      <path d="M3.5 9v6" />
      <path d="M20.5 9v6" />
      <path d="M6 12h12" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18" />
      <path d="M12 3a14 14 0 0 0 0 18" />
    </>
  ),
  language: (
    <>
      <path d="M4 5h8" />
      <path d="M8 3v2" />
      <path d="M10.5 5c-.5 3.8-2.8 6-6.5 7" />
      <path d="M5.5 8.5c1.2 1.8 2.8 3.1 4.8 3.9" />
      <path d="M13 20l4.2-10 4.3 10" />
      <path d="M14.4 16.5h5.4" />
    </>
  ),
  note: (
    <>
      <path d="M6 3.5h9l3 3V20a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5 20V5A1.5 1.5 0 0 1 6.5 3.5z" />
      <path d="M14.5 3.5V8H19" />
      <path d="M8 12h8" />
      <path d="M8 16h6" />
    </>
  ),
  spark: (
    <>
      <path d="M12 3.5 13.6 9l5.4 1.5-5.4 1.6L12 17.5l-1.6-5.4L5 10.5 10.4 9z" />
      <path d="M5 16.5 6 19l2.5 1-2.5 1-1 2.5L4 21l-2.5-1L4 19z" />
    </>
  ),
  swim: (
    <>
      <path d="M5 16c1.4-1.2 2.8-1.2 4.2 0s2.8 1.2 4.2 0 2.8-1.2 4.2 0" />
      <path d="M5 20c1.4-1.2 2.8-1.2 4.2 0s2.8 1.2 4.2 0 2.8-1.2 4.2 0" />
      <path d="M12 5.5 8 10l4 2 2.5-2.5" />
      <circle cx="16.5" cy="5.5" r="1.8" />
    </>
  ),
  tennis: (
    <>
      <circle cx="9.5" cy="9.5" r="5.5" />
      <path d="M13.4 13.4 20 20" />
      <path d="m17.5 18.5 1-1" />
      <path d="M5.6 5.6c2.2 1.5 5.1 1.5 7.8 0" />
      <path d="M5.6 13.4c1.5-2.2 1.5-5.1 0-7.8" />
    </>
  ),
};
