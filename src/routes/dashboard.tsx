import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/PortalShell";
import { useAuth } from "@/lib/auth";
import { useServerFn } from "@tanstack/react-start";
import { sendPaymentInfoEmail } from "@/lib/email";
import { getAppSettings } from "@/lib/settings";
import { getDiscordAuthUrl } from "@/lib/discord";
import { toast } from "sonner";
import { Copy, LogOut, Crown, MessageSquare, X } from "lucide-react";
import { EventPass } from "@/components/EventPass";

const DISCORD_URL = "https://discord.gg/SDDT9D5kqs";

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

const TRACKS = [
  { v: "healthcare", l: "AI for Healthcare · Hopper" },
  { v: "fintech", l: "AI for Fintech · Dustin" },
  { v: "sustainability", l: "AI for Sustainability · Will" },
  { v: "education", l: "AI for Education · Eleven" },
];

const STATUS_LABEL: Record<string, { label: string; tone: string }> = {
  unpaid: { label: "Awaiting Payment", tone: "text-amber" },
  pending: { label: "Verifying Payment", tone: "text-amber" },
  paid: { label: "Verified", tone: "text-cyan" },
  refunded: { label: "Refunded", tone: "text-bone/50" },
};

type TabId = "overview" | "team" | "pass" | "submission" | "certificates";

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
  const [appSettings, setAppSettings] = useState({ registrationsOpen: true, paymentRequestsOpen: true });
  const [discordBusy, setDiscordBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [showDiscordBanner, setShowDiscordBanner] = useState(true);

  const sendPaymentInfoFn = useServerFn(sendPaymentInfoEmail);
  const getAppSettingsFn = useServerFn(getAppSettings);
  const getDiscordAuthUrlFn = useServerFn(getDiscordAuthUrl);

  const displayName =
    participantProfile?.first_name ||
    participantProfile?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "Builder";

  const isLeader = team?.leader_id === user?.id;
  const canSubmit = members.length >= 2;
  const isPaid = participantProfile?.payment_status === "paid";
  const currentUser = members.find((m) => m.user_id === user?.id) || members[0];

  // Handle Discord callback query params
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const discordResult = params.get("discord");
    if (discordResult) {
      switch (discordResult) {
        case "verified":
          toast.success("Discord verified! You're in the Catalyst server.");
          break;
        case "not-in-server":
          toast.error(
            "Discord connected but you haven't joined the Catalyst server yet. Join first, then verify again.",
          );
          break;
        case "denied":
          toast.info("Discord authorization was cancelled.");
          break;
        case "error":
          toast.error("Discord verification failed. Please try again.");
          break;
      }
      // Clean up URL
      params.delete("discord");
      const clean = params.toString();
      window.history.replaceState(
        {},
        "",
        window.location.pathname + (clean ? `?${clean}` : ""),
      );
    }
  }, []);

  const loadData = useCallback(async () => {
    if (!user) return;
    const [{ data: tm }, { data: freshProfile }, settings] = await Promise.all([
      supabase
        .from("team_members")
        .select("team_id, teams(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      getAppSettingsFn().catch(() => ({ registrationsOpen: true, paymentRequestsOpen: true })),
    ]);

    const currentProfile = freshProfile ?? profile;
    setParticipantProfile(currentProfile);
    setAppSettings(settings);

    const t = (tm as any)?.teams ?? null;
    setTeam(t);
    if (t) {
      const [{ data: ms }, { data: sub }] = await Promise.all([
        supabase
          .from("team_members")
          .select("*")
          .eq("team_id", t.id)
          .order("created_at"),
        supabase
          .from("submissions")
          .select("*")
          .eq("team_id", t.id)
          .maybeSingle(),
      ]);
      setMembers(ms ?? []);
      setSubmission(sub);
    } else {
      setMembers([]);
      setSubmission(null);
    }

    const { data: c } = await supabase
      .from("certificates")
      .select("*")
      .eq("user_id", user.id);
    setCerts(c ?? []);
    setBusy(false);
  }, [user, profile, getAppSettingsFn]);

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
    loadData();
  }, [user, profile, loading, nav, loadData]);

  // Team Management Actions
  const removeMember = async (id: string) => {
    if (!confirm("Remove this member from the team?")) return;
    setBusy(true);
    const { error } = await supabase.from("team_members").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      setBusy(false);
    } else {
      toast.success("Member removed.");
      loadData();
    }
  };

  const makeLeader = async (userId: string) => {
    if (!confirm("Transfer leadership? You will become a regular member."))
      return;
    setBusy(true);
    const { error } = await supabase.rpc("change_team_leader", {
      p_new_leader_id: userId,
    });
    if (error) {
      toast.error(error.message);
      setBusy(false);
    } else {
      toast.success("Leadership transferred.");
      loadData();
    }
  };

  const changeTrack = async (newTrack: string) => {
    setBusy(true);
    const { error } = await supabase.rpc("change_team_track", {
      p_new_track: newTrack as any,
    });
    if (error) {
      toast.error(error.message);
      setBusy(false);
    } else {
      toast.success("Track updated.");
      loadData();
    }
  };

  const leaveTeam = async () => {
    if (isLeader && members.length > 1) {
      toast.error("You must transfer leadership before leaving.");
      return;
    }
    const msg = isLeader
      ? "You are the last member. This will delete the team. Continue?"
      : "Leave team?";
    if (!confirm(msg)) return;

    setBusy(true);
    const { error } = await supabase.rpc(
      isLeader ? "delete_team" : "leave_team",
    );
    if (error) {
      toast.error(error.message);
      setBusy(false);
    } else {
      toast.success(isLeader ? "Team deleted." : "You have left the team.");
      loadData();
    }
  };

  const copyCode = () => {
    if (!team) return;
    navigator.clipboard.writeText(team.pass_code);
    toast.success("Access code copied to clipboard!");
  };

  if (busy) {
    return (
      <PortalShell title="Loading…">
        <div className="text-bone/50 font-mono text-sm">Reading the gate…</div>
      </PortalShell>
    );
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "team", label: "My Team" },
    { id: "pass", label: "Pass & Payment" },
    { id: "submission", label: "Submission" },
  ];
  if (certs.length > 0) {
    tabs.push({ id: "certificates", label: "Certificates" });
  }

  return (
    <PortalShell title="Dashboard">
      {/* TAB BAR */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 border-b border-white/10 pb-0 relative">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabId)}
            className={`px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] transition-all whitespace-nowrap relative ${
              activeTab === tab.id
                ? "text-blood text-glow-blood font-bold"
                : "text-bone/60 hover:text-bone hover:bg-white/5"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blood shadow-[0_0_10px_oklch(0.56_0.26_25/0.8)]" />
            )}
          </button>
        ))}
      </div>

      <div className="reveal" key={activeTab}>
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Discord Verification Banner */}
            {showDiscordBanner &&
              (participantProfile?.is_in_discord ? (
                <div className="panel border-[#5865F2]/40 bg-[#5865F2]/5 p-4 sm:p-5 reveal relative">
                  <button
                    onClick={() => setShowDiscordBanner(false)}
                    className="absolute top-4 right-4 text-bone/50 hover:text-bone"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pr-8">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#5865F2]/20 text-[#5865F2]">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#8ea0ff]">
                          Discord Verified
                        </p>
                        <p className="mt-1 font-serif text-sm text-bone/70">
                          Connected as{" "}
                          <span className="font-mono text-[#5865F2] font-bold">
                            {participantProfile.discord_username ||
                              "Discord User"}
                          </span>
                        </p>
                      </div>
                    </div>
                    <a
                      href={DISCORD_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-h-9 items-center justify-center rounded bg-[#5865F2] px-5 text-white font-mono text-[10px] uppercase tracking-[0.1em] hover:bg-[#4752C4] transition-colors"
                    >
                      Open Server
                    </a>
                  </div>
                </div>
              ) : (
                <div className="panel border-[#5865F2]/40 bg-[#5865F2]/10 p-4 sm:p-5 reveal relative">
                  <button
                    onClick={() => setShowDiscordBanner(false)}
                    className="absolute top-4 right-4 text-[#8ea0ff] hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between pr-8">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#8ea0ff]">
                        Required — Community Verification
                      </p>
                      <h2 className="mt-2 font-display text-xl sm:text-2xl text-bone flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-[#5865F2]" />
                        Connect & verify your Discord
                      </h2>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
                      <a
                        href={DISCORD_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="flex min-h-10 items-center justify-center rounded border border-[#5865F2]/60 bg-transparent px-5 text-[#8ea0ff] font-mono text-[10px] uppercase tracking-[0.1em] hover:bg-[#5865F2]/10 transition-colors"
                      >
                        1. Join Server
                      </a>
                      <button
                        type="button"
                        disabled={discordBusy}
                        onClick={async () => {
                          if (!session?.access_token) return;
                          setDiscordBusy(true);
                          try {
                            const { url } = await getDiscordAuthUrlFn({
                              data: {
                                accessToken: session.access_token,
                                redirectOrigin: window.location.origin,
                              },
                            });
                            window.location.href = url;
                          } catch (err: any) {
                            toast.error(
                              err?.message ||
                                "Failed to start Discord verification.",
                            );
                            setDiscordBusy(false);
                          }
                        }}
                        className="flex min-h-10 items-center justify-center rounded bg-[#5865F2] px-5 text-white font-mono text-[10px] uppercase tracking-[0.1em] hover:bg-[#4752C4] transition-colors disabled:opacity-50"
                      >
                        {discordBusy ? "Redirecting..." : "2. Verify Discord"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

            {/* Participant card */}
            <div className="panel p-5 sm:p-8 reveal-delay-1">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-cyan">
                    Participant
                  </p>
                  <h2 className="mt-1 font-display text-3xl sm:text-4xl text-bone break-words">
                    {participantProfile?.full_name || displayName}
                  </h2>
                </div>
                <Link
                  to="/profile"
                  className="btn-secondary inline-flex min-h-10 items-center justify-center border-cyan/40 px-5 py-2 text-cyan hover:border-cyan hover:bg-cyan/10"
                >
                  Edit profile
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="border border-white/10 bg-black/20 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-bone/45">
                    Email
                  </p>
                  <p className="mt-2 font-mono text-sm text-bone/80 break-all">
                    {user?.email}
                  </p>
                </div>
                <div className="border border-white/10 bg-black/20 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-bone/45">
                    Phone
                  </p>
                  <p className="mt-2 font-mono text-sm text-bone/80">
                    {participantProfile?.phone || "—"}
                  </p>
                </div>
                <div className="border border-white/10 bg-black/20 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-bone/45">
                    College
                  </p>
                  <p
                    className="mt-2 font-serif text-sm text-bone/80 truncate"
                    title={participantProfile?.college}
                  >
                    {participantProfile?.college || "—"}
                  </p>
                </div>
                <div className="border border-white/10 bg-black/20 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-bone/45">
                    Course / Year
                  </p>
                  <p className="mt-2 font-serif text-sm text-bone/80">
                    {participantProfile?.course || "—"} ·{" "}
                    {participantProfile?.year_of_study || "—"}
                  </p>
                </div>
                <div className="border border-white/10 bg-black/20 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-bone/45">
                    Dietary
                  </p>
                  <p
                    className="mt-2 font-serif text-sm text-bone/80 truncate"
                    title={participantProfile?.dietary_restrictions}
                  >
                    {participantProfile?.dietary_restrictions || "None"}
                  </p>
                </div>
                <div className="border border-white/10 bg-black/20 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-bone/45">
                    T-Shirt Size
                  </p>
                  <p className="mt-2 font-mono text-sm text-bone/80">
                    {participantProfile?.tshirt_size || "—"}
                  </p>
                </div>
              </div>
            </div>

            {!team && (
              <div className="border border-blood/20 bg-blood/5 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 reveal-delay-2">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-blood">
                    Next Step
                  </p>
                  <p className="text-bone/80 font-serif text-lg">
                    You need a team to participate in the hackathon.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("team")}
                  className="btn-primary min-h-10 px-6 py-2 whitespace-nowrap"
                >
                  Go to My Team
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "team" && (
          <div className="space-y-8">
            {!team ? (
              <div className="panel p-6 sm:p-12 text-center reveal">
                <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-blood text-glow-blood mb-6 font-bold">
                  No team yet
                </p>
                <h2 className="font-display text-4xl sm:text-5xl text-bone mb-4 drop-shadow-md">
                  Assemble your party
                </h2>
                <p className="font-serif italic text-bone/80 max-w-lg mx-auto mb-8 text-lg">
                  Teams of 2–5. You'll be the leader. Invite your members by
                  email after creation.
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
              <>
                <div className="panel p-6 sm:p-8 reveal">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-blood">
                        Team
                      </p>
                      <h2 className="font-display text-3xl sm:text-4xl text-bone mt-1 break-words">
                        {team.name}
                      </h2>
                      {team.tagline && (
                        <p className="mt-2 text-bone/70 font-serif italic">
                          "{team.tagline}"
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-start sm:items-end">
                      <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-cyan text-glow-cyan mb-2 font-bold">
                        Track
                      </p>
                      {isLeader ? (
                        <select
                          value={team.track}
                          onChange={(e) => changeTrack(e.target.value)}
                          className="input-styled appearance-none cursor-pointer py-2 max-w-[250px] text-sm"
                        >
                          {!TRACKS.some((t) => t.v === team.track) && (
                            <option
                              value={team.track}
                              disabled
                              className="bg-void text-bone"
                            >
                              Retired track
                            </option>
                          )}
                          {TRACKS.map((t) => (
                            <option
                              key={t.v}
                              value={t.v}
                              className="bg-void text-bone"
                            >
                              {t.l}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="input-styled bg-black/40 text-bone/70 py-2 cursor-not-allowed text-sm">
                          {TRACKS.find((t) => t.v === team.track)?.l ||
                            "Retired track"}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/10 pt-8">
                    {/* Access Code */}
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-blood text-glow-blood mb-2 font-bold">
                        Access Code
                      </p>
                      <p className="text-sm font-serif italic text-bone/70 mb-3 max-w-sm">
                        Share this 8-character code with your teammates so they
                        can join.
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="font-display text-3xl tracking-widest text-bone bg-black/40 px-4 py-2 rounded-lg border border-white/10">
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

                    {/* Action Panel */}
                    <div className="flex flex-col justify-end items-start md:items-end">
                      {!canSubmit && (
                        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber text-glow-cyan mb-4 md:text-right">
                          Add at least 1 more member to unlock submission &
                          pass.
                        </p>
                      )}
                      <button
                        onClick={leaveTeam}
                        className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-bone/50 hover:text-blood transition-colors px-4 py-2"
                      >
                        <LogOut className="w-4 h-4" />
                        {isLeader && members.length === 1
                          ? "Delete Team"
                          : "Leave Team"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="panel p-5 sm:p-8 reveal-delay-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-blood mb-4">
                    Roster · {members.length}/5
                  </p>
                  <ul className="divide-y divide-bone/10">
                    {members.map((m) => (
                      <li
                        key={m.id}
                        className="py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <p className="text-bone truncate text-lg">
                              {m.full_name}
                            </p>
                            {m.role === "leader" && (
                              <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.3em] text-blood bg-blood/10 px-2 py-0.5 rounded border border-blood/20">
                                <Crown className="w-3 h-3" /> Leader
                              </span>
                            )}
                          </div>
                          <p className="break-all text-xs text-bone/50 font-mono mt-1">
                            {m.email}
                          </p>
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
              </>
            )}
          </div>
        )}

        {activeTab === "pass" && (
          <div className="space-y-8">
            <div className="panel p-5 sm:p-8 reveal">
              <h2 className="font-display text-3xl sm:text-4xl text-bone mb-6">
                Payment & Access
              </h2>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="border border-white/10 bg-black/20 p-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-bone/45">
                    Status
                  </p>
                  <p
                    className={`mt-2 font-mono text-lg uppercase tracking-[0.25em] ${
                      STATUS_LABEL[
                        participantProfile?.payment_status || "unpaid"
                      ].tone
                    }`}
                  >
                    {
                      STATUS_LABEL[
                        participantProfile?.payment_status || "unpaid"
                      ].label
                    }
                  </p>
                </div>

                <div className="border border-white/10 bg-black/20 p-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-bone/45">
                    Individual event pass code
                  </p>
                  <p className="mt-2 font-display text-3xl text-blood tracking-wide">
                    {participantProfile?.pass_code || "Pending"}
                  </p>
                </div>
              </div>

              {participantProfile?.payment_status !== "paid" && (
                <div className="mt-6 border border-amber/25 bg-amber/5 p-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-amber">
                    {appSettings.paymentRequestsOpen
                      ? "Payment Instructions"
                      : "Slots Full"}
                  </p>
                  <p className="mt-3 font-serif text-base leading-relaxed text-bone/70">
                    {appSettings.paymentRequestsOpen
                      ? "Request the payment instructions by email. Once the admin verifies your payment, your event pass unlocks. Approval takes up to 2 business days after you send the screenshot and transaction reference."
                      : "All available slots are full, so payment requests are closed. You can request an email confirmation with the same update and explore other AUKTAVE events."}
                  </p>
                  {paymentInfoRequested && (
                    <div className="mt-4 border border-amber/30 bg-black/25 p-3 font-serif text-sm leading-relaxed text-amber/90">
                      {appSettings.paymentRequestsOpen
                        ? "Payment details were sent. It will take 2 business days to approve your payment after you reply with proof of payment."
                        : "A slots-full notice was sent to your email."}
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
                        const result = await sendPaymentInfoFn({
                          data: { accessToken: session.access_token },
                        });
                        toast.success(
                          result.closed
                            ? "Slots-full notice sent. Check your email."
                            : "Payment instructions sent! Check your email (and spam folder).",
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
                    className="btn-secondary mt-5 flex w-full sm:w-auto min-h-12 items-center justify-center text-center px-8 py-3 border-amber/50 text-amber bg-amber/5 hover:bg-amber/10 hover:border-amber cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {emailBusy
                      ? "Sending..."
                      : appSettings.paymentRequestsOpen
                        ? "Email Payment Details"
                        : "Email Slots Full Notice"}
                  </button>
                </div>
              )}
            </div>

            {/* Event Pass Inline Rendering */}
            {team ? (
              <div
                className={`panel p-5 sm:p-8 reveal-delay-1 ${isPaid ? "border-cyan/30" : "border-amber/30"}`}
              >
                {!canSubmit ? (
                  <div className="text-center py-8">
                    <p className="font-display text-3xl text-bone mb-2">
                      Pass Locked
                    </p>
                    <p className="text-bone/80 text-lg font-serif">
                      Your pass unlocks once your team has at least 2 members.
                    </p>
                    <button
                      onClick={() => setActiveTab("team")}
                      className="mt-6 btn-secondary inline-flex px-6 py-2"
                    >
                      Manage Team
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="mb-6 font-serif italic text-bone/60 max-w-xl">
                      Show this at the venue for verification and meal coupons.
                      Download it as a PNG and post it on LinkedIn, X, or
                      Instagram.
                    </p>
                    <div className="mx-auto max-w-md">
                      <EventPass
                        team={team}
                        members={members}
                        currentUser={currentUser}
                        participantProfile={participantProfile}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {activeTab === "submission" && (
          <div className="space-y-8">
            {!team ? (
              <div className="panel p-8 text-center text-bone/70 font-serif reveal">
                You must join a team to submit a project.
              </div>
            ) : (
              <>
                {submission ? (
                  <div className="panel p-5 sm:p-8 reveal">
                    <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-blood mb-2">
                      Submission
                    </p>
                    <h3 className="font-display text-3xl text-bone">
                      {submission.title}
                    </h3>
                    <p className="mt-4 text-bone/80 font-serif text-lg max-w-3xl whitespace-pre-wrap">
                      {submission.description}
                    </p>

                    <div className="mt-8">
                      <Link
                        to="/submit/$teamId"
                        params={{ teamId: team.id }}
                        className="btn-secondary inline-flex items-center px-6"
                      >
                        Edit submission
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="panel p-8 text-center reveal">
                    <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-blood mb-4">
                      No Submission Yet
                    </p>
                    <h2 className="font-display text-3xl text-bone mb-4">
                      Ready to ship?
                    </h2>
                    <p className="font-serif text-bone/70 mb-8 max-w-md mx-auto">
                      Submit your project details, GitHub repo, and pitch deck.
                      You can update it until the deadline.
                    </p>
                    <Link
                      to="/submit/$teamId"
                      params={{ teamId: team.id }}
                      className="btn-primary inline-flex items-center"
                    >
                      Submit Project
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "certificates" && certs.length > 0 && (
          <div className="space-y-8">
            <div className="panel p-6 sm:p-8 reveal">
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-blood mb-6">
                Your certificates
              </p>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {certs.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-col border border-white/10 bg-black/20 p-5 hover:border-white/30 transition-colors"
                  >
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/50 mb-2">
                      {c.kind}
                    </span>
                    <span className="text-bone text-lg font-serif mb-4">
                      {c.recipient_name}
                    </span>
                    <div className="mt-auto pt-4 border-t border-white/5">
                      <Link
                        to="/certificate/$code"
                        params={{ code: c.certificate_code }}
                        className="font-mono text-[10px] uppercase tracking-[0.3em] text-blood hover:text-white transition-colors"
                      >
                        View Certificate →
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </PortalShell>
  );
}
