import { SectionTitle } from "./SectionTitle";

const faqs = [
  {
    q: "Is there any registration fee?",
    a: "Yes, the registration fee is ₹200 per participant.",
  },
  {
    q: "Can we change our track after selecting it?",
    a: "Yes, teams can change their track even on the day of the event.",
  },
  {
    q: "Will basic facilities like internet, power, and food be provided?",
    a: "Yes, internet access, charging points, and food will be provided throughout the event. Detailed information will be shared with team leaders via email.",
  },
  {
    q: "Are participants required to stay at the venue for the full duration?",
    a: "Yes, participants must remain at the venue for the entire duration of the hackathon.",
  },
  {
    q: "Will certificates be provided to all team members?",
    a: "Yes, certificates will be issued to all registered team members.",
  },
  {
    q: "What happens if a team cancels or does not show up? Will there be a refund?",
    a: "No refunds will be provided. Refunds will only be issued if decided by the organizing team.",
  },
  {
    q: "Will mentors or support be available during the hackathon?",
    a: "Yes, support will be available to guide participants during the event.",
  },
];

export function Faq() {
  return (
    <section
      id="faq"
      className="px-5 sm:px-6 py-24 md:py-44 border-t border-blood/10"
    >
      <div className="mx-auto max-w-3xl">
        <SectionTitle eyebrow="Transmissions - Decoded" italic>
          Questions.
        </SectionTitle>

        <ul className="border-t border-bone/10">
          {faqs.map((f, i) => (
            <li
              key={f.q}
              className="border-b border-bone/10 reveal"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <details className="group [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-4 sm:gap-6 py-6 sm:py-7 transition-colors hover:text-bone">
                  <span className="flex items-baseline gap-4 sm:gap-6 min-w-0">
                    <span className="font-mono text-[10px] tracking-[0.3em] sm:tracking-[0.4em] text-blood/70 tabular-nums shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-display text-lg sm:text-xl md:text-2xl text-bone italic">
                      {f.q}
                    </span>
                  </span>
                  <span className="font-mono text-2xl text-blood transition-transform duration-500 group-open:rotate-45 shrink-0">
                    +
                  </span>
                </summary>
                <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-out group-open:grid-rows-[1fr]">
                  <div className="overflow-hidden">
                    <p className="pb-6 sm:pb-7 pl-10 sm:pl-14 pr-2 sm:pr-10 font-serif text-sm sm:text-base leading-relaxed text-bone/65 opacity-0 translate-y-2 transition-all duration-500 group-open:opacity-100 group-open:translate-y-0">
                      {f.a}
                    </p>
                  </div>
                </div>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
