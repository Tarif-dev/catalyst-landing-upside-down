import { SectionTitle } from "./SectionTitle";

type Tier = {
  tier: string;
  tag: string;
  note: string;
  size: "xl" | "lg" | "md" | "sm";
  sponsors: { name: string; desc?: string }[];
};

const tiers: Tier[] = [
  {
    tier: "Title Sponsor",
    tag: "Tier 01 · Headline",
    note: "Presenting partner of Catalyst 2K26.",
    size: "xl",
    sponsors: [{ name: "Hawkins National Lab", desc: "Presenting Partner" }],
  },
  {
    tier: "Powered By",
    tag: "Tier 02 · Co-Presenter",
    note: "Fueling the 24-hour floor.",
    size: "lg",
    sponsors: [
      { name: "Palace Arcade" },
      { name: "Scoops Ahoy" },
    ],
  },
  {
    tier: "Cloud Partner",
    tag: "Tier 03 · Infrastructure",
    note: "Compute, storage, and the grid beneath it all.",
    size: "md",
    sponsors: [
      { name: "Starcourt Cloud" },
      { name: "Upside Compute" },
      { name: "Mirkwood Grid" },
    ],
  },
  {
    tier: "AI Partner",
    tag: "Tier 04 · Intelligence",
    note: "Models, APIs, and the minds behind the demons.",
    size: "md",
    sponsors: [
      { name: "Eleven Labs" },
      { name: "Vecna Vectors" },
      { name: "Demogorgon AI" },
    ],
  },
  {
    tier: "Community Partners",
    tag: "Tier 05 · Outreach",
    note: "The network. The signal carriers.",
    size: "sm",
    sponsors: [
      { name: "The Party" },
      { name: "Hellfire Club" },
      { name: "Radio Shack" },
      { name: "Hawkins Post" },
      { name: "Bradley's Big Buy" },
      { name: "Family Video" },
    ],
  },
];

const sizeMap = {
  xl: "text-4xl md:text-6xl",
  lg: "text-3xl md:text-5xl",
  md: "text-2xl md:text-4xl",
  sm: "text-xl md:text-2xl",
};

const colsMap = {
  xl: "grid-cols-1",
  lg: "grid-cols-1 sm:grid-cols-2",
  md: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  sm: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
};

export function Sponsors() {
  return (
    <section
      id="sponsors"
      className="relative overflow-hidden px-6 py-24 md:py-44 border-t border-blood/10"
    >
      <div className="pointer-events-none absolute left-1/2 top-32 h-96 w-[40rem] -translate-x-1/2 blob-blood opacity-30" />

      <div className="relative mx-auto max-w-6xl">
        <SectionTitle eyebrow="Backers — Signal Amplifiers" italic>
          The Sponsors.
        </SectionTitle>

        <p className="mx-auto -mt-6 mb-16 md:mb-20 max-w-2xl text-center font-serif text-base md:text-lg italic text-bone/55 reveal">
          The partners keeping the lights on when Hawkins flickers. More names
          stepping through the gate soon.
        </p>

        <div className="flex flex-col gap-16 md:gap-20">
          {tiers.map((t, ti) => (
            <div
              key={t.tier}
              className="reveal"
              style={{ animationDelay: `${ti * 0.08}s` }}
            >
              {/* Tier header */}
              <div className="mb-6 md:mb-8 flex flex-col items-center text-center gap-3">
                <div className="flex items-center gap-3 md:gap-4">
                  <span className="block h-px w-8 md:w-12 bg-blood/50" />
                  <span className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.45em] text-blood whitespace-nowrap">
                    {t.tag}
                  </span>
                  <span className="block h-px w-8 md:w-12 bg-blood/50" />
                </div>
                <h3 className="font-display text-3xl md:text-4xl italic text-bone">
                  {t.tier}
                </h3>
                <p className="font-serif italic text-sm md:text-base text-bone/50 max-w-md">
                  {t.note}
                </p>
              </div>

              {/* Sponsor grid */}
              <div className={`grid gap-px bg-blood/10 ${colsMap[t.size]}`}>
                {t.sponsors.map((s, si) => (
                  <div
                    key={s.name}
                    className="bracket group relative bg-black px-4 py-8 md:py-12 text-center transition-all duration-500 hover:bg-blood/[0.04]"
                    style={{ animationDelay: `${si * 0.04}s` }}
                  >
                    <div
                      className={`font-display italic text-bone/85 leading-tight transition-all duration-500 group-hover:text-blood group-hover:text-glow-blood ${sizeMap[t.size]}`}
                    >
                      {s.name}
                    </div>
                    {s.desc && (
                      <div className="mt-3 font-mono text-[9px] uppercase tracking-[0.4em] text-blood/70">
                        {s.desc}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-20 md:mt-24 flex flex-col items-center gap-4 text-center reveal">
          <p className="font-serif italic text-bone/55 text-base md:text-lg max-w-xl">
            Want your name through the gate? Partner with Catalyst 2K26.
          </p>
          <a
            href="#contact"
            className="bracket border border-blood/40 bg-blood/5 px-8 py-3 font-mono text-[10px] uppercase tracking-[0.4em] text-blood transition-all duration-500 hover:border-blood hover:bg-blood hover:text-black"
          >
            Become a Sponsor →
          </a>
        </div>
      </div>
    </section>
  );
}
