import { createServerFn } from "@tanstack/start";
import { z } from "zod";
import { adminClient } from "@/integrations/supabase/client.server";
import { supabase } from "@/integrations/supabase/client";

export const getAppSettings = createServerFn({ method: "GET" }).handler(async () => {
  // Use adminClient to ensure it can always read
  const supa = adminClient();
  const { data, error } = await supa.storage.from("config").download("settings.json");
  if (error || !data) {
    // Return default settings if file doesn't exist
    return { registrationsOpen: true };
  }
  const text = await data.text();
  try {
    return JSON.parse(text) as { registrationsOpen: boolean };
  } catch {
    return { registrationsOpen: true };
  }
});

export const updateAppSettings = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      adminAccessToken: z.string().min(20),
      settings: z.object({
        registrationsOpen: z.boolean(),
      }),
    }),
  )
  .handler(async ({ data }) => {
    // 1. Verify admin
    const supa = adminClient();
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
