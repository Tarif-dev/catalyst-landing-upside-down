import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

import { PortalShell } from "@/components/PortalShell";
import { toast } from "sonner";
import { getAppSettings } from "@/lib/settings";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create Account — Catalyst 2K26" }] }),
  loader: async () => {
    try {
      return await getAppSettings();
    } catch {
      return { registrationsOpen: true };
    }
  },
  component: RegisterPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

const REGISTER_DRAFT_KEY = "catalyst:register-draft";
const emptyRegisterForm = {
  email: "",
  password: "",
};

function readRegisterDraft() {
  if (typeof window === "undefined") return emptyRegisterForm;

  try {
    const saved = window.sessionStorage.getItem(REGISTER_DRAFT_KEY);
    if (!saved) return emptyRegisterForm;
    return { ...emptyRegisterForm, ...JSON.parse(saved) };
  } catch {
    return emptyRegisterForm;
  }
}

function RegisterPage() {
  const settings = Route.useLoaderData();
  const getAppSettingsFn = useServerFn(getAppSettings);
  const nav = useNavigate();
  const [form, setForm] = useState(readRegisterDraft);
  const didMount = useRef(false);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav({ to: "/dashboard" });
    });
  }, [nav]);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }

    window.sessionStorage.setItem(REGISTER_DRAFT_KEY, JSON.stringify(form));
  }, [form]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const latestSettings = await getAppSettingsFn().catch(() => settings);
    if (!latestSettings.registrationsOpen) {
      setLoading(false);
      toast.error("All participant slots are full. Registrations are closed.");
      return;
    }

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
          : error.message,
      );
      return;
    }

    // Supabase returns a user with empty identities when the email is already
    // registered and email confirmation is enabled (prevents email enumeration).
    if (
      data.user &&
      data.user.identities &&
      data.user.identities.length === 0
    ) {
      window.sessionStorage.removeItem(REGISTER_DRAFT_KEY);
      setLoading(false);
      toast.error("This email is already registered. Please sign in instead.");
      nav({ to: "/login" });
      return;
    }

    setLoading(false);
    window.sessionStorage.removeItem(REGISTER_DRAFT_KEY);
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
          One account per participant. The team leader registers first, then
          adds 1–4 teammates.
        </p>
        {!settings.registrationsOpen && (
          <div className="mb-6 border border-amber/35 bg-amber/10 px-4 py-3 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber">
              Registrations temporarily paused due to overwhelming number of
              submissions
            </p>
          </div>
        )}

        {!settings.registrationsOpen ? (
          <div className="panel p-8 sm:p-12 text-center space-y-6">
            <h2 className="font-display text-3xl sm:text-4xl text-bone">
              We are grateful
            </h2>
            <p className="font-serif text-lg text-bone/80 max-w-md mx-auto leading-relaxed">
              But the slots are filled. We will be happy to host you next time.
            </p>
            <div className="pt-4">
              <Link to="/" className="btn-secondary inline-flex px-8 py-3">
                Return to Hawkins
              </Link>
            </div>
            <div className="mt-8 border-t border-bone/15 pt-6 space-y-3">
              <p className="font-serif text-base text-bone/80 leading-relaxed">
                Please fill the form below to join the waitlist.
                <br />
                <span className="text-amber font-semibold">
                  It is on a first come, first serve basis.
                </span>
              </p>
              <a
                href="https://forms.gle/67MctQhxQDKB6eBC7"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex px-8 py-3"
              >
                Join Waitlist
              </a>
            </div>
            <p className="text-center text-sm font-serif italic text-bone/60 mt-8">
              Already registered?{" "}
              <Link
                to="/login"
                className="text-blood hover:text-glow-blood transition-all underline-offset-4 hover:underline"
              >
                Sign in to your account
              </Link>
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="panel p-8 sm:p-10 space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block font-mono text-[10px] uppercase tracking-[0.4em] text-blood/90 mb-2"
              >
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
              <label
                htmlFor="password"
                className="block font-mono text-[10px] uppercase tracking-[0.4em] text-blood/90 mb-2"
              >
                Password{" "}
                <span className="text-bone/40 normal-case tracking-normal">
                  (min 8)
                </span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="input-styled pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex items-center px-4 text-bone/50 hover:text-blood transition-colors"
                >
                  {showPw ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
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
              <Link
                to="/login"
                className="text-blood hover:text-glow-blood transition-all underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </PortalShell>
  );
}
