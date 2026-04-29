import { ReactNode } from "react";

export function SectionTitle({
  eyebrow,
  children,
  align = "center",
  accent = "blood",
}: {
  eyebrow?: string;
  children: ReactNode;
  align?: "center" | "left";
  accent?: "blood" | "magenta" | "cyan";
}) {
  const accentColor =
    accent === "magenta" ? "text-magenta" : accent === "cyan" ? "text-cyan" : "text-blood";
  const outline =
    accent === "magenta" ? "title-outline-magenta" : "title-outline";
  const wrap = align === "left" ? "text-left" : "text-center";
  const lineWrap = align === "left" ? "" : "mx-auto";

  return (
    <div className={`mb-16 ${wrap}`}>
      {eyebrow && (
        <p
          className={`font-mono text-[10px] uppercase tracking-[0.5em] ${accentColor} mb-5`}
        >
          ▎ {eyebrow}
        </p>
      )}
      <h2 className={`font-display text-5xl md:text-7xl ${outline} leading-[0.95]`}>
        {children}
      </h2>
      <div
        className={`mt-6 h-px w-24 ${lineWrap} bg-gradient-to-r from-transparent via-current to-transparent ${accentColor}`}
      />
    </div>
  );
}
