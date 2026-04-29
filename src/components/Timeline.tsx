import { SectionTitle } from "./SectionTitle";

const events = [
  { time: "09:00", day: "May 19", title: "Gates Open", note: "Check-in & breakfast" },
  { time: "10:30", day: "May 19", title: "Opening Ceremony", note: "Tracks revealed. Clock starts." },
  { time: "11:00", day: "May 19", title: "Hacking Begins", note: "24 hours on the clock." },
  { time: "20:00", day: "May 19", title: "Mentor Hours", note: "Industry experts on the floor" },
  { time: "03:00", day: "May 20", title: "Midnight Run", note: "Energy, music, chaos" },
  { time: "11:00", day: "May 20", title: "Submissions Close", note: "Pencils down" },
  { time: "13:00", day: "May 20", title: "Final Demos", note: "Pitch to the jury" },
  { time: "17:00", day: "May 20", title: "Awards", note: "Champions of Hawkins crowned" },
];

export function Timeline() {
  return (
    <section id="timeline" className="px-6 py-28 md:py-40">
      <div className="mx-auto max-w-4xl">
        <SectionTitle eyebrow="24 hours · 19–20 may 2026">Schedule</SectionTitle>

        <div className="relative">
          {/* Spine */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-blood/60 to-transparent md:left-1/2" />

          <ol className="space-y-8">
            {events.map((e, i) => (
              <li
                key={i}
                className={`relative flex flex-col md:flex-row md:items-center ${
                  i % 2 === 0 ? "md:justify-start" : "md:justify-end"
                }`}
              >
                {/* Dot */}
                <span className="absolute left-4 top-2 z-10 -translate-x-1/2 md:left-1/2">
                  <span className="block h-3 w-3 rounded-full bg-blood shadow-blood pulse-blood" />
                </span>

                <div
                  className={`vine-border ml-12 p-5 md:ml-0 md:w-[calc(50%-2.5rem)] ${
                    i % 2 === 0 ? "md:mr-auto md:pr-6" : "md:ml-auto md:pl-6"
                  }`}
                >
                  <div className="mb-1 flex items-center gap-3">
                    <span className="font-mono text-xs text-blood">{e.day}</span>
                    <span className="font-mono text-xs text-muted-foreground">·</span>
                    <span className="font-mono text-xs text-bone">{e.time}</span>
                  </div>
                  <h3 className="font-display text-xl tracking-wide text-bone">
                    {e.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">{e.note}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
