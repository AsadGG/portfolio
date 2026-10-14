import type { ReactNode } from "react";
import type { ViewState } from "../data/data-module";

export function SectionState<T>({
  state,
  skeleton,
  children,
}: {
  state: ViewState<T>;
  skeleton: ReactNode;
  children: (data: T) => ReactNode;
}) {
  if (state.status === "loading") return skeleton;

  if (state.status === "error") {
    return (
      <section aria-live="polite" className="section-error" role="alert">
        <p>{state.message}</p>
        <button
          onClick={() => void state.retry().catch(() => {})}
          type="button"
        >
          Retry
        </button>
      </section>
    );
  }

  return children(state.data);
}
