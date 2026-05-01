import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/PortalShell";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [{ title: "Create Account — Catalyst 2K26" }],
  }),
  component: RegisterPage,
});

const schema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(8, "Min 8 characters").max(72),
  phone: z.string().trim().min(7).max(20),
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
        data: { full_name: parsed.data.fullName },
      },
    });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }
    if (data.user) {
      // wait briefly for trigger then patch profile
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
      toast.success("Account created. Now build your team.");
      nav({ to: "/team/new" });
    } else {
      toast.success("Check your inbox to verify your email.");
    }
  };

  const google = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) toast.error(error.message);
  };

  return (
    <PortalShell title="Create your account">
      <div className="mx-auto max-w-xl">
        <p className="mb-6 font-serif italic text-bone/60">
          One account per participant. The team leader registers first, then adds 1–4 teammates.
        </p>
        <form onSubmit={submit} className="panel p-6 sm:p-8 space-y-5">
          {[
            { k: "fullName", label: "Full name", type: "text" },
            { k: "email", label: "Email", type: "email" },
            { k: "password", label: "Password (min 8)", type: "password" },
            { k: "phone", label: "Phone", type: "tel" },
            { k: "college", label: "College / Institution", type: "text" },
          ].map((f) => (
            <div key={f.k}>
              <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/60">{f.label}</label>
              <input
                type={f.type}
                required
                value={(form as any)[f.k]}
                onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                className="mt-2 w-full bg-black/60 border border-bone/15 px-3 py-2.5 text-bone focus:outline-none focus:border-blood"
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            className="bracket w-full border border-blood bg-blood py-3 font-mono text-[10px] uppercase tracking-[0.4em] text-black hover:bg-transparent hover:text-blood transition-all duration-500 disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create account"}
          </button>
          <button
            type="button"
            onClick={google}
            className="w-full border border-bone/20 bg-transparent py-3 font-mono text-[10px] uppercase tracking-[0.4em] text-bone/80 hover:border-bone transition"
          >
            Continue with Google
          </button>
          <p className="text-center text-sm font-serif italic text-bone/55">
            Already have an account?{" "}
            <Link to="/login" className="text-blood hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </PortalShell>
  );
}
