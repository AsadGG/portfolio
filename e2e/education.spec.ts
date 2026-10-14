import { expect, test } from "@playwright/test";

test("Education shows the degree and institution without an empty date", async ({
  page,
}) => {
  await page.goto("/");

  const education = page.getByRole("region", { name: "Education" });
  await expect(
    education.getByRole("heading", { level: 2, name: "Education" }),
  ).toBeVisible();
  await expect(
    education.getByText("Bachelor of Science (BS)", { exact: true }),
  ).toBeVisible();
  await expect(
    education.getByText("Computer Software Engineering", { exact: true }),
  ).toBeVisible();
  await expect(
    education.getByText("University of Karachi", { exact: false }),
  ).toBeVisible();
  await expect(
    education.getByText("Karachi, Pakistan", { exact: true }),
  ).toBeVisible();
  await expect(education.getByText("–", { exact: true })).toHaveCount(0);
});

test("Education can retry its failed document while other sections remain available", async ({
  page,
}) => {
  let blocked = true;
  await page.route("**/content/education.json", async (route) => {
    if (!blocked) {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 503,
      contentType: "text/plain",
      body: "unavailable",
    });
  });

  await page.goto("/");
  const education = page.getByRole("region", { name: "Education" });
  const retry = education.getByRole("button", { name: "Retry" });
  await expect(retry).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry" })).toHaveCount(1);
  await expect(
    page.getByRole("region", { name: "Experience" }).getByRole("heading", {
      level: 2,
      name: "Experience",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Highlights" }).getByRole("heading", {
      level: 2,
      name: "Highlights",
    }),
  ).toBeVisible();

  blocked = false;
  await retry.click();
  await expect(
    education.getByRole("heading", { level: 2, name: "Education" }),
  ).toBeVisible();
});
