import { expect, test } from "@playwright/test";

test("Project cards open a shareable dialog without losing scroll or card focus", async ({
  page,
}) => {
  await page.goto("/");
  const card = page.getByRole("link", { name: /WedWise/ });
  await card.scrollIntoViewIfNeeded();
  await card.focus();
  const scrollY = await page.evaluate(() => window.scrollY);

  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "WedWise" })).toBeVisible();
  await expect(page).toHaveURL(/project=wedwise/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scrollY);

  await page.reload();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).not.toHaveURL(/project=/);

  await card.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(card).toBeFocused();
});

test("the Project dialog closes with its close button and browser back", async ({
  page,
}) => {
  await page.goto("/?project=wedwise&part=mobile");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page).not.toHaveURL(/project=/);
  await expect(page).not.toHaveURL(/part=/);

  const card = page.getByRole("link", { name: /WedWise/ });
  await card.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.mouse.click(4, 4);
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await card.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(card).toBeFocused();
});

test("an unknown Project URL leaves the page open without a dialog", async ({
  page,
}) => {
  let releaseProjects!: () => void;
  const projectsReleased = new Promise<void>((resolve) => {
    releaseProjects = resolve;
  });
  await page.route("**/content/projects.json", async (route) => {
    await projectsReleased;
    await route.continue();
  });

  try {
    await page.goto("/?project=does-not-exist");
    await expect(
      page.getByRole("heading", { name: "Asad Ur Rahman" }),
    ).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  } finally {
    releaseProjects();
  }

  await expect(page.getByRole("link", { name: /WedWise/ })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
