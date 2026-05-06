import { useEffect, useRef, useState } from "react";
import amityLogo from "@/assets/amity_logo_white.png";

// These are loaded via URL for preloading only — NOT bundled into JS.
// They are ~3.5MB each and must NOT be static imports.
const CHARACTER_URLS = [
  "/src/assets/dustin.webp",
  "/src/assets/eleven.webp",
  "/src/assets/hopper.webp",
  "/src/assets/will.webp",
];

const IMAGES = [amityLogo, ...CHARACTER_URLS];
const VIDEO_THUMB =
  "https://image.mux.com/rt42FVRXL01VirdZbHjOMjPwd5sTP1LKKGFj1bDQpbnM/thumbnail.jpg?time=0";

const LETTERS = "CATALYST".split("");

function preloadImage(src: string) {
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

export function Loader({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"loading" | "open" | "gone">("loading");
  const target = useRef(0);

  useEffect(() => {
    let mounted = true;
    const total = IMAGES.length + 1; // +1 for video thumb proxy
    let loaded = 0;
    const tick = () => {
      loaded += 1;
      target.current = Math.min(1, loaded / total);
    };
    const tasks = [
      ...IMAGES.map((src) => preloadImage(src).then(tick)),
      preloadImage(VIDEO_THUMB).then(tick),
    ];

    const minTime = new Promise<void>((r) => setTimeout(r, 1600));

    Promise.all([Promise.all(tasks), minTime]).then(() => {
      if (!mounted) return;
      target.current = 1;
    });

    // smooth ease toward target
    let raf = 0;
    let cur = 0;
    const animate = () => {
      cur += (target.current - cur) * 0.08;
      setProgress(cur);
      if (cur < 0.995) {
        raf = requestAnimationFrame(animate);
      } else {
        setProgress(1);
        // door-open phase
        setPhase("open");
        setTimeout(() => {
          setPhase("gone");
          onDone();
        }, 1100);
      }
    };
    raf = requestAnimationFrame(animate);

    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
    };
  }, [onDone]);

  if (phase === "gone") return null;

  const pct = Math.round(progress * 100);
  const opening = phase === "open";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black"
      aria-label="Loading Catalyst 2K26"
    >
      {/* Curtain doors */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-black transition-transform duration-[1100ms] ease-[cubic-bezier(.7,.05,.2,1)]"
        style={{ transform: opening ? "translateX(-100%)" : "translateX(0)" }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-black transition-transform duration-[1100ms] ease-[cubic-bezier(.7,.05,.2,1)]"
        style={{ transform: opening ? "translateX(100%)" : "translateX(0)" }}
      />

      {/* Vignette + red glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.7)_70%,#000_100%)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[60vmin] w-[60vmin] -translate-x-1/2 -translate-y-1/2 blob-blood opacity-60" />

      {/* Lightning flicker bg */}
      <div className="pointer-events-none absolute inset-0 loader-flicker" />

      {/* Center stage */}
      <div
        className={`relative z-10 flex flex-col items-center px-6 transition-opacity duration-700 ${
          opening ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* Eyebrow */}
        <div className="mb-8 flex items-center gap-3">
          <span className="block h-px w-8 bg-blood/60" />
          <span className="block h-1.5 w-1.5 rounded-full bg-blood pulse-dot" />
          <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-blood">
            Hawkins Lab — Transmission
          </span>
          <span className="block h-1.5 w-1.5 rounded-full bg-blood pulse-dot" />
          <span className="block h-px w-8 bg-blood/60" />
        </div>

        {/* Letters */}
        <div className="flex items-center gap-1 sm:gap-2">
          {LETTERS.map((l, i) => {
            const reveal = pct >= ((i + 1) / LETTERS.length) * 100;
            return (
              <span
                key={i}
                className={`font-display text-5xl sm:text-7xl md:text-8xl transition-all duration-500 ${
                  reveal ? "letter-on" : "letter-off"
                }`}
                style={{ transitionDelay: `${i * 40}ms` }}
              >
                {l}
              </span>
            );
          })}
        </div>

        <div className="mt-3 font-display text-2xl sm:text-3xl italic text-bone/70">
          2K26
        </div>

        {/* Christmas-light string of bulbs */}
        <div className="relative mt-12 w-[min(560px,82vw)]">
          {/* wire */}
          <div className="absolute left-0 right-0 top-1/2 h-px bg-bone/15" />
          <div className="relative flex items-center justify-between">
            {Array.from({ length: 13 }).map((_, i) => {
              const on = pct / 100 > i / 13;
              const colors = [
                "var(--blood)",
                "var(--amber)",
                "var(--cyan)",
                "var(--magenta)",
              ];
              const c = colors[i % colors.length];
              return (
                <span
                  key={i}
                  className="relative inline-block h-3 w-3 rounded-full transition-all duration-500"
                  style={{
                    background: on ? c : "oklch(0.18 0.01 0)",
                    boxShadow: on ? `0 0 14px ${c}, 0 0 28px ${c}` : "none",
                    animationDelay: `${i * 90}ms`,
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-10 w-[min(560px,82vw)]">
          <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.4em] text-bone/55">
            <span>Opening the gate</span>
            <span className="text-blood tabular-nums">
              {String(pct).padStart(3, "0")}%
            </span>
          </div>
          <div className="mt-3 h-px w-full bg-bone/10">
            <div
              className="h-px bg-blood transition-[width] duration-150 ease-out"
              style={{
                width: `${pct}%`,
                boxShadow: "0 0 12px var(--blood), 0 0 24px var(--blood)",
              }}
            />
          </div>
          <p className="mt-4 text-center font-serif italic text-sm text-bone/45">
            “Friends don't lie.” — calibrating the Upside Down…
          </p>
        </div>
      </div>

      <style>{`
        .letter-off {
          color: oklch(0.18 0.01 0);
          text-shadow: none;
          opacity: 0.45;
          transform: translateY(2px);
        }
        .letter-on {
          color: var(--blood);
          text-shadow: 0 0 14px oklch(0.56 0.26 25 / 0.8), 0 0 40px oklch(0.56 0.26 25 / 0.45);
          opacity: 1;
          transform: translateY(0);
          animation: letterFlicker 2.4s infinite;
        }
        @keyframes letterFlicker {
          0%, 92%, 100% { opacity: 1; }
          93% { opacity: 0.55; }
          94% { opacity: 1; }
          95% { opacity: 0.7; }
          96% { opacity: 1; }
        }
        .loader-flicker {
          background:
            radial-gradient(ellipse at 30% 20%, oklch(0.56 0.26 25 / 0.08), transparent 60%),
            radial-gradient(ellipse at 70% 80%, oklch(0.56 0.26 25 / 0.06), transparent 60%);
          animation: bgFlicker 4s infinite;
        }
        @keyframes bgFlicker {
          0%, 100% { opacity: 1; }
          45% { opacity: 0.85; }
          47% { opacity: 1; }
          70% { opacity: 0.7; }
          72% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
