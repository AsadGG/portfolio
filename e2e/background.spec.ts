import { expect, type Locator, test } from "@playwright/test";

function collectConsoleErrors(page: import("@playwright/test").Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

function canvasPixelRatio(canvas: Locator) {
  return canvas.evaluate((element) => {
    if (!(element instanceof HTMLCanvasElement)) {
      throw new Error("The background canvas was not rendered.");
    }
    const rect = element.getBoundingClientRect();
    return element.width / rect.width;
  });
}

test.describe("background quality tiers", () => {
  test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

  test("desktop uses high quality and renders at a DPR of 2", async ({
    page,
  }) => {
    await page.goto("/");

    const background = page.locator("[data-background]");
    await expect(background).toHaveAttribute("data-background", "canvas");
    await expect(background).toHaveAttribute("data-quality", "high");
    const canvas = background.locator("canvas");
    await expect(canvas).toBeAttached();
    await expect.poll(() => canvasPixelRatio(canvas)).toBe(2);
  });
});

test.describe("mobile background quality", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });

  test("uses low quality and renders at a DPR of 1.25", async ({ page }) => {
    await page.goto("/");

    const background = page.locator("[data-background]");
    await expect(background).toHaveAttribute("data-background", "canvas");
    await expect(background).toHaveAttribute("data-quality", "low");
    const canvas = background.locator("canvas");
    await expect(canvas).toBeAttached();
    await expect.poll(() => canvasPixelRatio(canvas)).toBeCloseTo(1.25, 1);
  });
});

test("the decorative background loads behind content and leaves contact links clickable", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page);
  await page.goto("/");

  const background = page.locator("[data-background]");
  await expect(background).toHaveAttribute("data-background", "canvas");
  await expect(background.locator("canvas")).toBeAttached();
  await expect(background).toHaveAttribute("aria-hidden", "true");

  const email = page.getByRole("main").getByRole("link", { name: "Email" });
  await expect(email).toHaveAttribute("href", "mailto:asadxero@gmail.com");
  await email.click();
  expect(errors).toEqual([]);
});

test("the canvas background stays error-free while scrolling the page", async ({
  page,
}) => {
  await page.goto("/");
  const background = page.locator("[data-background]");
  await expect(background).toHaveAttribute("data-background", "canvas");
  await expect(background.locator("canvas")).toBeAttached();
  await expect(
    page.getByRole("main").getByRole("heading", { level: 1 }),
  ).toBeVisible();
  await page.waitForLoadState("networkidle");

  const sectionNavigation = page
    .getByRole("navigation", { name: "Sections" })
    .first();
  const errors = collectConsoleErrors(page);

  for (const section of [
    { id: "about", label: "About" },
    { id: "highlights", label: "Highlights" },
    { id: "skills", label: "Skills" },
    { id: "experience", label: "Experience" },
    { id: "education", label: "Education" },
  ]) {
    await sectionNavigation
      .getByRole("button", { name: section.label })
      .click();
    await expect(
      page.locator(`[data-section="${section.id}"]`),
    ).toBeInViewport();
  }

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(
    page.getByRole("main").getByRole("heading", { level: 1 }),
  ).toBeInViewport();

  await page.evaluate(async () => {
    const step = Math.max(1, window.innerHeight * 0.8);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => window.setTimeout(resolve, 80));
    }
    window.scrollTo(0, 0);
  });

  expect(errors).toEqual([]);
});

test("without WebGL the gradient stays visible and the 3D chunk is not requested", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page);
  const scriptRequests: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "script") scriptRequests.push(request.url());
  });
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      contextType,
      ...args
    ) {
      if (contextType === "webgl" || contextType === "webgl2") return null;
      return Reflect.apply(getContext, this, [
        contextType,
        ...args,
      ]) as ReturnType<typeof getContext>;
    } as typeof HTMLCanvasElement.prototype.getContext;
  });

  await page.goto("/");

  const background = page.locator("[data-background]");
  await expect(background).toHaveAttribute("data-background", "gradient");
  const backgroundStyles = await background.evaluate((element) => {
    const styles = getComputedStyle(element);
    return {
      backgroundColor: styles.backgroundColor,
      backgroundImage: styles.backgroundImage,
    };
  });
  expect(backgroundStyles.backgroundImage).toContain("radial-gradient");
  expect(backgroundStyles.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  await expect(background.locator("canvas")).toHaveCount(0);
  await expect(
    page.getByRole("main").getByRole("heading", { level: 1 }),
  ).toBeVisible();
  expect(
    scriptRequests.some((url) => /background-scene|three|fiber/i.test(url)),
  ).toBe(false);
  expect(errors).toEqual([]);
});
