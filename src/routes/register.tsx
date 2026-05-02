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
  fullName: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  phone: z.string().trim().min(7, "Enter a valid phone").max(20),
  college: z.string().trim().min(2).max(150),
});

function RegisterPage() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    college: "Amity University Kolkata",
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
        data: { full_name: parsed.data.fullName },
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

    if (data.user) {
      await supabase
        .from("profiles")
        .update({
          full_name: parsed.data.fullName,
          phone: parsed.data.phone,
          college: parsed.data.college,
        })
        .eq("user_id", data.user.id);
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

  const fields: { k: keyof typeof form; label: string; type: string; placeholder?: string; autoComplete?: string }[] = [
    { k: "fullName", label: "Full name", type: "text", placeholder: "Eleven Hopper", autoComplete: "name" },
    { k: "email", label: "Email", type: "email", placeholder: "you@hawkins.lab", autoComplete: "email" },
    { k: "phone", label: "Phone", type: "tel", placeholder: "+91 …", autoComplete: "tel" },
    { k: "college", label: "College / Institution", type: "text", autoComplete: "organization" },
  ];

  return (
    <PortalShell title="Create your account">
      <div className="mx-auto max-w-xl">
        <p className="mb-6 font-serif italic text-bone/70 text-lg">
          One account per participant. The team leader registers first, then adds 1–4 teammates.
        </p>
        <form onSubmit={submit} className="panel p-7 sm:p-9 space-y-5">
          {fields.map((f) => (
            <div key={f.k}>
              <label htmlFor={f.k} className="block font-mono text-[10px] uppercase tracking-[0.35em] text-blood/90">
                {f.label}
              </label>
              <input
                id={f.k}
                type={f.type}
                required
                autoComplete={f.autoComplete}
                placeholder={f.placeholder}
                value={form[f.k]}
                onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                className="mt-2 w-full bg-black border border-bone/25 px-4 py-3 text-bone text-base placeholder:text-bone/30 focus:outline-none focus:border-blood focus:ring-1 focus:ring-blood/40 transition"
              />
            </div>
          ))}

          <div>
            <label htmlFor="password" className="block font-mono text-[10px] uppercase tracking-[0.35em] text-blood/90">
              Password <span className="text-bone/40 normal-case tracking-normal">(min 8)</span>
            </label>
            <div className="relative mt-2">
              <input
                id="password"
                type={showPw ? "text" : "password"}
                required
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
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
            {loading ? "Creating…" : "Create account"}
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
            Already have an account?{" "}
            <Link to="/login" className="text-blood hover:underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </PortalShell>
  );
}
