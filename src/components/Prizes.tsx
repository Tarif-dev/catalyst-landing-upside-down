import { SectionTitle } from "./SectionTitle";

const breakdown = [
  { k: "Per Track", v: "₹10,000", sub: "× 5 channels" },
  { k: "Winners", v: "05", sub: "One per track" },
  { k: "Guaranteed", v: "₹50,000", sub: "Cash pool" },
  { k: "Beyond Cash", v: "∞", sub: "Swag · Offers" },
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

        <div className="mb-20 text-center reveal reveal-delay-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-bone/45 mb-6">
            Total Pool · INR
          </p>
          <div className="font-display text-7xl md:text-[10rem] title-outline breathe leading-[0.9] tracking-tight">
            ₹50,000<span className="text-blood/60">+</span>
          </div>
          <div className="mx-auto mt-8 h-px w-32 bg-blood/40" />
          <p className="mt-8 font-italic-display text-lg md:text-xl text-bone/65 italic max-w-2xl mx-auto">
            No podium. No runners-up. Every track crowns a single champion — and
            the Upside Down pays each one the same respect.
          </p>
        </div>

        <div className="grid gap-px bg-blood/15 md:grid-cols-4 reveal reveal-delay-2">
          {breakdown.map((item) => (
            <div key={item.k} className="bracket relative bg-black px-4 py-10 text-center">
              <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-bone/45">
                {item.k}
              </div>
              <div className="mt-4 font-display text-4xl md:text-5xl text-bone tracking-tight italic">
                {item.v}
              </div>
              <div className="mt-3 font-mono text-[9px] uppercase tracking-[0.35em] text-blood/70">
                {item.sub}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-16 text-center font-italic-display text-base text-bone/50 italic">
          + track-wise swag · sponsor goodies · internship interviews · bragging rights until ’27
        </p>
      </div>
    </section>
  );
}
