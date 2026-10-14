import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import {
  createDataModule,
  GENERIC_CONTENT_ERROR_MESSAGE,
} from "../src/data/data-module";

const engagements = [
  {
    id: "urapp",
    kind: "employment",
    companyName: "UrApp Technologies",
    start: "2024-01",
    location: "Karachi, Pakistan",
    summary:
      "Coordinates API integration work and designs reusable authentication and RBAC modules.",
  },
  {
    id: "2cimple",
    kind: "employment",
    companyName: "2Cimple",
    start: "2021-12",
    end: "2024-01",
    summary: "Developed production web applications in React and Angular.",
  },
  { id: "freelance", kind: "freelance", start: "2026-07", location: "Remote" },
];

function envelope(data: unknown, message = "Engagements loaded") {
  const count = Array.isArray(data) ? data.length : 1;
  return new Response(
    JSON.stringify({
      statusCode: 200,
      message,
      data,
      pagination: {
        currentPage: 1,
        lastPage: 1,
        nextPage: null,
        pageSize: count,
        previousPage: null,
        total: count,
      },
    }),
    { status: 200 },
  );
}

function createModule(
  records: unknown,
  projects: unknown = [],
  skills: unknown = [],
) {
  const documents: Record<string, unknown> = {
    "engagements.json": records,
    "projects.json": projects,
    "skills.json": skills,
  };
  return createDataModule({
    baseUrl: "http://content.test/",
    fetch: async (input) => {
      const url = input instanceof Request ? input.url : String(input);
      const path = new URL(url).pathname.split("/").at(-1) ?? "";
      return envelope(documents[path] ?? [], `${path} loaded`);
    },
    queryClient: new QueryClient(),
    retries: false,
  });
}

