import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import amityLogo from "@/assets/Amity_logo.png";
import hopperImg from "@/assets/hopper.png";
import dustinImg from "@/assets/dustin.png";
import willImg from "@/assets/will.png";
import elevenImg from "@/assets/eleven.png";
import steveImg from "@/assets/steve.png";
import { toast } from "sonner";

const TRACK_CONFIG: Record<string, { label: string; img: string; theme: string }> = {
  healthcare: { label: "AI · HEALTHCARE", img: hopperImg, theme: "blood" },
  fintech: { label: "AI · FINTECH", img: dustinImg, theme: "cyan" },
  sustainability: { label: "AI · SUSTAINABILITY", img: willImg, theme: "magenta" },
  education: { label: "AI · EDUCATION", img: elevenImg, theme: "amber" },
  open: { label: "OPEN INNOVATION", img: steveImg, theme: "blood" },
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
      width: 280,
      color: { dark: "#ffffff", light: "#00000000" },
      errorCorrectionLevel: "H",
    }).then(setQr);
  }, [team.pass_code]);

  const download = async () => {
    if (!ref.current) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(ref.current, {
        cacheBust: true,
        pixelRatio: 3, // Higher quality for sharing
        backgroundColor: "#0d021a", // Deep slate background matching new theme
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `catalyst-2k26-${team.name.replace(/\s+/g, "-")}.png`;
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
  const track = TRACK_CONFIG[team.track] || TRACK_CONFIG.open;

  return (
    <div className="space-y-6">
      {/* Container for the pass itself - exactly what gets screenshotted */}
      <div 
        ref={ref} 
        className="relative mx-auto w-full max-w-[480px] aspect-[4/5] overflow-hidden rounded-xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        style={{ background: "oklch(0.14 0.02 260)" }}
      >
        {/* Cinematic Backdrop */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 z-0" />
        <div className="absolute top-[-30%] right-[-20%] w-[80%] h-[80%] blob-blood opacity-40 mix-blend-screen" />
        <div className="absolute bottom-[-20%] left-[-20%] w-[70%] h-[70%] blob-upside-down opacity-60 mix-blend-screen" />
        
        {/* Subtle Grid */}
        <div 
          className="absolute inset-0 opacity-[0.05] z-0"
          style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "20px 20px" }}
        />

        {/* Character Image Background (Faded into bottom right) */}
        <div className="absolute bottom-0 right-[-10%] w-[75%] h-[75%] opacity-80 z-0 select-none pointer-events-none mix-blend-luminosity">
          <img 
            src={track.img} 
            alt="Track Character" 
            className="w-full h-full object-contain object-bottom filter drop-shadow-[0_0_15px_rgba(220,38,38,0.3)] opacity-70"
            crossOrigin="anonymous" 
          />
          {/* Gradient to blend image bottom into card */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-background" />
        </div>

        {/* Outer Frame overlay */}
        <div className="absolute inset-4 border border-white/10 rounded-lg pointer-events-none z-10" />

        {/* Foreground Content */}
        <div className="relative h-full flex flex-col p-8 z-20">
          
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-blood text-glow-blood font-bold">Hawkins National Lab</span>
              <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.3em] text-bone/60">Classified Access · Level 4</span>
            </div>
            <img src={amityLogo} alt="Amity" className="h-8 w-auto filter opacity-90 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" crossOrigin="anonymous" />
          </div>

          {/* Hackathon Branding */}
          <div className="mt-8">
            <h1 className="font-display text-6xl leading-none text-bone tracking-wide drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
              CATALYST
            </h1>
            <p className="font-display italic text-3xl text-blood text-glow-blood mt-1">2K26</p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.4em] text-bone/70 bg-black/40 inline-block px-3 py-1 rounded backdrop-blur-sm border border-white/5">
              Amity University Kolkata
            </p>
          </div>

          {/* Glowing Separator */}
          <div className="w-full h-px bg-gradient-to-r from-blood via-red-500/50 to-transparent my-6 opacity-70 shadow-[0_0_10px_rgba(220,38,38,0.8)]" />

          {/* Team Info */}
          <div className="bg-black/30 backdrop-blur-md border border-white/10 p-5 rounded-lg shadow-inner max-w-[80%]">
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-blood font-bold">{track.label}</p>
            <p className="mt-2 font-display text-3xl text-bone drop-shadow-md leading-tight">{team.name}</p>
            {team.tagline && (
              <p className="mt-2 font-serif italic text-sm text-bone/80 border-l-2 border-blood/50 pl-3">
                "{team.tagline}"
              </p>
            )}
          </div>

          <div className="flex-1" />

          {/* Footer Area with Barcode/QR */}
          <div className="flex items-end justify-between w-full mt-6">
            <div className="bg-black/50 backdrop-blur-md p-4 rounded-lg border border-white/10 flex flex-col">
              <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-bone/50 mb-1">Access Code</span>
              <span className="font-display text-4xl text-blood text-glow-blood tracking-widest">{team.pass_code}</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-bone/70 mt-3 pt-2 border-t border-white/10">
                LDR: {leader?.full_name ?? "—"}
              </span>
            </div>
            
            {qr && (
              <div className="bg-white/90 p-2 rounded-lg shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                <img src={qr} alt="Verification QR" className="w-24 h-24" crossOrigin="anonymous" />
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Action Buttons (Not part of the screenshot) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[480px] mx-auto">
        <button
          onClick={download}
          disabled={busy}
          className="btn-primary"
        >
          {busy ? "Rendering Portal..." : "Download Pass"}
        </button>
        <button
          onClick={share}
          className="btn-secondary"
        >
          Share Protocol
        </button>
      </div>
      <p className="text-center text-xs font-serif italic text-bone/60">
        Tag <span className="text-blood font-bold tracking-widest uppercase text-[10px]">@AmityKolkata</span> on comms.
      </p>
    </div>
  );
}
