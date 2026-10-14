import { expect, test } from "@playwright/test";

test("Skills section shows ordered categories and omits Unlisted Skills", async ({
  page,
}) => {
  await page.goto("/");

  const section = page.getByRole("region", { name: "Skills" });
  await expect(
    section.getByRole("heading", { level: 2, name: "Skills" }),
  ).toBeVisible();
  await expect(section.getByRole("heading", { level: 3 }).first()).toHaveText(
    "Programming Languages",
  );
  await expect(
    section.getByRole("heading", { level: 3, name: "Testing" }),
  ).toBeVisible();
  await expect(section.getByText("Vitest", { exact: true })).toBeVisible();
  await expect(section.getByText("ky", { exact: true })).toHaveCount(0);
});

test("Skills and Experience can retry their shared Skills document", async ({
  page,
}) => {
  let blocked = true;
  await page.route("**/content/skills.json", async (route) => {
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
  const main = page.getByRole("main");
  const skills = page.getByRole("region", { name: "Skills" });
  const experience = page.locator("#experience");
  await expect(
    main.getByRole("heading", { level: 1, name: "Asad Ur Rahman" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Highlights" }).getByRole("heading", {
      level: 2,
      name: "Highlights",
    }),
  ).toBeVisible();
  const retry = skills.getByRole("button", { name: "Retry" });
  await expect(retry).toBeVisible();
  await expect(experience.getByRole("button", { name: "Retry" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry" })).toHaveCount(2);

  blocked = false;
  await retry.click();
  await expect(
    skills.getByRole("heading", { level: 2, name: "Skills" }),
  ).toBeVisible();
  await expect(
    experience.getByRole("heading", { level: 4, name: "WedWise" }),
  ).toBeVisible();
});
