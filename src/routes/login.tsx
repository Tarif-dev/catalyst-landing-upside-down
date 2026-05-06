import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
      toast.error(
        error.message === "Invalid login credentials"
          ? "Wrong email or password."
          : error.message,
      );
      return;
    }
    toast.success("Welcome back to Hawkins.");
    nav({ to: "/dashboard" });
  };

  return (
    <PortalShell title="Sign in">
      <div className="mx-auto max-w-md">
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-styled"
              placeholder="you@hawkins.lab"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block font-mono text-[10px] uppercase tracking-[0.4em] text-blood/90 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPw ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            {loading ? "Opening gate…" : "Enter"}
          </button>

          <p className="text-center text-base font-serif italic text-bone/70 mt-6">
            New here?{" "}
            <Link
              to="/register"
              className="text-blood hover:text-glow-blood transition-all underline-offset-4 hover:underline"
            >
              Register your team
            </Link>
          </p>
        </form>
      </div>
    </PortalShell>
  );
}
