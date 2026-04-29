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
    <section id="top" className="relative min-h-screen overflow-hidden">
      <HeroVideo />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pt-24 text-center">
        {/* Eyebrow tape */}
        <div className="mb-8 inline-flex items-center gap-3 border border-blood/40 bg-background/60 px-4 py-2 backdrop-blur-sm">
          <span className="block h-1.5 w-1.5 rounded-full bg-blood pulse-blood" />
          <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-blood">
            Hawkins Lab Presents · A 24hr AI Hackathon
          </span>
        </div>

        {/* Title — ST style outlined letters with blood-glow */}
        <h1 className="font-display text-[18vw] leading-[0.85] tracking-tight md:text-[12rem]">
          <span className="block title-outline flicker">CATALYST</span>
          <span className="mt-2 block text-blood text-glow-blood text-[10vw] md:text-[7rem]">
            2K26
          </span>
        </h1>

        <p className="mt-8 max-w-xl font-mono text-sm leading-relaxed text-bone/90 md:text-base">
          Something is coming to{" "}
          <span className="text-blood">Amity University Kolkata</span>.
          <br className="hidden md:block" />
          24 hours. 5 tracks. One chance to step through.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <a
            href="#register"
            className="border border-blood bg-blood px-8 py-3 font-mono text-xs uppercase tracking-[0.3em] text-primary-foreground transition-all hover:bg-transparent hover:text-blood hover:shadow-blood"
          >
            Enter the Gate
          </a>
          <a
            href="#tracks"
            className="border border-blood/50 bg-background/40 px-8 py-3 font-mono text-xs uppercase tracking-[0.3em] text-blood backdrop-blur-sm transition-all hover:border-blood hover:bg-blood/10"
          >
            See Tracks ↓
          </a>
        </div>

        {/* Countdown */}
        <div className="mt-16 w-full max-w-2xl">
          <p className="mb-3 text-center font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            Gate opens in
          </p>
          <Countdown />
        </div>
      </div>

      {/* Bottom fade into next section */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-background" />
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
    <div className="overflow-hidden border-y border-blood/20 bg-background/80 py-4">
      <div className="flex animate-[marquee_30s_linear_infinite] whitespace-nowrap">
        {[...items, ...items, ...items].map((it, i) => (
          <span
            key={i}
            className="mx-8 font-display text-2xl tracking-[0.3em] text-blood/70"
          >
            {it} <span className="mx-8 text-blood">✦</span>
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
