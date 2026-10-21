import { expect, type Page, test } from "@playwright/test";

type ProjectDescription = {
  id: string;
  description?: string;
};

type ProjectImage = {
  src: string;
  alt: string;
  caption?: string;
};

type ProjectImages = {
  id: string;
  images: ProjectImage[];
  parts: Array<{ images: ProjectImage[] }>;
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

async function interceptProjectImages(
  page: Page,
  projectId: string,
  updateImages: (images: ProjectImage[]) => ProjectImage[],
) {
  await page.route("**/content/projects.json", async (route) => {
    const response = await route.fetch();
    const document = (await response.json()) as {
      data: ProjectImages[];
    };
    const project = document.data.find(({ id }) => id === projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);
    const part = project.parts.find(({ images }) => images.length > 0);
    if (project.images.length > 0) {
      project.images = updateImages(project.images);
    } else if (part) {
      part.images = updateImages(part.images);
    } else {
      throw new Error(`Project has no images: ${projectId}`);
    }
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

test("Project Parts are browsable in URL-backed tabs", async ({ page }) => {
  await page.goto("/?project=gripsun");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const tabs = dialog.getByRole("tablist");
  await expect(tabs.getByRole("tab")).toHaveText([
    "Web Console",
    "Mobile",
    "API",
  ]);
  const apiTab = dialog.getByRole("tab", { name: "API" });
  const consoleTab = dialog.getByRole("tab", { name: "Web Console" });
  await expect(consoleTab).toHaveAttribute("aria-selected", "true");
  await expect(
    dialog.getByRole("region", { name: "Web Console image gallery" }),
  ).toBeVisible();
  await expect(
    dialog
      .getByRole("region", { name: "Web Console image gallery" })
      .getByText("1 / 39"),
  ).toBeVisible();
  await expect(
    dialog.getByText(/React and TanStack staff console for products/),
  ).toBeVisible();
  await expect(
    dialog.getByRole("list", { name: "Skills used in Web Console" }),
  ).toContainText("React");

  const mobileTab = dialog.getByRole("tab", { name: "Mobile" });
  await consoleTab.focus();
  await page.keyboard.press("ArrowRight");
  await expect(mobileTab).toBeFocused();
  await mobileTab.click();
  await expect(page).toHaveURL(/part=mobile/);
  await expect(
    dialog.getByText(/Expo and React Native app for solar customers/),
  ).toBeVisible();

  await apiTab.click();
  await expect(page).toHaveURL(/part=api/);
  await expect(apiTab).toHaveAttribute("aria-selected", "true");
  await expect(
    dialog.getByText("Fastify, TypeScript, PostgreSQL and Kysely."),
  ).toBeVisible();
  await expect(
    dialog.getByText(
      "A shared Fastify and PostgreSQL API supports the member app and staff console.",
    ),
  ).toBeVisible();
  await expect(
    dialog.getByRole("list", { name: "Skills used in API" }),
  ).toContainText("Fastify");
  await expect(
    dialog.getByRole("region", { name: "API image gallery" }),
  ).toHaveCount(0);

  await page.goto("/?project=gripsun&part=mobile");
  await expect(dialog.getByRole("tab", { name: "Mobile" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(
    dialog.getByText(/Expo and React Native app for solar customers/),
  ).toBeVisible();

  await page.goto("/?project=gripsun&part=nope");
  await expect(
    dialog.getByRole("tab", { name: "Web Console" }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page).toHaveURL(/part=nope/);

  await page.goto("/?project=wedwise");
  const wedWiseDialog = page.getByRole("dialog");
  await expect(wedWiseDialog.getByRole("tablist")).toHaveCount(0);
  await expect(
    wedWiseDialog.getByRole("region", { name: "Web image gallery" }),
  ).toBeVisible();
});

test("Project dialog Images can be browsed with buttons and arrow keys", async ({
  page,
}) => {
  await page.goto("/?project=wedwise");
  const dialog = page.getByRole("dialog");
  const gallery = dialog.getByRole("region", { name: "Web image gallery" });

  await expect(gallery).toBeVisible();
  await expect(gallery.getByText("1 / 66")).toBeVisible();
  await expect(gallery.getByRole("img")).toHaveAttribute("alt", /.+/);
  await expect(gallery.locator("img").nth(1)).toHaveAttribute(
    "loading",
    "lazy",
  );
  await gallery.getByRole("button", { name: "Next image" }).click();
  await expect(gallery.getByText("2 / 66")).toBeVisible();
  const previousButton = gallery.getByRole("button", {
    name: "Previous image",
  });
  await previousButton.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(gallery.getByText("1 / 66")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(gallery.getByText("2 / 66")).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await expect(gallery.getByText("1 / 66")).toBeVisible();

  await page.keyboard.press("Tab");
  const nextButton = gallery.getByRole("button", { name: "Next image" });
  await expect(nextButton).toBeFocused();
  await expect(nextButton).toHaveClass(/focus-visible:ring-2/);
});

test("an Image opens a full-screen viewer and returns focus to the shared gallery position", async ({
  page,
}) => {
  await interceptProjectImages(page, "wedwise", (images) =>
    images.map((image, index) =>
      index === 0 ? { ...image, caption: "Planning overview" } : image,
    ),
  );

  await page.goto("/?project=wedwise");
  const dialog = page.getByRole("dialog");
  const gallery = dialog.getByRole("region", { name: "Web image gallery" });
  const imageControl = gallery.getByRole("button", {
    name: "View image full screen",
  });

  await page.keyboard.press("Tab");
  await expect(imageControl).toBeFocused();
  await page.keyboard.press("Enter");
  const viewer = page.getByRole("dialog", { name: "Image viewer" });
  await expect(viewer).toBeVisible();
  await expect(viewer.getByRole("img")).toHaveAttribute("alt", /.+/);
  await expect(viewer.getByText("Planning overview")).toBeVisible();
  await expect(viewer.getByText("1 / 66")).toBeVisible();
  await expect(
    viewer.getByRole("button", { name: "Previous image" }),
  ).toBeVisible();
  const nextButton = viewer.getByRole("button", { name: "Next image" });
  await expect(nextButton).toBeVisible();
  await expect(
    viewer.getByRole("button", { name: "Close image viewer" }),
  ).toBeVisible();
  await expect(
    viewer.getByRole("button", { name: "Close image viewer" }),
  ).toBeFocused();

  await nextButton.click();
  await expect(viewer.getByText("2 / 66")).toBeVisible();
  await viewer.getByRole("button", { name: "Previous image" }).click();
  await expect(viewer.getByText("1 / 66")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(viewer.getByText("2 / 66")).toBeVisible();
  await page.keyboard.press("Escape");

  await expect(viewer).toHaveCount(0);
  await expect(dialog).toBeVisible();
  await expect(gallery.getByText("2 / 66")).toBeVisible();
  await expect(
    gallery.getByRole("button", { name: "View image full screen" }),
  ).toBeFocused();
  await expect(page).toHaveURL(/project=wedwise/);

  await gallery.getByRole("button", { name: "View image full screen" }).click();
  await expect(viewer).toBeVisible();
  await expect(viewer.getByText("2 / 66")).toBeVisible();
  await viewer.getByRole("button", { name: "Close image viewer" }).click();
  await expect(viewer).toHaveCount(0);
  await expect(
    gallery.getByRole("button", { name: "View image full screen" }),
  ).toBeFocused();
});

test("a Part without Images has no gallery", async ({ page }) => {
  await page.goto("/?project=gripsun&part=api");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("tab", { name: "API" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(
    dialog.getByRole("region", { name: /image gallery/ }),
  ).toHaveCount(0);
});

test("a single Image shows its caption without carousel controls", async ({
  page,
}) => {
  await interceptProjectImages(page, "wedwise", (images) => [
    { ...images[0], caption: "Planning overview" },
  ]);

  await page.goto("/?project=wedwise");
  const gallery = page
    .getByRole("dialog")
    .getByRole("region", { name: "Web image gallery" });
  await expect(gallery.getByRole("img")).toHaveAttribute("alt", /.+/);
  await expect(gallery.getByText("Planning overview")).toBeVisible();
  await expect(
    gallery.getByRole("button", { name: "Previous image" }),
  ).toHaveCount(0);
  await expect(gallery.getByRole("button", { name: "Next image" })).toHaveCount(
    0,
  );
  await expect(
    gallery.getByRole("button", { name: "View image full screen" }),
  ).toBeVisible();
  await expect(gallery.getByText("1 / 1")).toBeVisible();
});

test("Project Descriptions render markdown with readable styling and safe links", async ({
  page,
}) => {
  await interceptProjectDescription(
    page,
    "wedwise",
    "WedWise uses [React Hook Form](https://react-hook-form.com/) for forms.\n\nThe workflow includes:\n\n- registration\n- planning\n- contracts\n- invoices\n- guest management",
  );
  await page.goto("/?project=wedwise");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  const description = dialog.getByTestId("markdown-content").first();
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
      .first()
      .getByText(/installer claims and cashback/),
  ).toBeVisible();
});

test("Project Description renders raw HTML as literal text and omits missing content", async ({
  page,
}) => {
  await interceptProjectDescription(page, "gripsun", undefined);

  await page.goto("/?project=gripsun&part=api");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/installer claims and cashback/)).toHaveCount(
    0,
  );
  await expect(
    dialog.getByText(
      "Vitest integration tests call real HTTP routes against PostgreSQL.",
    ),
  ).toBeVisible();
});

test("raw HTML in a Project Description is displayed literally", async ({
  page,
}) => {
  await interceptProjectDescription(page, "wedwise", "<b>x</b>");

  await page.goto("/?project=wedwise");
  const description = page.getByTestId("markdown-content").first();
  await expect(description).toHaveText("<b>x</b>");
  await expect(description.locator("b")).toHaveCount(0);
});

test("the Project dialog closes with its close button and browser back", async ({
  page,
}) => {
  await page.goto("/?project=wedwise&part=web");
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
