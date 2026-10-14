import { expect, type Page, test } from "@playwright/test";

type ProjectDescription = {
  id: string;
  description?: string;
};

async function interceptProjectDescription(
  page: Page,
  projectId: string,
  description: string | undefined,
) {
  await page.route("**/content/projects.json", async (route) => {
    const response = await route.fetch();
    const document = (await response.json()) as {
      data: ProjectDescription[];
    };
    const project = document.data.find(({ id }) => id === projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);
    if (description === undefined) delete project.description;
    else project.description = description;
    await route.fulfill({ response, body: JSON.stringify(document) });
  });
}

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

test("Project dialog Images can be browsed with buttons and arrow keys", async ({
  page,
}) => {
  await page.goto("/?project=wedwise");
  const dialog = page.getByRole("dialog");
  const gallery = dialog.getByRole("region", { name: "WedWise image gallery" });

  await expect(gallery).toBeVisible();
  await expect(gallery.getByText("1 / 3")).toBeVisible();
  await expect(gallery.getByRole("img")).toHaveAttribute("alt", /.+/);
  await expect(gallery.locator("img").nth(1)).toHaveAttribute(
    "loading",
    "lazy",
  );
  await gallery.getByRole("button", { name: "Next image" }).click();
  await expect(gallery.getByText("2 / 3")).toBeVisible();
  const previousButton = gallery.getByRole("button", {
    name: "Previous image",
  });
  await previousButton.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(gallery.getByText("1 / 3")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(gallery.getByText("2 / 3")).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await expect(gallery.getByText("1 / 3")).toBeVisible();

  await page.keyboard.press("Tab");
  const nextButton = gallery.getByRole("button", { name: "Next image" });
  await expect(nextButton).toBeFocused();
  await expect(nextButton).toHaveClass(/focus-visible:ring-2/);
});

test("a Project without Images has no gallery", async ({ page }) => {
  await page.goto("/?project=crypto-mining-platform");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("region", { name: /image gallery/ }),
  ).toHaveCount(0);
});

test("a single Image shows its caption without carousel controls", async ({
  page,
}) => {
  await page.route("**/content/projects.json", async (route) => {
    const response = await route.fetch();
    const document = (await response.json()) as {
      data: Array<{
        id: string;
        images: Array<{ src: string; alt: string; caption?: string }>;
      }>;
    };
    const project = document.data.find(({ id }) => id === "wedwise");
    if (!project) throw new Error("WedWise Project not found");
    project.images = [{ ...project.images[0], caption: "Planning overview" }];
    await route.fulfill({ response, body: JSON.stringify(document) });
  });

  await page.goto("/?project=wedwise");
  const gallery = page
    .getByRole("dialog")
    .getByRole("region", { name: "WedWise image gallery" });
  await expect(gallery.getByRole("img")).toHaveAttribute("alt", /.+/);
  await expect(gallery.getByText("Planning overview")).toBeVisible();
  await expect(gallery.getByRole("button")).toHaveCount(0);
  await expect(gallery.getByText("1 / 1")).toBeVisible();
});

test("Project Descriptions render markdown with readable styling and safe links", async ({
  page,
}) => {
  await page.goto("/?project=wedwise");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  const description = dialog.getByTestId("markdown-content");
  await expect(description).toHaveClass(/prose/);
  await expect(description).toHaveClass(/prose-invert/);
  await expect(description.locator("ul > li")).toHaveCount(5);
  await expect(
    description.getByRole("link", { name: "React Hook Form" }),
  ).toHaveAttribute("target", "_blank");
  await expect(
    description.getByRole("link", { name: "React Hook Form" }),
  ).toHaveAttribute("rel", "noopener noreferrer");

  await page.goto("/?project=gripsun");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page
      .getByTestId("markdown-content")
      .getByText(/Installers claim fitted units/),
  ).toBeVisible();
});

test("Project Description renders raw HTML as literal text and omits missing content", async ({
  page,
}) => {
  await interceptProjectDescription(page, "gripsun", undefined);

  await page.goto("/?project=gripsun");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByTestId("markdown-content")).toHaveCount(0);
});

test("raw HTML in a Project Description is displayed literally", async ({
  page,
}) => {
  await interceptProjectDescription(page, "wedwise", "<b>x</b>");

  await page.goto("/?project=wedwise");
  const description = page.getByTestId("markdown-content");
  await expect(description).toHaveText("<b>x</b>");
  await expect(description.locator("b")).toHaveCount(0);
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
