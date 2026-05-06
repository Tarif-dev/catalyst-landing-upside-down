import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/PortalShell";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/team/join")({
  head: () => ({ meta: [{ title: "Join Team — Catalyst 2K26" }] }),
  component: JoinTeam,
});

function JoinTeam() {
  const { user, profile, loading } = useAuth();
  const nav = useNavigate();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      nav({ to: "/login" });
      return;
    }
    if (profile && !profile.is_complete) {
      nav({ to: "/onboarding" });
      return;
    }
    // Check if already in a team
    supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) nav({ to: "/dashboard" });
      });
  }, [user, profile, loading, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!code.trim() || code.length !== 8) {
      toast.error("Please enter a valid 8-character team code.");
      return;
    }

    setBusy(true);
    // Call the RPC
    const { data, error } = await supabase.rpc("join_team_by_code", {
      p_code: code.trim().toUpperCase(),
    });

    setBusy(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Successfully joined the team! Welcome to Hawkins.");
    nav({ to: "/dashboard" });
  };

  return (
    <PortalShell title="Join your party">
      <div className="mx-auto max-w-md">
        <form
          onSubmit={submit}
          className="panel p-8 sm:p-10 space-y-6 text-center"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-blood text-glow-blood mb-2 font-bold">
            Access Code
          </p>
          <h2 className="font-display text-3xl sm:text-4xl text-bone mb-2">
            Enter Pass Code
          </h2>
          <p className="text-sm font-serif italic text-bone/60 mb-6">
            Ask your team leader for the 8-character code shown on their
            dashboard.
          </p>

          <div>
            <input
              required
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="input-styled text-center font-display text-2xl tracking-[0.2em] uppercase h-16"
              placeholder="XXXXXXXX"
            />
          </div>

          <button
            type="submit"
            disabled={busy || code.length !== 8}
            className="btn-primary w-full flex items-center justify-center gap-3 mt-4 h-14"
          >
            {busy && <Loader2 className="h-5 w-5 animate-spin" />}
            {busy ? "Authenticating…" : "Join Team"}
          </button>

          <div className="pt-4 mt-4 border-t border-white/10">
            <Link
              to="/dashboard"
              className="text-sm font-mono uppercase tracking-[0.2em] text-bone/40 hover:text-blood transition"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </form>
      </div>
    </PortalShell>
  );
}
