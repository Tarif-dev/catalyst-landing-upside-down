import { SectionTitle } from "./SectionTitle";
import dustin from "@/assets/dustin.webp";
import hopper from "@/assets/hopper.webp";
import eleven from "@/assets/eleven.webp";
import will from "@/assets/will.webp";
import riseInStellarLogo from "@/assets/sponsors/rise_in_stellar.png";

const tracks = [
  {
    code: "I",
    name: "AI for Healthcare",
    patron: "Hopper",
    quote: '"Mornings are for coffee and contemplation."',
    role: "The Chief - steady under pressure, the one who runs toward the dark.",
    image: hopper,
    desc: "Diagnostic intelligence, predictive care, patient triage, medical imaging, drug discovery copilots, mental-health companions.",
    looking: [
      "Clinical-grade reasoning",
      "Privacy-first architectures",
      "Edge / offline inference",
    ],
  },
  {
    code: "II",
    name: "AI for Fintech",
    patron: "Dustin",
    quote: '"Curiosity Voyager."',
    role: "The Strategist - reads the patterns, breaks the code, beats the system.",
    image: dustin,
    desc: "Fraud detection, risk modelling, autonomous trading agents, credit intelligence for the underbanked, embedded finance copilots.",
    looking: [
      "Real-time signal extraction",
      "Explainable decisions",
      "Regulation-aware design",
    ],
  },
  {
    code: "III",
    name: "AI for Sustainability",
    patron: "Will",
    quote: '"I made it eighty-five days."',
    role: "The Sensitive - attuned to what others miss, the first to feel the shift.",
    image: will,
    desc: "Climate intelligence, carbon accounting, biodiversity monitoring, energy-grid optimisation, circular supply chains, disaster prediction.",
    looking: [
      "Satellite / sensor fusion",
      "Measurable impact",
      "Low-compute footprints",
    ],
  },
  {
    code: "IV",
    name: "AI for Education",
    patron: "Eleven",
    quote: '"Friends don\'t lie."',
    role: "The Prodigy - raw power shaped into purpose, learning in public.",
    image: eleven,
    desc: "Adaptive tutors, accessibility tools, regional-language learning, assessment copilots, skill-gap mapping, teacher augmentation.",
    looking: [
      "Personalised pedagogy",
      "Accessibility by default",
      "Low-bandwidth delivery",
    ],
  },
];

