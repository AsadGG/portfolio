import { expect, test } from "@playwright/test";

test("section navigation stays visible and keeps headings clear of the header", async ({
  page,
}) => {
  await page.goto("/");

  const header = page.getByRole("banner");
  const navigation = header.getByRole("navigation", { name: "Sections" });
  const originalUrl = page.url();
  const skillsHeading = page.getByRole("heading", {
    level: 2,
    name: "Skills",
  });

  await navigation.getByRole("button", { name: "Skills" }).click();
  await expect
    .poll(async () => {
      const headerBottom = await header.evaluate(
        (element) => element.getBoundingClientRect().bottom,
      );
      const headingTop = await skillsHeading.evaluate(
        (element) => element.getBoundingClientRect().top,
      );
      return headingTop - headerBottom;
    })
    .toBeGreaterThanOrEqual(0);
  await expect(page).toHaveURL(originalUrl);

  await page.getByRole("button", { name: "Asad Ur Rahman" }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

  await page.getByRole("button", { name: "Education" }).click();
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0);
  await expect(header).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(header).toBeVisible();
  await expect
    .poll(() =>
      header.evaluate((element) => element.getBoundingClientRect().top),
    )
    .toBe(0);
});

test("the header tracks the section in the reading band", async ({ page }) => {
  await page.goto("/");

  const navigation = page.getByRole("navigation", { name: "Sections" });
  const currentLinks = navigation.locator('[aria-current="true"]');
  await expect(currentLinks).toHaveCount(0);

  await navigation.getByRole("button", { name: "Skills" }).click();
  const skills = navigation.getByRole("button", { name: "Skills" });
  await expect(skills).toHaveAttribute("aria-current", "true");
  await expect(currentLinks).toHaveCount(1);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const education = navigation.getByRole("button", { name: "Education" });
  await expect(education).toHaveAttribute("aria-current", "true");
  await expect(currentLinks).toHaveCount(1);
});

test("section navigation uses a compact menu on narrow screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const header = page.getByRole("banner");
  const navigation = header.getByRole("navigation", { name: "Sections" });
  await expect(navigation).toBeVisible();
  const menuButton = navigation.getByRole("button", {
    name: "Open section menu",
  });
  await expect(menuButton).toBeVisible();
  await menuButton.click();

  const education = page.getByRole("menuitem", { name: "Education" });
  await expect(education).toBeVisible();
  await education.click();
  await expect(education).toBeHidden();
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await menuButton.click();
  await expect(
    page.getByRole("menuitem", { name: "Education" }),
  ).toHaveAttribute("aria-current", "true");
});

test("section navigation scrolls instantly when reduced motion is requested", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await page
    .getByRole("navigation", { name: "Sections" })
    .getByRole("button", { name: "Skills" })
    .click();

  const headingTop = await page
    .getByRole("heading", { level: 2, name: "Skills" })
    .evaluate((element) => element.getBoundingClientRect().top);
  expect(headingTop).toBeGreaterThanOrEqual(0);
  expect(headingTop).toBeLessThan(200);
});
