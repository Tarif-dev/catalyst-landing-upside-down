import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getWelcomeEmailTemplate } from "@/lib/email-template";
import type { Database } from "@/integrations/supabase/types";

const inputSchema = z.object({
  accessToken: z.string().min(20),
});

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 3;
const attempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string) {
  const now = Date.now();
  const current = attempts.get(key);

  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  if (current.count >= MAX_PER_WINDOW) {
    throw new Error("Too many welcome email attempts. Please try again later.");
  }

  current.count += 1;
}

function requestOrigin() {
  const request = getRequest();
  if (!request) return process.env.PUBLIC_SITE_URL ?? "http://localhost:3000";
  return new URL(request.url).origin;
}

export const sendWelcomeEmail = createServerFn({ method: "POST" })
  .inputValidator(inputSchema)
  .handler(async ({ data }) => {
    const apiKey = process.env.RESEND_API_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!apiKey) {
      return { sent: false, skipped: true };
    }

    if (!supabaseUrl || !supabasePublishableKey) {
      throw new Error("Email service is not configured.");
    }

    const supabase = createClient<Database>(
      supabaseUrl,
      supabasePublishableKey,
      {
        global: {
          headers: {
            Authorization: `Bearer ${data.accessToken}`,
          },
        },
        auth: {
          storage: undefined,
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    const { data: userData, error } = await supabase.auth.getUser(
      data.accessToken,
    );
    if (error || !userData.user?.email) {
      throw new Error("You must be signed in to request a welcome email.");
    }

    const request = getRequest();
    const forwardedFor = request?.headers
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim();
    const ip =
      forwardedFor ||
      request?.headers.get("cf-connecting-ip") ||
      request?.headers.get("x-real-ip") ||
      "unknown";
    const email = userData.user.email;

    checkRateLimit(`${ip}:${userData.user.id}:${email.toLowerCase()}`);

    const dashboardUrl = new URL("/dashboard", requestOrigin()).toString();
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from:
          process.env.RESEND_FROM_EMAIL ??
          "Catalyst 2K26 <onboarding@resend.dev>",
        to: email,
        subject: "Welcome to Catalyst 2K26",
        html: getWelcomeEmailTemplate(dashboardUrl),
      }),
    });

    if (!response.ok) {
      throw new Error("Welcome email could not be sent.");
    }

    return { sent: true, skipped: false };
  });
