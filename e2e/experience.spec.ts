import { expect, test } from "@playwright/test";

test("Experience lists Engagements in order with dates and location", async ({
  page,
}) => {
  await page.goto("/");

  const experience = page.locator("#experience");
  await expect(
    experience.getByRole("heading", { level: 2, name: "Experience" }),
  ).toBeVisible();
  await expect(experience.getByRole("heading", { level: 3 })).toHaveText([
    "UrApp Technologies",
    "2Cimple",
    "Freelance",
  ]);
  await expect(experience.getByText("Jan 2024 – Present")).toBeVisible();
  await expect(experience.getByText("Karachi, Pakistan")).toBeVisible();
});

test("Experience can retry its failed document while other sections remain available", async ({
  page,
}) => {
  let blocked = true;
  await page.route("**/content/engagements.json", async (route) => {
    if (!blocked) {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 503,
      contentType: "text/plain",
      body: "unavailable",
    });
  });

  await page.goto("/");
  const experience = page.locator("#experience");
  const about = page.locator('[data-section="about"]');
  const retry = experience.getByRole("button", { name: "Retry" });
  await expect(retry).toBeVisible();
  await expect(about.getByRole("button", { name: "Retry" })).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Skills" }).getByText("TypeScript"),
  ).toBeVisible();

  blocked = false;
  await retry.click();
  await expect(
    experience.getByRole("heading", { level: 2, name: "Experience" }),
  ).toBeVisible();
});
