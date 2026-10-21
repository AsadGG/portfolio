import { type PointerEvent, useRef } from "react";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * Mirrors the mouse position over an element into CSS variables so styles can
 * follow it without re-rendering. `--mx`/`--my` hold the pointer position and,
 * when `maxTilt` is set, `--rx`/`--ry` hold a 3D tilt toward it in degrees.
 */
export function usePointerTilt<T extends HTMLElement>({ maxTilt = 0 } = {}) {
  const frame = useRef(0);

  const onPointerMove = (event: PointerEvent<T>) => {
    if (event.pointerType !== "mouse") return;
    const element = event.currentTarget;
    const { clientX, clientY } = event;

    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const bounds = element.getBoundingClientRect();
      const x = (clientX - bounds.left) / bounds.width;
      const y = (clientY - bounds.top) / bounds.height;
      element.style.setProperty("--mx", `${(x * 100).toFixed(2)}%`);
      element.style.setProperty("--my", `${(y * 100).toFixed(2)}%`);
      if (maxTilt && !window.matchMedia(REDUCED_MOTION).matches) {
        element.style.setProperty(
          "--rx",
          `${((0.5 - y) * maxTilt * 2).toFixed(2)}deg`,
        );
        element.style.setProperty(
          "--ry",
          `${((x - 0.5) * maxTilt * 2).toFixed(2)}deg`,
        );
      }
    });
  };

  const onPointerLeave = (event: PointerEvent<T>) => {
    cancelAnimationFrame(frame.current);
    event.currentTarget.style.setProperty("--rx", "0deg");
    event.currentTarget.style.setProperty("--ry", "0deg");
  };

  return { onPointerMove, onPointerLeave };
}
