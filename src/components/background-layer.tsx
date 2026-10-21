import { ArrowUpRightIcon } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";

import type { BackgroundQuality } from "#/components/background-scene";
import { type GalleryItem, useGalleryItems } from "#/gallery-store";

const BackgroundScene = lazy(() => import("#/components/background-scene"));

type BackgroundMode = "canvas" | "gradient";

export function BackgroundLayer() {
  const [mode, setMode] = useState<BackgroundMode>("gradient");
  const [quality, setQuality] = useState<BackgroundQuality>();
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<GalleryItem | null>(null);
  const [lastHoveredItem, setLastHoveredItem] = useState<GalleryItem>();
  const galleryItems = useGalleryItems();

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
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-background bg-[radial-gradient(ellipse_70%_55%_at_12%_0%,color-mix(in_oklab,var(--electric-cyan)_13%,transparent),transparent_65%),radial-gradient(ellipse_55%_50%_at_92%_18%,color-mix(in_oklab,var(--electric-violet)_15%,transparent),transparent_65%),radial-gradient(ellipse_80%_45%_at_50%_110%,color-mix(in_oklab,var(--electric-violet)_9%,transparent),transparent_70%)]"
      data-background={mode}
      data-quality={quality}
      data-motion={reducedMotion ? "static" : "animated"}
    >
      {mode === "canvas" && quality && (
        <Suspense fallback={null}>
          <BackgroundScene
            galleryItems={galleryItems}
            onGalleryHover={(item) => {
              setHoveredItem(item);
              if (item) setLastHoveredItem(item);
            }}
            onGalleryOpen={openProject}
            quality={quality}
            reducedMotion={reducedMotion}
          />
        </Suspense>
      )}
      <p
        className="absolute right-8 bottom-8 flex items-center gap-3 rounded-full border border-white/10 bg-background/70 py-2 pr-3 pl-4 text-sm text-foreground opacity-0 shadow-lg backdrop-blur-md transition-[opacity,translate] duration-300 data-[visible=true]:opacity-100 motion-safe:translate-y-2 motion-safe:data-[visible=true]:translate-y-0"
        data-visible={hoveredItem !== null}
      >
        <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
          Open
        </span>
        {lastHoveredItem?.name}
        <ArrowUpRightIcon className="size-4 text-primary" />
      </p>
    </div>
  );
}

/**
 * The gallery is a pointer-only shortcut, so it opens a Project through the
 * same card link keyboard and screen reader users reach in Experience.
 */
function openProject(item: GalleryItem) {
  document
    .querySelector<HTMLAnchorElement>(
      `[data-project-link="${CSS.escape(item.id)}"]`,
    )
    ?.click();
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
