import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  deleteParticipantAccount,
  setParticipantPaymentStatus as setParticipantPaymentStatusFn,
  createEmailCampaign,
  triggerEmailProcessing,
  getEmailCampaigns,
  terminateEmailCampaign,
} from "@/lib/email";
import { getAppSettings, updateAppSettings } from "@/lib/settings";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Console — Catalyst 2K26" }] }),
  component: Admin,
});

type Tab = "analytics" | "teams" | "participants" | "comms" | "settings";

function Admin() {
  const { user, isAdmin, loading, session } = useAuth();
  const nav = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>("analytics");
  const [teams, setTeams] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<any | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [busy, setBusy] = useState(true);
  /* ── Communications state ── */
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailTarget, setEmailTarget] = useState<string>("all");
  const [emailTrack, setEmailTrack] = useState<string>("healthcare");
  const [emailSending, setEmailSending] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [processingEmails, setProcessingEmails] = useState(false);
  const [terminatingCampaignId, setTerminatingCampaignId] = useState<string | null>(null);
  const setParticipantPaymentStatusServer = useServerFn(
    setParticipantPaymentStatusFn,
  );
  const deleteParticipantAccountFn = useServerFn(deleteParticipantAccount);
  const createEmailCampaignFn = useServerFn(createEmailCampaign);
  const triggerEmailProcessingFn = useServerFn(triggerEmailProcessing);
  const getEmailCampaignsFn = useServerFn(getEmailCampaigns);
  const terminateEmailCampaignFn = useServerFn(terminateEmailCampaign);
  const getAppSettingsFn = useServerFn(getAppSettings);
  const updateAppSettingsFn = useServerFn(updateAppSettings);
  const [appSettings, setAppSettings] = useState<{ registrationsOpen: boolean }>({ registrationsOpen: true });
  const [settingsBusy, setSettingsBusy] = useState(false);

  const load = async () => {
    const [teamsRes, participantsRes, settingsRes] = await Promise.all([
      supabase
        .from("teams")
        .select(
          "*, team_members(id, user_id, full_name, email, role), submissions(id, title)",
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false }),
      getAppSettingsFn()
    ]);
    setTeams(teamsRes.data ?? []);
    setParticipants(participantsRes.data ?? []);
    setAppSettings(settingsRes || { registrationsOpen: true });
    setBusy(false);
  };

  useEffect(() => {
    if (loading) return;
    if (!user) {
      nav({ to: "/admin-login" });
      return;
    }
    if (!isAdmin) {
      toast.error("Unauthorized access.");
      nav({ to: "/" });
      return;
    }
    void load();
  }, [user, isAdmin, loading, nav]);

  /* ── Actions ── */
  const participantByUserId = new Map(participants.map((p) => [p.user_id, p]));
  const statusLabel = (status?: string | null) =>
    status === "paid" ? "verified" : status || "unpaid";

  const setParticipantPaymentStatus = async (
    id: string,
    payment_status: "unpaid" | "paid",
  ) => {
    if (!session?.access_token) {
      toast.error("Please sign in again.");
      return;
    }

    try {
      const result = await setParticipantPaymentStatusServer({
        data: {
          adminAccessToken: session.access_token,
          participantProfileId: id,
          paymentStatus: payment_status,
        },
      });

      toast.success(
        `Participant status marked as ${statusLabel(payment_status)}.`,
      );
      if (payment_status === "paid") {
        if (result.sent) {
          toast.success("Confirmation emails sent to participant.");
        } else {
          toast.error("Payment marked, but email sending failed.");
        }
      }
    } catch (err: any) {
      console.error("Failed to update participant payment:", err);
      toast.error(err?.message || "Failed to update participant status.");
      return;
    }

    await load();
  };

  const beginDeleteParticipant = (participant: any) => {
    setDeleteTarget(participant);
    setDeleteConfirmText("");
  };

  const confirmDeleteParticipant = async () => {
    if (!deleteTarget || !session?.access_token) {
      toast.error("Please sign in again.");
      return;
    }

    const expected = deleteTarget.full_name || deleteTarget.email || "DELETE";
    if (deleteConfirmText.trim() !== expected) {
      toast.error(`Type "${expected}" exactly to confirm deletion.`);
      return;
    }

    const secondConfirm = window.confirm(
      `Final confirmation: permanently delete ${expected}? This removes their account, profile, team membership, and related auth record.`,
    );
    if (!secondConfirm) return;

    setDeleteBusy(true);
    try {
      await deleteParticipantAccountFn({
        data: {
          adminAccessToken: session.access_token,
          participantProfileId: deleteTarget.id,
        },
      });
      toast.success("Participant deleted.");
      setDeleteTarget(null);
      setDeleteConfirmText("");
      await load();
    } catch (err: any) {
      console.error("Failed to delete participant:", err);
      toast.error(err?.message || "Failed to delete participant.");
    } finally {
      setDeleteBusy(false);
    }
  };

  const toggleWinner = async (team: any) => {
    const { error } = await (supabase.from("teams") as any)
      .update({ is_winner: !team.is_winner })
      .eq("id", team.id);
    if (error) return toast.error(error.message);
    toast.success(
      team.is_winner ? "Winner status removed." : "🏆 Team marked as winner!",
    );
    void load();
  };

  const openResume = async (resumeUrl: string) => {
    if (!resumeUrl) return;
    // Extract the file path from the full URL
    // URL format: .../storage/v1/object/public/resumes/<path> or .../sign/<path>
    try {
      const match = resumeUrl.match(/\/resumes\/(.+)/);
      if (!match) {
        // Fallback: try to open the URL directly (may work if policy allows it)
        window.open(resumeUrl, "_blank");
        return;
      }
      const filePath = match[1];
      const { data, error } = await supabase.storage
        .from("resumes")
        .createSignedUrl(filePath, 60 * 60); // 1 hour
      if (error || !data?.signedUrl) {
        toast.error(
          "Could not generate resume link. Check bucket permissions.",
        );
        return;
      }
      window.open(data.signedUrl, "_blank");
    } catch {
      toast.error("Failed to open resume.");
    }
  };

  /* ── CSV Exports ── */
  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTeamsCSV = () => {
    let csv =
      "Team Name,Track,Team Code,Winner,Members,Verified Participants,Submission\n";
    teams.forEach((t) => {
      const members = t.team_members
        .map((m: any) => {
          const payment =
            participantByUserId.get(m.user_id)?.payment_status ?? "unpaid";
          return `${m.full_name}(${m.role}, ${statusLabel(payment)})`;
        })
        .join("; ");
      const paidCount = t.team_members.filter(
        (m: any) =>
          participantByUserId.get(m.user_id)?.payment_status === "paid",
      ).length;
      const sub = t.submissions?.[0]?.title ?? "";
      csv += `"${t.name}","${t.track}","${t.pass_code}","${t.is_winner ? "Yes" : "No"}","${members}","${paidCount}/${t.team_members.length}","${sub}"\n`;
    });
    downloadCSV(csv, "catalyst-teams.csv");
  };

  const downloadParticipantsCSV = () => {
    let csv =
      "Full Name,Phone,College,Course,Year,DOB,Address,LinkedIn,GitHub,Resume,Dietary,Profile Status,Status,Individual Pass Code\n";
    participants.forEach((p) => {
      csv += `"${p.full_name || ""}","${p.phone || ""}","${p.college || ""}","${p.course || ""}","${p.year_of_study || ""}","${p.dob || ""}","${(p.address || "").replace(/\n/g, " ")}","${p.linkedin_url || ""}","${p.github_url || ""}","${p.resume_url || ""}","${p.dietary_restrictions || ""}","${p.is_complete ? "Complete" : "Incomplete"}","${statusLabel(p.payment_status)}","${p.pass_code || ""}"\n`;
    });
    downloadCSV(csv, "catalyst-participants.csv");
  };

  /* ── Derived stats ── */
  const totalParticipants = participants.length;
  const totalTeams = teams.length;
  const paidParticipants = participants.filter(
    (p) => p.payment_status === "paid",
  ).length;
  const unpaidParticipants = totalParticipants - paidParticipants;
  const completeProfiles = participants.filter((p) => p.is_complete).length;
  const incompleteProfiles = totalParticipants - completeProfiles;
  const participantsWithResume = participants.filter((p) => p.resume_url).length;
  const participantsWithGithub = participants.filter((p) => p.github_url).length;
  const participantsWithLinkedIn = participants.filter(
    (p) => p.linkedin_url,
  ).length;
  const submittedTeams = teams.filter((t) => t.submissions?.length).length;
  const winnerTeams = teams.filter((t) => t.is_winner).length;
  const totalTeamMembers = teams.reduce(
    (sum, team) => sum + (team.team_members?.length || 0),
    0,
  );
  const averageTeamSize = totalTeams ? totalTeamMembers / totalTeams : 0;
  const fullyVerifiedTeams = teams.filter((team) => {
    const members = team.team_members || [];
    return (
      members.length > 0 &&
      members.every(
        (member: any) =>
          participantByUserId.get(member.user_id)?.payment_status === "paid",
      )
    );
  }).length;
  const estimatedRevenue = paidParticipants * 200;
  const paymentConversion = totalParticipants
    ? Math.round((paidParticipants / totalParticipants) * 100)
    : 0;
  const profileCompletionRate = totalParticipants
    ? Math.round((completeProfiles / totalParticipants) * 100)
    : 0;
  const submissionRate = totalTeams
    ? Math.round((submittedTeams / totalTeams) * 100)
    : 0;
  const fullTeamVerificationRate = totalTeams
    ? Math.round((fullyVerifiedTeams / totalTeams) * 100)
    : 0;

  const trackLabel = (track: string) =>
    ({
      healthcare: "Healthcare",
      fintech: "Fintech",
      sustainability: "Sustainability",
      education: "Education",
      open: "Open",
    })[track] || track || "Unassigned";

  const emailTargetLabel = (targetFilter: any) => {
    const target =
      typeof targetFilter === "string"
        ? (() => {
            try {
              return JSON.parse(targetFilter);
            } catch {
              return { type: targetFilter };
            }
          })()
        : targetFilter || { type: "all" };

    const labels: Record<string, string> = {
      all: "All Participants",
      verified: "Verified (Paid)",
      paid: "Verified (Paid)",
      unverified: "Unverified",
      unpaid: "Unverified",
      complete: "Complete Profiles",
      track: target.track ? `${trackLabel(target.track)} Track` : "Specific Track",
    };

    return labels[target.type] || "All Participants";
  };

  const campaignStatusTone = (
    status?: string,
  ): "green" | "yellow" | "red" | "blue" | "gray" => {
    if (status === "completed") return "green";
    if (status === "failed" || status === "terminated") return "red";
    if (status === "processing") return "yellow";
    if (status === "queued" || status === "pending") return "blue";
    return "gray";
  };

  const canTerminateCampaign = (campaign: any) =>
    ["queued", "processing", "pending"].includes(campaign.status) &&
    (campaign.pending_count ?? 0) > 0;

  const refreshCampaigns = async () => {
    if (!session?.access_token) return;
    const res = await getEmailCampaignsFn({
      data: { adminAccessToken: session.access_token },
    });
    setCampaigns(res.campaigns);
  };

  const groupBy = (items: any[], getKey: (item: any) => string | null) => {
    const counts = new Map<string, number>();
    items.forEach((item) => {
      const key = getKey(item)?.trim() || "Not provided";
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts, ([label, value]) => ({ label, value })).sort(
      (a, b) => b.value - a.value || a.label.localeCompare(b.label),
    );
  };

  const trackAnalytics = [
    "healthcare",
    "fintech",
    "sustainability",
    "education",
    "open",
  ].map((track) => {
    const trackTeams = teams.filter((team) => team.track === track);
    const userIds = new Set<string>();
    trackTeams.forEach((team) =>
      (team.team_members || []).forEach((member: any) =>
        userIds.add(member.user_id),
      ),
    );
    const trackParticipants = Array.from(userIds)
      .map((id) => participantByUserId.get(id))
      .filter(Boolean);
    return {
      label: trackLabel(track),
      teams: trackTeams.length,
      participants: trackParticipants.length,
      verified: trackParticipants.filter((p) => p.payment_status === "paid")
        .length,
    };
  });

  const collegeAnalytics = groupBy(participants, (p) => p.college).slice(0, 8);
  const courseAnalytics = groupBy(participants, (p) => p.course).slice(0, 8);
  const yearAnalytics = groupBy(participants, (p) => p.year_of_study).slice(
    0,
    8,
  );
  const teamSizeAnalytics = [1, 2, 3, 4, 5].map((size) => ({
    label: `${size} member${size === 1 ? "" : "s"}`,
    value: teams.filter((team) => (team.team_members || []).length === size)
      .length,
  }));
  const paymentAnalytics = [
    { label: "Verified", value: paidParticipants },
    { label: "Unverified", value: unpaidParticipants },
  ];
  const profileAnalytics = [
    { label: "Complete", value: completeProfiles },
    { label: "Incomplete", value: incompleteProfiles },
  ];
  const submissionAnalytics = [
    { label: "Submitted", value: submittedTeams },
    { label: "Not submitted", value: totalTeams - submittedTeams },
  ];
  const registrationTrend = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    return {
      label: date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      }),
      value: participants.filter((p) => p.created_at?.slice(0, 10) === key)
        .length,
    };
  });
  const needsAttention = {
    incomplete: participants.filter((p) => !p.is_complete).slice(0, 6),
    unverified: participants
      .filter((p) => p.is_complete && p.payment_status !== "paid")
      .slice(0, 6),
    teamsMissingSubmission: teams
      .filter((team) => !team.submissions?.length)
      .slice(0, 6),
    teamsNotFullyVerified: teams
      .filter((team) => {
        const members = team.team_members || [];
        return (
          members.length > 0 &&
          members.some(
            (member: any) =>
              participantByUserId.get(member.user_id)?.payment_status !==
              "paid",
          )
        );
      })
      .slice(0, 6),
  };

  const downloadAnalyticsCSV = () => {
    const rows = [
      ["Metric", "Value"],
      ["Total participants", totalParticipants],
      ["Complete profiles", completeProfiles],
      ["Incomplete profiles", incompleteProfiles],
      ["Verified participants", paidParticipants],
      ["Unverified participants", unpaidParticipants],
      ["Total teams", totalTeams],
      ["Submitted teams", submittedTeams],
      ["Teams fully verified", fullyVerifiedTeams],
      ["Average team size", averageTeamSize.toFixed(2)],
      ["Estimated revenue", estimatedRevenue],
      [],
      ["Track", "Teams", "Participants", "Verified Participants"],
      ...trackAnalytics.map((track) => [
        track.label,
        track.teams,
        track.participants,
        track.verified,
      ]),
      [],
      ["Top colleges", "Participants"],
      ...collegeAnalytics.map((item) => [item.label, item.value]),
      [],
      ["Recent registrations", "Participants"],
      ...registrationTrend.map((item) => [item.label, item.value]),
    ];
    downloadCSV(
      rows
        .map((row) => row.map((cell) => `"${cell ?? ""}"`).join(","))
        .join("\n"),
      "catalyst-analytics.csv",
    );
  };

  if (busy) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f9fafb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          className="admin-topbar"
          style={{
            width: 32,
            height: 32,
            border: "3px solid #dbeafe",
            borderTopColor: "#2563eb",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const tabBtn = (label: string, value: Tab) => (
    <button
      key={value}
      onClick={() => setActiveTab(value)}
      style={{
        padding: "16px 4px",
        marginRight: 32,
        border: "none",
        borderBottom:
          activeTab === value ? "2px solid #2563eb" : "2px solid transparent",
        background: "none",
        cursor: "pointer",
        fontSize: 14,
        fontWeight: 500,
        color: activeTab === value ? "#2563eb" : "#6b7280",
      }}
    >
      {label}
    </button>
  );

  const badge = (
    text: string,
    color: "green" | "yellow" | "red" | "blue" | "gray",
  ) => {
    const map: Record<string, { bg: string; text: string }> = {
      green: { bg: "#dcfce7", text: "#166534" },
      yellow: { bg: "#fef9c3", text: "#854d0e" },
      red: { bg: "#fee2e2", text: "#991b1b" },
      blue: { bg: "#dbeafe", text: "#1e40af" },
      gray: { bg: "#f3f4f6", text: "#374151" },
    };
    const c = map[color];
    return (
      <span
        style={{
          display: "inline-block",
          padding: "2px 8px",
          borderRadius: 9999,
          fontSize: 12,
          fontWeight: 600,
          background: c.bg,
          color: c.text,
        }}
      >
        {text}
      </span>
    );
  };

  const btn = (
    label: string,
    onClick: () => void,
    variant: "green" | "yellow" | "blue" | "gray" | "red",
  ) => {
    const map: Record<
      string,
      { border: string; bg: string; text: string; hoverBg: string }
    > = {
      green: {
        border: "#bbf7d0",
        bg: "#f0fdf4",
        text: "#15803d",
        hoverBg: "#dcfce7",
      },
      yellow: {
        border: "#fde68a",
        bg: "#fffbeb",
        text: "#b45309",
        hoverBg: "#fef3c7",
      },
      blue: {
        border: "#bfdbfe",
        bg: "#eff6ff",
        text: "#1d4ed8",
        hoverBg: "#dbeafe",
      },
      gray: {
        border: "#e5e7eb",
        bg: "#f9fafb",
        text: "#374151",
        hoverBg: "#f3f4f6",
      },
      red: {
        border: "#fecaca",
        bg: "#fef2f2",
        text: "#b91c1c",
        hoverBg: "#fee2e2",
      },
    };
    const v = map[variant];
    return (
      <button
        onClick={onClick}
        style={{
          padding: "4px 10px",
          borderRadius: 6,
          border: `1px solid ${v.border}`,
          background: v.bg,
          color: v.text,
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 500,
        }}
        onMouseOver={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = v.hoverBg;
        }}
        onMouseOut={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = v.bg;
        }}
      >
        {label}
      </button>
    );
  };

  const maxValue = (items: { value: number }[]) =>
    Math.max(1, ...items.map((item) => item.value));

  const analyticsCard = (
    label: string,
    value: string | number,
    note: string,
    tone: "blue" | "green" | "yellow" | "red" | "purple" = "blue",
  ) => {
    const tones = {
      blue: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
      green: { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
      yellow: { bg: "#fffbeb", text: "#b45309", border: "#fde68a" },
      red: { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" },
      purple: { bg: "#faf5ff", text: "#7e22ce", border: "#e9d5ff" },
    };
    const color = tones[tone];
    return (
      <div
        style={{
          background: "#fff",
          border: `1px solid ${color.border}`,
          borderRadius: 12,
          padding: 20,
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: color.text }}>
          {label}
        </div>
        <div style={{ marginTop: 8, fontSize: 30, fontWeight: 800 }}>
          {value}
        </div>
        <div style={{ marginTop: 6, fontSize: 13, color: "#6b7280" }}>
          {note}
        </div>
      </div>
    );
  };

  const barList = (
    title: string,
    items: { label: string; value: number; meta?: string }[],
    emptyText = "No data yet.",
  ) => (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 20,
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      }}
    >
      <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>
        {title}
      </h3>
      {items.length === 0 ? (
        <div style={{ color: "#9ca3af", fontSize: 13 }}>{emptyText}</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((item) => {
            const width = `${Math.max(4, (item.value / maxValue(items)) * 100)}%`;
            return (
              <div key={item.label}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    fontSize: 13,
                    marginBottom: 5,
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{item.label}</span>
                  <span style={{ color: "#6b7280" }}>
                    {item.value}
                    {item.meta ? ` ${item.meta}` : ""}
                  </span>
                </div>
                <div
                  style={{
                    height: 8,
                    borderRadius: 999,
                    background: "#f3f4f6",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width,
                      borderRadius: 999,
                      background:
                        "linear-gradient(90deg, #2563eb 0%, #06b6d4 100%)",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const attentionList = (
    title: string,
    items: any[],
    getPrimary: (item: any) => string,
    getSecondary: (item: any) => string,
    emptyText: string,
  ) => (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 20,
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      }}
    >
      <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>
        {title}
      </h3>
      {items.length === 0 ? (
        <div style={{ color: "#16a34a", fontSize: 13, fontWeight: 600 }}>
          {emptyText}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                padding: 12,
                background: "#f9fafb",
                border: "1px solid #f3f4f6",
                borderRadius: 8,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                {getPrimary(item)}
              </div>
              <div style={{ marginTop: 2, fontSize: 12, color: "#6b7280" }}>
                {getSecondary(item)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f9fafb",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#111827",
      }}
    >
      {/* ── Top Nav ── */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: 64,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#2563eb",
              }}
            />
            <span style={{ fontSize: 17, fontWeight: 700 }}>
              Catalyst Admin Console
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={
                activeTab === "analytics"
                  ? downloadAnalyticsCSV
                  : activeTab === "teams"
                    ? downloadTeamsCSV
                    : downloadParticipantsCSV
              }
              style={{
                padding: "8px 16px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                background: "#fff",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
                color: "#374151",
              }}
            >
              Export{" "}
              {activeTab === "analytics"
                ? "Analytics"
                : activeTab === "teams"
                  ? "Teams"
                  : "Participants"}{" "}
              CSV
            </button>
          </div>
        </div>
      </nav>

      {/* ── Tabs ── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          {tabBtn("Analytics Command Center", "analytics")}
          {tabBtn("Teams Database", "teams")}
          {tabBtn("Individual Participants", "participants")}
          {tabBtn("Communications", "comms")}
          {tabBtn("Settings", "settings")}
        </div>
      </div>

      <main
        className="admin-main"
        style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}
      >
        {/* ── Stats Row ── */}
        <div
          className="admin-stats"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: 16,
            marginBottom: 28,
          }}
        >
          {[
            { label: "Total Teams", value: totalTeams },
            { label: "Total Participants", value: totalParticipants },
            { label: "Verified Participants", value: paidParticipants },
            { label: "Complete Profiles", value: completeProfiles },
            { label: "Submitted Projects", value: submittedTeams },
            { label: "Revenue", value: `₹${estimatedRevenue}` },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "20px 24px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: "#6b7280",
                  fontWeight: 500,
                  marginBottom: 4,
                }}
              >
                {s.label}
              </div>
              <div style={{ fontSize: 30, fontWeight: 700, color: "#111827" }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* ── Table Card ── */}
        {activeTab === "analytics" && (
          <div style={{ display: "grid", gap: 24 }}>
            <section
              className="admin-analytics-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: 16,
              }}
            >
              {analyticsCard("Payment conversion", `${paymentConversion}%`, `${paidParticipants}/${totalParticipants} participants verified`, paymentConversion >= 70 ? "green" : "yellow")}
              {analyticsCard("Profile completion", `${profileCompletionRate}%`, `${incompleteProfiles} profiles still incomplete`, profileCompletionRate >= 85 ? "green" : "yellow")}
              {analyticsCard("Project submission", `${submissionRate}%`, `${submittedTeams}/${totalTeams} teams have submitted`, submissionRate >= 60 ? "green" : "red")}
              {analyticsCard("Team verification", `${fullTeamVerificationRate}%`, `${fullyVerifiedTeams}/${totalTeams} teams fully paid`, fullTeamVerificationRate >= 70 ? "green" : "yellow")}
              {analyticsCard("Average team size", averageTeamSize.toFixed(1), `${totalTeamMembers} assigned team members`, "blue")}
              {analyticsCard("Winner teams", winnerTeams, "Marked by admin console", "purple")}
              {analyticsCard("Resume coverage", `${totalParticipants ? Math.round((participantsWithResume / totalParticipants) * 100) : 0}%`, `${participantsWithResume} participants uploaded resumes`, "blue")}
              {analyticsCard("Profile links", `${participantsWithGithub}/${participantsWithLinkedIn}`, "GitHub / LinkedIn coverage", "blue")}
            </section>

            <section
              className="admin-analytics-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 16,
              }}
            >
              {barList("Payment Status", paymentAnalytics)}
              {barList("Profile Status", profileAnalytics)}
              {barList("Submission Status", submissionAnalytics)}
            </section>

            <section
              className="admin-analytics-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 16,
              }}
            >
              {barList("Track Health", trackAnalytics.map((track) => ({
                label: track.label,
                value: track.participants,
                meta: `participants · ${track.teams} teams · ${track.verified} verified`,
              })))}
              {barList("Team Size Distribution", teamSizeAnalytics)}
              {barList("Top Colleges", collegeAnalytics)}
              {barList("Top Courses", courseAnalytics)}
              {barList("Graduating Years", yearAnalytics)}
              {barList("Registrations: Last 7 Days", registrationTrend)}
            </section>

            <section
              className="admin-analytics-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: 16,
              }}
            >
              {attentionList("Incomplete Profiles", needsAttention.incomplete, (p) => p.full_name || p.email || "Unnamed participant", (p) => `${p.phone || "No phone"} · ${p.college || "No college"}`, "All profiles are complete.")}
              {attentionList("Pending Payments", needsAttention.unverified, (p) => p.full_name || p.email || "Unnamed participant", (p) => `${p.pass_code || "No pass"} · ${p.course || "No course"}`, "No completed profile is waiting on payment.")}
              {attentionList("Teams Missing Submission", needsAttention.teamsMissingSubmission, (team) => team.name, (team) => `${trackLabel(team.track)} · ${(team.team_members || []).length}/5 members`, "Every team has submitted a project.")}
              {attentionList("Teams Not Fully Verified", needsAttention.teamsNotFullyVerified, (team) => team.name, (team) => {
                const verified = (team.team_members || []).filter(
                  (member: any) =>
                    participantByUserId.get(member.user_id)?.payment_status ===
                    "paid",
                ).length;
                return `${verified}/${(team.team_members || []).length} verified`;
              }, "Every team is fully verified.")}
            </section>
          </div>
        )}

        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            display: activeTab === "analytics" ? "none" : "block",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "16px 24px",
              borderBottom: "1px solid #e5e7eb",
              background: "#f9fafb",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 600,
                color: "#111827",
              }}
            >
              {activeTab === "teams"
                ? `Teams Directory (${totalTeams})`
                : `Participants Directory (${totalParticipants})`}
            </h3>
          </div>

          <div style={{ overflowX: "auto" }}>
            {/* ────── TEAMS TAB ────── */}
            {activeTab === "teams" && (
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 14,
                }}
              >
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    {[
                      "Team / Track",
                      "Members",
                      "Submission",
                      "Status Progress",
                      "Winner",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 16px",
                          textAlign: "left",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teams.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          padding: "32px 16px",
                          textAlign: "center",
                          color: "#9ca3af",
                        }}
                      >
                        No teams registered yet.
                      </td>
                    </tr>
                  )}
                  {teams.map((t, i) => (
                    <tr
                      key={t.id}
                      style={{
                        borderBottom: "1px solid #f3f4f6",
                        background: i % 2 === 0 ? "#fff" : "#fafafa",
                      }}
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 600 }}>{t.name}</div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#6b7280",
                            marginTop: 2,
                          }}
                        >
                          {t.track} · {t.pass_code}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {t.team_members.map((m: any) => (
                          <div key={m.id} style={{ fontSize: 13 }}>
                            {m.full_name}{" "}
                            <span style={{ color: "#9ca3af", fontSize: 11 }}>
                              ({m.role})
                            </span>
                            <span style={{ marginLeft: 6 }}>
                              {badge(
                                statusLabel(
                                  participantByUserId.get(m.user_id)
                                    ?.payment_status,
                                ),
                                participantByUserId.get(m.user_id)
                                  ?.payment_status === "paid"
                                  ? "green"
                                  : "yellow",
                              )}
                            </span>
                          </div>
                        ))}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: t.submissions?.[0] ? "#111827" : "#9ca3af",
                          fontSize: 13,
                        }}
                      >
                        {t.submissions?.[0]?.title ?? "—"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {(() => {
                          const paidCount = t.team_members.filter(
                            (m: any) =>
                              participantByUserId.get(m.user_id)
                                ?.payment_status === "paid",
                          ).length;
                          const total = t.team_members.length;
                          return badge(
                            `${paidCount}/${total} verified`,
                            total > 0 && paidCount === total
                              ? "green"
                              : "yellow",
                          );
                        })()}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {t.is_winner ? (
                          badge("Winner", "blue")
                        ) : (
                          <span style={{ color: "#9ca3af" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div
                          style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
                        >
                          {btn(
                            t.is_winner ? "Revoke Winner" : "Make Winner",
                            () => toggleWinner(t),
                            t.is_winner ? "gray" : "blue",
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* ────── PARTICIPANTS TAB ────── */}
            {activeTab === "participants" && (
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 14,
                }}
              >
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    {[
                      "Name & Contact",
                      "Institution",
                      "Course",
                      "Profile",
                      "Payment",
                      "Individual Pass Code",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 16px",
                          textAlign: "left",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {participants.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          padding: "32px 16px",
                          textAlign: "center",
                          color: "#9ca3af",
                        }}
                      >
                        No participants yet.
                      </td>
                    </tr>
                  )}
                  {participants.map((p, i) => (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: "1px solid #f3f4f6",
                        background: i % 2 === 0 ? "#fff" : "#fafafa",
                      }}
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 600 }}>
                          {p.full_name || "Anonymous"}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#6b7280",
                            marginTop: 2,
                          }}
                        >
                          {p.phone || "—"}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13 }}>
                        {p.college || "—"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontSize: 13 }}>{p.course || "—"}</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>
                          {p.year_of_study || ""}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {badge(
                          p.is_complete ? "Complete" : "Incomplete",
                          p.is_complete ? "green" : "red",
                        )}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {badge(
                          statusLabel(p.payment_status),
                          p.payment_status === "paid" ? "green" : "yellow",
                        )}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontFamily: "ui-monospace, SFMono-Regular, monospace",
                          fontSize: 13,
                        }}
                      >
                        {p.pass_code || "—"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div
                          style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
                        >
                          {p.payment_status !== "paid"
                            ? btn(
                                "Mark Verified",
                                () => setParticipantPaymentStatus(p.id, "paid"),
                                "green",
                              )
                            : btn(
                                "Mark Unverified",
                                () =>
                                  setParticipantPaymentStatus(p.id, "unpaid"),
                                "yellow",
                              )}
                          {btn(
                            "View Details",
                            () => setSelectedParticipant(p),
                            "blue",
                          )}
                          {btn(
                            "Delete",
                            () => beginDeleteParticipant(p),
                            "red",
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* ── Participant Detail Modal ── */}
      {selectedParticipant && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedParticipant(null);
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              maxWidth: 680,
              width: "100%",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                  {selectedParticipant.full_name || "Participant"}
                </h3>
                <p
                  style={{ margin: "2px 0 0", fontSize: 13, color: "#6b7280" }}
                >
                  {selectedParticipant.college || ""}{" "}
                  {selectedParticipant.course
                    ? `· ${selectedParticipant.course}`
                    : ""}
                </p>
              </div>
              <button
                onClick={() => setSelectedParticipant(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 22,
                  color: "#6b7280",
                  lineHeight: 1,
                  padding: 4,
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ overflowY: "auto", padding: "24px", flex: 1 }}>
              {/* Personal */}
              <section style={{ marginBottom: 24 }}>
                <h4
                  style={{
                    margin: "0 0 12px",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Personal Information
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                    background: "#f9fafb",
                    borderRadius: 8,
                    padding: 16,
                  }}
                >
                  {[
                    ["Status", statusLabel(selectedParticipant.payment_status)],
                    ["Individual Pass Code", selectedParticipant.pass_code],
                    ["Phone", selectedParticipant.phone],
                    ["Date of Birth", selectedParticipant.dob],
                    [
                      "Dietary Restrictions",
                      selectedParticipant.dietary_restrictions,
                    ],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#9ca3af",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          marginBottom: 4,
                        }}
                      >
                        {label}
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          color: value ? "#111827" : "#9ca3af",
                        }}
                      >
                        {value || "—"}
                      </div>
                    </div>
                  ))}
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#9ca3af",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        marginBottom: 4,
                      }}
                    >
                      Address
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        color: selectedParticipant.address
                          ? "#111827"
                          : "#9ca3af",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {selectedParticipant.address || "—"}
                    </div>
                  </div>
                </div>
              </section>

              {/* Academic */}
              <section style={{ marginBottom: 24 }}>
                <h4
                  style={{
                    margin: "0 0 12px",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Academic Background
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 16,
                    background: "#f9fafb",
                    borderRadius: 8,
                    padding: 16,
                  }}
                >
                  {[
                    ["College", selectedParticipant.college],
                    ["Course / Stream", selectedParticipant.course],
                    ["Year / Batch", selectedParticipant.year_of_study],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#9ca3af",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          marginBottom: 4,
                        }}
                      >
                        {label}
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          color: value ? "#111827" : "#9ca3af",
                        }}
                      >
                        {value || "—"}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Links */}
              <section>
                <h4
                  style={{
                    margin: "0 0 12px",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Professional Links
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 12,
                  }}
                >
                  {[
                    {
                      label: "LinkedIn",
                      url: selectedParticipant.linkedin_url,
                      icon: "🔗",
                      color: "#0a66c2",
                      isResume: false,
                    },
                    {
                      label: "GitHub",
                      url: selectedParticipant.github_url,
                      icon: "🐙",
                      color: "#111827",
                      isResume: false,
                    },
                    {
                      label: "Resume (PDF)",
                      url: selectedParticipant.resume_url,
                      icon: "📄",
                      color: "#059669",
                      isResume: true,
                    },
                  ].map(({ label, url, icon, color, isResume }) => (
                    <div
                      key={label}
                      style={{
                        background: "#f9fafb",
                        borderRadius: 8,
                        padding: "12px 14px",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: "#9ca3af",
                          fontWeight: 600,
                          marginBottom: 8,
                        }}
                      >
                        {label}
                      </div>
                      {url ? (
                        isResume ? (
                          <button
                            onClick={() => openResume(url)}
                            style={{
                              fontSize: 13,
                              color,
                              textDecoration: "none",
                              fontWeight: 500,
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 0,
                            }}
                          >
                            {icon} Open Resume
                          </button>
                        ) : (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: 13,
                              color,
                              textDecoration: "none",
                              fontWeight: 500,
                            }}
                          >
                            {icon} Open {label}
                          </a>
                        )
                      ) : (
                        <span style={{ fontSize: 13, color: "#9ca3af" }}>
                          Not provided
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setSelectedParticipant(null)}
                style={{
                  padding: "8px 20px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  background: "#fff",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#374151",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 60,
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleteBusy) {
              setDeleteTarget(null);
            }
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 520,
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 24px 70px rgba(0,0,0,0.24)",
              border: "1px solid #fee2e2",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: 24, borderBottom: "1px solid #fee2e2" }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#b91c1c",
                  marginBottom: 8,
                }}
              >
                Delete participant
              </div>
              <h3 style={{ margin: 0, fontSize: 20, color: "#111827" }}>
                {deleteTarget.full_name || deleteTarget.email || "Participant"}
              </h3>
              <p style={{ margin: "8px 0 0", color: "#6b7280", fontSize: 14 }}>
                Step 1: type the participant name exactly. Step 2: confirm the
                browser warning. This permanently removes the auth account and
                cascades their profile and team membership.
              </p>
            </div>
            <div style={{ padding: 24 }}>
              <label
                htmlFor="delete-confirm"
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "#6b7280",
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                Type: {deleteTarget.full_name || deleteTarget.email || "DELETE"}
              </label>
              <input
                id="delete-confirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                disabled={deleteBusy}
                style={{
                  width: "100%",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  padding: "10px 12px",
                  fontSize: 14,
                  color: "#111827",
                  outline: "none",
                }}
              />
            </div>
            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
              }}
            >
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleteBusy}
                style={{
                  padding: "8px 16px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  background: "#fff",
                  cursor: deleteBusy ? "not-allowed" : "pointer",
                  color: "#374151",
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteParticipant}
                disabled={deleteBusy}
                style={{
                  padding: "8px 16px",
                  border: "1px solid #dc2626",
                  borderRadius: 6,
                  background: "#dc2626",
                  cursor: deleteBusy ? "not-allowed" : "pointer",
                  color: "#fff",
                  fontWeight: 600,
                }}
              >
                {deleteBusy ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Communications Tab ── */}
      {activeTab === "comms" && (
        <div style={{ display: "grid", gap: 24 }}>
          {/* Compose Card */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 24,
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <h3 style={{ margin: "0 0 20px", fontSize: 17, fontWeight: 700 }}>
              Compose Bulk Email
            </h3>
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: 6,
                  }}
                >
                  Subject
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="e.g. Important Update — Catalyst 2K26"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: 6,
                  }}
                >
                  Body (HTML supported — use {"{{name}}"} for personalization)
                </label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={10}
                  placeholder="<p>Hi {{name}},</p>\n<p>We have an exciting update...</p>"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    fontSize: 14,
                    fontFamily: "monospace",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#374151",
                      marginBottom: 6,
                    }}
                  >
                    Target Audience
                  </label>
                  <select
                    value={emailTarget}
                    onChange={(e) => setEmailTarget(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: "1px solid #d1d5db",
                      borderRadius: 8,
                      fontSize: 14,
                      background: "#fff",
                    }}
                  >
                    <option value="all">All Participants</option>
                    <option value="verified">Verified (Paid) Only</option>
                    <option value="unverified">Unverified Only</option>
                    <option value="complete">Complete Profiles Only</option>
                    <option value="track">Specific Track</option>
                  </select>
                </div>
                {emailTarget === "track" && (
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#374151",
                        marginBottom: 6,
                      }}
                    >
                      Track
                    </label>
                    <select
                      value={emailTrack}
                      onChange={(e) => setEmailTrack(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        border: "1px solid #d1d5db",
                        borderRadius: 8,
                        fontSize: 14,
                        background: "#fff",
                      }}
                    >
                      <option value="healthcare">Healthcare</option>
                      <option value="fintech">Fintech</option>
                      <option value="sustainability">Sustainability</option>
                      <option value="education">Education</option>
                      <option value="open">Open</option>
                    </select>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <button
                  disabled={emailSending || !emailSubject.trim() || !emailBody.trim()}
                  onClick={async () => {
                    if (!session?.access_token) {
                      toast.error("Please sign in again.");
                      return;
                    }
                    const confirm = window.confirm(
                      `Send "${emailSubject}" to ${emailTarget === "track" ? emailTrack + " track" : emailTarget} participants?`,
                    );
                    if (!confirm) return;
                    setEmailSending(true);
                    try {
                      const result = await createEmailCampaignFn({
                        data: {
                          adminAccessToken: session.access_token,
                          subject: emailSubject,
                          bodyHtml: emailBody,
                          targetFilter: {
                            type: emailTarget as any,
                            ...(emailTarget === "track"
                              ? { track: emailTrack as any }
                              : {}),
                          },
                        },
                      });
                      if (result.campaignId) {
                        toast.success(
                          `Campaign queued! ${result.totalCount} emails will be sent.`,
                        );
                        setEmailSubject("");
                        setEmailBody("");
                        await refreshCampaigns();
                      } else {
                        toast.info(result.message || "No recipients found.");
                      }
                    } catch (err: any) {
                      toast.error(err?.message || "Failed to create campaign.");
                    } finally {
                      setEmailSending(false);
                    }
                  }}
                  style={{
                    padding: "10px 24px",
                    borderRadius: 8,
                    border: "none",
                    background:
                      emailSending || !emailSubject.trim() || !emailBody.trim()
                        ? "#9ca3af"
                        : "#2563eb",
                    color: "#fff",
                    cursor:
                      emailSending || !emailSubject.trim() || !emailBody.trim()
                        ? "not-allowed"
                        : "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {emailSending ? "Queuing..." : "Queue Emails"}
                </button>
                <button
                  disabled={processingEmails}
                  onClick={async () => {
                    if (!session?.access_token) {
                      toast.error("Please sign in again.");
                      return;
                    }
                    setProcessingEmails(true);
                    try {
                      const result = await triggerEmailProcessingFn({
                        data: { adminAccessToken: session.access_token },
                      });
                      toast.success(
                        `Processed ${result.processed} emails (${result.sent} sent, ${result.failed} failed).`,
                      );
                      await refreshCampaigns();
                    } catch (err: any) {
                      toast.error(
                        err?.message || "Failed to process email queue.",
                      );
                    } finally {
                      setProcessingEmails(false);
                    }
                  }}
                  style={{
                    padding: "10px 24px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    background: processingEmails ? "#f3f4f6" : "#fff",
                    color: "#374151",
                    cursor: processingEmails ? "not-allowed" : "pointer",
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  {processingEmails
                    ? "Processing..."
                    : "Process Queue Now (50 max)"}
                </button>
              </div>
            </div>
          </div>

          {/* Email Preview */}
          {emailBody.trim() && (
            <div
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 24,
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
            >
              <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>
                Preview
              </h3>
              <div
                style={{
                  background: "#000",
                  border: "1px solid #331111",
                  borderRadius: 8,
                  padding: 24,
                  color: "#ccc",
                  fontFamily: "Georgia, serif",
                  fontSize: 15,
                  lineHeight: 1.7,
                  maxHeight: 400,
                  overflowY: "auto",
                }}
                dangerouslySetInnerHTML={{ __html: emailBody }}
              />
            </div>
          )}

          {/* Campaign History */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid #e5e7eb",
                background: "#f9fafb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
                Campaign History
              </h3>
              <button
                onClick={async () => {
                  if (!session?.access_token) return;
                  try {
                    await refreshCampaigns();
                    toast.success("Campaigns refreshed.");
                  } catch {
                    toast.error("Failed to load campaigns.");
                  }
                }}
                style={{
                  padding: "6px 14px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  background: "#fff",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                Refresh
              </button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 14,
                }}
              >
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    {["Subject", "Target", "Status", "Progress", "Created", "Actions"].map(
                      (h) => (
                        <th
                          key={h}
                          style={{
                            padding: "10px 16px",
                            textAlign: "left",
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#6b7280",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            borderBottom: "1px solid #e5e7eb",
                          }}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {campaigns.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          padding: "32px 16px",
                          textAlign: "center",
                          color: "#9ca3af",
                        }}
                      >
                        No campaigns yet. Click "Refresh" to load.
                      </td>
                    </tr>
                  ) : (
                    campaigns.map((c: any) => (
                      <tr
                        key={c.id}
                        style={{ borderBottom: "1px solid #f3f4f6" }}
                      >
                        <td
                          style={{
                            padding: "12px 16px",
                            fontWeight: 600,
                            maxWidth: 280,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {c.subject}
                        </td>
                        <td style={{ padding: "12px 16px", color: "#6b7280" }}>
                          {emailTargetLabel(c.target_filter)}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {badge(
                            c.status,
                            campaignStatusTone(c.status),
                          )}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            fontFamily: "monospace",
                          }}
                        >
                          {c.sent_count}/{c.total_count}
                          {(c.failed_count ?? 0) > 0
                            ? ` (${c.failed_count} stopped/failed)`
                            : ""}
                        </td>
                        <td style={{ padding: "12px 16px", color: "#6b7280" }}>
                          {new Date(c.created_at).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {canTerminateCampaign(c) ? (
                            <button
                              disabled={terminatingCampaignId === c.id}
                              onClick={async () => {
                                if (!session?.access_token) {
                                  toast.error("Please sign in again.");
                                  return;
                                }
                                const confirmed = window.confirm(
                                  `Terminate "${c.subject}"? Pending emails will be stopped and cannot be resumed.`,
                                );
                                if (!confirmed) return;

                                setTerminatingCampaignId(c.id);
                                try {
                                  const result = await terminateEmailCampaignFn({
                                    data: {
                                      adminAccessToken: session.access_token,
                                      campaignId: c.id,
                                    },
                                  });
                                  toast.success(
                                    `Campaign terminated. ${result.pendingCancelled} pending emails stopped.`,
                                  );
                                  await refreshCampaigns();
                                } catch (err: any) {
                                  toast.error(
                                    err?.message || "Failed to terminate campaign.",
                                  );
                                } finally {
                                  setTerminatingCampaignId(null);
                                }
                              }}
                              style={{
                                padding: "6px 12px",
                                borderRadius: 6,
                                border: "1px solid #fecaca",
                                background:
                                  terminatingCampaignId === c.id
                                    ? "#f3f4f6"
                                    : "#fef2f2",
                                color: "#b91c1c",
                                cursor:
                                  terminatingCampaignId === c.id
                                    ? "not-allowed"
                                    : "pointer",
                                fontSize: 13,
                                fontWeight: 600,
                              }}
                            >
                              {terminatingCampaignId === c.id
                                ? "Terminating..."
                                : "Terminate"}
                            </button>
                          ) : (
                            <span style={{ color: "#9ca3af", fontSize: 13 }}>
                              -
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Settings Tab ── */}
      {activeTab === "settings" && (
        <div style={{ display: "grid", gap: 24 }}>
          <div
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 24,
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <h3 style={{ margin: "0 0 20px", fontSize: 17, fontWeight: 700 }}>
              Global Settings
            </h3>
            
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
              <div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#111827" }}>
                  Allow New Registrations
                </h4>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
                  When disabled, the registration page will display a message that slots are filled.
                </p>
              </div>
              
              <button
                disabled={settingsBusy}
                onClick={async () => {
                  if (!session?.access_token) return;
                  setSettingsBusy(true);
                  const newVal = !appSettings.registrationsOpen;
                  try {
                    await updateAppSettingsFn({
                      data: {
                        adminAccessToken: session.access_token,
                        settings: { registrationsOpen: newVal }
                      }
                    });
                    setAppSettings({ registrationsOpen: newVal });
                    toast.success(newVal ? "Registrations opened." : "Registrations closed.");
                  } catch (err: any) {
                    toast.error("Failed to update settings.");
                  } finally {
                    setSettingsBusy(false);
                  }
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: settingsBusy ? "not-allowed" : "pointer",
                  background: appSettings.registrationsOpen ? "#dc2626" : "#059669",
                  color: "#fff",
                  border: "none",
                  transition: "background 0.2s"
                }}
              >
                {settingsBusy ? "Updating..." : appSettings.registrationsOpen ? "Stop Registrations" : "Open Registrations"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 760px) {
          .admin-topbar {
            height: auto !important;
            min-height: 64px;
            flex-direction: column;
            align-items: stretch !important;
            gap: 12px;
            padding-top: 14px !important;
            padding-bottom: 14px !important;
          }
          .admin-main {
            padding: 20px 12px 32px !important;
          }
          .admin-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 10px !important;
          }
          .admin-stats > div {
            padding: 14px !important;
          }
          .admin-stats > div > div:last-child {
            font-size: 24px !important;
          }
          .admin-analytics-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
