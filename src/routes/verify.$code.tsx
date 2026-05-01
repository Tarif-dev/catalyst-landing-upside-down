import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/PortalShell";

export const Route = createFileRoute("/verify/$code")({
  head: () => ({ meta: [{ title: "Verify — Catalyst 2K26" }] }),
  component: VerifyPage,
});

function VerifyPage() {
  const { code } = Route.useParams();
  const [team, setTeam] = useState<any>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    supabase
      .from("teams")
      .select("name, track, payment_status, created_at")
      .eq("pass_code", code.toUpperCase())
      .maybeSingle()
      .then(({ data }) => {
        setTeam(data);
        setBusy(false);
      });
  }, [code]);

  return (
    <PortalShell title="Pass Verification">
      {busy ? (
        <p className="text-bone/50">Checking the gate…</p>
      ) : team ? (
        <div className="panel panel-blood p-8 max-w-md">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-cyan">✓ Valid</p>
          <h2 className="mt-2 font-display text-3xl text-bone">{team.name}</h2>
          <p className="mt-1 font-mono text-xs uppercase tracking-[0.3em] text-blood">
            {team.track}
          </p>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.3em] text-bone/50">
            Status · {team.payment_status}
          </p>
        </div>
      ) : (
        <div className="panel p-8 max-w-md">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-blood">✗ Invalid</p>
          <p className="mt-2 text-bone/60">No team matches this pass code.</p>
        </div>
      )}
      <Link to="/" className="mt-6 inline-block text-blood underline">← Home</Link>
    </PortalShell>
  );
}
