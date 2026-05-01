import { createFileRoute } from "@tanstack/react-router";
import { HeroVideo } from "@/components/HeroVideo";
import { Nav } from "@/components/Nav";
import { Tracks } from "@/components/Tracks";
import { Timeline } from "@/components/Timeline";
import { Prizes } from "@/components/Prizes";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { Countdown } from "@/components/Countdown";
import { Venue } from "@/components/Venue";
import { Sponsors } from "@/components/Sponsors";
import { Contact } from "@/components/Contact";
import { Loader } from "@/components/Loader";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Catalyst 2K26 — 24hr AI Hackathon · Amity University Kolkata" },
      {
        name: "description",
        content:
          "Catalyst 2K26: a 24-hour AI hackathon hosted by Amity University Kolkata on 21–22 May 2026. ₹50,000+ prize pool. Five tracks. One Upside Down.",
      },
      { property: "og:title", content: "Catalyst 2K26 — AI Hackathon" },
      {
        property: "og:description",
        content:
          "24 hours. 5 tracks. ₹50,000+ prize pool. Step through the gate at Amity Kolkata, May 21–22, 2026.",
      },
    ],
  }),
  component: Index,
});

function Hero() {
  return (
    <section
      id="top"
      className="relative h-[100svh] w-full overflow-hidden bg-black"
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
      className="relative overflow-hidden px-5 sm:px-6 pt-24 sm:pt-32 pb-24 sm:pb-32 md:pt-40 md:pb-44"
    >
      <div className="pointer-events-none absolute left-1/2 top-10 h-96 w-[40rem] max-w-[90vw] -translate-x-1/2 blob-blood opacity-40" />

      <div className="relative mx-auto max-w-5xl">
        {/* Eyebrow */}
        <div className="mb-10 sm:mb-12 flex flex-wrap items-center justify-center gap-2 sm:gap-4 reveal">
          <span className="hidden sm:block h-px w-10 bg-blood/60" />
          <span className="block h-1.5 w-1.5 rounded-full bg-blood pulse-dot" />
          <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.4em] sm:tracking-[0.5em] text-blood text-center">
            Hawkins Lab — Transmission 2K26
          </span>
          <span className="block h-1.5 w-1.5 rounded-full bg-blood pulse-dot" />
          <span className="hidden sm:block h-px w-10 bg-blood/60" />
        </div>

        {/* Editorial title */}
        <h1 className="text-center font-display text-bone leading-[1.05] reveal reveal-delay-1">
          <span className="block text-3xl sm:text-4xl md:text-6xl italic text-bone/80">
            A 24-hour AI hackathon
          </span>
          <span className="mt-3 sm:mt-4 block text-2xl sm:text-3xl md:text-5xl">
            at <span className="title-outline not-italic">Amity University Kolkata</span>
          </span>
        </h1>

        {/* Subhead */}
        <p className="mx-auto mt-10 sm:mt-12 max-w-2xl text-center font-serif text-base sm:text-lg md:text-xl leading-relaxed text-bone/65 reveal reveal-delay-2 px-2">
          Five tracks. One gate. Build something the Upside Down hasn't seen —
          on the floor at Amity Kolkata, the night the world flickers.
        </p>

        {/* Spec strip */}
        <div className="mx-auto mt-14 sm:mt-20 grid max-w-4xl grid-cols-2 gap-px bg-blood/10 md:grid-cols-4 reveal reveal-delay-3">
          {[
            { k: "Date", v: "21–22", sub: "May 2026" },
            { k: "Format", v: "24h", sub: "On-campus" },
            { k: "Tracks", v: "05", sub: "AI verticals" },
            { k: "Prize Pool", v: "₹50K+", sub: "INR" },
          ].map((item) => (
            <div
              key={item.k}
              className="bracket relative bg-black px-3 sm:px-4 py-6 sm:py-7 text-center"
            >
              <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-bone/45">
                {item.k}
              </div>
              <div className="mt-3 font-display text-2xl sm:text-3xl md:text-4xl text-bone tracking-tight">
                {item.v}
              </div>
              <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.35em] text-blood/70">
                {item.sub}
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="mt-12 sm:mt-16 flex flex-col items-center justify-center gap-4 sm:flex-row reveal reveal-delay-4">
          <a
            href="#register"
            className="bracket relative w-full sm:w-auto text-center border border-blood bg-blood px-8 sm:px-12 py-4 font-mono text-[10px] uppercase tracking-[0.4em] sm:tracking-[0.45em] text-black transition-all duration-500 hover:bg-transparent hover:text-blood"
          >
            Enter the Gate
          </a>
          <a
            href="#tracks"
            className="bracket relative w-full sm:w-auto text-center border border-bone/20 bg-transparent px-8 sm:px-12 py-4 font-mono text-[10px] uppercase tracking-[0.4em] sm:tracking-[0.45em] text-bone/80 transition-all duration-500 hover:border-blood/60 hover:text-blood"
          >
            Explore Tracks ↓
          </a>
        </div>

        {/* Countdown */}
        <div className="mx-auto mt-20 sm:mt-28 w-full max-w-3xl reveal reveal-delay-4">
          <div className="mb-6 flex items-center justify-center gap-3">
            <span className="block h-px w-6 sm:w-8 bg-blood/50" />
            <p className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.4em] sm:tracking-[0.5em] text-bone/55">
              Gate opens in
            </p>
            <span className="block h-px w-6 sm:w-8 bg-blood/50" />
          </div>
          <Countdown />
        </div>
      </div>
    </section>
  );
}

function MarqueeStrip() {
  const items = [
    "MAY 21 — 22, 2026",
    "AMITY UNIVERSITY KOLKATA",
    "₹50,000+ PRIZE POOL",
    "24 HOURS",
    "5 TRACKS",
    "ONE GATE",
  ];
  return (
    <div className="overflow-hidden border-y border-blood/15 bg-black py-4 sm:py-5">
      <div className="flex marquee-track whitespace-nowrap">
        {[...items, ...items, ...items].map((it, i) => (
          <span
            key={i}
            className="mx-6 sm:mx-10 font-display text-xl sm:text-2xl italic tracking-wide text-bone/80"
          >
            {it}
            <span className="ml-6 sm:ml-10 text-blood not-italic">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Index() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) {
      document.body.style.overflow = "";
    } else {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [loaded]);

  return (
    <>
      {!loaded && <Loader onDone={() => setLoaded(true)} />}
      <Nav />
      <main>
        <Hero />
        <Details />
        <MarqueeStrip />
        <Prizes />
        <Tracks />
        <Sponsors />
        <Timeline />
        <Venue />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
