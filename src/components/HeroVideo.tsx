import MuxPlayer from "@mux/mux-player-react";

export function HeroVideo() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <MuxPlayer
        playbackId="LqCoyL4ueeeLRj1H01IaJRXonQ4D7EkwcJCS3waZegS8"
        streamType="on-demand"
        autoPlay="muted"
        loop
        muted
        playsInline
        nohotkeys
        thumbnailTime={0}
        style={{
          "--controls": "none",
          "--media-object-fit": "cover",
          width: "100%",
          height: "100%",
          aspectRatio: "unset",
        }}
      />
      {/* Red wash + vignette to pull video into ST palette */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background" />
      <div className="pointer-events-none absolute inset-0 mix-blend-multiply bg-[radial-gradient(ellipse_at_center,transparent_30%,oklch(0.08_0.015_25)_85%)]" />
      <div className="pointer-events-none absolute inset-0 mix-blend-color bg-blood/20" />
    </div>
  );
}
