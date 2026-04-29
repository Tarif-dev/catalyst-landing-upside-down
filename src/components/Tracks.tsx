import { Heart, Banknote, Leaf, GraduationCap, Sparkles } from "lucide-react";
import { SectionTitle } from "./SectionTitle";

const tracks = [
  {
    icon: Heart,
    name: "AI for Healthcare",
    code: "I",
    desc: "Diagnostic models, predictive care, biotech tooling. Build what heals.",
  },
  {
    icon: Banknote,
    name: "AI for Fintech",
    code: "II",
    desc: "Risk, fraud detection, embedded finance, autonomous trading systems.",
  },
  {
    icon: Leaf,
    name: "AI for Sustainability",
    code: "III",
    desc: "Climate intelligence, energy optimization, ocean & forest tech.",
  },
  {
    icon: GraduationCap,
    name: "AI for Education",
    code: "IV",
    desc: "Tutors, accessibility, personalized learning at planetary scale.",
  },
  {
    icon: Sparkles,
    name: "Open Innovation",
    code: "V",
    desc: "No rules. Surprise the jury. Build the unbuildable.",
  },
];

export function Tracks() {
  return (
    <section id="tracks" className="relative px-6 py-32 md:py-44">
      <div className="pointer-events-none absolute left-1/2 top-32 h-96 w-96 -translate-x-1/2 blob-blood opacity-50" />
      <div className="relative mx-auto max-w-6xl">
        <SectionTitle eyebrow="Channels — Five Frequencies" italic>
          The Tracks.
        </SectionTitle>

        <div className="grid grid-cols-1 gap-px bg-blood/10 md:grid-cols-2 lg:grid-cols-3">
          {tracks.map((t, i) => (
            <article
              key={t.code}
              className="panel group relative bg-black p-10 reveal"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="mb-8 flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center border border-blood/40 text-blood transition-all duration-500 group-hover:border-blood group-hover:bg-blood group-hover:text-black">
                  <t.icon className="h-5 w-5" strokeWidth={1.25} />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-bone/35">
                  {t.code.padStart(2, "0")} / 05
                </span>
              </div>

              <h3 className="font-display text-3xl md:text-[2rem] text-bone mb-4 leading-tight italic">
                {t.name}
              </h3>
              <p className="text-base leading-relaxed text-bone/55 font-serif">
                {t.desc}
              </p>

              <div className="mt-8 hairline-bone opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </article>
          ))}

          <div className="panel relative flex flex-col items-start justify-center bg-black p-10 reveal" style={{ animationDelay: "0.4s" }}>
            <div className="font-mono text-[10px] uppercase tracking-[0.45em] text-blood mb-4">
              Open Call
            </div>
            <p className="font-display text-3xl md:text-[2rem] text-bone italic leading-tight">
              Choose a frequency.<br/>Or break it.
            </p>
            <a href="#register" className="mt-6 font-mono text-[10px] uppercase tracking-[0.4em] text-blood/80 hover:text-blood transition-colors">
              Register →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
