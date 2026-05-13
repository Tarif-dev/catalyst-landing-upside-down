import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { handleDiscordCallback } from "@/lib/discord";
import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PortalShell } from "@/components/PortalShell";

export const Route = createFileRoute("/api/discord/callback")({
  component: DiscordCallbackPage,
});

function DiscordCallbackPage() {
  const navigate = useNavigate();
  const handleDiscordCallbackFn = useServerFn(handleDiscordCallback);
  const processingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (processingRef.current) return;
    processingRef.current = true;

    const fn = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const error = url.searchParams.get("error");
      
      const dashboardUrl = "/dashboard";
      
      if (error) {
        navigate({ to: dashboardUrl, search: { discord: "denied" } as any });
        return;
      }
      if (!code || !state) {
        navigate({ to: dashboardUrl, search: { discord: "error" } as any });
        return;
      }

      try {
        const result = await handleDiscordCallbackFn({
          data: {
            code,
            userId: state,
            redirectOrigin: url.origin,
          },
        });
        if (result.isInGuild) {
          navigate({ to: dashboardUrl, search: { discord: "verified" } as any });
        } else {
          navigate({ to: dashboardUrl, search: { discord: "not-in-server" } as any });
        }
      } catch (err: any) {
        console.error("[Discord Callback] Error:", err.message);
        navigate({ to: dashboardUrl, search: { discord: "error" } as any });
      }
    };
    fn();
  }, [navigate, handleDiscordCallbackFn]);

  return (
    <PortalShell title="Verifying Discord...">
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <h2 className="mb-4 font-display text-3xl text-bone">
          Verifying Connection
        </h2>
        <p className="font-mono text-sm uppercase tracking-widest text-bone/60">
          Communicating with Discord...
        </p>
      </div>
    </PortalShell>
  );
}
