import { Link, useNavigate } from "@tanstack/react-router";
import { ReactNode } from "react";
import amityLogo from "@/assets/amity_logo_white.png";
import catalystLogo from "@/assets/catalyst_logo.png";
import { useAuth } from "@/lib/auth";

export function PortalShell({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  const { user, isAdmin, signOut } = useAuth();
  const nav = useNavigate();

  return (
    <div className="min-h-dvh portal-bg theme-portal overflow-x-clip flex flex-col relative text-bone font-body">
      {/* Cinematic Background Elements */}
      <div className="fixed top-[-20%] left-[-10%] w-[60vw] h-[60dvh] blob-blood opacity-60 pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[60vw] h-[60dvh] blob-upside-down opacity-50 pointer-events-none" />

      <header className="sticky top-0 z-40 border-b border-border bg-background/60 backdrop-blur-2xl">
        <div className="mx-auto w-full flex max-w-6xl items-center justify-between px-5 sm:px-6 py-4">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src={amityLogo}
              alt="Amity"
              className="h-8 w-auto filter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] transition-transform group-hover:scale-105"
              fetchPriority="high"
              decoding="async"
            />
            <div className="w-px h-7 bg-bone/20" />
            <img
              src={catalystLogo}
              alt="Catalyst 2K26"
              className="h-7 w-auto brightness-200 transition-transform group-hover:scale-105"
              decoding="async"
            />
          </Link>
          <nav className="flex items-center gap-5 text-[14px]">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="font-serif italic text-bone/80 hover:text-white hover:text-glow-cyan transition-all duration-300"
                >
                  Dashboard
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="font-serif italic text-blood hover:text-glow-blood transition-all duration-300"
                  >
                    Admin
                  </Link>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    nav({ to: "/" });
                  }}
                  className="relative overflow-hidden group px-4 py-1.5 rounded-sm border border-blood/40 bg-blood/10 hover:bg-blood/20 transition-all duration-300"
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-blood group-hover:text-glow-blood">
                    Sign out
                  </span>
                  <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-blood transition-all duration-300 group-hover:w-full" />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="font-serif italic text-bone/80 hover:text-white hover:text-glow-cyan transition-all duration-300"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-6xl px-5 sm:px-6 py-12 sm:py-16 z-10 flex-1">
        {title && (
          <div className="mb-10 sm:mb-14 reveal">
            <div className="mb-4 flex items-center gap-3">
              <span className="block h-px w-10 bg-blood shadow-[0_0_8px_oklch(0.6_0.25_25)]" />
              <span className="font-mono text-[11px] uppercase tracking-[0.5em] text-blood text-glow-blood">
                Hawkins Log
              </span>
            </div>
            <h1 className="font-display text-4xl sm:text-6xl text-bone tracking-wide">
              {title}
            </h1>
          </div>
        )}
        <div className="reveal reveal-delay-1">{children}</div>
      </main>
    </div>
  );
}
