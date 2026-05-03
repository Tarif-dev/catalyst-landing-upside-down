import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { PortalShell } from "@/components/PortalShell";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create Account — Catalyst 2K26" }] }),
  component: RegisterPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

function RegisterPage() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
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
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      setLoading(false);
      toast.error(
        error.message.toLowerCase().includes("already")
          ? "This email is already registered. Please sign in instead."
          : error.message
      );
      return;
    }

    // Supabase returns a user with empty identities when the email is already
    // registered and email confirmation is enabled (prevents email enumeration).
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setLoading(false);
      toast.error("This email is already registered. Please sign in instead.");
      nav({ to: "/login" });
      return;
    }


    setLoading(false);
    if (data.session) {
      toast.success("Account created. Welcome to Hawkins.", {
        description: "You're signed in. Let's build your team.",
      });
      nav({ to: "/team/new" });
    } else {
      toast.success("Account created — please sign in.", {
        description: "Use your email and password to log in.",
      });
      nav({ to: "/login" });
    }
  };

  const google = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      setGoogleLoading(false);
      toast.error(error.message || "Google sign-in failed.");
    }
  };



  return (
    <PortalShell title="Create your account">
      <div className="mx-auto max-w-xl">
        <p className="mb-6 font-serif italic text-bone/70 text-lg">
          One account per participant. The team leader registers first, then adds 1–4 teammates.
        </p>
        <form onSubmit={submit} className="panel p-8 sm:p-10 space-y-6">
          <div>
            <label htmlFor="email" className="block font-mono text-[10px] uppercase tracking-[0.4em] text-blood/90 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@hawkins.lab"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-styled"
            />
          </div>

          <div>
            <label htmlFor="password" className="block font-mono text-[10px] uppercase tracking-[0.4em] text-blood/90 mb-2">
              Password <span className="text-bone/40 normal-case tracking-normal">(min 8)</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPw ? "text" : "password"}
                required
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-styled pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center px-4 text-bone/50 hover:text-blood transition-colors"
              >
                {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-3 mt-4"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Creating…" : "Create account"}
          </button>

          <div className="relative my-4 flex items-center">
            <span className="flex-1 hairline" />
            <span className="px-4 font-mono text-[9px] uppercase tracking-[0.4em] text-bone/50">or</span>
            <span className="flex-1 hairline" />
          </div>

          <button
            type="button"
            onClick={google}
            disabled={googleLoading}
            className="btn-secondary w-full flex items-center justify-center gap-3"
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.18v2.92h5.27c-.23 1.42-1.66 4.17-5.27 4.17-3.17 0-5.76-2.62-5.76-5.85s2.59-5.85 5.76-5.85c1.81 0 3.02.77 3.71 1.43l2.53-2.43C16.86 3.94 14.78 3 12.17 3 6.99 3 2.8 7.18 2.8 12.34s4.19 9.34 9.37 9.34c5.41 0 8.99-3.8 8.99-9.16 0-.62-.07-1.09-.16-1.42z"/></svg>
            )}
            Continue with Google
          </button>

          <p className="text-center text-base font-serif italic text-bone/70 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-blood hover:text-glow-blood transition-all underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </PortalShell>
  );
}
