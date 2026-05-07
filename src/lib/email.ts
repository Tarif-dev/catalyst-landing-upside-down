/**
 * Server functions for sending lifecycle emails via Gmail SMTP.
 *
 * All four functions run exclusively on the server (TanStack Start server fns)
 * and use the Nodemailer Gmail transport defined in ./gmail.ts.
 *
 *   1. sendWelcomeEmail       – after onboarding form completion
 *   2. sendPaymentInfoEmail   – when participant requests payment details
 *   3. sendPaymentConfirmedEmail – when admin marks participant as "paid"
 *   4. sendCongratulationsEmail  – sent together with #3
 */

import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { sendMail } from "@/lib/gmail";
import {
  getWelcomeEmailTemplate,
  getPaymentInfoEmailTemplate,
  getPaymentConfirmedEmailTemplate,
  getCongratulationsEmailTemplate,
} from "@/lib/email-templates";
import type { Database } from "@/integrations/supabase/types";

/* ── helpers ───────────────────────────────────────────────── */

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string) {
  const now = Date.now();
  const current = attempts.get(key);

  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  if (current.count >= MAX_PER_WINDOW) {
    throw new Error("Too many email attempts. Please try again later.");
  }
  current.count += 1;
}

function requestOrigin() {
  const request = getRequest();
  if (!request) return process.env.PUBLIC_SITE_URL ?? "http://localhost:3000";
  return new URL(request.url).origin;
}

function paymentUpiId() {
  const upiId = process.env.UPI_ID;
  if (!upiId) throw new Error("UPI_ID is not configured.");
  return upiId;
}

/** Create a Supabase client authenticated as the calling user. */
function authedClient(accessToken: string) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase not configured.");

  return createClient<Database>(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/** Create a Supabase admin client using the service-role key. */
function adminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service role not configured.");

  return createClient<Database>(url, key, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/* ── 1. Welcome Email ──────────────────────────────────────── */

export const sendWelcomeEmail = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string().min(20) }))
  .handler(async ({ data }) => {
    const supabase = authedClient(data.accessToken);

    const { data: userData, error } = await supabase.auth.getUser(
      data.accessToken,
    );
    if (error || !userData.user?.email) {
      throw new Error("You must be signed in to request a welcome email.");
    }

    const email = userData.user.email;
    checkRateLimit(`welcome:${userData.user.id}`);

    const dashboardUrl = new URL("/dashboard", requestOrigin()).toString();

    try {
      await sendMail({
        to: email,
        subject: "Welcome to Catalyst 2K26 🌌",
        html: getWelcomeEmailTemplate(dashboardUrl),
      });
      return { sent: true, skipped: false };
    } catch (err: any) {
      console.error("[Email] Welcome email failed:", err.message);
      return { sent: false, skipped: true };
    }
  });

/* ── 2. Payment Info Email ─────────────────────────────────── */

export const sendPaymentInfoEmail = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string().min(20) }))
  .handler(async ({ data }) => {
    const supabase = authedClient(data.accessToken);

    const { data: userData, error } = await supabase.auth.getUser(
      data.accessToken,
    );
    if (error || !userData.user?.email) {
      throw new Error("You must be signed in.");
    }

    const userId = userData.user.id;
    const email = userData.user.email;
    checkRateLimit(`payment-info:${userId}`);

    // Fetch participant profile for name + pass code
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, pass_code")
      .eq("user_id", userId)
      .maybeSingle();

    const dashboardUrl = new URL("/dashboard", requestOrigin()).toString();

    await sendMail({
      to: email,
      subject: "💳 Payment Instructions — Catalyst 2K26",
      html: getPaymentInfoEmailTemplate({
        participantName: profile?.full_name || "",
        passCode: profile?.pass_code || "N/A",
        dashboardUrl,
        upiId: paymentUpiId(),
      }),
    });

    return { sent: true };
  });

/* ── 3 + 4. Payment Confirmed + Congratulations ───────────── */

/**
 * Called from the admin panel when marking a participant as "paid".
 * Sends both the confirmation and congratulations emails in sequence.
 *
 * Uses the service-role key so the admin can trigger emails for any user.
 */
export const setParticipantPaymentStatus = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      adminAccessToken: z.string().min(20),
      participantProfileId: z.string().uuid(),
      paymentStatus: z.enum(["unpaid", "paid"]),
    }),
  )
  .handler(async ({ data }) => {
    // Verify caller is an admin
    const callerSupa = authedClient(data.adminAccessToken);
    const { data: callerUser, error: callerErr } =
      await callerSupa.auth.getUser(data.adminAccessToken);
    if (callerErr || !callerUser.user) {
      throw new Error("Unauthorized.");
    }

    const supa = adminClient();

    // Check admin status
    const { data: adminRow } = await supa
      .from("admins")
      .select("id")
      .eq("id", callerUser.user.id)
      .maybeSingle();
    if (!adminRow) throw new Error("Unauthorized: not an admin.");

    const { data: profile, error: updateErr } = await supa
      .from("profiles")
      .update({ payment_status: data.paymentStatus })
      .eq("id", data.participantProfileId)
      .select("id, user_id, full_name, pass_code, payment_status")
      .maybeSingle();
    if (updateErr) throw updateErr;
    if (!profile) throw new Error("Participant not found.");

    if (data.paymentStatus !== "paid") {
      return { sent: false, skipped: true, profile };
    }

    // Get participant email from auth
    const { data: authData } = await supa.auth.admin.getUserById(
      profile.user_id,
    );
    const participantEmail = authData?.user?.email;
    if (!participantEmail) {
      console.warn(
        `[Email] Cannot send payment emails — no email for user ${profile.user_id}`,
      );
      return { sent: false, reason: "no-email", profile };
    }

    // Fetch team info for congratulations email
    const { data: teamMember } = await supa
      .from("team_members")
      .select("team_id, teams(name, track)")
      .eq("user_id", profile.user_id)
      .maybeSingle();

    const team = (teamMember as any)?.teams ?? null;
    const origin = requestOrigin();
    const dashboardUrl = new URL("/dashboard", origin).toString();

    // Send both emails
    const results = await Promise.allSettled([
      sendMail({
        to: participantEmail,
        subject: "✅ Payment Confirmed — Catalyst 2K26",
        html: getPaymentConfirmedEmailTemplate({
          participantName: profile.full_name || "",
          passCode: profile.pass_code || "",
          dashboardUrl,
        }),
      }),
      sendMail({
        to: participantEmail,
        subject: "🎉 You're In! — Catalyst 2K26",
        html: getCongratulationsEmailTemplate({
          participantName: profile.full_name || "",
          teamName: team?.name,
          track: team?.track,
          dashboardUrl,
        }),
      }),
    ]);

    const allOk = results.every((r) => r.status === "fulfilled");
    if (!allOk) {
      const failures = results
        .filter((r) => r.status === "rejected")
        .map((r) => (r as PromiseRejectedResult).reason?.message || "Unknown");
      console.error("[Email] Some payment emails failed:", failures);
    }

    return { sent: allOk, email: participantEmail, profile };
  });

export const sendPaymentConfirmedEmails = setParticipantPaymentStatus;
