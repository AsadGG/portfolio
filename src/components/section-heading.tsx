import { cn } from "cn";
import type { ReactNode } from "react";

export function SectionHeading({
  id,
  index,
  lead,
  className,
  children,
}: {
  id: string;
  index: string;
  lead?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <p
        aria-hidden="true"
        className="flex items-center gap-3 font-mono text-xs tracking-[0.24em] text-primary"
      >
        {index}
        <span className="h-px w-12 bg-linear-to-r from-primary/80 to-transparent" />
      </p>
      <h2
        className="scroll-mt-32 text-4xl font-semibold tracking-[-0.035em] text-balance sm:text-5xl"
        id={id}
      >
        {children}
      </h2>
      {lead ? (
        <p className="max-w-xl text-base leading-relaxed text-pretty text-muted-foreground">
          {lead}
        </p>
      ) : null}
    </div>
  );
}
