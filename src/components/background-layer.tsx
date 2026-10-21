import { lazy, Suspense, useEffect, useState } from "react";
import type { BackgroundQuality } from "#/components/background-scene";

const BackgroundScene = lazy(() => import("#/components/background-scene"));

type BackgroundMode = "canvas" | "gradient";

export function BackgroundLayer() {
  const [mode, setMode] = useState<BackgroundMode>("gradient");
  const [quality, setQuality] = useState<BackgroundQuality>();
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let currentQuality = getBackgroundQuality();
    let webglSupported: boolean | undefined;
    let cancelDeferredScene: (() => void) | undefined;
    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    const hasWebGL = () => {
      webglSupported ??= supportsWebGL();
      return webglSupported;
    };

    const deferScene = () => {
      cancelDeferredScene?.();
      if (!hasWebGL()) return;

      cancelDeferredScene = runWhenIdle(() => {
        setMode("canvas");
      });
    };

    const updateMotionPreference = () => {
      const shouldReduceMotion = motionPreference.matches;
      setReducedMotion(shouldReduceMotion);
      if (shouldReduceMotion) {
        cancelDeferredScene?.();
        setMode(hasWebGL() ? "canvas" : "gradient");
      } else {
        deferScene();
      }
    };

    const updateQuality = () => {
      const nextQuality = getBackgroundQuality();
      if (nextQuality === currentQuality) return;
      currentQuality = nextQuality;
      setQuality(nextQuality);
      deferScene();
    };

    setQuality(currentQuality);
    updateMotionPreference();
    motionPreference.addEventListener("change", updateMotionPreference);
    window.addEventListener("resize", updateQuality);

    return () => {
      cancelDeferredScene?.();
      motionPreference.removeEventListener("change", updateMotionPreference);
      window.removeEventListener("resize", updateQuality);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-background bg-[image:radial-gradient(ellipse_at_18%_12%,color-mix(in_oklab,var(--electric-cyan)_16%,transparent),transparent_42%),radial-gradient(ellipse_at_82%_26%,color-mix(in_oklab,var(--electric-cyan)_8%,transparent),transparent_44%)]"
      data-background={mode}
      data-quality={quality}
      data-motion={reducedMotion ? "static" : "animated"}
    >
      {mode === "canvas" && quality && (
        <Suspense fallback={null}>
          <BackgroundScene quality={quality} reducedMotion={reducedMotion} />
        </Suspense>
      )}
    </div>
  );
}

function getBackgroundQuality(): BackgroundQuality {
  return window.matchMedia("(pointer: coarse)").matches ||
    window.innerWidth < 768
    ? "low"
    : "high";
}

function supportsWebGL() {
  const canvas = document.createElement("canvas");
  try {
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function runWhenIdle(callback: () => void) {
  const idleWindow = window as Window & {
    requestIdleCallback?: (
      callback: () => void,
      options?: { timeout: number },
    ) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

  if (idleWindow.requestIdleCallback) {
    const handle = idleWindow.requestIdleCallback(callback, { timeout: 2000 });
    return () => idleWindow.cancelIdleCallback?.(handle);
  }

  const handle = window.setTimeout(callback, 1000);
  return () => window.clearTimeout(handle);
}