describe("Experience view", () => {
  it("keeps Freelance last even when it started after every Employment", async () => {
    const module = createModule(engagements);

    await expect(module.getExperience()).resolves.toMatchObject({
      status: "ready",
      data: [
        { heading: "UrApp Technologies" },
        { heading: "2Cimple" },
        { heading: "Freelance" },
      ],
    });
  });

  it("orders Employment newest first", async () => {
    const module = createModule([
      engagements[1],
      engagements[0],
      engagements[2],
    ]);

    await expect(module.getExperience()).resolves.toMatchObject({
      status: "ready",
      data: [
        { heading: "UrApp Technologies" },
        { heading: "2Cimple" },
        { heading: "Freelance" },
      ],
    });
  });

  it("formats an absent end as Present", async () => {
    const module = createModule(engagements);
    const view = await module.getExperience();

    expect(view.status).toBe("ready");
    if (view.status === "ready") {
      expect(
        view.data.find(({ heading }) => heading === "UrApp Technologies")
          ?.dateRange,
      ).toBe("Jan 2024 – Present");
    }
  });

  it("formats the 2Cimple date range with an en dash", async () => {
    const module = createModule(engagements);
    const view = await module.getExperience();

    expect(view.status).toBe("ready");
    if (view.status === "ready") {
      expect(
        view.data.find(({ heading }) => heading === "2Cimple")?.dateRange,
      ).toBe("Dec 2021 – Jan 2024");
    }
  });

  it("rejects Employment without a Company name", async () => {
    const module = createModule([
      { id: "broken", kind: "employment", start: "2024-01" },
    ]);

    await expect(module.getExperience()).resolves.toMatchObject({
      status: "error",
      message: GENERIC_CONTENT_ERROR_MESSAGE,
    });
  });

  it("groups Projects in document order and resolves their ordered Skills including Unlisted Skills", async () => {
    const module = createModule(
      engagements,
      [
        {
          id: "second-project",
          engagementId: "urapp",
          name: "Second Project",
          summary: "Second summary.",
          description: "Second description.",
          skillIds: ["ky", "react"],
          images: [
            {
              src: "images/second-project/first.svg",
              alt: "First project placeholder",
            },
            {
              src: "images/second-project/second.svg",
              alt: "Second project placeholder",
            },
          ],
          parts: [],
        },
        {
          id: "first-project",
          engagementId: "urapp",
          name: "First Project",
          summary: "First summary.",
          description: "First description.",
          skillIds: ["typescript"],
          images: [],
          parts: [],
        },
        {
          id: "client-project",
          engagementId: "freelance",
          name: "Client Project",
          summary: "Client summary.",
          description: "Client description.",
          skillIds: ["ky"],
          clientName: "Client Name",
          images: [],
          parts: [],
        },
      ],
      [
        { id: "react", name: "React", categoryId: "frontend", listed: true },
        {
          id: "typescript",
          name: "TypeScript",
          categoryId: "language",
          listed: true,
        },
        { id: "ky", name: "ky", categoryId: "tools", listed: false },
      ],
    );

    const view = await module.getExperience();

    expect(view.status).toBe("ready");
    if (view.status === "ready") {
      expect(view.data[0].projects).toEqual([
        {
          id: "second-project",
          name: "Second Project",
          summary: "Second summary.",
          skills: ["ky", "React"],
          thumbnail: {
            src: "http://content.test/images/second-project/first.svg",
            alt: "First project placeholder",
          },
        },
        {
          id: "first-project",
          name: "First Project",
          summary: "First summary.",
          skills: ["TypeScript"],
          thumbnail: undefined,
        },
      ]);
      expect(view.data[2].projects).toEqual([
        {
          id: "client-project",
          name: "Client Project",
          summary: "Client summary.",
          clientName: "Client Name",
          skills: ["ky"],
          thumbnail: undefined,
        },
      ]);
    }
  });

  it("combines Project and Part Skills once in first-seen order", async () => {
    const module = createModule(
      engagements,
      [
        {
          id: "parts-project",
          engagementId: "urapp",
          name: "Parts Project",
          summary: "A Project with separate Parts.",
          description: "Project description.",
          skillIds: ["typescript", "docker"],
          images: [],
          parts: [
            {
              id: "api",
              name: "API",
              summary: "Fastify API.",
              description: "API description.",
              skillIds: ["fastify", "typescript"],
              images: [],
            },
            {
              id: "admin-console",
              name: "Admin Console",
              summary: "React admin console.",
              description: "Admin description.",
              skillIds: ["react", "playwright"],
              images: [],
            },
          ],
        },
      ],
      [
        {
          id: "typescript",
          name: "TypeScript",
          categoryId: "language",
          listed: true,
        },
        { id: "docker", name: "Docker", categoryId: "tools", listed: true },
        { id: "fastify", name: "Fastify", categoryId: "backend", listed: true },
        { id: "react", name: "React", categoryId: "frontend", listed: true },
        {
          id: "playwright",
          name: "Playwright",
          categoryId: "testing",
          listed: true,
        },
      ],
    );

    const view = await module.getExperience();

    expect(view.status).toBe("ready");
    if (view.status === "ready") {
      expect(view.data[0].projects[0].skills).toEqual([
        "TypeScript",
        "Docker",
        "Fastify",
        "React",
        "Playwright",
      ]);
    }
  });

  it("uses the first Part Image as a thumbnail when the Project has none", async () => {
    const module = createModule(engagements, [
      {
        id: "parts-project",
        engagementId: "urapp",
        name: "Parts Project",
        summary: "A Project with separate Parts.",
        description: "Project description.",
        skillIds: [],
        images: [],
        parts: [
          {
            id: "api",
            name: "API",
            summary: "API summary.",
            description: "API description.",
            skillIds: [],
            images: [],
          },
          {
            id: "admin-console",
            name: "Admin Console",
            summary: "Admin summary.",
            description: "Admin description.",
            skillIds: [],
            images: [
              {
                src: "images/gripsun/admin-console/admin.svg",
                alt: "Admin Console placeholder",
              },
            ],
          },
        ],
      },
    ]);

    const view = await module.getExperience();

    expect(view.status).toBe("ready");
    if (view.status === "ready") {
      expect(view.data[0].projects[0].thumbnail).toEqual({
        src: "http://content.test/images/gripsun/admin-console/admin.svg",
        alt: "Admin Console placeholder",
      });
    }
  });

  it("keeps the Project Image ahead of Part Images and has no thumbnail when neither has one", async () => {
    const module = createModule(engagements, [
      {
        id: "project-image-first",
        engagementId: "urapp",
        name: "Project Image First",
        summary: "Project image takes precedence.",
        description: "Project description.",
        skillIds: [],
        images: [{ src: "images/project.svg", alt: "Project placeholder" }],
        parts: [
          {
            id: "mobile-app",
            name: "Mobile App",
            summary: "Mobile summary.",
            description: "Mobile description.",
            skillIds: [],
            images: [{ src: "images/part.svg", alt: "Part placeholder" }],
          },
        ],
      },
      {
        id: "no-image",
        engagementId: "urapp",
        name: "No Image",
        summary: "No images.",
        description: "Description.",
        skillIds: [],
        images: [],
        parts: [
          {
            id: "api",
            name: "API",
            summary: "API summary.",
            description: "API description.",
            skillIds: [],
            images: [],
          },
        ],
      },
    ]);

    const view = await module.getExperience();

    expect(view.status).toBe("ready");
    if (view.status === "ready") {
      expect(view.data[0].projects[0].thumbnail).toEqual({
        src: "http://content.test/images/project.svg",
        alt: "Project placeholder",
      });
      expect(view.data[0].projects[1].thumbnail).toBeUndefined();
    }
  });

  it("requires a Description when a Project has no Parts", async () => {
    const module = createModule(engagements, [
      {
        id: "missing-description",
        engagementId: "urapp",
        name: "Missing Description",
        summary: "Summary.",
        skillIds: [],
        images: [],
        parts: [],
      },
    ]);

    await expect(module.getExperience()).resolves.toMatchObject({
      status: "error",
      message: GENERIC_CONTENT_ERROR_MESSAGE,
    });
  });

  it("accepts a Project without a Description when it has Parts", async () => {
    const module = createModule(engagements, [
      {
        id: "parts-only-description",
        engagementId: "urapp",
        name: "Parts Only Description",
        summary: "Summary.",
        skillIds: [],
        images: [],
        parts: [
          {
            id: "api",
            name: "API",
            summary: "API summary.",
            description: "API description.",
            skillIds: [],
            images: [],
          },
        ],
      },
    ]);

    const view = await module.getExperience();

    expect(view.status).toBe("ready");
    if (view.status === "ready") {
      expect(view.data[0].projects).toContainEqual(
        expect.objectContaining({ name: "Parts Only Description" }),
      );
    }
  });
});
