import { useEffect, useState } from "react";

const TARGET = new Date("2026-05-19T09:00:00+05:30").getTime();

function diff() {
  const now = Date.now();
  const d = Math.max(0, TARGET - now);
  return {
    days: Math.floor(d / 86400000),
    hours: Math.floor((d / 3600000) % 24),
    minutes: Math.floor((d / 60000) % 60),
    seconds: Math.floor((d / 1000) % 60),
  };
}

export function Countdown() {
  const [t, setT] = useState(diff());
  useEffect(() => {
    const id = setInterval(() => setT(diff()), 1000);
    return () => clearInterval(id);
  }, []);

  const items = [
    { label: "Days", v: t.days },
    { label: "Hours", v: t.hours },
    { label: "Minutes", v: t.minutes },
    { label: "Seconds", v: t.seconds },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 md:gap-4">
      {items.map((it) => (
        <div
          key={it.label}
          className="vine-border px-2 py-4 text-center md:px-4 md:py-5"
        >
          <div className="font-display text-3xl md:text-5xl text-blood text-glow-blood tabular-nums">
            {String(it.v).padStart(2, "0")}
          </div>
          <div className="mt-1 font-mono text-[9px] md:text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            {it.label}
          </div>
        </div>
      ))}
    </div>
  );
}
