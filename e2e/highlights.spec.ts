import { expect, test } from "@playwright/test";

const highlightTitles = [
  "Multi-Tenant Platforms",
  "End-to-End Ownership",
  "Web & Mobile Synergy",
  "Crypto & Web3 Expertise",
  "Leadership in Integration",
];

test("Highlights section shows five titled cards", async ({ page }) => {
  await page.goto("/");

  const section = page.getByRole("region", { name: "Highlights" });
  await expect(section).toBeVisible();
  await expect(section.getByRole("heading", { level: 2 })).toHaveText(
    "Highlights",
  );
  await expect(section.locator('[data-slot="card"]')).toHaveCount(5);
  for (const title of highlightTitles) {
    await expect(
      section.getByRole("heading", { level: 3, name: title }),
    ).toBeVisible();
  }
});

test("Highlights can retry its own failed request while Profile remains visible", async ({
  page,
}) => {
  let blocked = true;
  await page.route("**/content/highlights.json", async (route) => {
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
  const highlights = page.locator("#highlights");
  await expect(
    main.getByRole("heading", { level: 1, name: "Asad Ur Rahman" }),
  ).toBeVisible();
  const retry = highlights.getByRole("button", { name: "Retry" });
  await expect(retry).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry" })).toHaveCount(1);

  blocked = false;
  await retry.click();
  await expect(
    page.getByRole("region", { name: "Highlights" }).getByRole("heading", {
      level: 2,
      name: "Highlights",
    }),
  ).toBeVisible();
});
