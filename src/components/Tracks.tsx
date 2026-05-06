import { SectionTitle } from "./SectionTitle";
import dustin from "@/assets/dustin.webp";
import hopper from "@/assets/hopper.webp";
import eleven from "@/assets/eleven.webp";
import will from "@/assets/will.webp";

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

        <div className="mt-12 flex flex-col items-center gap-4 text-center reveal">
          <p className="font-serif italic text-bone/55 text-lg">
            Four tracks. Four winners. ₹50,000 worth of prize pool.
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
