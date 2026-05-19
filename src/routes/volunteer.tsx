import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { AdminScanner } from "@/components/AdminScanner";

export const Route = createFileRoute("/volunteer")({
  head: () => ({ meta: [{ title: "Volunteer Scanner — Catalyst 2K26" }] }),
  component: VolunteerPortal,
});

function VolunteerPortal() {
  const { user, loading, session, isAdmin } = useAuth();
  const nav = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      nav({ to: "/volunteer-login" });
      return;
    }

    // Check if volunteer or admin
    const check = async () => {
      if (isAdmin) {
        setAuthorized(true);
        setChecking(false);
        return;
      }

      const { data } = await supabase
        .from("volunteers" as any)
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        setAuthorized(true);
      } else {
        toast.error("Unauthorized. You are not a registered volunteer.");
        nav({ to: "/volunteer-login" });
      }
      setChecking(false);
    };

    check();
  }, [user, loading, isAdmin, nav]);

  if (loading || checking) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0f172a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            border: "3px solid rgba(99,102,241,0.2)",
            borderTopColor: "#6366f1",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f9fafb",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#111827",
      }}
    >
      {/* Top Bar */}
      <nav
        style={{
          background: "#fff",
          borderBottom: "1px solid #e5e7eb",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 640,
            margin: "0 auto",
            padding: "0 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: 56,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>📷</span>
            <div>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
                Catalyst Scanner
              </span>
              <span
                style={{
                  display: "inline-block",
                  marginLeft: 8,
                  padding: "2px 8px",
                  borderRadius: 9999,
                  fontSize: 10,
                  fontWeight: 700,
                  background: isAdmin ? "#dbeafe" : "#e0e7ff",
                  color: isAdmin ? "#1d4ed8" : "#4338ca",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {isAdmin ? "Admin" : "Volunteer"}
              </span>
            </div>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              nav({ to: "/volunteer-login" });
            }}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: "1px solid #e5e7eb",
              background: "#fff",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              color: "#6b7280",
            }}
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Scanner Content */}
      <main
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "24px 16px 64px",
        }}
      >
        {session?.access_token && (
          <AdminScanner accessToken={session.access_token} />
        )}
      </main>
    </div>
  );
}
