import { SectionTitle } from "./SectionTitle";
import cloudPartnerLogo from "@/assets/sponsors/cloud_partner_utho_white.png";
import osenLogo from "@/assets/sponsors/Osen_white_logo.png";
import miroLogo from "@/assets/sponsors/Miro.png";
import riseInStellarLogo from "@/assets/sponsors/rise_in_stellar.png";
import sajagLogo from "@/assets/sponsors/Sajag_media.png";
import drogLogo from "@/assets/sponsors/The_Drop_Organisation.png";
import interviewBuddyLogo from "@/assets/sponsors/InterviewBuddy.png";
import xyzLogo from "@/assets/sponsors/xyz-logo-white.png";

type Tier = {
  tier: string;
  tag: string;
  note: string;
  size: "xl" | "lg" | "md" | "sm";
  sponsors: { name: string; desc?: string; logo?: string; href?: string }[];
};

const tiers: Tier[] = [
  {
    tier: "Gold Sponsor",
    tag: "Tier 01 · Headline",
    note: "Leading the charge for Catalyst 2K26.",
    size: "xl",
    sponsors: [
      {
        name: "Osen",
        desc: "Gold Sponsor",
        logo: osenLogo,
        href: "https://osen.io/",
      },
    ],
  },
  {
    tier: "Cloud Partner",
    tag: "Tier 02 · Infrastructure",
    note: "Compute, storage, and the grid beneath it all.",
    size: "lg",
    sponsors: [
      {
        name: "Utho",
        desc: "Cloud Partner",
        logo: cloudPartnerLogo,
        href: "https://utho.com/",
      },
    ],
  },
  {
    tier: "Blockchain Partner",
    tag: "Tier 03 · Blockchain",
    note: "Powering decentralised innovation on-chain.",
    size: "lg",
    sponsors: [
      {
        name: "Rise In Stellar",
        desc: "Blockchain Partner",
        logo: riseInStellarLogo,
        href: "https://www.risein.com/",
      },
    ],
  },
  {
    tier: "Associate Partners",
    tag: "Tier 04 · Associates",
    note: "The allies amplifying the signal.",
    size: "md",
    sponsors: [
      {
        name: "Miro",
        desc: "Associate Partner",
        logo: miroLogo,
        href: "https://miro.com/",
      },
      {
        name: "Interview Buddy",
        desc: "Associate Partner",
        logo: interviewBuddyLogo,
        href: "https://interviewbuddy.net/",
      },
      {
        name: ".xyz",
        desc: "Associate Partner",
        logo: xyzLogo,
        href: "https://gen.xyz/",
      },
    ],
  },
  {
    tier: "Community Partners",
    tag: "Tier 05 · Community",
    note: "The network. The signal carriers.",
    size: "md",
    sponsors: [
      {
        name: "Sajag",
        desc: "Media Partner",
        logo: sajagLogo,
      },
      {
        name: "The Drog Organisation",
        desc: "Merchandise Partner",
        logo: drogLogo,
      },
    ],
  },
];

const colsMap = {
  xl: "grid-cols-1",
  lg: "grid-cols-1",
  md: "grid-cols-1 sm:grid-cols-3",
  sm: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
};

const logoSizeMap = {
  xl: "max-h-36 max-w-[360px]",
  lg: "max-h-24 max-w-[300px]",
  md: "max-h-20 max-w-[240px]",
  sm: "max-h-16 max-w-[200px]",
};

export function Sponsors() {
  return (
    <section
      id="sponsors"
      className="relative overflow-hidden px-6 py-24 md:py-44 border-t border-blood/10"
    >
      <div className="pointer-events-none absolute left-1/2 top-32 h-96 w-[40rem] -translate-x-1/2 blob-blood opacity-30" />

      <div className="relative mx-auto max-w-6xl">
        <SectionTitle eyebrow="Backers — Signal Amplifiers" italic>
          The Sponsors.
        </SectionTitle>

        <p className="mx-auto -mt-6 mb-16 md:mb-20 max-w-2xl text-center font-serif text-base md:text-lg italic text-bone/55 reveal">
          The partners keeping the lights on when Hawkins flickers.
        </p>

        <div className="flex flex-col gap-16 md:gap-20">
          {tiers.map((t, ti) => (
            <div
              key={t.tier}
              className="reveal"
              style={{ animationDelay: `${ti * 0.08}s` }}
            >
              {/* Tier header */}
              <div className="mb-6 md:mb-8 flex flex-col items-center text-center gap-3">
                <div className="flex items-center gap-3 md:gap-4">
                  <span className="block h-px w-8 md:w-12 bg-blood/50" />
                  <span className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.45em] text-blood whitespace-nowrap">
                    {t.tag}
                  </span>
                  <span className="block h-px w-8 md:w-12 bg-blood/50" />
                </div>
                <h3 className="font-display text-3xl md:text-4xl italic text-bone">
                  {t.tier}
                </h3>
                <p className="font-serif italic text-sm md:text-base text-bone/50 max-w-md">
                  {t.note}
                </p>
              </div>

              {/* Sponsor grid */}
              <div
                className={`grid gap-px bg-blood/10 ${
                  t.sponsors.length === 1
                    ? "mx-auto w-full max-w-lg grid-cols-1"
                    : colsMap[t.size]
                }`}
              >
                {t.sponsors.map((s, si) => {
                  const content = (
                    <>
                      {s.logo ? (
                        <div className="flex min-h-24 flex-col items-center justify-center">
                          <img
                            src={s.logo}
                            alt={s.name}
                            className={`${logoSizeMap[t.size]} w-auto object-contain opacity-95 drop-shadow-[0_0_22px_rgba(240,230,230,0.22)] transition-all duration-500 group-hover:scale-105 group-hover:opacity-100`}
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="font-display text-4xl md:text-6xl italic text-bone/85 leading-tight transition-all duration-500 group-hover:text-blood group-hover:text-glow-blood">
                          {s.name}
                        </div>
                      )}
                      {s.desc && (
                        <div className="mt-3 font-mono text-[9px] uppercase tracking-[0.4em] text-blood/70">
                          {s.desc}
                        </div>
                      )}
                    </>
                  );

                  const className =
                    "bracket group relative block bg-black px-4 py-8 text-center transition-all duration-500 hover:bg-blood/[0.04] md:py-12";

                  return s.href ? (
                    <a
                      key={s.name}
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      className={className}
                      style={{ animationDelay: `${si * 0.04}s` }}
                      aria-label={`Visit ${s.name}`}
                    >
                      {content}
                    </a>
                  ) : (
                    <div
                      key={s.name}
                      className={className}
                      style={{ animationDelay: `${si * 0.04}s` }}
                    >
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-20 md:mt-24 flex flex-col items-center gap-4 text-center reveal">
          <p className="font-serif italic text-bone/55 text-base md:text-lg max-w-xl">
            Want your name through the gate? Partner with Catalyst 2K26.
          </p>
          <a
            href="#contact"
            className="bracket border border-blood/40 bg-blood/5 px-8 py-3 font-mono text-[10px] uppercase tracking-[0.4em] text-blood transition-all duration-500 hover:border-blood hover:bg-blood hover:text-black"
          >
            Become a Sponsor →
          </a>
        </div>
      </div>
    </section>
  );
}
