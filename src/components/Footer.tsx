export function Footer() {
  return (
    <footer
      id="register"
      className="border-t border-blood/20 px-6 py-20 bg-upside-down"
    >
      <div className="mx-auto max-w-4xl text-center">
        <p className="font-mono text-xs uppercase tracking-[0.4em] text-blood/80 mb-4">
          // final transmission
        </p>
        <h2 className="font-display text-5xl md:text-7xl title-outline mb-6">
          Will You Answer?
        </h2>
        <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground mb-10">
          Registrations open soon. Drop your email with the organizing team and
          be the first to step through the gate.
        </p>

        <a
          href="mailto:catalyst@amitykolkata.edu.in"
          className="inline-block border border-blood bg-blood px-10 py-4 font-mono text-sm uppercase tracking-[0.3em] text-primary-foreground transition-all hover:bg-transparent hover:text-blood hover:shadow-blood pulse-blood"
        >
          Register Interest
        </a>

        <div className="mt-16 flex flex-col items-center gap-3 border-t border-blood/15 pt-8">
          <div className="flex items-center gap-2">
            <span className="block h-1.5 w-1.5 rounded-full bg-blood pulse-blood" />
            <span className="font-display text-sm tracking-[0.3em] text-blood">
              CATALYST · 2K26
            </span>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Hosted by Amity University Kolkata · 19–20 May 2026
          </p>
        </div>
      </div>
    </footer>
  );
}
