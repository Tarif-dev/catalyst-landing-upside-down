import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { PortalShell } from "@/components/PortalShell";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign In — Catalyst 2K26" }] }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
});

function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav({ to: "/dashboard" });
    });
  }, [nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "Wrong email or password." : error.message);
      return;
    }
    toast.success("Welcome back to Hawkins.");
    nav({ to: "/dashboard" });
  };

  const google = async () => {
    setGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/dashboard`,
    });
    if (result.error) {
      setGoogleLoading(false);
      toast.error(result.error.message || "Google sign-in failed.");
      return;
    }
    if (result.redirected) return;
    nav({ to: "/dashboard" });
  };

  return (
    <PortalShell title="Sign in">
      <div className="mx-auto max-w-md">
        <form onSubmit={submit} className="panel p-7 sm:p-9 space-y-6">
          <div>
            <label htmlFor="email" className="block font-mono text-[10px] uppercase tracking-[0.35em] text-blood/90">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full bg-black border border-bone/25 px-4 py-3 text-bone text-base placeholder:text-bone/30 focus:outline-none focus:border-blood focus:ring-1 focus:ring-blood/40 transition"
              placeholder="you@hawkins.lab"
            />
          </div>
          <div>
            <label htmlFor="password" className="block font-mono text-[10px] uppercase tracking-[0.35em] text-blood/90">
              Password
            </label>
            <div className="relative mt-2">
              <input
                id="password"
                type={showPw ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-bone/25 px-4 py-3 pr-12 text-bone text-base placeholder:text-bone/30 focus:outline-none focus:border-blood focus:ring-1 focus:ring-blood/40 transition"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-bone/60 hover:text-blood transition"
              >
                {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bracket flex w-full items-center justify-center gap-2 border border-blood bg-blood py-3.5 font-mono text-[11px] uppercase tracking-[0.4em] text-black hover:bg-transparent hover:text-blood transition-all duration-500 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Opening gate…" : "Enter"}
          </button>

          <div className="relative my-1 flex items-center">
            <span className="flex-1 border-t border-bone/15" />
            <span className="px-3 font-mono text-[9px] uppercase tracking-[0.4em] text-bone/40">or</span>
            <span className="flex-1 border-t border-bone/15" />
          </div>

          <button
            type="button"
            onClick={google}
            disabled={googleLoading}
            className="flex w-full items-center justify-center gap-3 border border-bone/30 bg-bone/[0.02] py-3 font-mono text-[11px] uppercase tracking-[0.35em] text-bone hover:bg-bone hover:text-black transition disabled:opacity-60"
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.18v2.92h5.27c-.23 1.42-1.66 4.17-5.27 4.17-3.17 0-5.76-2.62-5.76-5.85s2.59-5.85 5.76-5.85c1.81 0 3.02.77 3.71 1.43l2.53-2.43C16.86 3.94 14.78 3 12.17 3 6.99 3 2.8 7.18 2.8 12.34s4.19 9.34 9.37 9.34c5.41 0 8.99-3.8 8.99-9.16 0-.62-.07-1.09-.16-1.42z"/></svg>
            )}
            Continue with Google
          </button>

          <p className="text-center text-base font-serif italic text-bone/70">
            New here?{" "}
            <Link to="/register" className="text-blood hover:underline underline-offset-4">
              Register your team
            </Link>
          </p>
        </form>
      </div>
    </PortalShell>
  );
}