export function Tracks() {
  return (
    <section id="tracks" className="relative px-5 sm:px-6 py-24 md:py-44">
      <div className="pointer-events-none absolute left-1/2 top-32 h-96 w-96 -translate-x-1/2 blob-blood opacity-40" />
      <div className="relative mx-auto max-w-6xl">
        <SectionTitle
          eyebrow="Channels - Four Frequencies, Four Patrons"
          italic
        >
          The Tracks.
        </SectionTitle>

        <p className="mx-auto -mt-6 mb-20 max-w-2xl text-center font-serif text-base md:text-lg italic text-bone/55 reveal">
          Each track is guarded by a resident of Hawkins. Pick your patron.
          Build your case. One winner per track takes home{" "}
          <span className="text-blood not-italic font-medium">
            ₹10,000 worth of prizes
          </span>
          .
        </p>

        <div className="flex flex-col gap-px bg-blood/10">
          {tracks.map((t, i) => {
            const reverse = i % 2 === 1;
            return (
              <article
                key={t.code}
                className="panel group relative bg-black reveal"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div
                  className={`grid grid-cols-1 md:grid-cols-12 gap-0 items-stretch ${
                    reverse ? "md:[&>div:first-child]:order-2" : ""
                  }`}
                >
                  <div className="relative md:col-span-4 overflow-hidden border-b md:border-b-0 md:border-r border-blood/10 bg-gradient-to-b from-blood/[0.06] to-black aspect-[4/5] md:aspect-auto">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(200,40,40,0.15),transparent_70%)]" />
                    <img
                      src={t.image}
                      alt={t.patron}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover object-top grayscale contrast-110 opacity-80 transition-all duration-700 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-[1.02]"
                    />
                    <div
                      className="pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 3px)",
                      }}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between">
                      <div>
                        <div className="font-mono text-[9px] uppercase tracking-[0.45em] text-blood/80 mb-1">
                          Patron · {t.code.padStart(2, "0")}/04
                        </div>
                        <div className="font-display text-3xl italic text-bone leading-none">
                          {t.patron}
                        </div>
                      </div>
                      <span className="block h-2 w-2 rounded-full bg-blood pulse-dot" />
                    </div>
                    <span className="absolute top-3 left-3 h-3 w-3 border-t border-l border-blood/60" />
                    <span className="absolute top-3 right-3 h-3 w-3 border-t border-r border-blood/60" />
                  </div>

                  <div className="md:col-span-8 p-6 sm:p-8 md:p-12 flex flex-col justify-center">
                    <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] uppercase tracking-[0.3em] sm:tracking-[0.4em] font-mono">
                      <span className="text-bone/40">Track {t.code} / 04</span>
                      <span className="h-px w-6 sm:w-8 bg-blood/40" />
                      <span className="text-bone/40">Single Winner</span>
                    </div>

                    <h3 className="font-display text-3xl sm:text-4xl md:text-5xl text-bone leading-tight italic mb-4 sm:mb-5">
                      {t.name}
                    </h3>

                    <p className="font-serif italic text-bone/55 text-base sm:text-lg mb-2">
                      {t.quote}
                    </p>
                    <p className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.3em] sm:tracking-[0.35em] text-bone/40 mb-6">
                      - {t.role}
                    </p>

                    <div className="hairline-bone w-16 mb-6" />

                    <p className="text-[15px] sm:text-base md:text-[17px] leading-relaxed text-bone/70 font-serif mb-6 sm:mb-8">
                      {t.desc}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
                      {t.looking.map((tag) => (
                        <span
                          key={tag}
                          className="border border-bone/15 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-[10px] uppercase tracking-[0.25em] sm:tracking-[0.3em] text-bone/60 font-mono transition-colors hover:border-blood/60 hover:text-blood"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="bracket relative border border-blood/30 bg-gradient-to-r from-blood/10 via-blood/5 to-transparent px-4 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <div className="font-mono text-[9px] uppercase tracking-[0.4em] sm:tracking-[0.45em] text-blood/80 mb-2">
                          Champion's Prize
                        </div>
                        <div className="font-display text-4xl sm:text-5xl md:text-6xl text-bone italic leading-none text-glow-blood">
                          ₹10,000
                        </div>
                        <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.3em] sm:tracking-[0.35em] text-bone/40">
                          Worth of prizes
                        </div>
                      </div>
                      <div className="sm:text-right">
                        <div className="font-mono text-[9px] uppercase tracking-[0.35em] sm:tracking-[0.4em] text-bone/45 mb-1">
                          Awarded to
                        </div>
                        <div className="font-display italic text-lg sm:text-xl text-blood">
                          01 Team
                        </div>
                        <div className="font-mono text-[9px] uppercase tracking-[0.3em] sm:tracking-[0.35em] text-bone/40 mt-1">
                          Winner takes all
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* ─── Best use of Stellar — Special Cross-Track Award ─── */}
        <div className="mt-20 md:mt-28 reveal">
          <div className="bracket relative overflow-hidden border border-cyan/30 bg-gradient-to-br from-cyan/[0.06] via-black to-cyan/[0.03] px-6 py-10 sm:px-10 sm:py-14 md:px-14 md:py-16">
            {/* Decorative glow */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan/10 blur-3xl" />
            <div className="pointer-events-none absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-cyan/8 blur-2xl" />

            <div className="relative flex flex-col items-center text-center">
              {/* Eyebrow */}
              <div className="mb-4 flex items-center gap-3 md:gap-4">
                <span className="block h-px w-8 md:w-12 bg-cyan/50" />
                <span className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.45em] text-cyan whitespace-nowrap">
                  Bonus Track · Cross-Track Award
                </span>
                <span className="block h-px w-8 md:w-12 bg-cyan/50" />
              </div>

              {/* Title */}
              <h3 className="font-display text-3xl sm:text-4xl md:text-5xl italic text-bone leading-tight mb-4">
                Best Use of{" "}
                <span className="text-cyan text-glow-cyan">Stellar</span>
              </h3>

              {/* Stellar logo */}
              <div className="mb-6 flex items-center justify-center">
                <img
                  src={riseInStellarLogo}
                  alt="Rise In Stellar"
                  className="max-h-14 w-auto object-contain opacity-90 drop-shadow-[0_0_18px_rgba(100,200,255,0.25)]"
                  loading="lazy"
                />
              </div>

              {/* Divider */}
              <div className="h-px w-24 sm:w-32 bg-cyan/30 mb-8" />

              {/* Description */}
              <p className="max-w-2xl font-serif text-base sm:text-lg md:text-xl leading-relaxed text-bone/70 mb-8">
                This isn't a separate track — it's a{" "}
                <span className="text-cyan font-medium not-italic">
                  cross-track special award
                </span>
                . Teams from{" "}
                <span className="text-bone/90 font-medium">any</span> of the
                four tracks (Healthcare, Fintech, Sustainability, or Education)
                can integrate{" "}
                <span className="text-cyan font-medium not-italic">
                  Stellar's blockchain
                </span>{" "}
                into their project and become eligible for this award — on top of
                their track prizes.
              </p>

              <p className="max-w-xl font-serif text-sm sm:text-base text-bone/55 italic mb-10 leading-relaxed">
                Build on Stellar. Use its SDKs, smart contracts, or
                decentralised infrastructure alongside your AI solution. The
                team that makes the best use of the Stellar blockchain — as
                judged across all tracks — wins.
              </p>

              {/* Prize card */}
              <div className="bracket w-full max-w-md border border-cyan/30 bg-gradient-to-r from-cyan/10 via-cyan/5 to-transparent px-6 py-6 sm:px-8 sm:py-8 mb-6">
                <div className="font-mono text-[9px] uppercase tracking-[0.45em] text-cyan/80 mb-3">
                  Cash Prize
                </div>
                <div className="font-display text-5xl sm:text-6xl md:text-7xl text-bone italic leading-none text-glow-cyan">
                  $100
                </div>
                <div className="mt-3 font-mono text-[9px] uppercase tracking-[0.35em] text-bone/40">
                  Cash · Awarded to 01 team
                </div>
              </div>

              {/* Eligibility tags */}
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {[
                  "Open to all tracks",
                  "Use Stellar SDK / Smart Contracts",
                  "Judged across tracks",
                  "Stacks with track prizes",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="border border-cyan/20 px-3 py-1.5 text-[9px] sm:text-[10px] uppercase tracking-[0.25em] sm:tracking-[0.3em] text-cyan/70 font-mono transition-colors hover:border-cyan/60 hover:text-cyan"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 text-center reveal">
          <p className="font-serif italic text-bone/55 text-lg">
            Four tracks. Four winners. One special Stellar award. ₹50,000+ worth of prize pool.
          </p>
          <a
            href="#register"
            className="bracket border border-blood/40 bg-blood/5 px-8 py-3 font-mono text-[10px] uppercase tracking-[0.4em] text-blood transition-all duration-500 hover:border-blood hover:bg-blood hover:text-black"
          >
            Choose your patron →
          </a>
        </div>
      </div>
    </section>
  );
}
