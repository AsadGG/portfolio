import { lazy, Suspense, useEffect, useState } from "react";

const BackgroundScene = lazy(() => import("./background-scene"));

type BackgroundMode = "checking" | "canvas" | "gradient";

export function BackgroundLayer() {
  const [mode, setMode] = useState<BackgroundMode>("checking");
  const [sceneReady, setSceneReady] = useState(false);

  useEffect(() => {
    if (!supportsWebGL()) {
      setMode("gradient");
      return;
    }

    setMode("canvas");
    const frame = window.requestAnimationFrame(() => setSceneReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-background bg-[image:radial-gradient(ellipse_at_18%_12%,color-mix(in_oklab,var(--electric-cyan)_16%,transparent),transparent_42%),radial-gradient(ellipse_at_82%_26%,color-mix(in_oklab,var(--electric-cyan)_8%,transparent),transparent_44%)]"
      data-background={mode === "checking" ? "gradient" : mode}
    >
      {sceneReady && mode === "canvas" && (
        <Suspense fallback={null}>
          <BackgroundScene />
        </Suspense>
      )}
    </div>
  );
}

function supportsWebGL() {
  const canvas = document.createElement("canvas");
  try {
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}
