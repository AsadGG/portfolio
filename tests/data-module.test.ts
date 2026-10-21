import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vite-plus/test";
import { z } from "zod";

import {
  ContentError,
  createDataModule,
  GENERIC_CONTENT_ERROR_MESSAGE,
  projectSchema,
} from "../src/data/data-module";

const recordSchema = z.object({ id: z.string(), name: z.string() });

function createModule(
  body: unknown,
  status = 200,
  fetchImplementation: typeof globalThis.fetch = async () =>
    body instanceof Response
      ? body
      : new Response(JSON.stringify(body), { status }),
) {
  return createDataModule({
    baseUrl: "http://content.test/",
    fetch: fetchImplementation,
    queryClient: new QueryClient(),
    retries: false,
  });
}

describe("content document transport", () => {
  it("unwraps an item envelope to its record", async () => {
    const module = createModule({
      statusCode: 200,
      message: "Profile loaded",
      data: { id: "profile", name: "Asad" },
    });

    await expect(
      module.fetchItemDocument("profile.json", recordSchema),
    ).resolves.toEqual({
      id: "profile",
      name: "Asad",
    });
  });

  it("unwraps a list envelope to its records", async () => {
    const module = createModule({
      statusCode: 200,
      message: "Records loaded",
      data: [
        { id: "one", name: "First" },
        { id: "two", name: "Second" },
      ],
      pagination: {
        currentPage: 1,
        lastPage: 1,
        nextPage: null,
        pageSize: 2,
        previousPage: null,
        total: 2,
      },
    });

    await expect(
      module.fetchListDocument("records.json", recordSchema),
    ).resolves.toEqual([
      { id: "one", name: "First" },
      { id: "two", name: "Second" },
    ]);
  });

  it("rejects a Project Image with empty alt text", async () => {
    const module = createModule({
      statusCode: 200,
      message: "Projects loaded",
      data: [
        {
          id: "project",
          engagementId: "engagement",
          name: "Project",
          summary: "Summary",
          description: "Description",
          skillIds: [],
          images: [{ src: "images/project.svg", alt: "  " }],
          parts: [],
        },
      ],
      pagination: {
        currentPage: 1,
        lastPage: 1,
        nextPage: null,
        pageSize: 1,
        previousPage: null,
        total: 1,
      },
    });

    await expect(
      module.fetchListDocument("projects.json", projectSchema),
    ).rejects.toMatchObject({
      message: GENERIC_CONTENT_ERROR_MESSAGE,
    });
  });

  it("accepts optional role and URL links on a Project", () => {
    const project = {
      id: "project",
      engagementId: "engagement",
      name: "Project",
      summary: "Summary",
      description: "Description",
      skillIds: [],
      images: [],
      parts: [],
      role: "my role",
      links: {
        live: "https://example.com",
        repository: "https://github.com/example/project",
      },
    };

    expect(projectSchema.parse(project)).toMatchObject({
      role: "my role",
      links: project.links,
    });
    const { role: _role, links: _links, ...withoutOptionalFields } = project;
    expect(projectSchema.parse(withoutOptionalFields)).not.toHaveProperty(
      "links",
    );
  });

  it("rejects non-string roles and invalid Project link URLs", () => {
    const project = {
      id: "project",
      engagementId: "engagement",
      name: "Project",
      summary: "Summary",
      description: "Description",
      skillIds: [],
      images: [],
      parts: [],
    };

    expect(() => projectSchema.parse({ ...project, role: 42 })).toThrow();
    expect(() =>
      projectSchema.parse({ ...project, links: { live: "bad" } }),
    ).toThrow();
  });

  it("rejects a list envelope without pagination", async () => {
    const module = createModule({
      statusCode: 200,
      message: "Records loaded",
      data: [],
    });

    await expect(
      module.fetchListDocument("records.json", recordSchema),
    ).rejects.toMatchObject({
      name: "ContentError",
      message: GENERIC_CONTENT_ERROR_MESSAGE,
    });
  });

  it("rejects non-integer pagination fields", async () => {
    const module = createModule({
      statusCode: 200,
      message: "Records loaded",
      data: [],
      pagination: {
        currentPage: 1.5,
        lastPage: 1,
        nextPage: null,
        pageSize: 0,
        previousPage: null,
        total: 0,
      },
    });

    await expect(
      module.fetchListDocument("records.json", recordSchema),
    ).rejects.toMatchObject({
      message: GENERIC_CONTENT_ERROR_MESSAGE,
    });
  });

  it("rejects a record that does not match its schema", async () => {
    const module = createModule({
      statusCode: 200,
      message: "Profile loaded",
      data: { id: "profile", name: 42 },
    });

    await expect(
      module.fetchItemDocument("profile.json", recordSchema),
    ).rejects.toMatchObject({
      message: GENERIC_CONTENT_ERROR_MESSAGE,
    });
  });

  it("rejects an envelope whose status differs from the HTTP status", async () => {
    const module = createModule(
      {
        statusCode: 201,
        message: "Profile loaded",
        data: { id: "profile", name: "Asad" },
      },
      200,
    );

    await expect(
      module.fetchItemDocument("profile.json", recordSchema),
    ).rejects.toMatchObject({
      message: GENERIC_CONTENT_ERROR_MESSAGE,
    });
  });

  it("surfaces the message from a valid error envelope", async () => {
    const module = createModule(
      {
        statusCode: 503,
        message: "Content service is warming up.",
        code: "overloaded",
        requestId: "request-123",
      },
      503,
    );

    await expect(
      module.fetchItemDocument("profile.json", recordSchema),
    ).rejects.toBeInstanceOf(ContentError);
    await expect(
      module.fetchItemDocument("profile.json", recordSchema),
    ).rejects.toMatchObject({
      message: "Content service is warming up.",
    });
  });

  it("uses the generic message for an HTML 404 response", async () => {
    const module = createModule(
      new Response("<html>not found</html>", { status: 404 }),
    );

    await expect(
      module.fetchItemDocument("missing.json", recordSchema),
    ).rejects.toMatchObject({
      message: GENERIC_CONTENT_ERROR_MESSAGE,
    });
  });

  it("uses the generic message for network errors and keeps the cause", async () => {
    const networkError = new TypeError("Network unavailable");
    const module = createModule(undefined, 200, async () => {
      throw networkError;
    });

    await expect(
      module.fetchItemDocument("profile.json", recordSchema),
    ).rejects.toMatchObject({
      message: GENERIC_CONTENT_ERROR_MESSAGE,
      cause: networkError,
    });
  });
});
