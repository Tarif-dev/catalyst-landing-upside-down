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
  const wrap =
    align === "left" ? "text-left items-start" : "text-center items-center";
  return (
    <div className={`mb-14 sm:mb-20 flex flex-col ${wrap} reveal`}>
      {eyebrow && (
        <div className="mb-5 sm:mb-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-full">
          <span className="hidden sm:block h-px w-8 bg-blood/60" />
          <p className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.35em] sm:tracking-[0.45em] text-blood/80 text-center">
            {eyebrow}
          </p>
          <span className="hidden sm:block h-px w-8 bg-blood/60" />
        </div>
      )}
      <h2
        className={`font-display text-4xl sm:text-5xl md:text-7xl text-bone leading-[1.02] ${
          italic ? "italic" : ""
        }`}
      >
        {children}
      </h2>
    </div>
  );
}
