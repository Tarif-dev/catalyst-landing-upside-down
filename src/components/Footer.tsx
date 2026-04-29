export function Footer() {
  return (
    <footer
      id="register"
      className="relative overflow-hidden border-t border-magenta/20 px-6 py-24"
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 grid-floor opacity-40" />

      <div className="relative mx-auto max-w-4xl text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-magenta mb-6">
          ▎ Final Transmission
        </p>
        <h2 className="font-display text-5xl md:text-8xl title-outline mb-8 leading-[0.95]">
          Will You Answer?
        </h2>
        <p className="mx-auto max-w-xl text-sm leading-relaxed text-bone/65 mb-12">
          Registrations open soon. Drop a line to the organizing team and be first
          through the gate when it cracks.
        </p>

        <a
          href="mailto:catalyst@amitykolkata.edu.in"
          className="hud relative inline-block border border-magenta bg-magenta px-12 py-4 font-mono text-xs uppercase tracking-[0.4em] text-background transition-all hover:bg-transparent hover:text-magenta hover:shadow-magenta"
        >
          Register Interest
        </a>

        <div className="mt-20 flex flex-col items-center gap-3 border-t border-magenta/15 pt-10">
          <div className="flex items-center gap-3">
            <span className="block h-1.5 w-1.5 rounded-full bg-magenta shadow-magenta" />
            <span className="font-display text-base tracking-[0.3em] text-bone">
              CATALYST · 2K26
            </span>
            <span className="block h-1.5 w-1.5 rounded-full bg-cyan shadow-cyan" />
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-bone/50">
            Hosted by Amity University Kolkata · 19–20 May 2026
          </p>
        </div>
      </div>
    </footer>
  );
}
