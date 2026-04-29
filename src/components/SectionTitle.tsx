import { ReactNode } from "react";

export function SectionTitle({
  eyebrow,
  children,
}: {
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-14 text-center">
      {eyebrow && (
        <p className="font-mono text-xs uppercase tracking-[0.4em] text-blood/80 mb-4">
          // {eyebrow}
        </p>
      )}
      <h2 className="font-display text-5xl md:text-7xl text-blood text-glow-blood">
        {children}
      </h2>
      <div className="mx-auto mt-5 h-px w-24 bg-gradient-to-r from-transparent via-blood to-transparent" />
    </div>
  );
}
