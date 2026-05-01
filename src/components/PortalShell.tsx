import { Link, useNavigate } from "@tanstack/react-router";
import { ReactNode } from "react";
import amityLogo from "@/assets/Amity_logo.png";
import { useAuth } from "@/lib/auth";

export function PortalShell({ children, title }: { children: ReactNode; title?: string }) {
  const { user, isAdmin, signOut } = useAuth();
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-black">
      <header className="sticky top-0 z-40 border-b border-blood/15 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 sm:px-6 py-3">
          <Link to="/" className="flex items-center gap-3">
            <img src={amityLogo} alt="Amity" className="h-8 w-auto" />
            <span className="hidden sm:block font-mono text-[9px] uppercase tracking-[0.4em] text-blood">
              Catalyst · Portal
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-[13px]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            {user ? (
              <>
                <Link to="/dashboard" className="italic text-bone/70 hover:text-bone">Dashboard</Link>
                {isAdmin && <Link to="/admin" className="italic text-blood hover:text-bone">Admin</Link>}
                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    nav({ to: "/" });
                  }}
                  className="bracket border border-blood/40 bg-blood/5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.3em] text-blood hover:bg-blood hover:text-black transition"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/login" className="italic text-bone/70 hover:text-bone">Sign in</Link>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 sm:px-6 py-10 sm:py-14">
        {title && (
          <div className="mb-8 sm:mb-10">
            <div className="mb-3 flex items-center gap-3">
              <span className="block h-px w-8 bg-blood/60" />
              <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-blood">Catalyst 2K26</span>
            </div>
            <h1 className="font-display text-3xl sm:text-5xl text-bone">{title}</h1>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
