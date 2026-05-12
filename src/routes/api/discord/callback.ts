/**
 * Discord OAuth2 callback route.
 *
 * Discord redirects here after the user authorizes with:
 *   ?code=<authorization_code>&state=<user_id>
 *
 * This route calls the handleDiscordCallback server function, then
 * redirects back to /dashboard with a result query param.
 */
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { handleDiscordCallback } from "@/lib/discord";

export const APIRoute = createAPIFileRoute("/api/discord/callback")({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state"); // user_id
    const error = url.searchParams.get("error");

    const origin = url.origin;
    const dashboardUrl = new URL("/dashboard", origin);

    // User denied consent
    if (error) {
      dashboardUrl.searchParams.set("discord", "denied");
      return new Response(null, {
        status: 302,
        headers: { Location: dashboardUrl.toString() },
      });
    }

    if (!code || !state) {
      dashboardUrl.searchParams.set("discord", "error");
      return new Response(null, {
        status: 302,
        headers: { Location: dashboardUrl.toString() },
      });
    }

    try {
      const result = await handleDiscordCallback({
        data: {
          code,
          userId: state,
          redirectOrigin: origin,
        },
      });

      if (result.isInGuild) {
        dashboardUrl.searchParams.set("discord", "verified");
      } else {
        dashboardUrl.searchParams.set("discord", "not-in-server");
      }
    } catch (err: any) {
      console.error("[Discord Callback] Error:", err.message);
      dashboardUrl.searchParams.set("discord", "error");
    }

    return new Response(null, {
      status: 302,
      headers: { Location: dashboardUrl.toString() },
    });
  },
});
