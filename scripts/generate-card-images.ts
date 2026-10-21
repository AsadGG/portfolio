/**
 * Writes a card-sized copy of every Project thumbnail and records it as the
 * image's `cardSrc` in projects.json. Project cards and the 3D gallery show a
 * thumbnail at around 370 CSS pixels wide, while the provided screens are up
 * to 3840 pixels wide, so the full images would waste megabytes.
 *
 * Copies mirror the source path under `cards/`, for example
 * `images/nano/splash.webp` becomes `cards/images/nano/splash.webp`.
 *
 * Run after adding or changing Project images: `pnpm images:cards`.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const CONTENT_DIR = path.resolve(import.meta.dirname, "../public/content");
const PROJECTS_FILE = path.join(CONTENT_DIR, "projects.json");
// Twice the widest card, for high-density screens.
const MAX_SIZE = 800;

type Image = { src: string; alt: string; caption?: string; cardSrc?: string };
type Part = { images: Image[] };
type Project = { id: string; images: Image[]; parts: Part[] };

const document = JSON.parse(await readFile(PROJECTS_FILE, "utf8")) as {
  data: Project[];
};

let written = 0;
for (const project of document.data) {
  for (const image of [
    ...project.images,
    ...project.parts.flatMap((part) => part.images),
  ]) {
    delete image.cardSrc;
  }

  // The same choice the data module makes for a Project card's thumbnail.
  const thumbnail =
    project.images[0] ??
    project.parts.find((part) => part.images.length > 0)?.images[0];
  if (!thumbnail) continue;

  const cardSrc = path.posix.join("cards", thumbnail.src);
  const target = path.join(CONTENT_DIR, cardSrc);
  await mkdir(path.dirname(target), { recursive: true });
  await sharp(path.join(CONTENT_DIR, thumbnail.src))
    .resize({
      width: MAX_SIZE,
      height: MAX_SIZE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toFile(target);

  thumbnail.cardSrc = cardSrc;
  written += 1;
}

await writeFile(PROJECTS_FILE, `${JSON.stringify(document, null, 2)}\n`);
console.log(`Wrote ${written} card images.`);
