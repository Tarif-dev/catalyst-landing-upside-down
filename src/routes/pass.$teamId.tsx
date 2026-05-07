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
  const { user, profile, loading } = useAuth();
  const nav = useNavigate();
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [participantProfile, setParticipantProfile] = useState<any>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      nav({ to: "/login" });
      return;
    }
    (async () => {
      const [{ data: t }, { data: ms }, { data: p }] = await Promise.all([
        supabase.from("teams").select("*").eq("id", teamId).maybeSingle(),
        supabase
          .from("team_members")
          .select("*")
          .eq("team_id", teamId)
          .order("created_at"),
        supabase
          .from("profiles")
          .select("payment_status, pass_code")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);
      const memberRows = ms ?? [];
      const isMember = memberRows.some((m) => m.user_id === user.id);
      if (!isMember) {
        nav({ to: "/dashboard" });
        return;
      }
      setTeam(t);
      setMembers(memberRows);
      setParticipantProfile(p ?? profile);
      setBusy(false);
    })();
  }, [user, profile, loading, teamId, nav]);

  if (busy)
    return (
      <PortalShell title="Loading…">
        <div />
      </PortalShell>
    );
  if (!team)
    return (
      <PortalShell title="Not found">
        <Link to="/dashboard" className="text-blood">
          ← Dashboard
        </Link>
      </PortalShell>
    );
  if (members.length < 2) {
    return (
      <PortalShell title="Pass locked">
        <p className="text-bone/80 mb-6 text-lg font-serif">
          Your pass unlocks once your team has at least 2 members.
        </p>
        <Link to="/team/$teamId" params={{ teamId }} className="btn-secondary">
          Manage team →
        </Link>
      </PortalShell>
    );
  }

  const currentUser = members.find((m) => m.user_id === user?.id) || members[0];
  const isPaid = participantProfile?.payment_status === "paid";

  return (
    <PortalShell title="Your Event Pass">
      {!isPaid && (
        <div className="mb-6 flex items-start gap-3 panel p-4 border-amber/40">
          <span className="text-amber text-xl mt-0.5">⚠</span>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber font-bold">
              Payment Pending
            </p>
            <p className="mt-1 font-serif italic text-bone/70">
              Your QR code is locked until your individual registration fee is
              confirmed by the admin. The pass design is yours to keep!
            </p>
          </div>
        </div>
      )}
      <p className="mb-6 font-serif italic text-bone/60 max-w-xl">
        Show this at the venue. Download it as a PNG and post it on LinkedIn, X,
        or Instagram — the Upside Down loves a good entrance.
      </p>
      <div className="mx-auto max-w-md">
        <EventPass
          team={team}
          members={members}
          currentUser={currentUser}
          participantProfile={participantProfile}
        />
      </div>
    </PortalShell>
  );
}
