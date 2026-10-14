import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { createDataModule } from "../src/data/data-module";

function envelope(data: unknown) {
  const total = Array.isArray(data) ? data.length : 1;
  return new Response(
    JSON.stringify({
      statusCode: 200,
      message: "Loaded",
      data,
      pagination: {
        currentPage: 1,
        lastPage: 1,
        nextPage: null,
        pageSize: total,
        previousPage: null,
        total,
      },
    }),
  );
}

function createModule() {
  const documents: Record<string, unknown> = {
    "projects.json": [
      {
        id: "wedwise",
        engagementId: "urapp",
        name: "WedWise",
        summary: "Wedding planning.",
        description: "Raw **markdown** description.",
        skillIds: ["react"],
        images: [{ src: "images/wedwise/main.svg", alt: "WedWise image" }],
        parts: [
          {
            id: "mobile",
            name: "Mobile",
            summary: "Mobile app.",
            description: "Raw Part markdown.",
            skillIds: ["native"],
            images: [{ src: "images/wedwise/mobile.svg", alt: "Mobile image" }],
          },
        ],
        role: "Full-stack engineer",
        links: { live: "https://wedwise.example" },
      },
    ],
    "engagements.json": [
      {
        id: "urapp",
        kind: "employment",
        companyName: "UrApp Technologies",
        start: "2024-01",
      },
    ],
    "skills.json": [
      { id: "react", name: "React", categoryId: "frontend", listed: true },
      {
        id: "native",
        name: "React Native",
        categoryId: "frontend",
        listed: false,
      },
    ],
  };
  return createDataModule({
    baseUrl: "https://content.example/",
    fetch: async (input) => {
      const url = input instanceof Request ? input.url : String(input);
      const path = new URL(url).pathname.split("/").at(-1) ?? "";
      return envelope(documents[path] ?? []);
    },
    queryClient: new QueryClient(),
    retries: false,
  });
}

describe("Project detail view", () => {
  it("returns the full Project with its resolved relationships and raw content", async () => {
    const view = await createModule().getProjectDetail("wedwise");

    expect(view).toEqual({
      status: "ready",
      data: {
        id: "wedwise",
        engagementId: "urapp",
        name: "WedWise",
        clientName: undefined,
        role: "Full-stack engineer",
        summary: "Wedding planning.",
        description: "Raw **markdown** description.",
        links: { live: "https://wedwise.example" },
        skillIds: ["react"],
        skills: ["React", "React Native"],
        images: [
          {
            src: "https://content.example/images/wedwise/main.svg",
            alt: "WedWise image",
          },
        ],
        parts: [
          {
            id: "mobile",
            name: "Mobile",
            summary: "Mobile app.",
            description: "Raw Part markdown.",
            skillIds: ["native"],
            skills: ["React Native"],
            images: [
              {
                src: "https://content.example/images/wedwise/mobile.svg",
                alt: "Mobile image",
              },
            ],
          },
        ],
      },
      retry: expect.any(Function),
    });
  });

  it("returns not found for an unknown Project id", async () => {
    await expect(
      createModule().getProjectDetail("missing"),
    ).resolves.toMatchObject({
      status: "not-found",
    });
  });
});
