import { type KeyboardEvent, useRef, useState } from "react";

import { Button } from "#/components/ui/button";
import { Dialog, DialogContent } from "#/components/ui/dialog";

export type GalleryImage = {
  url: string;
  alt: string;
  caption?: string;
};

const navigationButtonLabels = {
  previous: { accessibleName: "Previous image", text: "Previous" },
  next: { accessibleName: "Next image", text: "Next" },
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
      className={className}
      onClick={onClick}
      type="button"
      variant="outline"
    >
      {label.text}
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
      className="space-y-3"
      onKeyDown={(event) =>
        handleGalleryNavigationKey(event, showPrevious, showNext)
      }
    >
      <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg border bg-muted/30">
        <Button
          aria-label="View image full screen"
          className="size-full rounded-none border-0 p-0 hover:bg-transparent"
          onClick={() => setViewerOpen(true)}
          ref={imageButton}
          type="button"
          variant="ghost"
        >
          {images.map((image, index) => (
            <img
              alt={image.alt}
              className="size-full object-contain"
              hidden={index !== currentIndex}
              key={image.url}
              loading={index === currentIndex ? "eager" : "lazy"}
              src={image.url}
            />
          ))}
        </Button>
      </div>
      {images[currentIndex]?.caption ? (
        <p className="text-center text-sm text-muted-foreground">
          {images[currentIndex].caption}
        </p>
      ) : null}
      <div className="grid grid-cols-3 items-center">
        {images.length > 1 ? (
          <GalleryNavigationButton
            direction="previous"
            onClick={showPrevious}
          />
        ) : null}
        <p
          aria-live="polite"
          className="justify-self-center text-sm text-muted-foreground"
        >
          {currentIndex + 1} / {images.length}
        </p>
        {images.length > 1 ? (
          <GalleryNavigationButton
            direction="next"
            className="justify-self-end"
            onClick={showNext}
          />
        ) : null}
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
          className="fixed top-0 left-0 z-[60] flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col items-center justify-center gap-4 rounded-none border-0 bg-black p-4 text-white sm:max-w-none"
          onKeyDown={(event) =>
            handleGalleryNavigationKey(event, showPrevious, showNext)
          }
          showCloseButton={false}
        >
          <Button
            aria-label="Close image viewer"
            className="absolute top-4 right-4"
            onClick={() => setViewerOpen(false)}
            ref={closeButton}
            type="button"
            variant="outline"
          >
            Close
          </Button>
          <img
            alt={images[currentIndex].alt}
            className="max-h-[calc(100dvh-10rem)] max-w-full object-contain"
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
            <p aria-live="polite" className="text-sm text-white/80">
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
