import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import amityLogo from "@/assets/amity_logo_white.png";
import catalystLogo from "@/assets/catalyst_logo.png";
import hopperImg from "@/assets/hopper.webp";
import dustinImg from "@/assets/dustin.webp";
import willImg from "@/assets/will.webp";
import elevenImg from "@/assets/eleven.webp";
import { toast } from "sonner";

const TRACK_CONFIG: Record<
  string,
  { label: string; img: string; theme: string }
> = {
  healthcare: { label: "AI · HEALTHCARE", img: hopperImg, theme: "blood" },
  fintech: { label: "AI · FINTECH", img: dustinImg, theme: "cyan" },
  sustainability: {
    label: "AI · SUSTAINABILITY",
    img: willImg,
    theme: "magenta",
  },
  education: { label: "AI · EDUCATION", img: elevenImg, theme: "amber" },
};

export function EventPass({
  team,
  members,
  currentUser,
  participantProfile,
}: {
  team: any;
  members: any[];
  currentUser?: any;
  participantProfile?: any;
}) {
  const isPaid = participantProfile?.payment_status === "paid";
  const passCode = String(participantProfile?.pass_code ?? team.pass_code);
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const [qr, setQr] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const verifyUrl = `${window.location.origin}/verify/${passCode}`;
    QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 400,
      color: { dark: "#000000", light: "#ffffff" },
      errorCorrectionLevel: "H",
    }).then(setQr);
  }, [passCode]);

  const download = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentRef = flipped ? backRef : frontRef;
    if (!currentRef.current) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(currentRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "#000000",
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      const side = flipped ? "qr" : "pass";
      a.download = `catalyst-2k26-${(currentUser?.full_name || team.name).replace(/\s+/g, "-")}-${side}.png`;
      a.click();
      toast.success(`Pass ${side} saved to device.`);
    } catch (err) {
      toast.error("Couldn't render pass.");
    } finally {
      setBusy(false);
    }
  };

  const share = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `I'm in! 🌌 Building at Catalyst 2K26 — Amity University Kolkata's 24hr AI hackathon, May 21–22. Team: ${team.name}. #Catalyst2K26 #StrangerThings`;
    const url = window.location.href;

    setBusy(true);
    try {
      const currentRef = flipped ? backRef : frontRef;
      if (!currentRef.current) throw new Error("Missing ref");

      const dataUrl = await toPng(currentRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "#000000",
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const side = flipped ? "qr" : "pass";
      const filename = `catalyst-2k26-${(currentUser?.full_name || team.name).replace(/\s+/g, "-")}-${side}.png`;
      const file = new File([blob], filename, { type: "image/png" });

      const shareData = {
        title: "Catalyst 2K26 — Event Pass",
        text,
        url,
        files: [file],
      };

      // Try sharing with file if supported
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share(shareData);
          return; // Success!
        } catch (shareErr: any) {
          if (shareErr.name === "AbortError") return; // User cancelled
          console.warn("Native file share failed, falling back:", shareErr);
          throw shareErr; // Trigger fallback
        }
      } else if (navigator.share) {
        // Fallback to basic text share if file sharing isn't supported by browser
        try {
          await navigator.share({
            title: shareData.title,
            text: shareData.text,
            url: shareData.url,
          });
          toast.info("Shared link! (Image sharing unsupported)");
          return;
        } catch (shareErr: any) {
          if (shareErr.name === "AbortError") return;
          throw shareErr; // Trigger fallback
        }
      } else {
        throw new Error("Share API not supported");
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;

      // Ultimate Fallback: Copy text to clipboard and trigger download
      try {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        toast.success("Text copied! Downloading pass image...");

        const currentRef = flipped ? backRef : frontRef;
        if (currentRef.current) {
          const dataUrl = await toPng(currentRef.current, {
            cacheBust: true,
            pixelRatio: 3,
            backgroundColor: "#000000",
          });
          const a = document.createElement("a");
          a.href = dataUrl;
          const side = flipped ? "qr" : "pass";
          a.download = `catalyst-2k26-${(currentUser?.full_name || team.name).replace(/\s+/g, "-")}-${side}.png`;
          a.click();
        }
      } catch (fallbackErr) {
        toast.error("Couldn't share pass.");
      }
    } finally {
      setBusy(false);
    }
  };

  const leader = members.find((m) => m.role === "leader");
  const track = TRACK_CONFIG[team.track] || TRACK_CONFIG.healthcare;

  return (
    <div className="w-full flex flex-col items-center space-y-8 px-4">
      {/* 3D Flip Container - using a vertical ID card ratio */}
      <div
        className="relative w-full max-w-[340px] sm:max-w-[360px] aspect-[2/3] cursor-pointer group"
        style={{ perspective: "1500px" }}
        onClick={() => setFlipped(!flipped)}
      >
        <div
          className="w-full h-full relative transition-transform duration-[800ms] ease-[cubic-bezier(0.175,0.885,0.32,1.275)]"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front Side Wrapper */}
          <div
            className="absolute inset-0 w-full h-full"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div
              ref={frontRef}
              className="w-full h-full bg-[#050505] rounded-[24px] overflow-hidden border border-white/10 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] relative flex flex-col"
            >
              {/* Modern Gradients & Background Effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-900/30 via-transparent to-black/80 z-0 pointer-events-none" />
              <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-red-600/10 blur-[60px] rounded-full z-0 pointer-events-none" />

              {/* Subtle Grid Pattern for tech feel */}
              <div
                className="absolute inset-0 opacity-[0.03] z-0 pointer-events-none"
                style={{
                  backgroundImage:
                    "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />

              {/* Character Image Background Fade */}
              <div className="absolute bottom-0 right-0 w-[120%] h-[70%] z-0 select-none pointer-events-none opacity-30 mix-blend-luminosity">
                <img
                  src={track.img}
                  alt="Track Character"
                  className="w-full h-full object-contain object-bottom filter drop-shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                  crossOrigin="anonymous"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#050505]/40 to-[#050505]" />
              </div>

              {/* Glass Inner Frame */}
              <div className="absolute inset-2 rounded-[16px] border border-white/5 pointer-events-none z-10" />

              {/* Layout Content */}
              <div className="relative z-20 flex flex-col h-full p-6 sm:p-7">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-red-500 font-bold flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(220,38,38,1)]" />
                      Hawkins Lab
                    </p>
                    <p className="font-mono text-[7px] uppercase tracking-[0.2em] text-white/40">
                      Classified Access
                    </p>
                  </div>
                  <img
                    src={amityLogo}
                    alt="Amity"
                    className="h-6 w-auto opacity-80"
                    crossOrigin="anonymous"
                  />
                </div>
                {/* Event Title */}
                <div className="relative mt-4 sm:mt-6 w-full h-20 sm:h-24">
                  <img
                    src={catalystLogo}
                    alt="Catalyst"
                    className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-auto drop-shadow-lg"
                    crossOrigin="anonymous"
                  />
                </div>
                <div className="flex-1" /> {/* Spacer */}
                {/* Dynamic Content: Team Info */}
                <div className="bg-white/[0.03] backdrop-blur-md rounded-xl p-4 sm:p-5 border border-white/10 mb-6 shadow-inner">
                  <p className="font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.2em] text-red-400 font-bold mb-2">
                    {track.label}
                  </p>
                  <h2 className="font-display text-2xl sm:text-3xl text-white leading-tight break-words line-clamp-2 drop-shadow-lg tracking-wider uppercase">
                    {currentUser?.full_name || team.name}
                  </h2>
                  <div className="mt-3 pl-2 border-l border-red-500/30">
                    <p className="font-mono text-[10px] text-white/80 uppercase tracking-widest">
                      TEAM: {team.name}
                    </p>
                    {team.tagline && (
                      <p className="font-serif italic text-[10px] sm:text-xs text-white/50 mt-1 line-clamp-2">
                        "{team.tagline}"
                      </p>
                    )}
                  </div>
                </div>
                {/* Footer Data */}
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/40 mb-1">
                      Pass Code
                    </p>
                    <p className="font-mono text-2xl sm:text-3xl text-red-500 font-bold tracking-[0.18em] sm:tracking-widest drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]">
                      {passCode}
                    </p>
                  </div>
                  <div className="flex flex-col text-right max-w-[40%]">
                    <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/40 mb-1">
                      Leader
                    </p>
                    <p className="font-mono text-xs text-white/80 truncate">
                      {leader?.full_name ?? "—"}
                    </p>
                  </div>
                </div>
                <div className="w-full flex justify-center mt-6">
                  <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 flex items-center gap-1.5 transition-colors group-hover:text-red-400/50">
                    Tap to reveal QR{" "}
                    <svg
                      className="w-3 h-3 animate-bounce"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 5l7 7-7 7M5 5l7 7-7 7"
                      />
                    </svg>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Back Side Wrapper (QR Code) */}
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div
              ref={backRef}
              className="w-full h-full bg-[#050205] rounded-[24px] overflow-hidden border border-red-500/20 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] relative flex flex-col items-center justify-center p-6 sm:p-8"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/10 via-transparent to-transparent z-0 pointer-events-none" />

              <div className="relative z-10 flex w-full max-w-[230px] flex-1 flex-col items-center justify-center pb-8">
                <h2 className="mb-6 text-center font-display text-xl sm:text-2xl uppercase leading-snug tracking-[0.2em] text-white drop-shadow-md">
                  Dimensional
                  <br />
                  Access
                </h2>

                {/* QR Code Frame */}
                <div className="bg-white p-3 rounded-xl shadow-[0_0_40px_rgba(220,38,38,0.2)] w-full aspect-square relative group/qr">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500/50 to-red-600/50 rounded-xl blur opacity-30 group-hover/qr:opacity-100 transition duration-500 animate-pulse z-[-1]" />
                  {qr ? (
                    <img
                      src={qr}
                      alt="Verification QR"
                      className={`w-full h-full object-contain mix-blend-multiply rounded-lg transition-all duration-300 ${!isPaid ? "blur-md select-none" : ""}`}
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-black/50 font-mono">
                      Generating...
                    </div>
                  )}
                  {/* Lock overlay for unpaid */}
                  {!isPaid && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-black/20">
                      <svg
                        className="w-10 h-10 text-amber-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      <p className="mt-2 text-[9px] font-mono uppercase tracking-widest text-amber-400 text-center px-2">
                        Payment Pending
                      </p>
                    </div>
                  )}
                  {/* Cyberpunk corners */}
                  <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-red-500" />
                  <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-red-500" />
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-red-500" />
                  <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-red-500" />
                </div>

                <div className="mt-7 flex w-full flex-col items-center text-center">
                  <p className="max-w-full font-mono text-red-500 text-glow-blood text-3xl sm:text-4xl font-bold tracking-[0.2em] tabular-nums leading-none">
                    {passCode}
                  </p>
                  <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-white/40 mt-4 leading-relaxed max-w-[200px] mx-auto">
                    Present to dimensional gate security for authorization.
                  </p>
                </div>
              </div>

              <div className="absolute bottom-6 w-full flex justify-center">
                <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 flex items-center gap-1.5 transition-colors group-hover:text-red-400/50">
                  <svg
                    className="w-3 h-3 animate-pulse transform rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 5l7 7-7 7M5 5l7 7-7 7"
                    />
                  </svg>{" "}
                  Tap to flip back
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-[340px] sm:max-w-[360px] pt-4">
        <button
          onClick={download}
          disabled={busy}
          className="flex-1 btn-primary py-3.5 text-xs sm:text-sm tracking-[0.2em] uppercase rounded-xl transition-all"
        >
          {busy ? "Rendering..." : `Download ${flipped ? "QR" : "Pass"}`}
        </button>
        <button
          onClick={share}
          disabled={busy}
          className="flex-1 btn-secondary py-3.5 text-xs sm:text-sm tracking-[0.2em] uppercase rounded-xl transition-all bg-white/5 hover:bg-white/10 border border-white/10 text-white"
        >
          {busy ? "Generating..." : "Share"}
        </button>
      </div>
    </div>
  );
}
