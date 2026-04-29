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
  // SSR-safe: start with zeros, populate after mount to avoid hydration mismatch
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
    <div className="grid grid-cols-4 gap-3 md:gap-5">
      {items.map((it) => (
        <div
          key={it.label}
          className="hud neon-card neon-card-blood relative px-3 py-6 text-center md:py-8"
        >
          <div
            className="font-pixel text-5xl md:text-7xl text-blood text-glow-blood tabular-nums leading-none"
            suppressHydrationWarning
          >
            {mounted ? String(it.v).padStart(2, "0") : "00"}
          </div>
          <div className="mt-3 font-mono text-[9px] md:text-[10px] uppercase tracking-[0.35em] text-bone/60">
            {it.label}
          </div>
        </div>
      ))}
    </div>
  );
}
