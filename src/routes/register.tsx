import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
