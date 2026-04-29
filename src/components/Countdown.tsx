import { useEffect, useState } from "react";

const TARGET = new Date("2026-05-19T09:00:00+05:30").getTime();

function diff(now: number) {
  const d = Math.max(0, TARGET - now);
  return {
    days: Math.floor(d / 86400000),
    hours: Math.floor((d / 3600000) % 24),
    minutes: Math.floor((d / 60000) % 60),
    seconds: Math.floor((d / 1000) % 60),
  };
}

export function Countdown() {
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setT(diff(Date.now()));
    const id = setInterval(() => setT(diff(Date.now())), 1000);
    return () => clearInterval(id);
  }, []);

  const items = [
    { label: "Days", v: t.days },
    { label: "Hours", v: t.hours },
    { label: "Minutes", v: t.minutes },
    { label: "Seconds", v: t.seconds },
  ];

  return (
    <div className="grid grid-cols-4 gap-px bg-blood/15">
      {items.map((it, i) => (
        <div
          key={it.label}
          className="bracket relative bg-black px-3 py-8 text-center md:py-12"
        >
          <div
            className="font-display text-5xl md:text-7xl text-blood text-glow-blood tabular-nums leading-none breathe"
            style={{ animationDelay: `${i * 0.3}s` }}
            suppressHydrationWarning
          >
            {mounted ? String(it.v).padStart(2, "0") : "00"}
          </div>
          <div className="mt-4 font-mono text-[9px] uppercase tracking-[0.4em] text-bone/55">
            {it.label}
          </div>
        </div>
      ))}
    </div>
  );
}
