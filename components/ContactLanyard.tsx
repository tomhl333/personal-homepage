"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const LanyardScene = dynamic(
  () => import("@/components/LanyardScene").then((mod) => mod.LanyardScene),
  {
    ssr: false,
    loading: () => null,
  },
);

export function ContactLanyard() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="pointer-events-none absolute left-1/2 top-4 z-[80] -translate-x-1/2 sm:top-6 lg:left-[43.5%] lg:top-5">
      <button
        aria-expanded={isOpen}
        className="pointer-events-auto relative z-[100] rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-sm font-semibold text-ink/65 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-moss/25 hover:text-moss"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        联系方式
      </button>

      {isOpen ? (
        <div className="pointer-events-auto absolute left-1/2 top-0 z-[90] h-[88vh] min-h-[42rem] w-screen -translate-x-1/2">
          <LanyardScene />
        </div>
      ) : null}
    </div>
  );
}
