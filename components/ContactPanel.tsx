"use client";

import { useEffect, useState } from "react";

const contacts = [
  { label: "Email", value: "yourname@example.com" },
  { label: "WeChat", value: "二维码占位 / WeChat QR" },
  { label: "GitHub", value: "github.com/tomhl333" },
  { label: "Social", value: "小红书 / 公众号 / LinkedIn 占位" },
];

export function ContactPanel() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  return (
    <>
      <button
        className="spring-link rounded-full border border-ink/10 bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-paper shadow-soft hover:bg-moss"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        Contact
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 px-5 py-8 backdrop-blur-md"
          onClick={() => setIsOpen(false)}
          role="presentation"
        >
          <section
            aria-labelledby="contact-panel-title"
            className="contact-pop relative w-full max-w-md overflow-hidden rounded-[1.75rem] border border-paper/20 bg-ink p-6 text-paper shadow-soft sm:p-7"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <button
              aria-label="关闭联系卡片"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-paper/20 text-paper/70 transition hover:border-paper/40 hover:text-paper"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              ×
            </button>

            <div className="contact-card-grid" aria-hidden="true" />
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-clay">
              Contact
            </p>
            <h2
              className="mt-4 font-serif text-3xl font-semibold leading-tight sm:text-4xl"
              id="contact-panel-title"
            >
              有空可以聊聊生活
            </h2>
            <p className="mt-4 text-sm leading-7 text-paper/70">
              如果你也喜欢运动、语言、阅读、AI，或者只是想聊聊生活，欢迎找到我。
            </p>

            <div className="mt-7 space-y-3">
              {contacts.map((item) => (
                <div
                  className="rounded-2xl border border-paper/10 bg-paper/10 p-4 backdrop-blur"
                  key={item.label}
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-paper/40">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-paper">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
