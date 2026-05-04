import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer
      id="register"
      className="relative overflow-hidden border-t border-blood/15 px-5 sm:px-6 py-20 sm:py-28"
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[30rem] w-[30rem] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 blob-blood opacity-50" />

      <div className="relative mx-auto max-w-3xl text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] sm:tracking-[0.5em] text-blood mb-6 sm:mb-8 reveal">
          ▸ Final Transmission
        </p>
        <h2 className="font-display text-5xl sm:text-6xl md:text-8xl text-bone italic mb-8 sm:mb-10 leading-[1] reveal reveal-delay-1">
          Will you <span className="title-outline not-italic font-display">answer</span>?
        </h2>
        <p className="mx-auto max-w-xl font-serif text-lg leading-relaxed text-bone/60 mb-14 reveal reveal-delay-2">
          Registrations open soon. Drop a line to the organizing team and be first
          through the gate when it cracks.
        </p>

        <a
          href="mailto:catalyst.auk@gmail.com"
          className="bracket relative inline-block border border-blood bg-blood px-10 sm:px-14 py-4 font-mono text-[10px] uppercase tracking-[0.5em] text-black transition-all duration-500 hover:bg-transparent hover:text-blood reveal reveal-delay-3"
        >
          Register Interest
        </a>

        <div className="mt-24 flex flex-col items-center gap-3 border-t border-bone/10 pt-10">
          <div className="flex items-center gap-3">
            <span className="block h-1 w-1 rounded-full bg-blood pulse-dot" />
            <span className="font-display text-base tracking-[0.3em] text-bone italic">
              Catalyst · 2K26
            </span>
            <span className="block h-1 w-1 rounded-full bg-blood pulse-dot" />
          </div>
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-bone/40 text-center">
            Amity University Kolkata · 21–22 May 2026
          </p>
          <Link to="/admin-login" className="font-mono text-[8px] uppercase tracking-[0.4em] text-bone/20 hover:text-blood transition mt-4">
            Admin Access
          </Link>
        </div>
      </div>
    </footer>
  );
}
