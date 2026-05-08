import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/PortalShell";
import { useAuth } from "@/lib/auth";
import { useServerFn } from "@tanstack/react-start";
import { sendPaymentInfoEmail } from "@/lib/email";
import { toast } from "sonner";

const DISCORD_URL = "https://discord.gg/TCRccCKF";
const DISCORD_NOTICE_KEY = "catalyst:discord-notice-joined";

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
  paid: { label: "Verified", tone: "text-cyan" },
  refunded: { label: "Refunded", tone: "text-bone/50" },
};

function Dashboard() {
  const { user, profile, session, loading } = useAuth();
  const nav = useNavigate();
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [submission, setSubmission] = useState<any>(null);
  const [certs, setCerts] = useState<any[]>([]);
  const [participantProfile, setParticipantProfile] = useState<any>(null);
  const [busy, setBusy] = useState(true);
  const [emailBusy, setEmailBusy] = useState(false);
  const [paymentInfoRequested, setPaymentInfoRequested] = useState(false);
  const [showDiscordNotice, setShowDiscordNotice] = useState(false);
  const sendPaymentInfoFn = useServerFn(sendPaymentInfoEmail);
  const displayName =
    participantProfile?.first_name ||
    participantProfile?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "Builder";

  useEffect(() => {
    if (typeof window === "undefined") return;

    setShowDiscordNotice(
      window.localStorage.getItem(DISCORD_NOTICE_KEY) !== "true",
    );
  }, []);

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
      const [{ data: tm }, { data: freshProfile }] = await Promise.all([
        supabase
          .from("team_members")
          .select("team_id, teams(*)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      ]);
      const currentProfile = freshProfile ?? profile;
      setParticipantProfile(currentProfile);
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
    <PortalShell title={`Welcome, ${displayName}`}>
      {showDiscordNotice && (
        <div className="panel mb-8 border-[#5865f2]/40 bg-[#5865f2]/10 p-5 sm:p-6 reveal">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#8ea0ff]">
                Required Community Update
              </p>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl text-bone">
                All participants must join the Discord server.
              </h2>
              <p className="mt-2 max-w-2xl font-serif text-base leading-relaxed text-bone/70">
                Announcements, support, team coordination, and event-day
                updates will be shared there first.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
              <a
                href={DISCORD_URL}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary flex min-h-12 items-center justify-center border-[#5865f2]/60 bg-[#5865f2]/15 px-6 text-[#8ea0ff] hover:border-[#5865f2] hover:bg-[#5865f2]/25"
              >
                Join Discord
              </a>
              <button
                type="button"
                onClick={() => {
                  window.localStorage.setItem(DISCORD_NOTICE_KEY, "true");
                  setShowDiscordNotice(false);
                }}
                className="btn-secondary flex min-h-12 items-center justify-center border-white/15 px-6 text-bone/65 hover:text-bone"
              >
                Already joined
              </button>
            </div>
          </div>
        </div>
      )}

      {!team ? (
        <div className="panel p-6 sm:p-12 text-center reveal">
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4">
            <Link
              to="/team/new"
              className="btn-primary inline-flex items-center justify-center min-w-0 sm:min-w-[200px]"
            >
              Create team
            </Link>
            <Link
              to="/team/join"
              className="btn-secondary inline-flex items-center justify-center min-w-0 sm:min-w-[200px]"
            >
              Join via Code
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Participant card */}
          <div className="panel p-5 sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-cyan">
                  Participant
                </p>
                <h2 className="mt-1 font-display text-3xl sm:text-4xl text-bone break-words">
                  {participantProfile?.full_name || displayName}
                </h2>
                <div className="mt-4">
                  <Link
                    to="/profile"
                    className="btn-secondary inline-flex min-h-10 items-center justify-center border-cyan/40 px-4 py-2 text-cyan hover:border-cyan hover:bg-cyan/10"
                  >
                    Edit profile
                  </Link>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="border border-white/10 bg-black/20 p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-bone/45">
                      Status
                    </p>
                    <p
                      className={`mt-2 font-mono text-sm uppercase tracking-[0.25em] ${STATUS_LABEL[participantProfile?.payment_status || "unpaid"].tone}`}
                    >
                      {
                        STATUS_LABEL[
                          participantProfile?.payment_status || "unpaid"
                        ].label
                      }
                    </p>
                  </div>
                  <div className="border border-white/10 bg-black/20 p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-bone/45">
                      Individual event pass code
                    </p>
                    <p className="mt-2 font-display text-2xl text-blood tracking-wide">
                      {participantProfile?.pass_code || "Pending"}
                    </p>
                  </div>
                </div>
              </div>

              {participantProfile?.payment_status !== "paid" && (
                <div className="border border-amber/25 bg-amber/5 p-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-amber">
                    Payment
                  </p>
                  <p className="mt-3 font-serif text-base leading-relaxed text-bone/70">
                    Request the payment instructions by email. Once the admin
                    verifies your payment, your event pass unlocks. Approval
                    takes up to 2 business days after you send the screenshot
                    and transaction reference.
                  </p>
                  {paymentInfoRequested && (
                    <div className="mt-4 border border-amber/30 bg-black/25 p-3 font-serif text-sm leading-relaxed text-amber/90">
                      Payment details were sent. It will take 2 business days
                      to approve your payment after you reply with proof of
                      payment.
                    </div>
                  )}
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
                        setPaymentInfoRequested(true);
                      } catch (err: any) {
                        toast.error(
                          err?.message || "Failed to send payment email.",
                        );
                      } finally {
                        setEmailBusy(false);
                      }
                    }}
                    className="btn-secondary mt-5 flex w-full min-h-12 items-center justify-center text-center px-4 py-3 border-amber/50 text-amber bg-amber/5 hover:bg-amber/10 hover:border-amber cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {emailBusy ? "Sending..." : "Email Payment Details"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Team card */}
          <div className="panel p-5 sm:p-8">
            <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-start">
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-blood">
                  Team
                </p>
                <h2 className="font-display text-3xl sm:text-4xl text-bone mt-1 break-words">
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
              <div className="rounded-sm border border-bone/10 bg-black/25 p-4 text-left sm:min-w-[190px] sm:text-right">
                <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-bone/50">
                  Team code
                </p>
                <p className="mt-1 font-display text-2xl text-blood tracking-wide">
                  {team.pass_code}
                </p>
              </div>
            </div>

            <div className="hairline my-6" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <Link
                to="/team/$teamId"
                params={{ teamId: team.id }}
                className="btn-secondary flex min-h-12 items-center justify-center text-center px-4 py-3 border-white/20"
              >
                Manage team
              </Link>
              <Link
                to="/pass/$teamId"
                params={{ teamId: team.id }}
                className="btn-secondary flex min-h-12 items-center justify-center text-center px-4 py-3 border-white/20"
              >
                Event Pass
              </Link>
              <Link
                to="/submit/$teamId"
                params={{ teamId: team.id }}
                className="btn-secondary flex min-h-12 items-center justify-center text-center px-4 py-3 border-white/20"
              >
                {submission ? "Edit submission" : "Submit project"}
              </Link>
            </div>
          </div>

          {/* Members */}
          <div className="panel p-5 sm:p-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-blood mb-4">
              Roster · {members.length}/5
            </p>
            <ul className="divide-y divide-bone/10">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-bone break-words">{m.full_name}</p>
                    <p className="break-all text-xs text-bone/50 font-mono">
                      {m.email}
                    </p>
                  </div>
                  <span
                    className={`w-fit font-mono text-[10px] uppercase tracking-[0.3em] ${m.role === "leader" ? "text-blood" : "text-bone/50"}`}
                  >
                    {m.role}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Submission */}
          {submission && (
            <div className="panel p-5 sm:p-8">
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
                  <li
                    key={c.id}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                  >
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
