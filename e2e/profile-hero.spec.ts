import { expect, test } from "@playwright/test";

test("Profile hero shows its content and safe contact links", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: "Asad Ur Rahman" }),
  ).toBeVisible();
  await expect(
    page.getByText("Senior Full-Stack Software Engineer"),
  ).toBeVisible();
  await expect(page.getByText("Karachi, Pakistan")).toBeVisible();
  await expect(page).toHaveTitle(
    "Asad Ur Rahman — Senior Full-Stack Software Engineer",
  );

  await expect(page.getByRole("link", { name: "Email" })).toHaveAttribute(
    "href",
    "mailto:asadxero@gmail.com",
  );
  await expect(
    page.getByRole("link", { name: "+92 310 2167445" }),
  ).toHaveAttribute("href", "tel:+923102167445");

  for (const [name, href] of [
    ["GitHub", "https://github.com/AsadGG"],
    ["LinkedIn", "https://www.linkedin.com/in/asad-ur-rahman-20608a272"],
  ]) {
    await expect(page.getByRole("link", { name })).toHaveAttribute(
      "href",
      href,
    );
    await expect(page.getByRole("link", { name })).toHaveAttribute(
      "target",
      "_blank",
    );
    await expect(page.getByRole("link", { name })).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
  }
});

test("Profile hero can retry after the Profile document fails", async ({
  page,
}) => {
  let blocked = true;
  let attempts = 0;
  await page.route("**/content/profile.json", async (route) => {
    attempts += 1;
    if (!blocked) {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        statusCode: 503,
        message: "Profile is temporarily unavailable.",
        code: "overloaded",
        requestId: "playwright-request",
      }),
    });
  });

  await page.goto("/");
  await expect(
    page.getByText("Profile is temporarily unavailable."),
  ).toBeVisible();
  const retry = page.getByRole("button", { name: "Retry" });
  await expect(retry).toBeVisible();
  expect(attempts).toBe(2);

  blocked = false;
  await retry.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { level: 1, name: "Asad Ur Rahman" }),
  ).toBeVisible();
});

test("Profile hero shows a skeleton while the Profile document is delayed", async ({
  page,
}) => {
  await page.route("**/content/profile.json", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.continue();
  });

  await page.goto("/");
  await expect(
    page.getByRole("status", { name: "Loading Profile" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1, name: "Asad Ur Rahman" }),
  ).toBeVisible();
});
