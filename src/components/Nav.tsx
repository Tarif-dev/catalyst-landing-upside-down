import { useEffect, useState } from "react";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#details", label: "Details" },
    { href: "#tracks", label: "Tracks" },
    { href: "#timeline", label: "Schedule" },
    { href: "#prizes", label: "Prizes" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-700 ${
        scrolled
          ? "border-b border-blood/15 bg-black/70 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <a href="#top" aria-label="Home" className="flex items-center gap-2.5">
          <span className="block h-1.5 w-1.5 rounded-full bg-blood pulse-dot" />
          <span className="font-mono text-[10px] uppercase tracking-[0.45em] text-bone/70">
            C/2K26
          </span>
        </a>

        <ul className="hidden items-center gap-12 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="group relative font-mono text-[10px] uppercase tracking-[0.4em] text-bone/65 transition-colors hover:text-bone"
              >
                {l.label}
                <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-blood transition-all duration-500 group-hover:w-full" />
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#register"
          className="bracket group relative inline-flex items-center gap-2.5 border border-blood/40 bg-blood/5 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.4em] text-blood transition-all duration-500 hover:border-blood hover:bg-blood hover:text-black"
        >
          <span className="block h-1 w-1 rounded-full bg-blood transition-colors group-hover:bg-black" />
          Register
        </a>
      </nav>
    </header>
  );
}
