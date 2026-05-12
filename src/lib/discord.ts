/**
 * Server functions for Discord OAuth2 guild-membership verification.
 *
 * Flow:
 *   1. Client calls getDiscordAuthUrl() → gets a redirect URL
 *   2. User authorises on Discord → redirected to /api/discord/callback?code=…
 *   3. Callback route calls handleDiscordCallback(code, userId)
 *      → exchanges code for token
 *      → fetches user guilds
 *      → checks for Catalyst guild
 *      → updates profiles table
 */

import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

/* ── env helpers ── */

function discordClientId() {
  const id = process.env.DISCORD_CLIENT_ID;
  if (!id) throw new Error("DISCORD_CLIENT_ID is not set.");
  return id;
}

function discordClientSecret() {
  const secret = process.env.DISCORD_CLIENT_SECRET;
  if (!secret) throw new Error("DISCORD_CLIENT_SECRET is not set.");
  return secret;
}

function discordGuildId() {
  const gid = process.env.DISCORD_GUILD_ID;
  if (!gid) throw new Error("DISCORD_GUILD_ID is not set.");
  return gid;
}

function adminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service role not configured.");
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

function authedClient(accessToken: string) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase not configured.");
  return createClient<Database>(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

const DISCORD_API = "https://discord.com/api/v10";

/* ── 1. Generate Discord OAuth2 consent URL ── */

export const getDiscordAuthUrl = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string().min(20),
      redirectOrigin: z.string().url(),
    }),
  )
  .handler(async ({ data }) => {
    // Verify user is logged in
    const supabase = authedClient(data.accessToken);
    const { data: userData, error } = await supabase.auth.getUser(
      data.accessToken,
    );
    if (error || !userData.user) {
      throw new Error("You must be signed in to connect Discord.");
    }

    const clientId = discordClientId();
    const redirectUri = `${data.redirectOrigin}/api/discord/callback`;
    const state = userData.user.id; // pass user ID in state for the callback

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "identify guilds",
      state,
      prompt: "consent",
    });

    return { url: `https://discord.com/oauth2/authorize?${params.toString()}` };
  });

/* ── 2. Handle the OAuth callback ── */

export const handleDiscordCallback = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      code: z.string().min(1),
      userId: z.string().uuid(),
      redirectOrigin: z.string().url(),
    }),
  )
  .handler(async ({ data }) => {
    const clientId = discordClientId();
    const clientSecret = discordClientSecret();
    const guildId = discordGuildId();
    const redirectUri = `${data.redirectOrigin}/api/discord/callback`;

    // Exchange code for access token
    const tokenRes = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code: data.code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("[Discord] Token exchange failed:", err);
      throw new Error("Discord authorization failed. Please try again.");
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Fetch Discord user info
    const userRes = await fetch(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      throw new Error("Failed to fetch Discord user info.");
    }

    const discordUser = await userRes.json();
    const discordId = discordUser.id;
    const discordUsername =
      discordUser.global_name || discordUser.username || "Unknown";

    // Fetch user's guilds
    const guildsRes = await fetch(`${DISCORD_API}/users/@me/guilds`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!guildsRes.ok) {
      throw new Error("Failed to fetch Discord guilds.");
    }

    const guilds: Array<{ id: string; name: string }> = await guildsRes.json();
    const isInGuild = guilds.some((g) => g.id === guildId);

    // Update profile in Supabase
    const supa = adminClient();
    const { error: updateErr } = await supa
      .from("profiles")
      .update({
        discord_id: discordId,
        discord_username: discordUsername,
        is_in_discord: isInGuild,
      } as any)
      .eq("user_id", data.userId);

    if (updateErr) {
      console.error("[Discord] Profile update failed:", updateErr);
      throw new Error("Failed to update Discord status.");
    }

    console.log(
      `[Discord] User ${data.userId} → discord:${discordUsername} (${discordId}), inGuild=${isInGuild}`,
    );

    return {
      discordId,
      discordUsername,
      isInGuild,
    };
  });
