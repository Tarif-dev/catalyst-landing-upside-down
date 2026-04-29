import { SectionTitle } from "./SectionTitle";

const faqs = [
  { q: "Who can participate?", a: "Any student — undergrad, postgrad, or final-year — from any college across India. Form teams of 2 to 4." },
  { q: "Is there a registration fee?", a: "No. Catalyst 2K26 is completely free to enter. Bring your laptop and your wildest idea." },
  { q: "Do I need an AI background?", a: "Not at all. Beginners are welcome. Mentors and starter kits will be available across every track." },
  { q: "Where will it happen?", a: "On-campus at Amity University Kolkata. Food, beverages, and a hacking floor that runs all night are provided." },
  { q: "What should I bring?", a: "Laptop, charger, college ID, and the will to survive 24 hours in the Upside Down." },
];

export function Faq() {
  return (
    <section id="faq" className="px-6 py-32 md:py-44 border-t border-blood/10">
      <div className="mx-auto max-w-3xl">
        <SectionTitle eyebrow="Transmissions — Decoded" italic>
          Questions.
        </SectionTitle>

        <ul className="border-t border-bone/10">
          {faqs.map((f, i) => (
            <li key={i} className="border-b border-bone/10 reveal" style={{ animationDelay: `${i * 0.06}s` }}>
              <details className="group [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-6 py-7 transition-colors hover:text-bone">
                  <span className="flex items-baseline gap-6">
                    <span className="font-mono text-[10px] tracking-[0.4em] text-blood/70 tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-display text-xl md:text-2xl text-bone italic">
                      {f.q}
                    </span>
                  </span>
                  <span className="font-mono text-2xl text-blood transition-transform duration-500 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="pb-7 pl-14 pr-10 font-serif text-base leading-relaxed text-bone/65">
                  {f.a}
                </p>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
