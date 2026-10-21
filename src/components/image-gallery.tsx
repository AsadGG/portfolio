import { cn } from "cn";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Maximize2Icon,
  XIcon,
} from "lucide-react";
import { type KeyboardEvent, useRef, useState } from "react";

import { Button } from "#/components/ui/button";
import { Dialog, DialogContent } from "#/components/ui/dialog";

export type GalleryImage = {
  url: string;
  alt: string;
  caption?: string;
};

const navigationButtonLabels = {
  previous: { accessibleName: "Previous image", icon: <ChevronLeftIcon /> },
  next: { accessibleName: "Next image", icon: <ChevronRightIcon /> },
};

function GalleryNavigationButton({
  direction,
  onClick,
  className,
}: {
  direction: keyof typeof navigationButtonLabels;
  onClick: () => void;
  className?: string;
}) {
  const label = navigationButtonLabels[direction];

  return (
    <Button
      aria-label={label.accessibleName}
      className={cn(
        "rounded-full border-white/12 bg-white/3 hover:border-white/25 hover:bg-white/8",
        className,
      )}
      onClick={onClick}
      size="icon-lg"
      type="button"
      variant="outline"
    >
      {label.icon}
    </Button>
  );
}

function handleGalleryNavigationKey(
  event: KeyboardEvent<HTMLElement>,
  showPrevious: () => void,
  showNext: () => void,
) {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    showPrevious();
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    showNext();
  }
}

export function ImageGallery({
  images,
  label,
}: {
  images: GalleryImage[];
  label: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const imageButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  if (images.length === 0) return null;

  function showPrevious() {
    setCurrentIndex((index) => (index === 0 ? images.length - 1 : index - 1));
  }

  function showNext() {
    setCurrentIndex((index) => (index === images.length - 1 ? 0 : index + 1));
  }

  return (
    <section
      aria-label={`${label} image gallery`}
      className="space-y-4"
      onKeyDown={(event) =>
        handleGalleryNavigationKey(event, showPrevious, showNext)
      }
    >
      <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_50%_0%,color-mix(in_oklab,var(--electric-cyan)_10%,transparent),transparent_70%)] bg-black/30 ring-1 ring-white/10">
        <Button
          aria-label="View image full screen"
          className="group/stage size-full rounded-none border-0 p-0 hover:bg-transparent"
          onClick={() => setViewerOpen(true)}
          ref={imageButton}
          type="button"
          variant="ghost"
        >
          {images.map((image, index) => (
            <img
              alt={image.alt}
              className="size-full animate-in object-contain duration-300 fade-in-0 motion-reduce:animate-none"
              hidden={index !== currentIndex}
              key={image.url}
              loading={index === currentIndex ? "eager" : "lazy"}
              src={image.url}
            />
          ))}
          <span
            aria-hidden="true"
            className="absolute right-3 bottom-3 grid size-9 place-items-center rounded-full bg-background/80 text-foreground opacity-0 ring-1 ring-white/10 backdrop-blur-md transition-opacity duration-200 group-hover/stage:opacity-100 group-focus-visible/stage:opacity-100"
          >
            <Maximize2Icon className="size-4" />
          </span>
        </Button>
      </div>
      {images[currentIndex]?.caption ? (
        <p className="text-center text-sm text-muted-foreground">
          {images[currentIndex].caption}
        </p>
      ) : null}
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
        {images.length > 1 ? (
          <GalleryNavigationButton
            direction="previous"
            onClick={showPrevious}
          />
        ) : (
          <span />
        )}
        <div className="flex flex-col items-center gap-2">
          <p
            aria-live="polite"
            className="font-mono text-xs text-muted-foreground tabular-nums"
          >
            {currentIndex + 1} / {images.length}
          </p>
          <div
            aria-hidden="true"
            className="h-0.5 w-full max-w-48 overflow-hidden rounded-full bg-white/10"
          >
            <div
              className="h-full rounded-full bg-linear-to-r from-primary to-violet transition-[width] duration-300 ease-out"
              style={{
                width: `${((currentIndex + 1) / images.length) * 100}%`,
              }}
            />
          </div>
        </div>
        {images.length > 1 ? (
          <GalleryNavigationButton
            direction="next"
            className="justify-self-end"
            onClick={showNext}
          />
        ) : (
          <span />
        )}
      </div>
      <Dialog
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        onOpenChangeComplete={(open) => {
          if (open) closeButton.current?.focus();
          else imageButton.current?.focus();
        }}
      >
        <DialogContent
          aria-label="Image viewer"
          className="fixed top-0 left-0 z-60 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col items-center justify-center gap-5 rounded-none border-0 bg-black/95 p-4 text-white ring-0 backdrop-blur-xl sm:max-w-none"
          onKeyDown={(event) =>
            handleGalleryNavigationKey(event, showPrevious, showNext)
          }
          showCloseButton={false}
        >
          <Button
            aria-label="Close image viewer"
            className="absolute top-4 right-4 rounded-full border-white/15 bg-white/5 hover:bg-white/10"
            onClick={() => setViewerOpen(false)}
            ref={closeButton}
            size="icon-lg"
            type="button"
            variant="outline"
          >
            <XIcon />
          </Button>
          <img
            alt={images[currentIndex].alt}
            className="max-h-[calc(100dvh-10rem)] max-w-full animate-in rounded-lg object-contain duration-300 fade-in-0 zoom-in-[0.98] motion-reduce:animate-none"
            key={images[currentIndex].url}
            src={images[currentIndex].url}
          />
          {images[currentIndex].caption ? (
            <p className="text-center text-sm text-white/80">
              {images[currentIndex].caption}
            </p>
          ) : null}
          <div className="flex items-center gap-4">
            {images.length > 1 ? (
              <GalleryNavigationButton
                direction="previous"
                onClick={showPrevious}
              />
            ) : null}
            <p
              aria-live="polite"
              className="font-mono text-xs text-white/80 tabular-nums"
            >
              {currentIndex + 1} / {images.length}
            </p>
            {images.length > 1 ? (
              <GalleryNavigationButton direction="next" onClick={showNext} />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
