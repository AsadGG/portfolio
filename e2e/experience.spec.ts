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
    "Sunday Market",
    "WedWise",
    "Private Crypto Mining Club (PCMC)",
    "Azaad",
    "Siddiq & Sons",
    "Sports Fan",
    "New Earth",
    "Fit and Fight",
    "MD AIDer",
    "ViraCore Browser",
    "UR Salon",
    "UR Laundry",
  ]);
  const cimple = experience
    .getByRole("heading", { level: 3, name: "2Cimple" })
    .locator("xpath=..");
  await expect(cimple.getByRole("heading", { level: 4 })).toHaveText(["Nano"]);
  await expect(urapp.getByText("React", { exact: true }).first()).toBeVisible();
  await expect(urapp.getByText("ky", { exact: true }).first()).toBeVisible();

  const freelance = experience
    .getByRole("heading", { level: 3, name: "Freelance" })
    .locator("xpath=..");
  await expect(freelance.getByRole("heading", { level: 4 })).toHaveText([
    "Gripsun Privilege Club",
    "DOWC",
    "BUTT-EMS",
    "Rameen Solar",
    "Inverex Loyalty",
  ]);
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
  await wedWiseCard.scrollIntoViewIfNeeded();
  const thumbnail = wedWiseCard.getByRole("img");
  await expect(thumbnail).toHaveAttribute(
    "alt",
    "WedWise Web app screen for Sign Up Setup Password 1.",
  );
  await expect
    .poll(() =>
      thumbnail.evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBeGreaterThan(0);

  const cryptoCard = experience
    .getByRole("heading", {
      level: 4,
      name: "Private Crypto Mining Club (PCMC)",
    })
    .locator("xpath=../..");
  await cryptoCard.scrollIntoViewIfNeeded();
  const pcmcThumbnail = cryptoCard.getByRole("img");
  await expect(pcmcThumbnail).toHaveAttribute(
    "alt",
    "Private Crypto Mining Club (PCMC) Customer app screen for Registration.",
  );
  await expect
    .poll(() =>
      pcmcThumbnail.evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBeGreaterThan(0);
});

test("Gripsun card combines Part Skills and uses its Web Console image", async ({
  page,
}) => {
  await page.goto("/");

  const experience = page.locator("#experience");
  const gripsunCard = experience
    .getByRole("heading", { level: 4, name: "Gripsun Privilege Club" })
    .locator("xpath=../..");
  const skills = gripsunCard.getByRole("list", {
    name: "Skills used in Gripsun Privilege Club",
  });

  await expect(skills.getByText("Fastify", { exact: true })).toBeVisible();
  await expect(skills.getByText("Playwright", { exact: true })).toBeVisible();
  await expect(skills.getByText("Expo", { exact: true })).toBeVisible();

  const thumbnail = gripsunCard.getByRole("img", {
    name: "Gripsun Privilege Club Web Console screen for Login.",
  });
  await thumbnail.scrollIntoViewIfNeeded();
  await expect(thumbnail).toHaveAttribute(
    "src",
    /images\/gripsun\/admin-console\/38-login\.webp$/,
  );
  await expect
    .poll(() =>
      thumbnail.evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBeGreaterThan(0);
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
