import { Heart, Banknote, Leaf, GraduationCap, Sparkles } from "lucide-react";
import { SectionTitle } from "./SectionTitle";

const tracks = [
  { icon: Heart, name: "AI for Healthcare", code: "TRK-001", desc: "Heal the world. Build models that diagnose, predict, save." },
  { icon: Banknote, name: "AI for Fintech", code: "TRK-002", desc: "Reinvent money. Risk, fraud, trading, embedded finance." },
  { icon: Leaf, name: "AI for Sustainability", code: "TRK-003", desc: "Climate, energy, oceans. Code that protects the planet." },
  { icon: GraduationCap, name: "AI for Education", code: "TRK-004", desc: "Tutors, accessibility, personalized learning at scale." },
  { icon: Sparkles, name: "Open Innovation", code: "TRK-005", desc: "No rules. Surprise us. Build the unbuildable." },
];

export function Tracks() {
  return (
    <section id="tracks" className="px-6 py-28 md:py-40">
      <div className="mx-auto max-w-6xl">
        <SectionTitle eyebrow="Choose your portal">Five Tracks</SectionTitle>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {tracks.map((t, i) => (
            <article
              key={t.code}
              className="vine-border group relative overflow-hidden p-7 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-blood"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blood to-transparent opacity-50" />

              <div className="mb-5 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center border border-blood/40 bg-blood/10 text-blood transition-all group-hover:bg-blood group-hover:text-primary-foreground">
                  <t.icon className="h-5 w-5" />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {t.code}
                </span>
              </div>

              <h3 className="font-display text-2xl text-bone tracking-wide mb-2">
                {t.name}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t.desc}
              </p>

              {i === tracks.length - 1 && (
                <span className="absolute right-3 top-3 font-mono text-[9px] uppercase tracking-widest text-neon flicker-slow">
                  ◉ wildcard
                </span>
              )}
            </article>
          ))}

          {/* Closing "the gate" tile */}
          <div className="relative flex flex-col items-center justify-center border border-dashed border-blood/30 p-7 text-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-blood/70 mb-2">
              The Gate
            </div>
            <p className="font-display text-3xl text-blood text-glow-blood">
              Step Through.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Pick one. Or break the rules with Open Innovation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
