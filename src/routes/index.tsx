import { createFileRoute, Link } from "@tanstack/react-router";
import { HeroVideo } from "@/components/HeroVideo";
import { Nav } from "@/components/Nav";
import { Loader } from "@/components/Loader";
import { Mail, MessageCircle } from "lucide-react";
import { useEffect, useState, lazy, Suspense } from "react";

const Tracks = lazy(() =>
  import("@/components/Tracks").then((m) => ({ default: m.Tracks })),
);
const Timeline = lazy(() =>
  import("@/components/Timeline").then((m) => ({ default: m.Timeline })),
);
const Prizes = lazy(() =>
  import("@/components/Prizes").then((m) => ({ default: m.Prizes })),
);
const Faq = lazy(() =>
  import("@/components/Faq").then((m) => ({ default: m.Faq })),
);
const Footer = lazy(() =>
  import("@/components/Footer").then((m) => ({ default: m.Footer })),
);
const Countdown = lazy(() =>
  import("@/components/Countdown").then((m) => ({ default: m.Countdown })),
);
const Venue = lazy(() =>
  import("@/components/Venue").then((m) => ({ default: m.Venue })),
);
const Sponsors = lazy(() =>
  import("@/components/Sponsors").then((m) => ({ default: m.Sponsors })),
);
const Contact = lazy(() =>
  import("@/components/Contact").then((m) => ({ default: m.Contact })),
);

const socialLinks = {
  instagram:
    "https://www.instagram.com/hack_catalyst?utm_source=qr&igsh=OXBla2kyeDg5ZzRw",
  discord: "https://discord.gg/TCRccCKF",
  linkedin: "https://www.linkedin.com/in/catalyst-admin-b49136407",
  email: "mailto:catalyst.auk@gmail.com",
};

type SocialIconProps = {
  className?: string;
};

function InstagramLogo({ className }: SocialIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.3" cy="6.8" r="1.2" fill="currentColor" />
    </svg>
  );
}

