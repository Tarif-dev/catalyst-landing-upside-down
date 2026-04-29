import { SectionTitle } from "./SectionTitle";
import { Trophy, Medal, Award } from "lucide-react";

const prizes = [
  { icon: Trophy, place: "01", label: "The Eleven", note: "Champion of Hawkins", accent: "blood" },
  { icon: Medal, place: "02", label: "The Hopper", note: "Runner-up", accent: "magenta" },
  { icon: Award, place: "03", label: "The Dustin", note: "Third place", accent: "cyan" },
] as const;

const accentMap = {
  blood: "neon-card-blood text-blood",
  magenta: "text-magenta",
  cyan: "neon-card-cyan text-cyan",
};

export function Prizes() {
  return (
    <section id="prizes" className="relative overflow-hidden px-6 py-32 md:py-44">
      {/* Synthwave horizon backdrop */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[60%] grid-floor opacity-50" />
      <div className="pointer-events-none absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 retro-sun opacity-60 blur-[1px]" />

      <div className="relative mx-auto max-w-5xl">
        <SectionTitle eyebrow="Reward // For surviving the Upside Down" accent="blood">
          Prize Pool
        </SectionTitle>

        <div className="mb-20 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-bone/50 mb-4">
            Total · INR
          </p>
          <div className="font-display text-7xl md:text-[11rem] title-outline flicker leading-[0.9]">
            ₹50,000+
          </div>
          <p className="mt-6 font-mono text-xs uppercase tracking-[0.3em] text-magenta">
            distributed across champions, runners-up & track leaders
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {prizes.map((p) => {
            const a = accentMap[p.accent];
            return (
              <div key={p.place} className={`hud neon-card ${a.split(" ")[0]} p-10 text-center`}>
                <p.icon className={`mx-auto mb-5 h-10 w-10 ${a.split(" ")[1]}`} strokeWidth={1.5} />
                <div className="font-display text-6xl md:text-7xl text-bone mb-3 leading-none">
                  {p.place}
                </div>
                <div className={`font-mono text-[11px] uppercase tracking-[0.4em] ${a.split(" ")[1]} mb-4`}>
                  {p.label}
                </div>
                <p className="text-sm text-bone/60">{p.note}</p>
              </div>
            );
          })}
        </div>

        <p className="mt-12 text-center font-mono text-[10px] uppercase tracking-[0.4em] text-bone/50">
          + track-wise prizes · swag · sponsor goodies · internship offers
        </p>
      </div>
    </section>
  );
}
