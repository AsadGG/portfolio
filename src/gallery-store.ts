import { useSyncExternalStore } from "react";

/** A Project thumbnail shown in the background's 3D gallery. */
export type GalleryItem = { id: string; name: string; src: string };

/**
 * The Experience section publishes its thumbnails here once it has mounted.
 * The root background reads them from here rather than subscribing to the
 * content itself: a root-level subscription starts the content requests
 * before the page hydrates, and early data makes hydration mismatch.
 */
const NO_ITEMS: GalleryItem[] = [];
let galleryItems = NO_ITEMS;
const listeners = new Set<() => void>();

function getGalleryItems() {
  return galleryItems;
}

function getServerGalleryItems() {
  return NO_ITEMS;
}

function subscribeToGalleryItems(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function sameItems(a: GalleryItem[], b: GalleryItem[]) {
  return (
    a.length === b.length &&
    a.every(
      (item, index) => item.id === b[index].id && item.src === b[index].src,
    )
  );
}

/** Replaces the items; a list equal to the current one is ignored. */
export function setGalleryItems(items: GalleryItem[]) {
  if (sameItems(galleryItems, items)) return;
  galleryItems = items.length === 0 ? NO_ITEMS : items;
  for (const listener of listeners) listener();
}

export function useGalleryItems(): GalleryItem[] {
  return useSyncExternalStore(
    subscribeToGalleryItems,
    getGalleryItems,
    getServerGalleryItems,
  );
}
