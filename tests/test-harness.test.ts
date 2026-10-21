import { expect, test } from "vite-plus/test";

test("Vitest runs in Node", () => {
  expect(process.versions.node).toBeDefined();
  expect(typeof window).toBe("undefined");
});
