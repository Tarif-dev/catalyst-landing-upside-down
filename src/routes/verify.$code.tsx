import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/PortalShell";

export const Route = createFileRoute("/verify/$code")({
  head: () => ({ meta: [{ title: "Verify - Catalyst 2K26" }] }),
  component: VerifyPage,
});

function VerifyPage() {
  const { code } = Route.useParams();
  const [pass, setPass] = useState<any>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    supabase
      .rpc("verify_participant_pass", { p_code: code.toUpperCase() })
      .then(({ data }) => {
        setPass(data?.[0] ?? null);
        setBusy(false);
      });
  }, [code]);

  return (
    <PortalShell title="Pass Verification">
      {busy ? (
        <p className="text-bone/50">Checking the gate...</p>
      ) : pass ? (
        <div className="panel panel-blood p-8 max-w-md">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-cyan">
            Valid
          </p>
          <h2 className="mt-2 font-display text-3xl text-bone">
            {pass.participant_name || "Participant"}
          </h2>
          <p className="mt-2 font-serif italic text-bone/70">
            {pass.team_name || "No team assigned"}
          </p>
          <p className="mt-1 font-mono text-xs uppercase tracking-[0.3em] text-blood">
            {pass.track || "No track"}
          </p>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.3em] text-bone/50">
            Status - {pass.payment_status}
          </p>
        </div>
      ) : (
        <div className="panel p-8 max-w-md">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-blood">
            Invalid
          </p>
          <p className="mt-2 text-bone/60">
            No participant matches this pass code.
          </p>
        </div>
      )}
      <Link to="/" className="mt-6 inline-block text-blood underline">
        Back home
      </Link>
    </PortalShell>
  );
}
