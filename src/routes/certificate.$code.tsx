import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/PortalShell";
import amityLogo from "@/assets/amity_logo_white.png";
import { toast } from "sonner";

export const Route = createFileRoute("/certificate/$code")({
  head: () => ({ meta: [{ title: "Certificate — Catalyst 2K26" }] }),
  component: CertPage,
});

function CertPage() {
  const { code } = Route.useParams();
  const [cert, setCert] = useState<any>(null);
  const [team, setTeam] = useState<any>(null);
  const [busy, setBusy] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase
        .from("certificates")
        .select("*")
        .eq("certificate_code", code.toUpperCase())
        .maybeSingle();
      setCert(c);
      if (c) {
        const { data: t } = await supabase
          .from("teams")
          .select("name, track")
          .eq("id", c.team_id)
          .maybeSingle();
        setTeam(t);
      }
      setBusy(false);
    })();
  }, [code]);

  const download = async () => {
    if (!ref.current) return;
    try {
      const url = await toPng(ref.current, {
        pixelRatio: 2,
        backgroundColor: "#000",
      });
      const a = document.createElement("a");
      a.href = url;
      a.download = `catalyst-2k26-certificate-${cert.recipient_name.replace(/\s+/g, "-")}.png`;
      a.click();
    } catch {
      toast.error("Couldn't render.");
    }
  };

  if (busy)
    return (
      <PortalShell title="Loading…">
        <div />
      </PortalShell>
    );
  if (!cert)
    return (
      <PortalShell title="Not found">
        <p className="text-bone/60">No certificate at this code.</p>
      </PortalShell>
    );

  return (
    <PortalShell title="Certificate">
      <div
        ref={ref}
        className="relative mx-auto w-full max-w-3xl aspect-[1.414/1] overflow-hidden bg-black p-10 text-bone"
      >
        <div
          className="absolute inset-0 opacity-40 blob-blood"
          style={{ filter: "blur(60px)" }}
        />
        <div className="absolute inset-5 border border-bone/25" />
        <div className="absolute inset-7 border border-blood/40" />
        <div className="relative h-full flex flex-col items-center justify-center text-center">
          <img
            src={amityLogo}
            alt="Amity"
            className="h-12 mb-3"
            crossOrigin="anonymous"
          />
          <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-blood">
            Hawkins Lab · Transmission 2K26
          </p>
          <h2
            className="mt-4 font-display text-5xl sm:text-6xl text-blood"
            style={{
              textShadow:
                "0 0 14px rgba(220,38,38,0.7), 0 0 40px rgba(220,38,38,0.4)",
            }}
          >
            CERTIFICATE
          </h2>
          <p className="font-display italic text-2xl text-bone/80">
            of {cert.kind}
          </p>
          <p className="mt-8 font-serif italic text-bone/60">
            This is presented to
          </p>
          <p className="mt-3 font-display text-4xl sm:text-5xl text-bone">
            {cert.recipient_name}
          </p>
          <p className="mt-6 font-serif italic text-bone/60 max-w-xl">
            for stepping through the gate at{" "}
            <span className="text-blood">Catalyst 2K26</span> — the 24-hour AI
            hackathon hosted by Amity University Kolkata —
            {team && (
              <>
                {" "}
                as part of team <span className="text-bone">{team.name}</span>
              </>
            )}
            .
          </p>
          <div className="mt-8 flex items-center gap-10">
            <div className="text-center">
              <p className="font-display text-xl text-bone">May 21–22, 2026</p>
              <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-bone/50 mt-1">
                Date
              </p>
            </div>
            <div className="text-center">
              <p className="font-display text-xl text-blood">
                {cert.certificate_code}
              </p>
              <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-bone/50 mt-1">
                Verify code
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-center gap-3">
        <button
          onClick={download}
          className="bracket border border-blood bg-blood px-6 py-3 font-mono text-[10px] uppercase tracking-[0.4em] text-black hover:bg-transparent hover:text-blood transition"
        >
          Download PNG
        </button>
        <Link
          to="/dashboard"
          className="bracket border border-bone/30 px-6 py-3 font-mono text-[10px] uppercase tracking-[0.4em] text-bone/70 hover:border-blood hover:text-blood transition"
        >
          Dashboard
        </Link>
      </div>
    </PortalShell>
  );
}
