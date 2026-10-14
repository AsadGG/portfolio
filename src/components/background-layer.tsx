import { lazy, Suspense, useEffect, useState } from "react";
import type { BackgroundQuality } from "./background-scene";

const BackgroundScene = lazy(() => import("./background-scene"));

type BackgroundMode = "canvas" | "gradient";

export function BackgroundLayer() {
  const [mode, setMode] = useState<BackgroundMode>("gradient");
  const [quality, setQuality] = useState<BackgroundQuality>();

  useEffect(() => {
    setQuality(getBackgroundQuality());
    if (!supportsWebGL()) return;

    let sceneFrame: number | undefined;
    const contentFrame = window.requestAnimationFrame(() => {
      sceneFrame = window.requestAnimationFrame(() => setMode("canvas"));
    });

    return () => {
      window.cancelAnimationFrame(contentFrame);
      if (sceneFrame !== undefined) window.cancelAnimationFrame(sceneFrame);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-background bg-[image:radial-gradient(ellipse_at_18%_12%,color-mix(in_oklab,var(--electric-cyan)_16%,transparent),transparent_42%),radial-gradient(ellipse_at_82%_26%,color-mix(in_oklab,var(--electric-cyan)_8%,transparent),transparent_44%)]"
      data-background={mode}
      data-quality={quality}
    >
      {mode === "canvas" && quality && (
        <Suspense fallback={null}>
          <BackgroundScene quality={quality} />
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
