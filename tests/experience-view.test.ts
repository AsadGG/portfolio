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

function envelope(data: unknown) {
  const count = Array.isArray(data) ? data.length : 1;
  return new Response(
    JSON.stringify({
      statusCode: 200,
      message: "Engagements loaded",
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

function createModule(records: unknown) {
  return createDataModule({
    baseUrl: "http://content.test/",
    fetch: async () => envelope(records),
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
});
