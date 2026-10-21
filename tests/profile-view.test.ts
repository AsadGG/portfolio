import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vite-plus/test";

import {
  createDataModule,
  GENERIC_CONTENT_ERROR_MESSAGE,
} from "../src/data/data-module";

const profile = {
  name: "Asad Ur Rahman",
  headline: "Senior Full-Stack Software Engineer",
  location: "Karachi, Pakistan",
  email: "asadxero@gmail.com",
  phone: "+92 310 2167445",
  github: "https://github.com/AsadGG",
  linkedin: "https://www.linkedin.com/in/asad-ur-rahman-20608a272",
  intro:
    "Full-Stack Software Engineer with {years}+ years of experience developing and maintaining production web, mobile, and backend applications.",
};

function createModule(fetchImplementation: typeof globalThis.fetch) {
  return createDataModule({
    baseUrl: "http://content.test/",
    fetch: fetchImplementation,
    queryClient: new QueryClient(),
    retries: false,
  });
}

function profileResponse(record: unknown) {
  return new Response(
    JSON.stringify({ statusCode: 200, message: "Profile", data: record }),
    {
      status: 200,
    },
  );
}

describe("Profile view", () => {
  it("returns the Profile record from an item document", async () => {
    const module = createModule(async () => profileResponse(profile));

    await expect(module.getProfile()).resolves.toMatchObject({
      status: "ready",
      data: profile,
    });
  });

  it("shows the generic message when the Profile document fails", async () => {
    const module = createModule(
      async () => new Response("not found", { status: 404 }),
    );

    const state = await module.getProfile();
    expect(state).toMatchObject({
      status: "error",
      message: GENERIC_CONTENT_ERROR_MESSAGE,
    });
    expect(state.status).toBe("error");
    if (state.status === "error") expect(state.retry).toBeTypeOf("function");
  });

  it("reports a schema-invalid Profile document as an error", async () => {
    const module = createModule(async () =>
      profileResponse({ ...profile, email: 42 }),
    );

    await expect(module.getProfile()).resolves.toMatchObject({
      status: "error",
      message: GENERIC_CONTENT_ERROR_MESSAGE,
    });
  });

  it("recovers after retrying a failed Profile fetch", async () => {
    let fixed = false;
    const module = createModule(async () =>
      fixed
        ? profileResponse(profile)
        : new Response("unavailable", { status: 503 }),
    );

    const failed = await module.getProfile();
    expect(failed.status).toBe("error");
    fixed = true;
    if (failed.status === "error") await failed.retry();

    await expect(module.getProfile()).resolves.toMatchObject({
      status: "ready",
      data: profile,
    });
  });

  it("shows the message from a Profile error envelope", async () => {
    const module = createModule(
      async () =>
        new Response(
          JSON.stringify({
            statusCode: 503,
            message: "Profile service unavailable.",
            code: "overloaded",
            requestId: "request-123",
          }),
          { status: 503 },
        ),
    );

    await expect(module.getProfile()).resolves.toMatchObject({
      status: "error",
      message: "Profile service unavailable.",
    });
  });
});
