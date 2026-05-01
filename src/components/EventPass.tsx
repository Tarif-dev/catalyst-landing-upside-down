import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import amityLogo from "@/assets/Amity_logo.png";
import { toast } from "sonner";

const TRACK_LABEL: Record<string, string> = {
  healthcare: "AI · HEALTHCARE",
  fintech: "AI · FINTECH",
  sustainability: "AI · SUSTAINABILITY",
  education: "AI · EDUCATION",
  open: "OPEN INNOVATION",
};

export function EventPass({
  team,
  members,
}: {
  team: any;
  members: any[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [qr, setQr] = useState<string>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const verifyUrl = `${window.location.origin}/verify/${team.pass_code}`;
    QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 240,
      color: { dark: "#ffffff", light: "#00000000" },
      errorCorrectionLevel: "H",
    }).then(setQr);
  }, [team.pass_code]);

  const download = async () => {
    if (!ref.current) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(ref.current, {
        cacheBust: true, pixelRatio: 2, backgroundColor: "#000",
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `catalyst-2k26-pass-${team.name.replace(/\s+/g, "-")}.png`;
      a.click();
    } catch (e) {
      toast.error("Couldn't render pass.");
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    const text = `I'm in! 🌌 Building at Catalyst 2K26 — Amity University Kolkata's 24hr AI hackathon, May 21–22. Team: ${team.name}. #Catalyst2K26 #StrangerThings`;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Catalyst 2K26 — Event Pass", text, url });
      } catch {/* user cancelled */}
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success("Copied to clipboard.");
    }
  };

  const leader = members.find((m) => m.role === "leader");

  return (
    <div className="space-y-5">
      <div ref={ref} className="pass-card relative mx-auto w-full max-w-[440px] aspect-[3/5] overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0 opacity-60 blob-blood" style={{ filter: "blur(60px)" }} />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "repeating-linear-gradient(0deg, transparent 0 3px, rgba(255,255,255,0.04) 3px 4px)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(220,38,38,0.5) 0%, transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(220,38,38,0.3) 0%, transparent 60%)",
          }}
        />

        {/* Frame */}
        <div className="absolute inset-3 border border-bone/20" />
        <div className="absolute inset-3 border-t-2 border-b-2 border-blood/60" />

        {/* Content */}
        <div className="relative h-full flex flex-col p-7 text-bone">
          {/* Top */}
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[0.45em] text-blood">Hawkins Lab</p>
              <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.4em] text-bone/60">
                Transmission · 2K26
              </p>
            </div>
            <img src={amityLogo} alt="Amity" className="h-7 w-auto opacity-90" crossOrigin="anonymous" />
          </div>

          {/* Title */}
          <div className="mt-5">
            <h2
              className="font-display text-5xl leading-none text-blood"
              style={{ textShadow: "0 0 14px rgba(220,38,38,0.7), 0 0 40px rgba(220,38,38,0.4)" }}
            >
              CATALYST
            </h2>
            <p className="mt-1 font-display italic text-2xl text-bone/80">2K26</p>
            <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.4em] text-bone/55">
              24hr AI Hackathon · May 21–22, 2026
            </p>
          </div>

          {/* Divider */}
          <div className="my-5 hairline" />

          {/* Holder */}
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.4em] text-bone/40">Team</p>
            <p className="mt-1 font-display text-2xl text-bone">{team.name}</p>
            <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.35em] text-blood">
              {TRACK_LABEL[team.track]}
            </p>
            {team.tagline && (
              <p className="mt-2 font-serif italic text-sm text-bone/65 line-clamp-2">
                "{team.tagline}"
              </p>
            )}
          </div>

          {/* Members chips */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {members.slice(0, 5).map((m) => (
              <span
                key={m.id}
                className="font-mono text-[8px] uppercase tracking-[0.25em] border border-bone/20 px-2 py-1 text-bone/70"
              >
                {m.full_name.split(" ")[0]}
              </span>
            ))}
          </div>

          <div className="flex-1" />

          {/* QR + code */}
          <div className="flex items-end justify-between">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[0.4em] text-bone/40">Pass code</p>
              <p
                className="mt-1 font-display text-3xl text-blood"
                style={{ textShadow: "0 0 12px rgba(220,38,38,0.8)" }}
              >
                {team.pass_code}
              </p>
              <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.4em] text-bone/40">
                Leader · {leader?.full_name?.split(" ")[0] ?? "—"}
              </p>
            </div>
            {qr && (
              <div className="border border-bone/15 p-1.5 bg-black/40">
                <img src={qr} alt="QR" className="h-20 w-20" />
              </div>
            )}
          </div>

          {/* Bottom strip */}
          <div className="mt-4 border-t border-blood/30 pt-3 flex items-center justify-between">
            <p className="font-mono text-[7px] uppercase tracking-[0.35em] text-bone/40">
              Amity University · Kolkata
            </p>
            <p className="font-mono text-[7px] uppercase tracking-[0.35em] text-bone/40">
              Friends don't lie.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={download}
          disabled={busy}
          className="bracket border border-blood bg-blood px-6 py-3 font-mono text-[10px] uppercase tracking-[0.4em] text-black hover:bg-transparent hover:text-blood transition disabled:opacity-50"
        >
          {busy ? "Rendering…" : "Download PNG"}
        </button>
        <button
          onClick={share}
          className="bracket border border-bone/30 bg-transparent px-6 py-3 font-mono text-[10px] uppercase tracking-[0.4em] text-bone/80 hover:border-blood hover:text-blood transition"
        >
          Share
        </button>
      </div>
      <p className="text-center text-xs font-serif italic text-bone/45">
        Tag <span className="text-blood">@AmityKolkata</span> · #Catalyst2K26 — best post wins swag.
      </p>
    </div>
  );
}
