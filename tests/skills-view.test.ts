import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vite-plus/test";

import {
  createDataModule,
  GENERIC_CONTENT_ERROR_MESSAGE,
} from "../src/data/data-module";

const categories = [
  { id: "languages", name: "Programming Languages" },
  { id: "frontend", name: "Frontend" },
  { id: "testing", name: "Testing" },
  { id: "tools", name: "Tools and Platforms" },
  { id: "unused", name: "Unused Category" },
];

const skills = [
  {
    id: "typescript",
    name: "TypeScript",
    categoryId: "languages",
    listed: true,
  },
  {
    id: "javascript",
    name: "JavaScript",
    categoryId: "languages",
    listed: true,
  },
  { id: "react", name: "React", categoryId: "frontend", listed: true },
  {
    id: "tanstack-router",
    name: "TanStack Router",
    categoryId: "frontend",
    listed: false,
  },
  { id: "vitest", name: "Vitest", categoryId: "testing", listed: true },
  { id: "ky", name: "ky", categoryId: "tools", listed: false },
];

function envelope(data: unknown) {
  return new Response(
    JSON.stringify({
      statusCode: 200,
      message: "Skills loaded",
      data,
      pagination: {
        currentPage: 1,
        lastPage: 1,
        nextPage: null,
        pageSize: Array.isArray(data) ? data.length : 1,
        previousPage: null,
        total: Array.isArray(data) ? data.length : 1,
      },
    }),
    { status: 200 },
  );
}

function requestPath(input: RequestInfo | URL) {
  return new URL(input instanceof Request ? input.url : String(input)).pathname;
}

function createModule(fetchImplementation?: typeof globalThis.fetch) {
  return createDataModule({
    baseUrl: "http://content.test/",
    fetch:
      fetchImplementation ??
      (async (input) => {
        const path = requestPath(input);
        return envelope(
          path.endsWith("skill-categories.json") ? categories : skills,
        );
      }),
    queryClient: new QueryClient(),
    retries: false,
  });
}

describe("Skills section view", () => {
  it("returns listed Skills grouped in document order and omits empty categories", async () => {
    const module = createModule();

    await expect(module.getSkillsSection()).resolves.toMatchObject({
      status: "ready",
      data: [
        {
          id: "languages",
          name: "Programming Languages",
          skills: [
            { id: "typescript", name: "TypeScript" },
            { id: "javascript", name: "JavaScript" },
          ],
        },
        {
          id: "frontend",
          name: "Frontend",
          skills: [{ id: "react", name: "React" }],
        },
        {
          id: "testing",
          name: "Testing",
          skills: [{ id: "vitest", name: "Vitest" }],
        },
      ],
    });
  });

  it.each(["skill-categories.json", "skills.json"])(
    "returns an error when %s fails",
    async (failedDocument) => {
      const module = createModule(async (input) => {
        const path = requestPath(input);
        if (path.endsWith(failedDocument)) {
          return new Response("unavailable", { status: 503 });
        }
        return envelope(
          path.endsWith("skill-categories.json") ? categories : skills,
        );
      });

      await expect(module.getSkillsSection()).resolves.toMatchObject({
        status: "error",
        message: GENERIC_CONTENT_ERROR_MESSAGE,
      });
    },
  );

  it("retries both Skills documents and recovers when both become available", async () => {
    let available = false;
    const calls = new Map<string, number>();
    const module = createModule(async (input) => {
      const path = requestPath(input);
      calls.set(path, (calls.get(path) ?? 0) + 1);
      if (!available) return new Response("unavailable", { status: 503 });
      return envelope(
        path.endsWith("skill-categories.json") ? categories : skills,
      );
    });

    const failed = await module.getSkillsSection();
    expect(failed.status).toBe("error");
    available = true;
    if (failed.status === "error") await failed.retry();

    await expect(module.getSkillsSection()).resolves.toMatchObject({
      status: "ready",
    });
    expect(calls.get("/skill-categories.json")).toBe(2);
    expect(calls.get("/skills.json")).toBe(2);
  });

  it("omits a Skill with an unknown category and warns once", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const module = createModule(async (input) => {
        const path = requestPath(input);
        return envelope(
          path.endsWith("skill-categories.json")
            ? [{ id: "frontend", name: "Frontend" }]
            : [
                {
                  id: "orphan-skill",
                  name: "Orphan Skill",
                  categoryId: "missing-category",
                  listed: true,
                },
              ],
        );
      });

      const first = await module.getSkillsSection();
      const second = await module.getSkillsSection();

      expect(first.status).toBe("ready");
      expect(second.status).toBe("ready");
      if (first.status === "ready") expect(first.data).toEqual([]);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain("orphan-skill");
      expect(warn.mock.calls[0][0]).toContain("missing-category");
    } finally {
      warn.mockRestore();
    }
  });
});
