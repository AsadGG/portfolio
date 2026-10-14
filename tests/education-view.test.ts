import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import {
  createDataModule,
  GENERIC_CONTENT_ERROR_MESSAGE,
} from "../src/data/data-module";

const education = {
  institution:
    "Umaer Basha Institute of Information Technology (UBIT), University of Karachi",
  degree: "Bachelor of Science (BS)",
  field: "Computer Software Engineering",
  location: "Karachi, Pakistan",
};

function createModule(record: unknown) {
  return createDataModule({
    baseUrl: "http://content.test/",
    fetch: async () =>
      new Response(
        JSON.stringify({
          statusCode: 200,
          message: "Education loaded",
          data: record,
        }),
        { status: 200 },
      ),
    queryClient: new QueryClient(),
    retries: false,
  });
}

describe("Education view", () => {
  it("formats both years", async () => {
    const module = createModule({
      ...education,
      startYear: 2017,
      endYear: 2021,
    });

    await expect(module.getEducation()).resolves.toMatchObject({
      status: "ready",
      data: { dateRange: "2017 – 2021" },
    });
  });

  it("formats an end year without a start year", async () => {
    const module = createModule({ ...education, endYear: 2021 });

    await expect(module.getEducation()).resolves.toMatchObject({
      status: "ready",
      data: { dateRange: "2021" },
    });
  });

  it("formats a start year without an end year as Present", async () => {
    const module = createModule({ ...education, startYear: 2017 });

    await expect(module.getEducation()).resolves.toMatchObject({
      status: "ready",
      data: { dateRange: "2017 – Present" },
    });
  });

  it("omits the date when neither year is present", async () => {
    const module = createModule(education);
    const view = await module.getEducation();

    expect(view.status).toBe("ready");
    if (view.status === "ready") {
      expect(view.data).not.toHaveProperty("dateRange");
    }
  });

  it("rejects a non-integer year", async () => {
    const module = createModule({ ...education, startYear: 2017.5 });

    await expect(module.getEducation()).resolves.toMatchObject({
      status: "error",
      message: GENERIC_CONTENT_ERROR_MESSAGE,
    });
  });
});
