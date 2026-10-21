/**
 * Per-item scroll reveals that share one IntersectionObserver. An item is
 * either hidden or plays a short timed fade, so its text never lingers at a
 * low-contrast partial opacity the way a scroll-scrubbed animation would.
 */

let observer: IntersectionObserver | undefined;

function getObserver() {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        (entry.target as HTMLElement).dataset.reveal = "shown";
        observer?.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  return observer;
}

/**
 * Ref callback that hides an element until it first scrolls into view. Items
 * already on screen, visitors who prefer reduced motion and browsers without
 * IntersectionObserver see the element straight away.
 */
export function revealOnView(element: HTMLElement | null) {
  if (
    !element ||
    typeof IntersectionObserver === "undefined" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }

  const bounds = element.getBoundingClientRect();
  if (bounds.top < window.innerHeight && bounds.bottom > 0) return;

  element.dataset.reveal = "hidden";
  const shared = getObserver();
  shared.observe(element);
  return () => shared.unobserve(element);
}

/**
 * Styles for `revealOnView` items. Set `--reveal-index` to stagger siblings
 * that enter the viewport together.
 */
export const revealClassName =
  "data-[reveal=hidden]:translate-y-6 data-[reveal=hidden]:opacity-0 data-[reveal=shown]:transition-[opacity,translate] data-[reveal=shown]:delay-[calc(var(--reveal-index,0)*90ms)] data-[reveal=shown]:duration-700 data-[reveal=shown]:ease-[cubic-bezier(0.22,1,0.36,1)]";
