import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { createDataModule } from "../src/data/data-module";

const profile = {
  name: "Asad Ur Rahman",
  headline: "Senior Full-Stack Software Engineer",
  location: "Karachi, Pakistan",
  email: "asadxero@gmail.com",
  phone: "+92 310 2167445",
  github: "https://github.com/AsadGG",
  linkedin: "https://www.linkedin.com/in/asad-ur-rahman-20608a272",
  intro: "With {years}+ years of experience.",
};

const engagements = [
  { id: "urapp", kind: "employment", companyName: "UrApp", start: "2024-01" },
  {
    id: "2cimple",
    kind: "employment",
    companyName: "2Cimple",
    start: "2021-12",
  },
  { id: "freelance", kind: "freelance", start: "2026-07" },
];

function createModule(
  now: () => Date,
  intro = profile.intro,
  records = engagements,
  canLoadEngagements = () => true,
) {
  return createDataModule({
    baseUrl: "http://content.test/",
    fetch: async (input) => {
      const path = new URL(input instanceof Request ? input.url : String(input))
        .pathname;
      if (path.endsWith("engagements.json") && !canLoadEngagements()) {
        return new Response("unavailable", { status: 503 });
      }
      const data = path.endsWith("profile.json")
        ? { ...profile, intro }
        : records;
      return new Response(
        JSON.stringify({
          statusCode: 200,
          message: "Content loaded",
          data,
          ...(!path.endsWith("profile.json")
            ? {
                pagination: {
                  currentPage: 1,
                  lastPage: 1,
                  nextPage: null,
                  pageSize: records.length,
                  previousPage: null,
                  total: records.length,
                },
              }
            : {}),
        }),
        { status: 200 },
      );
    },
    queryClient: new QueryClient(),
    retries: false,
    now,
  });
}

describe("Intro view", () => {
  it("resolves years from the earliest Engagement at the injected date", async () => {
    const module = createModule(() => new Date("2026-10-14T12:00:00Z"));

    await expect(module.getIntro()).resolves.toMatchObject({
      status: "ready",
      data: "With 4+ years of experience.",
    });
  });

  it("reaches five full years on the earliest start month in 2026", async () => {
    const module = createModule(() => new Date("2026-12-01T00:00:00Z"));

    await expect(module.getIntro()).resolves.toMatchObject({
      status: "ready",
      data: "With 5+ years of experience.",
    });
  });

  it("returns Intro unchanged when it has no years token", async () => {
    const module = createModule(
      () => new Date("2026-10-14T00:00:00Z"),
      "A short introduction without a year count.",
      [],
    );

    await expect(module.getIntro()).resolves.toMatchObject({
      status: "ready",
      data: "A short introduction without a year count.",
    });
  });

  it("uses the earliest start across Engagement kinds and document order", async () => {
    const records = [
      {
        id: "urapp",
        kind: "employment",
        companyName: "UrApp",
        start: "2024-01",
      },
      { id: "freelance", kind: "freelance", start: "2020-11" },
      {
        id: "2cimple",
        kind: "employment",
        companyName: "2Cimple",
        start: "2021-12",
      },
    ];
    const module = createModule(
      () => new Date("2026-10-14T00:00:00Z"),
      profile.intro,
      records,
    );

    await expect(module.getIntro()).resolves.toMatchObject({
      status: "ready",
      data: "With 5+ years of experience.",
    });
  });

  it("fails Intro when Engagements fail while the Profile view stays ready", async () => {
    let canLoadEngagements = false;
    const module = createModule(
      () => new Date("2026-10-14T00:00:00Z"),
      profile.intro,
      engagements,
      () => canLoadEngagements,
    );

    const intro = await module.getIntro();
    expect(intro.status).toBe("error");
    await expect(module.getProfile()).resolves.toMatchObject({
      status: "ready",
      data: profile,
    });

    canLoadEngagements = true;
    if (intro.status === "error") await intro.retry();
    await expect(module.getIntro()).resolves.toMatchObject({
      status: "ready",
      data: "With 4+ years of experience.",
    });
  });
});
