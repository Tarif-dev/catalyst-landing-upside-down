/**
 * Cron endpoint for processing queued bulk emails.
 *
 * GET or POST /api/cron/process-emails?secret=<CRON_SECRET>
 *
 * Processes up to 50 pending email jobs per invocation.
 * Designed to be pinged by cron-job.org, GitHub Actions, or manually
 * from the admin panel.
 */
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { createClient } from "@supabase/supabase-js";
import { sendMail } from "@/lib/gmail";
import { prepareBulkMailContent } from "@/lib/bulk-email-content";

const BATCH_SIZE = 50;

function adminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service role not configured.");
  return createClient(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

async function processEmails() {
  const supa = adminClient();

  // Grab pending jobs with their campaign data
  const { data: jobs, error } = await supa
    .from("email_jobs")
    .select("id, recipient_email, recipient_name, campaign_id, email_campaigns(subject, body, status)")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error("[Cron] Failed to fetch jobs:", error);
    return { processed: 0, error: error.message };
  }

  if (!jobs || jobs.length === 0) {
    return { processed: 0, message: "No pending jobs." };
  }

  let sentCount = 0;
  let failedCount = 0;

  for (const job of jobs) {
    const campaign = (job as any).email_campaigns;
    if (!campaign) {
      await supa
        .from("email_jobs")
        .update({ status: "failed", error_msg: "Campaign not found" } as any)
        .eq("id", job.id);
      failedCount++;
      continue;
    }

    if (["terminated", "cancelled", "canceled"].includes(campaign.status)) {
      await supa
        .from("email_jobs")
        .update({ status: "failed", error_msg: "Campaign terminated" } as any)
        .eq("id", job.id);
      failedCount++;
      continue;
    }

    try {
      // Personalize the body: replace {{name}} with recipient name
      let personalizedHtml = campaign.body || "";
      if (job.recipient_name) {
        personalizedHtml = personalizedHtml.replace(
          /\{\{name\}\}/gi,
          job.recipient_name,
        );
      }

      await sendMail({
        to: job.recipient_email,
        subject: campaign.subject,
        ...prepareBulkMailContent(personalizedHtml),
        includeDefaultAttachments: false,
      });

      await supa
        .from("email_jobs")
        .update({ status: "sent", sent_at: new Date().toISOString() } as any)
        .eq("id", job.id);

      sentCount++;
    } catch (err: any) {
      console.error(
        `[Cron] Failed to send to ${job.recipient_email}:`,
        err.message,
      );
      await supa
        .from("email_jobs")
        .update({ status: "failed", error_msg: err.message?.slice(0, 500) } as any)
        .eq("id", job.id);
      failedCount++;
    }
  }

  // Update campaign sent_count for each campaign
  const campaignIds = [...new Set(jobs.map((j) => j.campaign_id))];
  for (const cid of campaignIds) {
    const { data: campaign } = await supa
      .from("email_campaigns")
      .select("status")
      .eq("id", cid)
      .maybeSingle();

    if (["terminated", "cancelled", "canceled"].includes((campaign as any)?.status)) {
      continue;
    }

    const { count: pendingJobs } = await supa
      .from("email_jobs")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", cid)
      .eq("status", "pending");

    const newStatus =
      (pendingJobs ?? 0) === 0 ? "completed" : "processing";

    await supa
      .from("email_campaigns")
      .update({ status: newStatus } as any)
      .eq("id", cid);
  }

  return { processed: jobs.length, sent: sentCount, failed: failedCount };
}

export const APIRoute = createAPIFileRoute("/api/cron/process-emails")({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const secret = url.searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && secret !== cronSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await processEmails();
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },

  POST: async ({ request }) => {
    const url = new URL(request.url);
    const secret = url.searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && secret !== cronSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await processEmails();
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
});
