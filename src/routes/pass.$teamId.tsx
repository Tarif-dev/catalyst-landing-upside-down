import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/PortalShell";
import { useAuth } from "@/lib/auth";
import { EventPass } from "@/components/EventPass";

export const Route = createFileRoute("/pass/$teamId")({
  head: () => ({ meta: [{ title: "Event Pass — Catalyst 2K26" }] }),
  component: PassPage,
});

function PassPage() {
  const { teamId } = Route.useParams();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      nav({ to: "/login" });
      return;
    }
    (async () => {
      const [{ data: t }, { data: ms }] = await Promise.all([
        supabase.from("teams").select("*").eq("id", teamId).maybeSingle(),
        supabase.from("team_members").select("*").eq("team_id", teamId).order("created_at"),
      ]);
      setTeam(t);
      setMembers(ms ?? []);
      setBusy(false);
    })();
  }, [user, loading, teamId, nav]);

  if (busy) return <PortalShell title="Loading…"><div /></PortalShell>;
  if (!team) return <PortalShell title="Not found"><Link to="/dashboard" className="text-blood">← Dashboard</Link></PortalShell>;
  if (members.length < 2) {
    return (
      <PortalShell title="Pass locked">
        <p className="text-bone/80 mb-6 text-lg font-serif">Your pass unlocks once your team has at least 2 members.</p>
        <Link to="/team/$teamId" params={{ teamId }} className="btn-secondary">
          Manage team →
        </Link>
      </PortalShell>
    );
  }

  return (
    <PortalShell title="Your Event Pass">
      <p className="mb-6 font-serif italic text-bone/60 max-w-xl">
        Show this at the venue. Download it as a PNG and post it on LinkedIn, X, or Instagram —
        the Upside Down loves a good entrance.
      </p>
      <div className="mx-auto max-w-md">
        <EventPass team={team} members={members} />
      </div>
    </PortalShell>
  );
}
