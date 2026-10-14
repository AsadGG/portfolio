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
  intro:
    "Full-Stack Software Engineer with {years}+ years of experience developing and maintaining production web, mobile, and backend applications.",
};

function createModule(record: unknown) {
  return createDataModule({
    baseUrl: "http://content.test/",
    fetch: async () =>
      new Response(
        JSON.stringify({ statusCode: 200, message: "Profile", data: record }),
        { status: 200 },
      ),
    queryClient: new QueryClient(),
    retries: false,
  });
}

describe("Profile view", () => {
  it("returns the Profile record from an item document", async () => {
    const module = createModule(profile);

    await expect(module.getProfile()).resolves.toEqual({
      status: "success",
      data: profile,
    });
  });

  it("reports an error state when the Profile document is invalid", async () => {
    const module = createModule({ ...profile, email: 42 });

    await expect(module.getProfile()).resolves.toMatchObject({
      status: "error",
      data: undefined,
    });
  });
});
