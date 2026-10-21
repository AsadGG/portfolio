import type { ReactNode } from "react";
import { Button } from "#/components/ui/button";
import type { ViewState } from "#/data/data-module";

export function SectionState<T>({
  state,
  skeleton,
  children,
  compact = false,
}: {
  state: ViewState<T>;
  skeleton: ReactNode;
  children: (data: T) => ReactNode;
  compact?: boolean;
}) {
  if (state.status === "loading") return skeleton;

  if (state.status === "error") {
    return (
      <section
        aria-live="polite"
        className={
          compact
            ? "flex flex-col items-start gap-4 py-6"
            : "flex min-h-[75vh] flex-col items-start justify-center gap-4 py-16"
        }
        role="alert"
      >
        <p className="text-muted-foreground">{state.message}</p>
        <Button
          className="h-10 px-4 text-base"
          onClick={() => void state.retry().catch(() => {})}
          size="lg"
        >
          Retry
        </Button>
      </section>
    );
  }

  return children(state.data);
}
