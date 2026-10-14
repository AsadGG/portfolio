import { expect, test } from "@playwright/test";

test("home page has the portfolio title", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(
    "Asad Ur Rahman — Senior Full-Stack Software Engineer",
  );
});
