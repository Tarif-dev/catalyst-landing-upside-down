import { SectionTitle } from "./SectionTitle";

const events = [
  { time: "09:00", day: "MAY 19", title: "Gates Open", note: "Check-in & breakfast" },
  { time: "10:30", day: "MAY 19", title: "Opening Ceremony", note: "Tracks revealed. Clock starts." },
  { time: "11:00", day: "MAY 19", title: "Hacking Begins", note: "24 hours on the wire." },
  { time: "20:00", day: "MAY 19", title: "Mentor Hours", note: "Industry experts on the floor." },
  { time: "03:00", day: "MAY 20", title: "Midnight Run", note: "Energy. Music. Beautiful chaos." },
  { time: "11:00", day: "MAY 20", title: "Submissions Close", note: "Pencils down. Eyes up." },
  { time: "13:00", day: "MAY 20", title: "Final Demos", note: "Pitch to the jury." },
  { time: "17:00", day: "MAY 20", title: "Awards", note: "Champions of Hawkins crowned." },
];

export function Timeline() {
  return (
    <section id="timeline" className="relative px-6 py-32 md:py-44">
      <div className="mx-auto max-w-5xl">
        <SectionTitle eyebrow="Transmission // 19–20 May 2026" accent="cyan">
          Schedule
        </SectionTitle>

        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan/60 to-transparent md:left-1/2" />

          <ol className="space-y-10">
            {events.map((e, i) => {
              const left = i % 2 === 0;
              return (
                <li key={i} className="relative flex flex-col md:flex-row md:items-center">
                  <span className="absolute left-4 top-3 z-10 -translate-x-1/2 md:left-1/2">
                    <span className="block h-3 w-3 rotate-45 bg-cyan shadow-cyan" />
                  </span>

                  <div
                    className={`hud neon-card neon-card-cyan ml-12 p-6 md:ml-0 md:w-[calc(50%-2.5rem)] ${
                      left ? "md:mr-auto" : "md:ml-auto"
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-3">
                      <span className="font-mono text-[10px] tracking-[0.3em] text-cyan">{e.day}</span>
                      <span className="font-mono text-[10px] text-bone/40">//</span>
                      <span className="font-pixel text-xl text-bone leading-none">{e.time}</span>
                    </div>
                    <h3 className="font-display text-xl md:text-2xl tracking-wider text-bone mb-1">
                      {e.title}
                    </h3>
                    <p className="text-[13px] text-bone/60">{e.note}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
