import { Link, useNavigate } from "@tanstack/react-router";
import { ReactNode, useState, useRef, useEffect } from "react";
import amityLogo from "@/assets/amity_logo_white.png";
import catalystLogo from "@/assets/catalyst_logo.png";
import { useAuth } from "@/lib/auth";
import { MessageSquare, LogOut, Settings } from "lucide-react";

export function PortalShell({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  const { user, isAdmin, signOut, profile } = useAuth();
  const nav = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const getInitial = () => {
    if (profile?.full_name) return profile.full_name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return "U";
  };

  return (
    <div className="min-h-dvh portal-bg theme-portal overflow-x-clip flex flex-col relative text-bone font-body">
      {/* Cinematic Background Elements */}
      <div className="fixed top-[-20%] left-[-10%] w-[60vw] h-[60dvh] blob-blood opacity-60 pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[60vw] h-[60dvh] blob-upside-down opacity-50 pointer-events-none" />

      <header className="sticky top-0 z-40 border-b border-border bg-background/60 backdrop-blur-2xl">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:flex-nowrap sm:px-6">
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
              className="h-8 w-auto brightness-200 transition-transform group-hover:scale-105 sm:h-10"
              decoding="async"
            />
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-3 text-[14px] sm:gap-5">
            {user ? (
              <>
                <a
                  href="https://discord.gg/SDDT9D5kqs"
                  target="_blank"
                  rel="noreferrer"
                  title="Join Discord"
                  className="p-1.5 sm:p-2 text-[#5865F2] hover:bg-[#5865F2]/10 rounded-full transition-colors flex items-center justify-center"
                >
                  <MessageSquare className="w-5 h-5" />
                </a>
                
                <Link
                  to="/dashboard"
                  className="font-serif italic text-bone drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] hover:text-white hover:text-glow-cyan transition-all duration-300"
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
                
                <div className="relative ml-1 sm:ml-2" ref={dropdownRef}>
                  <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-black/40 border border-white/20 text-bone hover:border-white/50 transition-colors focus:outline-none"
                  >
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="font-mono text-sm">{getInitial()}</span>
                    )}
                  </button>
                  
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-md bg-black border border-white/20 shadow-2xl overflow-hidden py-1 z-50">
                      <div className="px-4 py-3 border-b border-white/10 mb-1 bg-black">
                        <p className="text-sm font-medium text-bone truncate">{profile?.full_name || "Builder"}</p>
                        <p className="text-xs text-bone/50 truncate font-mono mt-1">{user.email}</p>
                      </div>
                      
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          nav({ to: "/profile" });
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-bone/90 hover:bg-white/10 hover:text-bone transition-colors w-full text-left"
                      >
                        <Settings className="w-4 h-4 text-bone/50" /> Edit Profile
                      </button>
                      
                      <button
                        onClick={async () => {
                          setDropdownOpen(false);
                          await signOut();
                          nav({ to: "/" });
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-blood hover:bg-blood/20 transition-colors w-full text-left"
                      >
                        <LogOut className="w-4 h-4 text-blood/60" /> Sign out
                      </button>
                    </div>
                  )}
                </div>
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

      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-16">
        {title && (
          <div className="mb-10 sm:mb-14 reveal">
            <div className="mb-4 flex items-center gap-3">
              <span className="block h-px w-10 bg-blood shadow-[0_0_8px_oklch(0.6_0.25_25)]" />
              <span className="font-mono text-[11px] uppercase tracking-[0.5em] text-blood text-glow-blood">
                Hawkins Log
              </span>
            </div>
            <h1 className="break-words font-display text-4xl tracking-wide text-bone sm:text-6xl">
              {title}
            </h1>
          </div>
        )}
        <div className="reveal reveal-delay-1">{children}</div>
      </main>
    </div>
  );
}
