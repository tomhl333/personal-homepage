import { contactProfile } from "@/data/site";

export function Contact() {
  return (
    <section className="px-5 pb-8 pt-10 sm:px-8 lg:px-12" id="contact">
      <div className="mx-auto max-w-6xl rounded-[1.4rem] border border-ink/10 bg-white/45 p-5 text-ink shadow-sm backdrop-blur sm:p-6">
        <div>
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-clay">
              {contactProfile.eyebrow}
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-ink/65">
              {contactProfile.description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
