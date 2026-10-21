import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vite-plus/test";

import {
  createDataModule,
  GENERIC_CONTENT_ERROR_MESSAGE,
} from "../src/data/data-module";

const highlights = [
  {
    id: "multi-tenant-platforms",
    title: "Multi-Tenant Platforms",
    text: "Delivered tenant-specific features across salon, healthcare, and crypto-mining products.",
  },
  {
    id: "end-to-end-ownership",
    title: "End-to-End Ownership",
    text: "Delivered full lifecycle features from UI workflows through backend authentication and RBAC.",
  },
];

function createModule(records: unknown) {
  return createDataModule({
    baseUrl: "http://content.test/",
    fetch: async () =>
      new Response(
        JSON.stringify({
          statusCode: 200,
          message: "Highlights loaded",
          data: records,
          pagination: {
            currentPage: 1,
            lastPage: 1,
            nextPage: null,
            pageSize: Array.isArray(records) ? records.length : 1,
            previousPage: null,
            total: Array.isArray(records) ? records.length : 1,
          },
        }),
        { status: 200 },
      ),
    queryClient: new QueryClient(),
    retries: false,
  });
}

describe("Highlights view", () => {
  it("returns Highlights in document order", async () => {
    const module = createModule(highlights);

    await expect(module.getHighlights()).resolves.toMatchObject({
      status: "ready",
      data: highlights,
    });
  });

  it("shows an error when a Highlight has no title", async () => {
    const module = createModule([{ ...highlights[0], title: undefined }]);

    await expect(module.getHighlights()).resolves.toMatchObject({
      status: "error",
      message: GENERIC_CONTENT_ERROR_MESSAGE,
    });
  });
});
