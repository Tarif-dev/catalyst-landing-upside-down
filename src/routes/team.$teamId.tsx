import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/PortalShell";
import { AuthProvider, useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/team/$teamId")({
  head: () => ({ meta: [{ title: "Manage Team — Catalyst 2K26" }] }),
  component: () => (
    <AuthProvider>
      <TeamPage />
    </AuthProvider>
  ),
});

const memberSchema = z.object({
  email: z.string().trim().email().max(255),
  full_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(20).optional(),
});

function TeamPage() {
  const { teamId } = Route.useParams();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newMember, setNewMember] = useState({ email: "", full_name: "", phone: "" });

  const isLeader = team?.leader_id === user?.id;

  const load = async () => {
    const [{ data: t }, { data: ms }] = await Promise.all([
      supabase.from("teams").select("*").eq("id", teamId).maybeSingle(),
      supabase.from("team_members").select("*").eq("team_id", teamId).order("created_at"),
    ]);
    setTeam(t);
    setMembers(ms ?? []);
    setBusy(false);
  };

  useEffect(() => {
    if (loading) return;
    if (!user) {
      nav({ to: "/login" });
      return;
    }
    load();
  }, [user, loading, teamId, nav]);

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = memberSchema.safeParse(newMember);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (members.length >= 5) {
      toast.error("Team is full.");
      return;
    }
    setAdding(true);
    // look up user by email via profiles
    const { data: prof } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", parsed.data.email)
      .maybeSingle();
    if (!prof) {
      setAdding(false);
      toast.error("That person needs a Catalyst account first. Ask them to sign up, then try again.");
      return;
    }
    const { error } = await supabase.from("team_members").insert({
      team_id: teamId,
      user_id: prof.user_id,
      role: "member",
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
    });
    setAdding(false);
    if (error) {
      toast.error(error.message.includes("unique") ? "Already on the team." : error.message);
      return;
    }
    setNewMember({ email: "", full_name: "", phone: "" });
    toast.success("Member added.");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this member?")) return;
    const { error } = await supabase.from("team_members").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed.");
    load();
  };

  if (busy) return <PortalShell title="Loading…"><div className="text-bone/50">…</div></PortalShell>;
  if (!team) return <PortalShell title="Not found"><Link to="/dashboard" className="text-blood">← Dashboard</Link></PortalShell>;

  const canSubmit = members.length >= 2;

  return (
    <PortalShell title={team.name}>
      <div className="space-y-6">
        <div className="panel p-6 sm:p-8">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-blood">Roster</p>
              <p className="mt-1 font-display text-2xl text-bone">{members.length}/5 members</p>
              <p className="text-sm font-serif italic text-bone/55 mt-1">
                Min 2 to compete · Max 5
              </p>
            </div>
            <Link to="/pass/$teamId" params={{ teamId }} className="bracket border border-blood/40 bg-blood/5 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.4em] text-blood hover:bg-blood hover:text-black transition">
              View Pass
            </Link>
          </div>
          <div className="hairline my-6" />
          <ul className="divide-y divide-bone/10">
            {members.map((m) => (
              <li key={m.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-bone truncate">{m.full_name}</p>
                  <p className="text-xs text-bone/50 font-mono truncate">{m.email}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`font-mono text-[10px] uppercase tracking-[0.3em] ${m.role === "leader" ? "text-blood" : "text-bone/50"}`}>
                    {m.role}
                  </span>
                  {isLeader && m.role !== "leader" && (
                    <button onClick={() => remove(m.id)} className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/40 hover:text-blood">
                      remove
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {isLeader && members.length < 5 && (
          <form onSubmit={addMember} className="panel p-6 sm:p-8 space-y-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-blood">Add member</p>
            <p className="text-xs font-serif italic text-bone/50">
              They must have a Catalyst account already (ask them to sign up at /register, then come back here).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                placeholder="Full name"
                value={newMember.full_name}
                onChange={(e) => setNewMember({ ...newMember, full_name: e.target.value })}
                className="bg-black/60 border border-bone/15 px-3 py-2.5 text-bone focus:outline-none focus:border-blood"
              />
              <input
                type="email"
                placeholder="Email"
                value={newMember.email}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                className="bg-black/60 border border-bone/15 px-3 py-2.5 text-bone focus:outline-none focus:border-blood"
              />
              <input
                placeholder="Phone (optional)"
                value={newMember.phone}
                onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                className="bg-black/60 border border-bone/15 px-3 py-2.5 text-bone focus:outline-none focus:border-blood"
              />
            </div>
            <button
              type="submit"
              disabled={adding}
              className="bracket border border-blood bg-blood px-6 py-2.5 font-mono text-[10px] uppercase tracking-[0.4em] text-black hover:bg-transparent hover:text-blood transition disabled:opacity-50"
            >
              {adding ? "Adding…" : "Add to team"}
            </button>
          </form>
        )}

        {!canSubmit && (
          <div className="panel panel-blood p-5 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-blood">
              Add at least 1 more member to unlock submission & pass.
            </p>
          </div>
        )}
      </div>
    </PortalShell>
  );
}
