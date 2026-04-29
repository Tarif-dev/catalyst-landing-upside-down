import { SectionTitle } from "./SectionTitle";

const prizes = [
  { place: "I", label: "The Eleven", note: "Champion of Hawkins" },
  { place: "II", label: "The Hopper", note: "Runner-up" },
  { place: "III", label: "The Dustin", note: "Third place" },
];

export function Prizes() {
  return (
    <section id="prizes" className="relative overflow-hidden px-6 py-32 md:py-44 border-t border-blood/10">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[28rem] w-[28rem] -translate-x-1/2 blob-blood opacity-60" />
      <div className="pointer-events-none absolute right-10 bottom-10 h-72 w-72 blob-rose opacity-40" />

      <div className="relative mx-auto max-w-5xl">
        <SectionTitle eyebrow="Reward — For Those Who Survive" italic>
          The Spoils.
        </SectionTitle>

        <div className="mb-24 text-center reveal reveal-delay-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-bone/45 mb-6">
            Total Pool · INR
          </p>
          <div className="font-display text-7xl md:text-[10rem] title-outline breathe leading-[0.9] tracking-tight">
            ₹50,000<span className="text-blood/60">+</span>
          </div>
          <div className="mx-auto mt-8 h-px w-32 bg-blood/40" />
          <p className="mt-8 font-italic-display text-lg md:text-xl text-bone/65 italic">
            distributed across champions, runners-up &amp; track leaders
          </p>
        </div>

        <div className="grid gap-px bg-blood/15 md:grid-cols-3">
          {prizes.map((p, i) => (
            <div
              key={p.place}
              className="panel bracket relative bg-black p-12 text-center reveal"
              style={{ animationDelay: `${i * 0.12}s` }}
            >
              <div className="font-display text-6xl md:text-7xl text-blood text-glow-blood mb-4 leading-none">
                {p.place}
              </div>
              <div className="hairline-bone mx-auto w-12 mb-4" />
              <div className="font-display text-2xl text-bone italic mb-2">
                {p.label}
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-bone/45">
                {p.note}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-16 text-center font-italic-display text-base text-bone/50 italic">
          + track-wise prizes · swag · sponsor goodies · internship offers
        </p>
      </div>
    </section>
  );
}
