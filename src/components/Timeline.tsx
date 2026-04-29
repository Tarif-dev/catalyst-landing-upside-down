import { SectionTitle } from "./SectionTitle";

const events = [
  { time: "09:00", day: "MAY 19", title: "Gates Open", note: "Check-in & breakfast." },
  { time: "10:30", day: "MAY 19", title: "Opening Ceremony", note: "Tracks revealed. Clock starts." },
  { time: "11:00", day: "MAY 19", title: "Hacking Begins", note: "Twenty-four hours on the wire." },
  { time: "20:00", day: "MAY 19", title: "Mentor Hours", note: "Industry experts on the floor." },
  { time: "03:00", day: "MAY 20", title: "Midnight Run", note: "Energy. Music. Beautiful chaos." },
  { time: "11:00", day: "MAY 20", title: "Submissions Close", note: "Pencils down. Eyes up." },
  { time: "13:00", day: "MAY 20", title: "Final Demos", note: "Pitch to the jury." },
  { time: "17:00", day: "MAY 20", title: "Awards", note: "Champions of Hawkins crowned." },
];

export function Timeline() {
  return (
    <section id="timeline" className="relative px-6 py-32 md:py-44 border-t border-blood/10">
      <div className="mx-auto max-w-4xl">
        <SectionTitle eyebrow="Transmission — 19 / 20 May 2026" italic>
          The Schedule.
        </SectionTitle>

        <ol className="relative">
          <span className="absolute left-[7.5rem] top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-blood/40 to-transparent hidden md:block" />
          {events.map((e, i) => (
            <li
              key={i}
              className="group relative grid grid-cols-1 md:grid-cols-[7.5rem_1fr] gap-2 md:gap-12 py-8 border-b border-bone/5 last:border-0 reveal"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="md:text-right">
                <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-blood/80">
                  {e.day}
                </div>
                <div className="font-display text-3xl text-bone tabular-nums mt-1">
                  {e.time}
                </div>
              </div>

              <div className="relative md:pl-8">
                <span className="absolute -left-[0.3rem] top-3 hidden h-1.5 w-1.5 rotate-45 bg-blood transition-all duration-500 group-hover:scale-150 md:block" />
                <h3 className="font-display text-2xl md:text-3xl text-bone italic leading-tight transition-colors group-hover:text-blood">
                  {e.title}
                </h3>
                <p className="mt-2 text-base text-bone/55 font-serif">{e.note}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
