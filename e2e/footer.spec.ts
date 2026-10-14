import { expect, test } from "@playwright/test";
import { expectContactLinks } from "./contact-links";

test("footer is the last landmark and repeats the Profile contact links", async ({
  page,
}) => {
  await page.goto("/");

  const footer = page.getByRole("contentinfo");
  await expect(footer).toBeVisible();
  await expect(page.locator("main, footer").last()).toHaveJSProperty(
    "tagName",
    "FOOTER",
  );
  await expect(footer.getByText("Asad Ur Rahman")).toBeVisible();
  await expect(
    footer.getByText(new Date().getFullYear().toString()),
  ).toBeVisible();

  await expectContactLinks(footer);
});

test("footer can retry after the Profile document fails", async ({ page }) => {
  let blocked = true;
  await page.route("**/content/profile.json", async (route) => {
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
  const footer = page.getByRole("contentinfo");
  await expect(
    footer.getByText("Profile is temporarily unavailable."),
  ).toBeVisible();
  const retry = footer.getByRole("button", { name: "Retry" });
  await expect(retry).toBeVisible();

  blocked = false;
  await retry.click();
  await expect(footer.getByText("Asad Ur Rahman")).toBeVisible();
});
