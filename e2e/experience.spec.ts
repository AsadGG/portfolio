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

test("Experience shows ordered Project cards with Skill chips and Client names", async ({
  page,
}) => {
  await page.goto("/");

  const experience = page.locator("#experience");
  const urapp = experience
    .getByRole("heading", { level: 3, name: "UrApp Technologies" })
    .locator("xpath=..");
  await expect(urapp.getByRole("heading", { level: 4 })).toHaveText([
    "WedWise",
    "Laundry Operations App",
    "Salon & Healthcare Platform",
    "Crypto-Mining Platform",
  ]);
  await expect(urapp.getByText("React", { exact: true }).first()).toBeVisible();
  await expect(urapp.getByText("ky", { exact: true }).first()).toBeVisible();

  const freelance = experience
    .getByRole("heading", { level: 3, name: "Freelance" })
    .locator("xpath=..");
  await expect(
    freelance.getByRole("heading", {
      level: 4,
      name: "Gripsun Privilege Club",
    }),
  ).toBeVisible();
  await expect(
    freelance.getByText("Client: Gripsun", { exact: true }),
  ).toBeVisible();
});

test("Project cards show their first Image or a no-image placeholder", async ({
  page,
}) => {
  await page.goto("/");

  const experience = page.locator("#experience");
  const wedWiseCard = experience
    .getByRole("heading", { level: 4, name: "WedWise" })
    .locator("xpath=../..");
  const thumbnail = wedWiseCard.getByRole("img");
  await expect(thumbnail).toHaveAttribute(
    "alt",
    "Placeholder image for WedWise",
  );
  await expect
    .poll(() =>
      thumbnail.evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBeGreaterThan(0);

  const cryptoCard = experience
    .getByRole("heading", { level: 4, name: "Crypto-Mining Platform" })
    .locator("xpath=../..");
  await expect(cryptoCard.locator("img")).toHaveCount(0);
  const placeholder = cryptoCard.locator(
    '[aria-label="Placeholder image for Crypto-Mining Platform"]',
  );
  await expect(placeholder).toContainText("Placeholder");
  await expect(placeholder).toContainText("Crypto-Mining Platform");
});

test("Experience can retry a failed Project document without showing Retry elsewhere", async ({
  page,
}) => {
  let blocked = true;
  await page.route("**/content/projects.json", async (route) => {
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
  await expect(about.getByRole("button", { name: "Retry" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Retry" })).toHaveCount(1);

  blocked = false;
  await retry.click();
  await expect(
    experience.getByRole("heading", { level: 2, name: "Experience" }),
  ).toBeVisible();
  await expect(
    experience.getByRole("heading", { level: 4, name: "WedWise" }),
  ).toBeVisible();
});
