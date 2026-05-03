import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/PortalShell";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Copy, LogOut, Crown } from "lucide-react";

export const Route = createFileRoute("/team/$teamId")({
  head: () => ({ meta: [{ title: "Manage Team — Catalyst 2K26" }] }),
  component: TeamPage,
});

const TRACKS = [
  { v: "healthcare", l: "AI for Healthcare · Hopper" },
  { v: "fintech", l: "AI for Fintech · Dustin" },
  { v: "sustainability", l: "AI for Sustainability · Will" },
  { v: "education", l: "AI for Education · Eleven" },
  { v: "open", l: "Open Innovation · Steve" },
];

function TeamPage() {
  const { teamId } = Route.useParams();
  const { user, profile, loading } = useAuth();
  const nav = useNavigate();
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);

  const isLeader = team?.leader_id === user?.id;

  const load = async () => {
    const [{ data: t }, { data: ms }] = await Promise.all([
      supabase.from("teams").select("*").eq("id", teamId).maybeSingle(),
      supabase.from("team_members").select("*").eq("team_id", teamId).order("created_at"),
    ]);
    if (!t && !busy) {
      // Team might have been deleted
      nav({ to: "/dashboard" });
      return;
    }
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
    if (profile && !profile.is_complete) {
      nav({ to: "/onboarding" });
      return;
    }
    load();
  }, [user, profile, loading, teamId, nav]);

  const removeMember = async (id: string) => {
    if (!confirm("Remove this member from the team?")) return;
    const { error } = await supabase.from("team_members").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Member removed.");
    load();
  };

  const makeLeader = async (userId: string) => {
    if (!confirm("Transfer leadership? You will become a regular member.")) return;
    setBusy(true);
    const { error } = await supabase.rpc("change_team_leader", { p_new_leader_id: userId });
    if (error) {
      toast.error(error.message);
      setBusy(false);
    } else {
      toast.success("Leadership transferred.");
      load();
    }
  };

  const changeTrack = async (newTrack: string) => {
    setBusy(true);
    const { error } = await supabase.rpc("change_team_track", { p_new_track: newTrack });
    if (error) {
      toast.error(error.message);
      setBusy(false);
    } else {
      toast.success("Track updated.");
      load();
    }
  };

  const leaveTeam = async () => {
    if (isLeader && members.length > 1) {
      toast.error("You must transfer leadership before leaving.");
      return;
    }
    const msg = isLeader ? "You are the last member. This will delete the team. Continue?" : "Leave team?";
    if (!confirm(msg)) return;
    
    setBusy(true);
    const { error } = await supabase.rpc(isLeader ? "delete_team" : "leave_team");
    if (error) {
      toast.error(error.message);
      setBusy(false);
    } else {
      toast.success(isLeader ? "Team deleted." : "You have left the team.");
      nav({ to: "/dashboard" });
    }
  };

  const copyCode = () => {
    if (!team) return;
    navigator.clipboard.writeText(team.pass_code);
    toast.success("Access code copied to clipboard!");
  };

  if (busy) return <PortalShell title="Loading…"><div className="text-bone/50">…</div></PortalShell>;
  if (!team) return <PortalShell title="Not found"><Link to="/dashboard" className="text-blood">← Dashboard</Link></PortalShell>;

  const canSubmit = members.length >= 2;

  return (
    <PortalShell title={team.name}>
      <div className="space-y-6">
        
        {/* Team Settings / Info Panel */}
        <div className="panel p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Access Code */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-blood text-glow-blood mb-2 font-bold">Access Code</p>
              <p className="text-sm font-serif italic text-bone/70 mb-3">
                Share this 8-character code with your teammates so they can join.
              </p>
              <div className="flex items-center gap-3">
                <span className="font-display text-4xl tracking-widest text-bone bg-black/40 px-4 py-2 rounded-lg border border-white/10">
                  {team.pass_code}
                </span>
                <button 
                  onClick={copyCode}
                  className="p-3 bg-black/40 hover:bg-white/10 text-bone/60 hover:text-bone rounded-lg border border-white/10 transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Track Selection */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-cyan text-glow-cyan mb-2 font-bold">Track</p>
              {isLeader ? (
                <select
                  value={team.track}
                  onChange={(e) => changeTrack(e.target.value)}
                  className="input-styled appearance-none cursor-pointer mt-2"
                >
                  {TRACKS.map((t) => (
                    <option key={t.v} value={t.v} className="bg-void text-bone">{t.l}</option>
                  ))}
                </select>
              ) : (
                <div className="input-styled bg-black/40 text-bone/70 mt-2 cursor-not-allowed">
                  {TRACKS.find(t => t.v === team.track)?.l || team.track}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Roster Panel */}
        <div className="panel p-6 sm:p-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-blood text-glow-blood mb-2 font-bold">Roster</p>
              <p className="font-display text-3xl text-bone">{members.length}/5 members</p>
              <p className="text-sm font-serif italic text-bone/70 mt-1">
                Min 2 to compete · Max 5
              </p>
            </div>
            <Link to="/pass/$teamId" params={{ teamId }} className="btn-secondary px-6 py-2.5">
              View Pass
            </Link>
          </div>
          
          <div className="hairline my-6" />
          
          <ul className="divide-y divide-bone/10">
            {members.map((m) => (
              <li key={m.id} className="py-4 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <p className="text-bone truncate text-lg">{m.full_name}</p>
                    {m.role === "leader" && (
                      <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.3em] text-blood bg-blood/10 px-2 py-0.5 rounded border border-blood/20">
                        <Crown className="w-3 h-3" /> Leader
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-bone/50 font-mono truncate mt-1">{m.email}</p>
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                  {isLeader && m.role !== "leader" && (
                    <>
                      <button 
                        onClick={() => makeLeader(m.user_id)} 
                        className="btn-secondary px-3 py-1.5 text-[10px]"
                        title="Make Leader"
                      >
                        Make Leader
                      </button>
                      <button 
                        onClick={() => removeMember(m.id)} 
                        className="font-mono text-[10px] uppercase tracking-[0.3em] text-blood hover:text-red-400 transition-colors"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Panel */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <button 
            onClick={leaveTeam}
            className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-bone/50 hover:text-blood transition-colors px-4 py-2"
          >
            <LogOut className="w-4 h-4" />
            {isLeader && members.length === 1 ? "Delete Team" : "Leave Team"}
          </button>
          
          {!canSubmit && (
            <div className="text-center sm:text-right">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber text-glow-cyan">
                Add at least 1 more member to unlock submission & pass.
              </p>
            </div>
          )}
        </div>

      </div>
    </PortalShell>
  );
}
