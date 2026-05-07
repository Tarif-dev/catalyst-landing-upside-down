import MuxPlayer from "@mux/mux-player-react";

export function HeroVideo() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <div className="absolute inset-0 md:hidden">
        <div className="absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-black via-black/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-black via-black/55 to-transparent" />
        <div className="absolute inset-y-0 left-1/2 z-10 w-px -translate-x-1/2 bg-blood/35 shadow-[0_0_28px_oklch(0.56_0.26_25)]" />
        <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_38%,rgba(0,0,0,0.5)_100%)]" />
      </div>
      <MuxPlayer
        className="h-full w-full scale-[1.16] md:scale-100"
        playbackId="rt42FVRXL01VirdZbHjOMjPwd5sTP1LKKGFj1bDQpbnM"
        streamType="on-demand"
        autoPlay="muted"
        loop
        muted
        playsInline
        nohotkeys
        thumbnailTime={0}
        style={{
          ["--controls" as any]: "none",
          "--media-object-fit": "cover",
          "--media-object-position": "52% center",
          width: "100%",
          height: "100%",
          aspectRatio: "unset",
        }}
      />
    </div>
  );
}
