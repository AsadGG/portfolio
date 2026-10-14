import { expect, test } from "@playwright/test";

test("About shows the current years of experience", async ({ page }) => {
  await page.goto("/");

  const about = page.locator('[data-section="about"]');
  await expect(
    about.getByRole("heading", { level: 2, name: "About" }),
  ).toBeVisible();
  await expect(about.getByText(/\d+\+ years/)).toBeVisible();
  await expect(about.getByText("{years}", { exact: false })).toHaveCount(0);
});

test("About can retry failed Engagements while the Profile hero stays visible", async ({
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
  const about = page.locator('[data-section="about"]');
  const retry = about.getByRole("button", { name: "Retry" });
  await expect(retry).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1, name: "Asad Ur Rahman" }),
  ).toBeVisible();

  blocked = false;
  await retry.click();
  await expect(
    about.getByRole("heading", { level: 2, name: "About" }),
  ).toBeVisible();
  await expect(about.getByText(/\d+\+ years/)).toBeVisible();
});
