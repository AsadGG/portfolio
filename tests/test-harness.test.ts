import { expect, test } from "vitest";

test("Vitest runs in Node", () => {
  expect(process.versions.node).toBeDefined();
  expect(typeof window).toBe("undefined");
});
