import { copyFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const shellPath = fileURLToPath(
  new URL("../dist/client/_shell.html", import.meta.url),
);
const indexPath = fileURLToPath(
  new URL("../dist/client/index.html", import.meta.url),
);
const notFoundPath = fileURLToPath(
  new URL("../dist/client/404.html", import.meta.url),
);

await copyFile(shellPath, indexPath);
await copyFile(shellPath, notFoundPath);
await rm(shellPath);

console.log("GitHub Pages files prepared in dist/client/");
