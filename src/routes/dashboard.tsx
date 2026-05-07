import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/PortalShell";
import { useAuth } from "@/lib/auth";
import { useServerFn } from "@tanstack/react-start";
import { sendPaymentInfoEmail } from "@/lib/email";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Catalyst 2K26" }] }),
  component: Dashboard,
});

const TRACK_LABEL: Record<string, string> = {
  healthcare: "AI for Healthcare",
  fintech: "AI for Fintech",
  sustainability: "AI for Sustainability",
  education: "AI for Education",
};

const STATUS_LABEL: Record<string, { label: string; tone: string }> = {
  unpaid: { label: "Awaiting Payment", tone: "text-amber" },
  pending: { label: "Verifying Payment", tone: "text-amber" },
  paid: { label: "Confirmed", tone: "text-cyan" },
  refunded: { label: "Refunded", tone: "text-bone/50" },
};

function Dashboard() {
  const { user, profile, session, loading } = useAuth();
  const nav = useNavigate();
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [submission, setSubmission] = useState<any>(null);
  const [certs, setCerts] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);
  const [emailBusy, setEmailBusy] = useState(false);
  const sendPaymentInfoFn = useServerFn(sendPaymentInfoEmail);

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

    (async () => {
      const { data: tm } = await supabase
        .from("team_members")
        .select("team_id, teams(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const t = (tm as any)?.teams ?? null;
      setTeam(t);
      if (t) {
        const [{ data: ms }, { data: sub }] = await Promise.all([
          supabase.from("team_members").select("*").eq("team_id", t.id),
          supabase
            .from("submissions")
            .select("*")
            .eq("team_id", t.id)
            .maybeSingle(),
        ]);
        setMembers(ms ?? []);
        setSubmission(sub);
      }
      const { data: c } = await supabase
        .from("certificates")
        .select("*")
        .eq("user_id", user.id);
      setCerts(c ?? []);
      setBusy(false);
    })();
  }, [user, profile, loading, nav]);

  if (busy) {
    return (
      <PortalShell title="Loading…">
        <div className="text-bone/50 font-mono text-sm">Reading the gate…</div>
      </PortalShell>
    );
  }

  return (
    <PortalShell title={`Welcome, ${user?.email?.split("@")[0]}`}>
      {!team ? (
        <div className="panel p-8 sm:p-12 text-center reveal">
          <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-blood text-glow-blood mb-6 font-bold">
            No team yet
          </p>
          <h2 className="font-display text-4xl sm:text-5xl text-bone mb-4 drop-shadow-md">
            Assemble your party
          </h2>
          <p className="font-serif italic text-bone/80 max-w-lg mx-auto mb-8 text-lg">
            Teams of 2–5. You'll be the leader. Invite your members by email
            after creation.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/team/new"
              className="btn-primary inline-flex items-center justify-center min-w-[200px]"
            >
              Create team
            </Link>
            <Link
              to="/team/join"
              className="btn-secondary inline-flex items-center justify-center min-w-[200px]"
            >
              Join via Code
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Team card */}
          <div className="panel p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-blood">
                  Team
                </p>
                <h2 className="font-display text-3xl sm:text-4xl text-bone mt-1">
                  {team.name}
                </h2>
                <p className="mt-1 font-serif italic text-bone/60">
                  {TRACK_LABEL[team.track] || "Retired track"}
                </p>
                {team.tagline && (
                  <p className="mt-2 text-bone/70 font-serif italic">
                    "{team.tagline}"
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-bone/50">
                  Status
                </p>
                <p
                  className={`mt-1 font-mono text-sm uppercase tracking-[0.3em] ${STATUS_LABEL[profile?.payment_status || "unpaid"].tone}`}
                >
                  {STATUS_LABEL[profile?.payment_status || "unpaid"].label}
                </p>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.3em] text-bone/40">
                  Pass code
                </p>
                <p className="font-display text-xl text-blood">
                  {team.pass_code}
                </p>
              </div>
            </div>

            <div className="hairline my-6" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                to="/team/$teamId"
                params={{ teamId: team.id }}
                className="btn-secondary text-center px-4 py-3 border-white/20"
              >
                Manage team
              </Link>
              <Link
                to="/pass/$teamId"
                params={{ teamId: team.id }}
                className="btn-secondary text-center px-4 py-3 border-white/20"
              >
                Event Pass
              </Link>
              <Link
                to="/submit/$teamId"
                params={{ teamId: team.id }}
                className="btn-secondary text-center px-4 py-3 border-white/20"
              >
                {submission ? "Edit submission" : "Submit project"}
              </Link>
              {profile?.payment_status !== "paid" && (
                <button
                  disabled={emailBusy}
                  onClick={async () => {
                    if (!session?.access_token) {
                      toast.error("Please sign in again.");
                      return;
                    }
                    setEmailBusy(true);
                    try {
                      await sendPaymentInfoFn({
                        data: { accessToken: session.access_token },
                      });
                      toast.success(
                        "Payment instructions sent! Check your email (and spam folder).",
                      );
                    } catch (err: any) {
                      toast.error(
                        err?.message || "Failed to send payment email.",
                      );
                    } finally {
                      setEmailBusy(false);
                    }
                  }}
                  className="btn-secondary text-center px-4 py-3 border-amber/50 text-amber bg-amber/5 hover:bg-amber/10 hover:border-amber cursor-pointer transition-colors disabled:opacity-50"
                >
                  {emailBusy ? "Sending…" : "📧 Email Payment Details (₹200)"}
                </button>
              )}
            </div>
          </div>

          {/* Members */}
          <div className="panel p-6 sm:p-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-blood mb-4">
              Roster · {members.length}/5
            </p>
            <ul className="divide-y divide-bone/10">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-bone">{m.full_name}</p>
                    <p className="text-xs text-bone/50 font-mono">{m.email}</p>
                  </div>
                  <span
                    className={`font-mono text-[10px] uppercase tracking-[0.3em] ${m.role === "leader" ? "text-blood" : "text-bone/50"}`}
                  >
                    {m.role}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Submission */}
          {submission && (
            <div className="panel p-6 sm:p-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-blood mb-2">
                Submission
              </p>
              <h3 className="font-display text-2xl text-bone">
                {submission.title}
              </h3>
              <p className="mt-2 text-bone/70 font-serif">
                {submission.description}
              </p>
            </div>
          )}

          {/* Certs */}
          {certs.length > 0 && (
            <div className="panel p-6 sm:p-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-blood mb-4">
                Your certificates
              </p>
              <ul className="space-y-2">
                {certs.map((c) => (
                  <li key={c.id} className="flex items-center justify-between">
                    <span className="text-bone capitalize">
                      {c.kind} — {c.recipient_name}
                    </span>
                    <Link
                      to="/certificate/$code"
                      params={{ code: c.certificate_code }}
                      className="font-mono text-[10px] uppercase tracking-[0.3em] text-blood hover:underline"
                    >
                      View →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </PortalShell>
  );
}
