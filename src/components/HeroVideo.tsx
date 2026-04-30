import MuxPlayer from "@mux/mux-player-react";

export function HeroVideo() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <MuxPlayer
        playbackId="rt42FVRXL01VirdZbHjOMjPwd5sTP1LKKGFj1bDQpbnM"
        streamType="on-demand"
        autoPlay="muted"
        loop
        muted
        playsInline
        nohotkeys
        thumbnailTime={0}
        style={{
          // @ts-ignore - mux css vars
          "--controls": "none",
          "--media-object-fit": "cover",
          width: "100%",
          height: "100%",
          aspectRatio: "unset",
        }}
      />
    </div>
  );
}
