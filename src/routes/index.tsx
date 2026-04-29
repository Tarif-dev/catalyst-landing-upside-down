import { createFileRoute } from "@tanstack/react-router";
import { HeroVideo } from "@/components/HeroVideo";
import { Nav } from "@/components/Nav";
import { Tracks } from "@/components/Tracks";
import { Timeline } from "@/components/Timeline";
import { Prizes } from "@/components/Prizes";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { Countdown } from "@/components/Countdown";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Catalyst 2K26 — 24hr AI Hackathon · Amity University Kolkata" },
      {
        name: "description",
        content:
          "Catalyst 2K26: a 24-hour AI hackathon hosted by Amity University Kolkata on 19–20 May 2026. ₹50,000+ prize pool. Five tracks. One Upside Down.",
      },
      { property: "og:title", content: "Catalyst 2K26 — AI Hackathon" },
      {
        property: "og:description",
        content:
          "24 hours. 5 tracks. ₹50,000+ prize pool. Step through the gate at Amity Kolkata, May 19–20, 2026.",
      },
    ],
  }),
  component: Index,
});

function Hero() {
  return (
    <section
      id="top"
      className="relative h-screen w-full overflow-hidden"
      aria-label="Catalyst 2K26 hero"
    >
      <HeroVideo />
    </section>
  );
}

function Details() {
  return (
    <section
      id="details"
      className="relative overflow-hidden px-6 pt-28 pb-32 md:pt-36 md:pb-44"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-magenta/60 to-transparent" />

      <div className="relative mx-auto max-w-6xl">
        {/* Eyebrow */}
        <div className="mb-10 flex items-center justify-center gap-3">
          <span className="block h-1.5 w-1.5 rounded-full bg-magenta shadow-magenta pulse-blood" />
          <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-magenta">
            Hawkins Lab // Transmission 2K26
          </span>
          <span className="block h-1.5 w-1.5 rounded-full bg-cyan shadow-cyan" />
        </div>

        {/* Title */}
        <h1 className="text-center font-display leading-[0.85] tracking-tight">
          <span className="block title-outline text-[20vw] md:text-[14rem]">
            CATALYST
          </span>
          <span className="mt-3 block title-outline-magenta text-[12vw] md:text-[8rem]">
            2K26
          </span>
        </h1>

        {/* Tagline */}
        <p className="mx-auto mt-10 max-w-2xl text-center font-body text-base md:text-lg leading-relaxed text-bone/80">
          A <span className="text-magenta">24-hour AI hackathon</span> at{" "}
          <span className="text-cyan">Amity University Kolkata</span>. Five
          tracks. One gate. Build something the Upside Down hasn't seen.
        </p>

        {/* Quick spec strip */}
        <div className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { k: "Date", v: "19–20 May", sub: "2026" },
            { k: "Format", v: "24 Hours", sub: "On-campus" },
            { k: "Tracks", v: "5", sub: "AI verticals" },
            { k: "Prize Pool", v: "₹50K+", sub: "INR" },
          ].map((item) => (
            <div
              key={item.k}
              className="hud neon-card px-4 py-5 text-center"
            >
              <div className="font-mono text-[9px] uppercase tracking-[0.35em] text-bone/50">
                {item.k}
              </div>
              <div className="mt-2 font-display text-2xl md:text-3xl text-bone tracking-wider">
                {item.v}
              </div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-magenta/80">
                {item.sub}
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="mt-14 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#register"
            className="hud relative border border-magenta bg-magenta px-10 py-4 font-mono text-[11px] uppercase tracking-[0.4em] text-background transition-all hover:bg-transparent hover:text-magenta hover:shadow-magenta"
          >
            Enter the Gate
          </a>
          <a
            href="#tracks"
            className="hud relative border border-cyan/60 bg-cyan/5 px-10 py-4 font-mono text-[11px] uppercase tracking-[0.4em] text-cyan transition-all hover:border-cyan hover:bg-cyan/15 hover:shadow-cyan"
          >
            Explore Tracks ↓
          </a>
        </div>

        {/* Countdown */}
        <div className="mx-auto mt-24 w-full max-w-3xl">
          <p className="mb-5 text-center font-mono text-[10px] uppercase tracking-[0.5em] text-bone/55">
            ▎ Gate opens in
          </p>
          <Countdown />
        </div>
      </div>
    </section>
  );
}

function MarqueeStrip() {
  const items = [
    "MAY 19–20, 2026",
    "AMITY UNIVERSITY KOLKATA",
    "₹50,000+ PRIZE POOL",
    "24 HOURS",
    "5 TRACKS",
    "ONE GATE",
  ];
  return (
    <div className="overflow-hidden border-y border-magenta/20 bg-void/60 py-4 backdrop-blur-sm">
      <div className="flex animate-[marquee_40s_linear_infinite] whitespace-nowrap">
        {[...items, ...items, ...items].map((it, i) => (
          <span
            key={i}
            className="mx-8 font-display text-2xl tracking-[0.35em] text-magenta/70"
          >
            {it}{" "}
            <span className="mx-8 text-cyan">✦</span>
          </span>
        ))}
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-33.333%); } }`}</style>
    </div>
  );
}

function Index() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Details />
        <MarqueeStrip />
        <Tracks />
        <Timeline />
        <Prizes />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
