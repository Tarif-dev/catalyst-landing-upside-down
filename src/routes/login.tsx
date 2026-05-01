import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/PortalShell";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Sign In — Catalyst 2K26" }],
  }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
});

function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back.");
    nav({ to: "/dashboard" });
  };

  const google = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) toast.error(error.message);
  };

  return (
    <PortalShell title="Sign in">
      <div className="mx-auto max-w-md">
        <form onSubmit={submit} className="panel p-6 sm:p-8 space-y-5">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/60">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full bg-black/60 border border-bone/15 px-3 py-2.5 text-bone focus:outline-none focus:border-blood"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/60">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full bg-black/60 border border-bone/15 px-3 py-2.5 text-bone focus:outline-none focus:border-blood"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bracket w-full border border-blood bg-blood py-3 font-mono text-[10px] uppercase tracking-[0.4em] text-black hover:bg-transparent hover:text-blood transition-all duration-500 disabled:opacity-50"
          >
            {loading ? "Opening gate…" : "Enter"}
          </button>
          <div className="relative my-2 text-center">
            <span className="bg-black px-3 font-mono text-[9px] uppercase tracking-[0.4em] text-bone/40">or</span>
          </div>
          <button
            type="button"
            onClick={google}
            className="w-full border border-bone/20 bg-transparent py-3 font-mono text-[10px] uppercase tracking-[0.4em] text-bone/80 hover:border-bone transition"
          >
            Continue with Google
          </button>
          <p className="text-center text-sm font-serif italic text-bone/55">
            New here?{" "}
            <Link to="/register" className="text-blood hover:underline">
              Register your team
            </Link>
          </p>
        </form>
      </div>
    </PortalShell>
  );
}
