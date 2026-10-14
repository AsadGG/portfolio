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
