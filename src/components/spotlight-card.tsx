import { cn } from "cn";
import type { ComponentProps } from "react";

import { Card } from "#/components/ui/card";
import { usePointerTilt } from "#/use-pointer-tilt";

/** A Card whose surface lights up under the mouse. */
export function SpotlightCard({
  className,
  ...props
}: ComponentProps<typeof Card>) {
  const pointer = usePointerTilt<HTMLDivElement>();

  return (
    <Card
      {...props}
      {...pointer}
      className={cn(
        "relative isolate gap-4 rounded-2xl bg-card/70 p-6 text-sm text-card-foreground ring-white/8 transition-[box-shadow,translate] duration-300 ease-out before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-[radial-gradient(28rem_circle_at_var(--mx,50%)_var(--my,0%),color-mix(in_oklab,var(--electric-cyan)_11%,transparent),transparent_65%)] before:opacity-0 before:transition-opacity before:duration-500 hover:-translate-y-0.5 hover:ring-white/16 hover:before:opacity-100 motion-reduce:hover:translate-y-0",
        className,
      )}
    />
  );
}
