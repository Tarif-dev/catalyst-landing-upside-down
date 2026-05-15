import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import { PortalShell } from "@/components/PortalShell";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset Password — Catalyst 2K26" }] }),
  component: ForgotPasswordPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    setLoading(false);
    
    if (error) {
      // Prevent email enumeration by showing a generic message for security
      // However, Supabase rate limits or specific errors can be shown.
      if (error.message.includes("rate limit")) {
        toast.error("Too many requests. Please try again later.");
      } else {
        toast.error("Failed to send reset link. Please try again.");
      }
      return;
    }
    
    setIsSuccess(true);
    toast.success("Reset link sent to your email.");
  };

  return (
    <PortalShell title="Reset Password">
      <div className="mx-auto max-w-md">
        <div className="panel p-8 sm:p-10">
          {isSuccess ? (
            <div className="text-center space-y-6">
              <h2 className="font-display text-2xl text-bone">Check your email</h2>
              <p className="font-serif text-base text-bone/70">
                We've sent a password reset link to <span className="text-bone font-medium">{email}</span>.
                Please check your spam folder if you don't see it.
              </p>
              <div className="pt-4">
                <Link to="/login" className="btn-secondary inline-flex px-8 py-3">
                  Return to sign in
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-6">
              <p className="text-center font-serif text-sm text-bone/70 mb-6">
                Enter the email associated with your team. We'll send you a link to securely reset your password.
              </p>
              <div>
                <label
                  htmlFor="email"
                  className="block font-mono text-[10px] uppercase tracking-[0.4em] text-blood/90 mb-2"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-styled"
                  placeholder="you@hawkins.lab"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="btn-primary w-full flex items-center justify-center gap-3 mt-4"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Transmitting…" : "Send Reset Link"}
              </button>

              <p className="text-center text-base font-serif italic text-bone/70 mt-6">
                Remembered your password?{" "}
                <Link
                  to="/login"
                  className="text-blood hover:text-glow-blood transition-all underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </PortalShell>
  );
}
