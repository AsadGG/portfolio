import { expect, test } from "@playwright/test";
import { expectContactLinks } from "./contact-links";

test("Profile hero shows its content and safe contact links", async ({
  page,
}) => {
  await page.goto("/");
  const main = page.getByRole("main");

  await expect(
    main.getByRole("heading", { level: 1, name: "Asad Ur Rahman" }),
  ).toBeVisible();
  await expect(
    main.getByText("Senior Full-Stack Software Engineer"),
  ).toBeVisible();
  await expect(main.getByText("Karachi, Pakistan")).toBeVisible();
  await expect(page).toHaveTitle(
    "Asad Ur Rahman — Senior Full-Stack Software Engineer",
  );

  await expectContactLinks(main);
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
  const main = page.getByRole("main");
  await expect(
    main.getByText("Profile is temporarily unavailable."),
  ).toBeVisible();
  const retry = main.getByRole("button", { name: "Retry" });
  await expect(retry).toBeVisible();
  expect(attempts).toBe(2);

  blocked = false;
  await retry.focus();
  await page.keyboard.press("Enter");
  await expect(
    main.getByRole("heading", { level: 1, name: "Asad Ur Rahman" }),
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
    page.getByRole("main").getByRole("status", { name: "Loading Profile" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("main")
      .getByRole("heading", { level: 1, name: "Asad Ur Rahman" }),
  ).toBeVisible();
});
