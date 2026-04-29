import { Heart, Banknote, Leaf, GraduationCap, Sparkles } from "lucide-react";
import { SectionTitle } from "./SectionTitle";

const tracks = [
  {
    icon: Heart,
    name: "AI for Healthcare",
    code: "TRK_001",
    desc: "Diagnostic models, predictive care, biotech tooling. Build what heals.",
    accent: "blood",
  },
  {
    icon: Banknote,
    name: "AI for Fintech",
    code: "TRK_002",
    desc: "Risk, fraud detection, embedded finance, autonomous trading systems.",
    accent: "cyan",
  },
  {
    icon: Leaf,
    name: "AI for Sustainability",
    code: "TRK_003",
    desc: "Climate intelligence, energy optimization, ocean & forest tech.",
    accent: "magenta",
  },
  {
    icon: GraduationCap,
    name: "AI for Education",
    code: "TRK_004",
    desc: "Tutors, accessibility, personalized learning at planetary scale.",
    accent: "cyan",
  },
  {
    icon: Sparkles,
    name: "Open Innovation",
    code: "TRK_005",
    desc: "No rules. Surprise the jury. Build the unbuildable.",
    accent: "magenta",
  },
] as const;

const accentMap = {
  blood: { card: "neon-card-blood", text: "text-blood", chip: "bg-blood/15 border-blood/40", hover: "group-hover:bg-blood" },
  cyan: { card: "neon-card-cyan", text: "text-cyan", chip: "bg-cyan/15 border-cyan/40", hover: "group-hover:bg-cyan" },
  magenta: { card: "", text: "text-magenta", chip: "bg-magenta/15 border-magenta/40", hover: "group-hover:bg-magenta" },
};

export function Tracks() {
  return (
    <section id="tracks" className="relative px-6 py-32 md:py-44">
      <div className="mx-auto max-w-6xl">
        <SectionTitle eyebrow="Channels // Pick your frequency" accent="magenta">
          Five Tracks
        </SectionTitle>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tracks.map((t) => {
            const a = accentMap[t.accent];
            return (
              <article
                key={t.code}
                className={`group hud neon-card ${a.card} relative overflow-hidden p-8`}
              >
                <div className="mb-6 flex items-start justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center border ${a.chip} ${a.text} transition-all ${a.hover} group-hover:text-background`}
                  >
                    <t.icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <span className={`font-mono text-[10px] uppercase tracking-[0.3em] ${a.text} opacity-70`}>
                    {t.code}
                  </span>
                </div>

                <h3 className="font-display text-2xl md:text-3xl text-bone tracking-wider mb-3 leading-tight">
                  {t.name}
                </h3>
                <p className="text-[13px] leading-relaxed text-bone/65 font-body">
                  {t.desc}
                </p>

                <div className={`mt-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] ${a.text}`}>
                  <span>Enter</span>
                  <span className="inline-block h-px w-8 bg-current" />
                  <span>→</span>
                </div>
              </article>
            );
          })}

          <div className="hud relative flex flex-col items-center justify-center border border-dashed border-magenta/30 p-8 text-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-magenta/80 mb-3">
              ▎ The Gate
            </div>
            <p className="font-display text-3xl md:text-4xl title-outline-magenta leading-tight">
              Step Through.
            </p>
            <p className="mt-3 text-xs text-bone/60 max-w-[16rem]">
              Pick one channel. Or break frequency with Open Innovation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
