export function Nav() {
  const links = [
    { href: "#tracks", label: "Tracks" },
    { href: "#timeline", label: "Schedule" },
    { href: "#prizes", label: "Prizes" },
    { href: "#faq", label: "FAQ" },
  ];
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-blood/20 bg-background/70 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center gap-2">
          <span className="block h-2 w-2 rounded-full bg-blood pulse-blood" />
          <span className="font-display text-xl tracking-wider text-blood text-glow-blood">
            CATALYST
          </span>
          <span className="font-mono text-xs text-muted-foreground">2K26</span>
        </a>
        <ul className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:text-blood"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href="#register"
          className="border border-blood bg-blood/10 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.25em] text-blood transition-all hover:bg-blood hover:text-primary-foreground hover:shadow-blood"
        >
          Register
        </a>
      </nav>
    </header>
  );
}
