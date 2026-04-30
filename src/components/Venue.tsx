import { SectionTitle } from "./SectionTitle";

const coords = [
  { k: "Campus", v: "Amity University", sub: "Kolkata" },
  { k: "City", v: "Rajarhat", sub: "New Town · WB" },
  { k: "Coordinates", v: "22.596° N", sub: "88.484° E" },
  { k: "Gate Opens", v: "19 May", sub: "09:00 IST" },
];

export function Venue() {
  return (
    <section
      id="venue"
      className="relative overflow-hidden px-6 py-32 md:py-44 border-t border-blood/10"
    >
      <div className="pointer-events-none absolute left-10 top-20 h-80 w-80 blob-blood opacity-40" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-96 w-96 blob-rose opacity-30" />

      <div className="relative mx-auto max-w-6xl">
        <SectionTitle eyebrow="Location — The Gate, on Earth" italic>
          The Venue.
        </SectionTitle>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-px bg-blood/15 reveal reveal-delay-1">
          {/* Map */}
          <div className="md:col-span-7 relative bg-black">
            <div className="relative aspect-[4/3] md:aspect-auto md:h-full min-h-[380px] overflow-hidden">
              <iframe
                title="Amity University Kolkata — Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3683.5294759164753!2d88.48488367610287!3d22.596694979474652!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f882d4ebdbb839%3A0x9d75c9117c4db1d4!2sAmity%20University%20Kolkata!5e0!3m2!1sen!2sin!4v1777569545249!5m2!1sen!2sin"
                width="100%"
                height="100%"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 h-full w-full border-0"
                style={{
                  filter:
                    "grayscale(1) invert(0.92) contrast(1.1) hue-rotate(175deg) saturate(0.6) brightness(0.85)",
                }}
              />
              {/* Blood wash */}
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.55)_100%)] mix-blend-multiply" />
              <div className="pointer-events-none absolute inset-0 bg-blood/[0.08] mix-blend-overlay" />
              {/* Scanlines */}
              <div
                className="pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 3px)",
                }}
              />
              {/* Corner brackets */}
              <span className="absolute top-3 left-3 h-4 w-4 border-t border-l border-blood/80 pointer-events-none" />
              <span className="absolute top-3 right-3 h-4 w-4 border-t border-r border-blood/80 pointer-events-none" />
              <span className="absolute bottom-3 left-3 h-4 w-4 border-b border-l border-blood/80 pointer-events-none" />
              <span className="absolute bottom-3 right-3 h-4 w-4 border-b border-r border-blood/80 pointer-events-none" />

              {/* HUD label */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/70 backdrop-blur-sm border border-blood/30 px-4 py-2 pointer-events-none">
                <span className="block h-1.5 w-1.5 rounded-full bg-blood pulse-dot" />
                <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-blood">
                  Signal Located · Hawkins Grid
                </span>
              </div>
            </div>
          </div>

          {/* Address panel */}
          <div className="md:col-span-5 bg-black p-8 md:p-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="block h-px w-8 bg-blood/60" />
                <span className="font-mono text-[9px] uppercase tracking-[0.45em] text-blood">
                  Coordinates
                </span>
              </div>

              <h3 className="font-display text-4xl md:text-5xl italic text-bone leading-tight mb-5">
                Amity University,
                <br />
                <span className="title-outline not-italic">Kolkata</span>
              </h3>

              <p className="font-serif italic text-bone/60 text-lg leading-relaxed mb-8">
                Major Arterial Road, Action Area II,
                <br />
                Rajarhat, New Town,
                <br />
                Kolkata, West Bengal — 700135
              </p>

              <div className="hairline w-full mb-8" />

              <div className="grid grid-cols-2 gap-px bg-blood/15">
                {coords.map((c) => (
                  <div key={c.k} className="bg-black px-4 py-5">
                    <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-bone/45">
                      {c.k}
                    </div>
                    <div className="mt-2 font-display italic text-xl text-bone">
                      {c.v}
                    </div>
                    <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.35em] text-blood/70">
                      {c.sub}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=Amity+University+Kolkata"
                target="_blank"
                rel="noreferrer noopener"
                className="bracket flex-1 text-center border border-blood bg-blood px-6 py-3.5 font-mono text-[10px] uppercase tracking-[0.4em] text-black transition-all duration-500 hover:bg-transparent hover:text-blood"
              >
                Get Directions →
              </a>
              <a
                href="https://maps.app.goo.gl/?q=Amity+University+Kolkata"
                target="_blank"
                rel="noreferrer noopener"
                className="bracket flex-1 text-center border border-bone/20 px-6 py-3.5 font-mono text-[10px] uppercase tracking-[0.4em] text-bone/80 transition-all duration-500 hover:border-blood/60 hover:text-blood"
              >
                Open in Maps
              </a>
            </div>
          </div>
        </div>

        <p className="mt-10 text-center font-italic-display text-base text-bone/50 italic reveal reveal-delay-2">
          “When the gate opens, follow the flicker.”
        </p>
      </div>
    </section>
  );
}
