import { SectionTitle } from "./SectionTitle";
import { Trophy, Medal, Award } from "lucide-react";

export function Prizes() {
  return (
    <section id="prizes" className="px-6 py-28 md:py-40 bg-upside-down">
      <div className="mx-auto max-w-5xl">
        <SectionTitle eyebrow="The reward for surviving">Prize Pool</SectionTitle>

        {/* Headline number */}
        <div className="mb-16 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.4em] text-muted-foreground mb-3">
            Total Pool
          </p>
          <div className="font-display text-7xl md:text-9xl title-outline flicker">
            ₹50,000+
          </div>
          <p className="mt-4 font-mono text-sm text-blood/80">
            // distributed across winning teams & track champions
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: Trophy, place: "1st", label: "The Eleven", note: "Champion of Hawkins" },
            { icon: Medal, place: "2nd", label: "The Hopper", note: "Runner-up" },
            { icon: Award, place: "3rd", label: "The Dustin", note: "Third place" },
          ].map((p) => (
            <div
              key={p.place}
              className="vine-border glow-ring p-8 text-center"
            >
              <p.icon className="mx-auto mb-4 h-8 w-8 text-blood" />
              <div className="font-display text-4xl text-bone mb-1">{p.place}</div>
              <div className="font-mono text-xs uppercase tracking-widest text-blood mb-3">
                {p.label}
              </div>
              <p className="text-sm text-muted-foreground">{p.note}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          + track-wise prizes · swag · sponsor goodies
        </p>
      </div>
    </section>
  );
}
