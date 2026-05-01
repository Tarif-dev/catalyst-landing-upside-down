import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/PortalShell";
import { AuthProvider, useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Catalyst 2K26" }] }),
  component: () => (
    <AuthProvider>
      <Admin />
    </AuthProvider>
  ),
});

function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const [teams, setTeams] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("teams")
      .select("*, team_members(id, user_id, full_name, email, role), submissions(id, title)")
      .order("created_at", { ascending: false });
    setTeams(data ?? []);
    setBusy(false);
  };

  useEffect(() => {
    if (loading) return;
    if (!user) {
      nav({ to: "/login" });
      return;
    }
    if (!isAdmin) {
      toast.error("Admins only.");
      nav({ to: "/dashboard" });
      return;
    }
    void load();
  }, [user, isAdmin, loading, nav]);

  const setStatus = async (id: string, payment_status: "unpaid" | "pending" | "paid" | "refunded") => {
    const { error } = await supabase.from("teams").update({ payment_status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated.");
    load();
  };

  const issueCerts = async (team: any) => {
    if (!confirm(`Issue participation certificates to all ${team.team_members.length} members of ${team.name}?`)) return;
    const rows = team.team_members.map((m: any) => ({
      team_id: team.id,
      user_id: m.user_id,
      recipient_name: m.full_name,
      kind: "participation",
    }));
    const { error } = await supabase.from("certificates").upsert(rows, { onConflict: "team_id,user_id,kind", ignoreDuplicates: true });
    if (error) return toast.error(error.message);
    toast.success("Certificates issued.");
  };

  if (busy) return <PortalShell title="Loading…"><div /></PortalShell>;

  return (
    <PortalShell title="Admin Console">
      <div className="space-y-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-blood">{teams.length} teams</p>
        {teams.map((t) => (
          <div key={t.id} className="panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-2xl text-bone">{t.name}</h3>
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-blood mt-1">
                  {t.track} · {t.team_members.length}/5 · {t.pass_code}
                </p>
                <p className="mt-2 text-xs text-bone/50 font-mono">
                  {t.team_members.map((m: any) => `${m.full_name} (${m.email})`).join(" · ")}
                </p>
                {t.submissions?.[0] && (
                  <p className="mt-2 text-sm text-bone/70">
                    Submission: <span className="text-bone">{t.submissions[0].title}</span>
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <div className="flex gap-2">
                  {["unpaid", "paid"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(t.id, s)}
                      className={`font-mono text-[9px] uppercase tracking-[0.3em] px-3 py-1.5 border transition ${
                        t.payment_status === s
                          ? "border-blood bg-blood/20 text-blood"
                          : "border-bone/20 text-bone/60 hover:border-blood"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => issueCerts(t)}
                  className="font-mono text-[10px] uppercase tracking-[0.3em] border border-cyan/40 bg-cyan/5 text-cyan px-3 py-1.5 hover:bg-cyan/20 transition"
                >
                  Issue certificates
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PortalShell>
  );
}
