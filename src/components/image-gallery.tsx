import { useState } from "react";
import { Button } from "./ui/button";

export type GalleryImage = {
  url: string;
  alt: string;
  caption?: string;
};

export function ImageGallery({
  images,
  label,
}: {
  images: GalleryImage[];
  label: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

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
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          showPrevious();
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          showNext();
        }
      }}
    >
      <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg border bg-muted/30">
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
      </div>
      {images[currentIndex]?.caption ? (
        <p className="text-center text-sm text-muted-foreground">
          {images[currentIndex].caption}
        </p>
      ) : null}
      <div className="grid grid-cols-3 items-center">
        {images.length > 1 ? (
          <Button
            aria-label="Previous image"
            onClick={showPrevious}
            type="button"
            variant="outline"
          >
            Previous
          </Button>
        ) : null}
        <p
          aria-live="polite"
          className="justify-self-center text-sm text-muted-foreground"
        >
          {currentIndex + 1} / {images.length}
        </p>
        {images.length > 1 ? (
          <Button
            aria-label="Next image"
            className="justify-self-end"
            onClick={showNext}
            type="button"
            variant="outline"
          >
            Next
          </Button>
        ) : null}
      </div>
    </section>
  );
}
