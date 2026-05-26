import { contactProfile, contacts } from "@/data/site";
import { LineIcon } from "@/components/LineIcon";

export function Contact() {
  return (
    <section className="px-5 pb-8 pt-10 sm:px-8 lg:px-12" id="contact">
      <div className="mx-auto max-w-6xl rounded-[1.4rem] border border-ink/10 bg-white/45 p-5 text-ink shadow-sm backdrop-blur sm:p-6">
        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-clay">
              {contactProfile.eyebrow}
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-ink/65">
              {contactProfile.description}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {contacts.map((item) => (
              <div
                className="flex min-w-56 items-center gap-3 rounded-2xl border border-ink/10 bg-paper/65 px-4 py-3"
                key={item.label}
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-moss/10 text-moss">
                  <LineIcon name={item.icon} />
                </span>
                <div>
                  <p className="text-xs text-ink/45">联系我</p>
                  <p className="mt-1 text-sm font-semibold">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <footer className="mt-5 border-t border-ink/10 pt-4 text-xs text-ink/45">
          {contactProfile.footer}
        </footer>
      </div>
    </section>
  );
}
