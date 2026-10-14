import { expect, test } from "@playwright/test";

const animatedSections = [
  "about",
  "highlights",
  "skills",
  "experience",
  "education",
];

test("content sections reveal when they enter the viewport and the hero stays visible", async ({
  page,
}) => {
  await page.goto("/");

  const hero = page.locator('[data-section="hero"]');
  await expect(hero).toBeVisible();
  await expect
    .poll(() => hero.evaluate((element) => getComputedStyle(element).opacity))
    .toBe("1");

  const about = page.locator('[data-section="about"]');
  await expect(about).toBeAttached();
  expect(
    await about.evaluate((element) => getComputedStyle(element).opacity),
  ).toBe("1");

  const education = page.locator('[data-section="education"]');
  await expect
    .poll(() =>
      education.evaluate((element) => getComputedStyle(element).opacity),
    )
    .toBe("0");
  expect(
    await education.evaluate(
      (element) => getComputedStyle(element).transitionDuration,
    ),
  ).toBe("0s");
  await education.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      education.evaluate((element) => getComputedStyle(element).opacity),
    )
    .toBe("1");
});

test("reduced motion shows every content section immediately without transitions", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  for (const section of animatedSections) {
    const element = page.locator(`[data-section="${section}"]`);
    await expect
      .poll(() => element.evaluate((node) => getComputedStyle(node).opacity))
      .toBe("1");
    await expect
      .poll(() =>
        element.evaluate((node) => getComputedStyle(node).transitionDuration),
      )
      .toBe("0s");
  }
});

test("sections remain visible when IntersectionObserver is unavailable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "IntersectionObserver", {
      configurable: true,
      value: undefined,
    });
  });
  await page.goto("/");

  for (const section of animatedSections) {
    const element = page.locator(`[data-section="${section}"]`);
    await expect
      .poll(() => element.evaluate((node) => getComputedStyle(node).opacity))
      .toBe("1");
  }
});
