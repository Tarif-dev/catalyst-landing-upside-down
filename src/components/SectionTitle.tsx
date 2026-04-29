import { ReactNode } from "react";

export function SectionTitle({
  eyebrow,
  children,
  align = "center",
  italic = false,
}: {
  eyebrow?: string;
  children: ReactNode;
  align?: "center" | "left";
  italic?: boolean;
}) {
  const wrap = align === "left" ? "text-left items-start" : "text-center items-center";
  return (
    <div className={`mb-20 flex flex-col ${wrap} reveal`}>
      {eyebrow && (
        <div className="mb-6 flex items-center gap-3">
          <span className="block h-px w-8 bg-blood/60" />
          <p className="font-mono text-[10px] uppercase tracking-[0.45em] text-blood/80">
            {eyebrow}
          </p>
          <span className="block h-px w-8 bg-blood/60" />
        </div>
      )}
      <h2
        className={`font-display text-5xl md:text-7xl text-bone leading-[1.02] ${
          italic ? "italic" : ""
        }`}
      >
        {children}
      </h2>
    </div>
  );
}
