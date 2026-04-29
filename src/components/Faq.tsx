import { SectionTitle } from "./SectionTitle";

const faqs = [
  { q: "Who can participate?", a: "Any student — undergrad, postgrad, or final-year — from any college across India. Form teams of 2 to 4." },
  { q: "Is there a registration fee?", a: "No. Catalyst 2K26 is completely free to enter. Bring your laptop and your wildest idea." },
  { q: "Do I need an AI background?", a: "No. We welcome beginners. Mentors and starter kits will be available for every track." },
  { q: "Where will it happen?", a: "On-campus at Amity University Kolkata. Food, beverages, and a hacking floor that runs all night are provided." },
  { q: "What should I bring?", a: "Laptop, charger, college ID, and the will to survive 24 hours in the Upside Down." },
];

export function Faq() {
  return (
    <section id="faq" className="px-6 py-28 md:py-40">
      <div className="mx-auto max-w-3xl">
        <SectionTitle eyebrow="Transmissions decoded">FAQ</SectionTitle>

        <ul className="space-y-3">
          {faqs.map((f, i) => (
            <li key={i}>
              <details className="vine-border group p-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-4">
                  <span className="font-display text-lg tracking-wide text-bone">
                    {f.q}
                  </span>
                  <span className="font-mono text-blood transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
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
