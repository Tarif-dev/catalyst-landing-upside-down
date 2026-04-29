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
    <section id="faq" className="px-6 py-32 md:py-44">
      <div className="mx-auto max-w-3xl">
        <SectionTitle eyebrow="Transmissions // Decoded" accent="cyan">
          FAQ
        </SectionTitle>

        <ul className="space-y-4">
          {faqs.map((f, i) => (
            <li key={i}>
              <details className="hud neon-card group p-6 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-6">
                  <span className="flex items-center gap-4">
                    <span className="font-pixel text-cyan text-xl tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-display text-lg md:text-xl tracking-wider text-bone">
                      {f.q}
                    </span>
                  </span>
                  <span className="font-mono text-magenta text-xl transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-4 ml-10 text-sm leading-relaxed text-bone/65">
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
