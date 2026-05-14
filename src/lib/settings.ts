import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export type AppSettings = {
  registrationsOpen: boolean;
  paymentRequestsOpen: boolean;
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  registrationsOpen: true,
  paymentRequestsOpen: true,
};

async function getAdminClient() {
  const { supabaseAdmin } =
    await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function normalizeAppSettings(value: unknown): AppSettings {
  if (!value || typeof value !== "object") return DEFAULT_APP_SETTINGS;

  const settings = value as Partial<AppSettings>;
  return {
    registrationsOpen:
      typeof settings.registrationsOpen === "boolean"
        ? settings.registrationsOpen
        : DEFAULT_APP_SETTINGS.registrationsOpen,
    paymentRequestsOpen:
      typeof settings.paymentRequestsOpen === "boolean"
        ? settings.paymentRequestsOpen
        : DEFAULT_APP_SETTINGS.paymentRequestsOpen,
  };
}

export async function readAppSettings(): Promise<AppSettings> {
  const adminClient = await getAdminClient();
  const { data, error } = await adminClient.storage
    .from("config")
    .download("settings.json");

  if (error || !data) {
    return DEFAULT_APP_SETTINGS;
  }

  try {
    return normalizeAppSettings(JSON.parse(await data.text()));
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

export const getAppSettings = createServerFn({ method: "GET" }).handler(
  async () => {
    return readAppSettings();
  },
);

export const updateAppSettings = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      adminAccessToken: z.string().min(20),
      settings: z.object({
        registrationsOpen: z.boolean(),
        paymentRequestsOpen: z.boolean(),
      }),
    }),
  )
  .handler(async ({ data }) => {
    // 1. Verify admin
    const supa = await getAdminClient();
    const { data: callerUser, error: callerErr } = await supabase.auth.getUser(
      data.adminAccessToken,
    );
    if (callerErr || !callerUser?.user) throw new Error("Unauthorized.");

    const { data: adminRow } = await supa
      .from("admins")
      .select("id")
      .eq("id", callerUser.user.id)
      .maybeSingle();

    if (!adminRow) throw new Error("Unauthorized: not an admin.");

    // 2. Upload to config bucket
    const { error: uploadError } = await supa.storage
      .from("config")
      .upload("settings.json", JSON.stringify(data.settings), {
        contentType: "application/json",
        upsert: true,
      });

    if (uploadError) {
      throw new Error("Failed to save settings.");
    }

    return { success: true, settings: data.settings };
  });
