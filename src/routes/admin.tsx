import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  deleteParticipantAccount,
  setParticipantPaymentStatus as setParticipantPaymentStatusFn,
} from "@/lib/email";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Console — Catalyst 2K26" }] }),
  component: Admin,
});

type Tab = "teams" | "participants";

function Admin() {
  const { user, isAdmin, loading, session } = useAuth();
  const nav = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>("teams");
  const [teams, setTeams] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<any | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [busy, setBusy] = useState(true);
  const setParticipantPaymentStatusServer = useServerFn(
    setParticipantPaymentStatusFn,
  );
  const deleteParticipantAccountFn = useServerFn(deleteParticipantAccount);

  const load = async () => {
    const [teamsRes, participantsRes] = await Promise.all([
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
    ]);
    setTeams(teamsRes.data ?? []);
    setParticipants(participantsRes.data ?? []);
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

      toast.success(`Participant payment marked as ${payment_status}.`);
      if (payment_status === "paid") {
        if (result.sent) {
          toast.success("Confirmation emails sent to participant.");
        } else {
          toast.error("Payment marked, but email sending failed.");
        }
      }
    } catch (err: any) {
      console.error("Failed to update participant payment:", err);
      toast.error(err?.message || "Failed to update payment status.");
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
      "Team Name,Track,Team Code,Winner,Members,Paid Participants,Submission\n";
    teams.forEach((t) => {
      const members = t.team_members
        .map((m: any) => {
          const payment =
            participantByUserId.get(m.user_id)?.payment_status ?? "unpaid";
          return `${m.full_name}(${m.role}, ${payment})`;
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
      "Full Name,Phone,College,Course,Year,DOB,Address,LinkedIn,GitHub,Resume,Dietary,Profile Status,Payment Status,Pass Code\n";
    participants.forEach((p) => {
      csv += `"${p.full_name || ""}","${p.phone || ""}","${p.college || ""}","${p.course || ""}","${p.year_of_study || ""}","${p.dob || ""}","${(p.address || "").replace(/\n/g, " ")}","${p.linkedin_url || ""}","${p.github_url || ""}","${p.resume_url || ""}","${p.dietary_restrictions || ""}","${p.is_complete ? "Complete" : "Incomplete"}","${p.payment_status || "unpaid"}","${p.pass_code || ""}"\n`;
    });
    downloadCSV(csv, "catalyst-participants.csv");
  };

  /* ── Derived stats ── */
  const totalParticipants = participants.length;
  const totalTeams = teams.length;
  const paidParticipants = participants.filter(
    (p) => p.payment_status === "paid",
  ).length;
  const completeProfiles = participants.filter((p) => p.is_complete).length;

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
                activeTab === "teams"
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
              ↓ Export {activeTab === "teams" ? "Teams" : "Participants"} CSV
            </button>
          </div>
        </div>
      </nav>

      {/* ── Tabs ── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          {tabBtn("Teams Database", "teams")}
          {tabBtn("Individual Participants", "participants")}
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
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            marginBottom: 28,
          }}
        >
          {[
            { label: "Total Teams", value: totalTeams },
            { label: "Total Participants", value: totalParticipants },
            { label: "Paid Participants", value: paidParticipants },
            { label: "Complete Profiles", value: completeProfiles },
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
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
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
                      "Payment Progress",
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
                                participantByUserId.get(m.user_id)
                                  ?.payment_status ?? "unpaid",
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
                            `${paidCount}/${total} paid`,
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
                      "Pass Code",
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
                          p.payment_status || "unpaid",
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
                                "Mark Paid",
                                () => setParticipantPaymentStatus(p.id, "paid"),
                                "green",
                              )
                            : btn(
                                "Mark Unpaid",
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
                    ["Payment Status", selectedParticipant.payment_status],
                    ["Pass Code", selectedParticipant.pass_code],
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
        }
      `}</style>
    </div>
  );
}
