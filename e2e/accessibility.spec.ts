import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const wcag21AA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function expectNoSeriousAxeViolations(
  page: import("@playwright/test").Page,
) {
  // Wait for entrance animations to settle. Looping animations and ones
  // driven by scroll position never finish on their own, so skip those.
  await page.evaluate(async () => {
    const animations = document.documentElement
      .getAnimations({ subtree: true })
      .filter(
        (animation) =>
          animation.timeline === document.timeline &&
          animation.effect?.getComputedTiming().iterations !== Infinity,
      );
    await Promise.all(
      animations.map((animation) => animation.finished.catch(() => undefined)),
    );
  });

  expect(
    await page
      .locator("img")
      .evaluateAll((images) =>
        images.every(
          (image) =>
            image instanceof HTMLImageElement && image.alt.trim().length > 0,
        ),
      ),
  ).toBe(true);

  const results = await new AxeBuilder({ page }).withTags(wcag21AA).analyze();
  const violations = results.violations.filter(
    ({ impact }) => impact === "serious" || impact === "critical",
  );

  expect(
    violations.map(({ id, impact, help, nodes }) => ({
      id,
      impact,
      help,
      targets: nodes.map(({ target }) => target),
      samples: nodes.slice(0, 2).map(({ target, failureSummary }) => ({
        target,
        failureSummary,
      })),
    })),
  ).toEqual([]);
}

test("accessible content states have no serious or critical axe violations", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Asad Ur Rahman" }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("heading", { level: 2 })).toHaveText(
    ["About", "Highlights", "Skills", "Experience", "Education"],
    { timeout: 15_000 },
  );
  await expect(page.getByRole("link", { name: "Open WedWise" })).toBeVisible({
    timeout: 15_000,
  });
  await expectNoSeriousAxeViolations(page);

  await page.getByRole("link", { name: "Open WedWise" }).click();
  await expect(page.getByRole("dialog", { name: "WedWise" })).toBeVisible();
  await expectNoSeriousAxeViolations(page);

  await page
    .getByRole("button", { name: "View image full screen" })
    .press("Enter");
  await expect(
    page.getByRole("dialog", { name: "Image viewer" }),
  ).toBeVisible();
  await expectNoSeriousAxeViolations(page);
  await page.keyboard.press("Escape");

  await page.goto("/?project=gripsun&part=web-console");
  await expect(page.getByRole("tab", { name: "Web Console" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expectNoSeriousAxeViolations(page);
});

test("keyboard navigation follows page order and restores focus from a trapped dialog", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Open WedWise" })).toBeVisible();

  const firstCard = page.getByRole("link", { name: "Open WedWise" });
  const focusOrder: string[] = [];
  for (let index = 0; index < 30; index += 1) {
    await page.keyboard.press("Tab");
    const current = await page.evaluate(() => {
      const active = document.activeElement;
      if (!(active instanceof HTMLElement)) return null;
      const nav = active.closest('nav[aria-label="Sections"]');
      const hero = active.closest('[data-section="hero"]');
      if (nav)
        return `nav:${active.getAttribute("aria-label") ?? active.textContent?.trim()}`;
      if (hero)
        return `hero:${active.getAttribute("aria-label") ?? active.textContent?.trim()}`;
      const card = active.getAttribute("aria-label");
      return card === "Open WedWise" ? "card:WedWise" : null;
    });
    if (current) focusOrder.push(current);
    if (
      await firstCard.evaluate((element) => element === document.activeElement)
    )
      break;
  }

  const navigationControlCount = await page
    .getByRole("navigation", { name: "Sections" })
    .getByRole("button")
    .count();
  const navigationIndexes = focusOrder.flatMap((item, index) =>
    item.startsWith("nav:") ? [index] : [],
  );
  const firstHeroIndex = focusOrder.findIndex((item) =>
    item.startsWith("hero:"),
  );
  expect(navigationIndexes).toHaveLength(navigationControlCount);
  expect(navigationIndexes.at(-1)).toBeLessThan(firstHeroIndex);
  expect(focusOrder.filter((item) => item.startsWith("hero:"))).toHaveLength(4);
  expect(focusOrder.at(-1)).toBe("card:WedWise");

  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "WedWise" });
  await expect(dialog).toBeVisible();
  for (let index = 0; index < 20; index += 1) {
    await page.keyboard.press("Shift+Tab");
    await expect
      .poll(() =>
        dialog.evaluate(
          (element) =>
            element.contains(document.activeElement) ||
            document.activeElement?.getAttribute("aria-label") === "Close",
        ),
      )
      .toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(firstCard).toBeFocused();
});

test("the page exposes the required heading outline and hides the background", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Asad Ur Rahman" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Asad Ur Rahman",
  );
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
  await expect(page.getByRole("heading", { level: 2 })).toHaveText([
    "About",
    "Highlights",
    "Skills",
    "Experience",
    "Education",
  ]);
  await expect(page.getByRole("heading", { level: 3 })).toContainText([
    "Programming Languages",
    "Frontend",
    "Mobile",
    "Backend and APIs",
    "Databases and Data Access",
    "State Management",
    "Testing",
    "Architecture and Development",
    "Tools and Platforms",
    "Web3",
    "UrApp Technologies",
    "2Cimple",
    "Freelance",
  ]);
  await expect(page.getByRole("heading", { level: 4 })).toHaveCount(
    await page.getByRole("link", { name: /^Open / }).count(),
  );
  await expect(
    page.getByRole("heading", { level: 4, name: "WedWise" }),
  ).toBeVisible();
  await expect(page.locator("[data-background]")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
});