function DiscordLogo({ className }: SocialIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <path
        d="M7.4 7.1A11 11 0 0 1 10 6.2l.5 1a9.8 9.8 0 0 1 3 0l.5-1a11 11 0 0 1 2.6.9c1.7 2.5 2.4 5 2.1 7.5a10.8 10.8 0 0 1-3.3 1.7l-.8-1.3c.5-.2 1-.4 1.4-.7a7.8 7.8 0 0 1-8 0c.4.3.9.5 1.4.7l-.8 1.3a10.8 10.8 0 0 1-3.3-1.7c-.3-2.5.4-5 2.1-7.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="9.5" cy="12" r="1" fill="currentColor" />
      <circle cx="14.5" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

function LinkedInLogo({ className }: SocialIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M5.6 8.8h3.1v9.8H5.6V8.8Zm1.6-4.9a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6Zm3.4 4.9h3v1.3h.1c.4-.8 1.5-1.6 3-1.6 3.2 0 3.8 2.1 3.8 4.9v5.2h-3.1V14c0-1.1 0-2.5-1.5-2.5s-1.8 1.2-1.8 2.4v4.7h-3.1V8.8Z"
      />
    </svg>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Catalyst 2K26 — 24hr AI Hackathon · Amity University Kolkata" },
      {
        name: "description",
        content:
          "Catalyst 2K26: a 24-hour AI hackathon hosted by Amity University Kolkata on 21–22 May 2026. ₹50,000 worth of prize pool. Four tracks. One Upside Down.",
      },
      { property: "og:title", content: "Catalyst 2K26 — AI Hackathon" },
      {
        property: "og:description",
        content:
          "24 hours. 4 tracks. ₹50,000 worth of prize pool. Step through the gate at Amity Kolkata, May 21–22, 2026.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://hack-catalyst.vercel.app/" },
      {
        rel: "preload",
        as: "image",
        href: "https://image.mux.com/rt42FVRXL01VirdZbHjOMjPwd5sTP1LKKGFj1bDQpbnM/thumbnail.jpg?time=0",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Event",
          name: "Catalyst 2K26 AI Hackathon",
          startDate: "2026-05-21T09:00:00+05:30",
          endDate: "2026-05-22T18:00:00+05:30",
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
          eventStatus: "https://schema.org/EventScheduled",
          location: {
            "@type": "Place",
            name: "Amity University Kolkata",
            address: {
              "@type": "PostalAddress",
              streetAddress:
                "Major Arterial Road, Action Area II, Rajarhat, New Town",
              addressLocality: "Kolkata",
              postalCode: "700135",
              addressRegion: "WB",
              addressCountry: "IN",
            },
          },
          image: [
            "https://hack-catalyst.vercel.app/attachments/catalyst_logo_white.png",
          ],
          description:
            "Catalyst 2K26: a 24-hour AI hackathon hosted by Amity University Kolkata on 21–22 May 2026. ₹50,000 worth of prize pool. Four tracks. One Upside Down.",
          offers: {
            "@type": "Offer",
            url: "https://hack-catalyst.vercel.app/register",
            price: "0",
            priceCurrency: "INR",
            availability: "https://schema.org/InStock",
            validFrom: "2026-01-01T00:00:00+05:30",
          },
          organizer: {
            "@type": "Organization",
            name: "Catalyst Hackathon",
            url: "https://hack-catalyst.vercel.app",
          },
        }),
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
  const socialItems = [
    {
      label: "Instagram",
      meta: "@hack_catalyst",
      href: socialLinks.instagram,
      icon: InstagramLogo,
      color: "text-[#ff6f8c]",
      accent:
        "border-[#e4405f]/35 bg-[#e4405f]/10 hover:border-[#e4405f]/80 hover:bg-[#e4405f]/20 hover:text-[#ff6f8c]",
    },
    {
      label: "Discord",
      meta: "Join the server",
      href: socialLinks.discord,
      icon: DiscordLogo,
      color: "text-[#8ea0ff]",
      accent:
        "border-[#5865f2]/35 bg-[#5865f2]/10 hover:border-[#5865f2]/80 hover:bg-[#5865f2]/20 hover:text-[#8ea0ff]",
    },
    {
      label: "LinkedIn",
      meta: "Catalyst Admin",
      href: socialLinks.linkedin,
      icon: LinkedInLogo,
      color: "text-[#64b5ff]",
      accent:
        "border-[#0a66c2]/35 bg-[#0a66c2]/10 hover:border-[#0a66c2]/80 hover:bg-[#0a66c2]/20 hover:text-[#64b5ff]",
    },
    {
      label: "Email",
      meta: "catalyst.auk@gmail.com",
      href: socialLinks.email,
      icon: Mail,
      color: "text-blood",
      accent:
        "border-blood/35 bg-blood/10 hover:border-blood/80 hover:bg-blood/20 hover:text-blood",
    },
  ];

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
            at{" "}
            <span className="title-outline not-italic">
              Amity University Kolkata
            </span>
          </span>
        </h1>

        {/* Subhead */}
        <p className="mx-auto mt-10 sm:mt-12 max-w-2xl text-center font-serif text-base sm:text-lg md:text-xl leading-relaxed text-bone/65 reveal reveal-delay-2 px-2">
          Four tracks. One gate. Build something the Upside Down hasn't seen —
          on the floor at Amity Kolkata, the night the world flickers.
        </p>

        <div className="mx-auto mt-8 max-w-2xl border border-amber/35 bg-amber/10 px-5 py-4 text-center reveal reveal-delay-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-amber">
            Registrations close on 15 May 2026
          </p>
        </div>

        {/* Spec strip */}
        <div className="mx-auto mt-14 sm:mt-20 grid max-w-4xl grid-cols-2 gap-px bg-blood/10 md:grid-cols-4 reveal reveal-delay-3">
          {[
            { k: "Date", v: "21–22", sub: "May 2026" },
            { k: "Format", v: "24h", sub: "On-campus" },
            { k: "Tracks", v: "04", sub: "AI verticals" },
            { k: "Prize Pool", v: "₹50K", sub: "Worth" },
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
          <Link
            to="/register"
            className="bracket relative w-full sm:w-auto text-center border border-blood bg-blood px-8 sm:px-12 py-4 font-mono text-[10px] uppercase tracking-[0.4em] sm:tracking-[0.45em] text-black transition-all duration-500 hover:bg-transparent hover:text-blood"
          >
            Register Now
          </Link>
          <a
            href={socialLinks.discord}
            target="_blank"
            rel="noreferrer"
            className="bracket relative inline-flex w-full items-center justify-center gap-3 border border-cyan/50 bg-cyan/10 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.35em] text-cyan transition-all duration-500 hover:border-cyan hover:bg-cyan hover:text-black sm:w-auto sm:px-10"
          >
            <MessageCircle className="h-4 w-4" />
            Join Discord
          </a>
          <a
            href="#tracks"
            className="bracket relative w-full sm:w-auto text-center border border-bone/20 bg-transparent px-8 sm:px-12 py-4 font-mono text-[10px] uppercase tracking-[0.4em] sm:tracking-[0.45em] text-bone/80 transition-all duration-500 hover:border-blood/60 hover:text-blood"
          >
            Explore Tracks ↓
          </a>
        </div>

        <div
          className="bracket relative mx-auto mt-10 max-w-4xl overflow-hidden border border-blood/30 bg-black/70 px-4 py-7 shadow-[0_0_45px_rgba(180,20,20,0.16)] reveal reveal-delay-4 sm:px-7 sm:py-8"
          aria-label="Catalyst social links"
        >
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-blood to-transparent" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blood/10 blur-3xl" />

          <div className="relative mb-6 text-center">
            <div className="mb-3 flex items-center justify-center gap-3">
              <span className="h-px w-10 bg-blood/60" />
              <p className="font-mono text-[9px] uppercase tracking-[0.45em] text-blood">
                Follow the signal
              </p>
              <span className="h-px w-10 bg-blood/60" />
            </div>
            <h2 className="font-display text-3xl italic leading-none text-bone sm:text-4xl">
              Stay connected
            </h2>
            <p className="mx-auto mt-3 max-w-xl font-serif text-sm leading-relaxed text-bone/60 sm:text-base">
              Updates, team calls, announcements, and behind-the-scenes drops
              land here first.
            </p>
          </div>

          <div className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {socialItems.map((item) => {
              const Icon = item.icon;
              const isExternal = item.href.startsWith("http");

              return (
                <a
                  key={item.label}
                  href={item.href}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noreferrer" : undefined}
                  className={`group flex min-h-28 flex-col items-center justify-center gap-3 border px-4 py-5 text-center text-bone/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_24px_rgba(240,230,230,0.08)] ${item.accent}`}
                  aria-label={
                    item.label === "Email"
                      ? "Email Catalyst"
                      : `Follow Catalyst on ${item.label}`
                  }
                >
                  <span
                    className={`grid h-12 w-12 place-items-center rounded-full border border-current/30 bg-black/35 shadow-[0_0_22px_currentColor] transition-transform duration-300 group-hover:scale-110 ${item.color}`}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone">
                    {item.label}
                  </span>
                  <span className="max-w-full truncate font-serif text-sm italic text-bone/55">
                    {item.meta}
                  </span>
                </a>
              );
            })}
          </div>
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
          <Suspense
            fallback={<div className="h-32 w-full animate-pulse bg-bone/5" />}
          >
            <Countdown />
          </Suspense>
        </div>
      </div>
    </section>
  );
}

function MarqueeStrip() {
  const items = [
    "MAY 21 — 22, 2026",
    "AMITY UNIVERSITY KOLKATA",
    "₹50,000 WORTH OF PRIZE POOL",
    "24 HOURS",
    "4 TRACKS",
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
        <Suspense fallback={<div className="min-h-screen" />}>
          <Prizes />
          <Tracks />
          <Sponsors />
          <Timeline />
          <Venue />
          <Faq />
          <Contact />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </>
  );
}
