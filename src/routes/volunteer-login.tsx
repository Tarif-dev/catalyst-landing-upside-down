import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/volunteer-login")({
  head: () => ({ meta: [{ title: "Volunteer Login — Catalyst 2K26" }] }),
  component: VolunteerLogin,
});

function VolunteerLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const { session } = useAuth();

  useEffect(() => {
    if (session) {
      nav({ to: "/volunteer" });
    }
  }, [session, nav]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // Check if they are a volunteer or admin
    const userId = data.user.id;

    const [volunteerRes, adminRes] = await Promise.all([
      supabase
        .from("volunteers" as any)
        .select("id")
        .eq("id", userId)
        .maybeSingle(),
      supabase.from("admins").select("id").eq("id", userId).maybeSingle(),
    ]);

    if (!volunteerRes.data && !adminRes.data) {
      toast.error("Unauthorized. You are not a registered volunteer.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    toast.success("Welcome, Volunteer!");
    nav({ to: "/volunteer" });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "48px 16px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 9999,
              background: "rgba(99, 102, 241, 0.15)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 16 }}>📷</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#a5b4fc",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Volunteer Scanner
            </span>
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "-0.01em",
            }}
          >
            Catalyst 2K26
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "rgba(255,255,255,0.5)" }}>
            Sign in to access the QR scanner
          </p>
        </div>

        {/* Form Card */}
        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16,
            padding: 32,
          }}
        >
          <form
            onSubmit={handleLogin}
            style={{ display: "grid", gap: 16, textAlign: "left" }}
          >
            <div>
              <label
                htmlFor="vol-email"
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.6)",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Email
              </label>
              <input
                id="vol-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.08)",
                  color: "#fff",
                  fontSize: 15,
                  outline: "none",
                  transition: "border-color 0.15s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#6366f1"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
              />
            </div>

            <div>
              <label
                htmlFor="vol-password"
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.6)",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Password
              </label>
              <input
                id="vol-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.08)",
                  color: "#fff",
                  fontSize: 15,
                  outline: "none",
                  transition: "border-color 0.15s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#6366f1"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "13px 24px",
                borderRadius: 10,
                border: "none",
                background: loading
                  ? "rgba(99, 102, 241, 0.4)"
                  : "linear-gradient(135deg, #6366f1, #4f46e5)",
                color: "#fff",
                fontSize: 15,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                marginTop: 4,
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <p style={{ marginTop: 20, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
          Contact an admin to get volunteer access.
        </p>
      </div>
    </div>
  );
}
