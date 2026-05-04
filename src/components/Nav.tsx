import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import amityLogo from "@/assets/amity_logo_white.png";
import { supabase } from "@/integrations/supabase/client";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const links = [
    { href: "/#details", label: "Details" },
    { href: "/#prizes", label: "Prizes" },
    { href: "/#tracks", label: "Tracks" },
    { href: "/#sponsors", label: "Sponsors" },
    { href: "/#timeline", label: "Schedule" },
    { href: "/#venue", label: "Venue" },
    { href: "/#faq", label: "FAQ" },
    { href: "/#contact", label: "Contact" },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-700 ${
        scrolled || open
          ? "border-b border-blood/15 bg-black/80 backdrop-blur-xl"
          : "bg-transparent"
      }`}
      style={{ fontFamily: "'Cormorant Garamond', serif" }}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-6 py-3 sm:py-4">
        <a
          href="#top"
          aria-label="Amity University Kolkata"
          className="flex items-center gap-3 group"
          onClick={() => setOpen(false)}
        >
          <img
            src={amityLogo}
            alt="Amity University Kolkata"
            className="h-8 sm:h-10 w-auto object-contain transition-opacity duration-500 group-hover:opacity-80"
            decoding="async"
            fetchPriority="high"
          />
        </a>

        {/* Desktop links */}
        <ul className="hidden lg:flex items-center gap-8 xl:gap-10">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="group relative text-[15px] italic text-bone/70 transition-colors hover:text-bone"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                {l.label}
                <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-blood transition-all duration-500 group-hover:w-full" />
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <Link
            to={authed ? "/dashboard" : "/register"}
            className="bracket hidden sm:inline-flex group relative items-center gap-2.5 border border-blood/40 bg-blood/5 px-5 md:px-6 py-2 md:py-2.5 text-[13px] italic text-blood transition-all duration-500 hover:border-blood hover:bg-blood hover:text-black"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            <span className="block h-1 w-1 rounded-full bg-blood transition-colors group-hover:bg-black" />
            {authed ? "Dashboard" : "Register"}
          </Link>

          {/* Mobile toggle */}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
            className="lg:hidden relative h-10 w-10 flex flex-col items-center justify-center gap-1.5 border border-blood/30 bg-blood/5 transition-colors hover:border-blood"
          >
            <span
              className={`block h-px w-5 bg-blood transition-transform duration-300 ${
                open ? "translate-y-[3px] rotate-45" : ""
              }`}
            />
            <span
              className={`block h-px w-5 bg-blood transition-transform duration-300 ${
                open ? "-translate-y-[3px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        className={`lg:hidden overflow-hidden transition-[max-height,opacity] duration-500 ease-out ${
          open ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <ul className="flex flex-col border-t border-blood/15 bg-black/90 backdrop-blur-xl px-6 py-4">
          {links.map((l) => (
            <li key={l.href} className="border-b border-bone/5 last:border-0">
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between py-4 text-lg italic text-bone/80 hover:text-blood transition-colors"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                <span>{l.label}</span>
                <span className="font-mono text-[10px] tracking-[0.3em] text-blood/60">
                  →
                </span>
              </a>
            </li>
          ))}
          <li className="pt-4">
            <Link
              to={authed ? "/dashboard" : "/register"}
              onClick={() => setOpen(false)}
              className="bracket block text-center border border-blood bg-blood py-3 font-mono text-[10px] uppercase tracking-[0.4em] text-black"
            >
              {authed ? "Dashboard" : "Register"}
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
}
