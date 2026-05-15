import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import { PortalShell } from "@/components/PortalShell";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/update-password")({
  head: () => ({ meta: [{ title: "Update Password — Catalyst 2K26" }] }),
  component: UpdatePasswordPage,
});

const schema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

function UpdatePasswordPage() {
  const { session, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // We wait briefly for the session to be established via the hash fragment by Supabase
    if (!authLoading) {
      setIsInitializing(false);
      // If after loading there is no session, we shouldn't be on this page
      if (!session) {
        toast.error("Invalid or expired password reset link.");
        nav({ to: "/login" });
      }
    }
  }, [authLoading, session, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });
    setLoading(false);
    
    if (error) {
      toast.error(error.message || "Failed to update password.");
      return;
    }
    
    toast.success("Password updated successfully.", {
      description: "Your gate access has been restored.",
    });
    
    // Redirect to dashboard since they are now authenticated
    nav({ to: "/dashboard" });
  };

  if (isInitializing) {
    return (
      <PortalShell title="Verifying Access">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blood" />
        </div>
      </PortalShell>
    );
  }

  // Double check session to prevent rendering the form if it was missed
  if (!session) return null;

  return (
    <PortalShell title="New Password">
      <div className="mx-auto max-w-md">
        <form onSubmit={submit} className="panel p-8 sm:p-10 space-y-6">
          <p className="text-center font-serif text-sm text-bone/70 mb-6">
            Enter a new password for your account. Make it strong.
          </p>

          <div>
            <label
              htmlFor="password"
              className="block font-mono text-[10px] uppercase tracking-[0.4em] text-blood/90 mb-2"
            >
              New Password{" "}
              <span className="text-bone/40 normal-case tracking-normal">
                (min 8)
              </span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPw ? "text" : "password"}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-styled pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center px-4 text-bone/50 hover:text-blood transition-colors"
              >
                {showPw ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block font-mono text-[10px] uppercase tracking-[0.4em] text-blood/90 mb-2"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showPw ? "text" : "password"}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-styled pr-12"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !password || !confirmPassword}
            className="btn-primary w-full flex items-center justify-center gap-3 mt-4"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>
    </PortalShell>
  );
}
