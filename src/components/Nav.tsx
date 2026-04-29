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
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-magenta/20 bg-background/75 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="#top" aria-label="Home" className="flex items-center gap-2">
          <span className="block h-2 w-2 rounded-full bg-magenta shadow-magenta" />
          <span className="block h-2 w-2 rounded-full bg-cyan shadow-cyan" />
        </a>

        <ul className="hidden items-center gap-10 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="font-mono text-[11px] uppercase tracking-[0.3em] text-bone/70 transition-colors hover:text-magenta"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#register"
          className="hud relative inline-flex items-center gap-2 border border-magenta/60 bg-magenta/10 px-5 py-2 font-mono text-[11px] uppercase tracking-[0.3em] text-magenta transition-all hover:bg-magenta hover:text-background"
        >
          <span className="block h-1.5 w-1.5 rounded-full bg-magenta" />
          Register
        </a>
      </nav>
    </header>
  );
}
