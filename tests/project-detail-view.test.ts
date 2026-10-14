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

function createModule(
  parts: unknown[] = [
    {
      id: "mobile",
      name: "Mobile",
      summary: "Mobile app.",
      description: "Raw Part markdown.",
      skillIds: ["native"],
      images: [{ src: "images/wedwise/mobile.svg", alt: "Mobile image" }],
    },
  ],
) {
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
        parts,
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

  it("resolves Part Skills and Images in document order", async () => {
    const view = await createModule([
      {
        id: "api",
        name: "API",
        summary: "API summary.",
        description: "API details.",
        skillIds: ["react"],
        images: [{ src: "images/api.svg", alt: "API image" }],
      },
      {
        id: "admin-console",
        name: "Admin Console",
        summary: "Admin summary.",
        description: "Admin details.",
        skillIds: ["native"],
        images: [{ src: "images/admin.svg", alt: "Admin image" }],
      },
      {
        id: "mobile-app",
        name: "Mobile App",
        summary: "Mobile summary.",
        description: "Mobile details.",
        skillIds: ["react"],
        images: [{ src: "images/mobile.svg", alt: "Mobile image" }],
      },
    ]).getProjectDetail("wedwise");

    expect(view.status).toBe("ready");
    if (view.status !== "ready") throw new Error("Expected Project detail");
    expect(
      view.data.parts.map(({ id, skills, images }) => ({ id, skills, images })),
    ).toEqual([
      {
        id: "api",
        skills: ["React"],
        images: [
          { src: "https://content.example/images/api.svg", alt: "API image" },
        ],
      },
      {
        id: "admin-console",
        skills: ["React Native"],
        images: [
          {
            src: "https://content.example/images/admin.svg",
            alt: "Admin image",
          },
        ],
      },
      {
        id: "mobile-app",
        skills: ["React"],
        images: [
          {
            src: "https://content.example/images/mobile.svg",
            alt: "Mobile image",
          },
        ],
      },
    ]);
  });
});
