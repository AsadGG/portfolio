import { expect, type Locator } from "@playwright/test";

const contactLinks = [
  { name: "Email", href: "mailto:asadxero@gmail.com" },
  { name: "+92 310 2167445", href: "tel:+923102167445" },
  {
    name: "GitHub",
    href: "https://github.com/AsadGG",
    target: "_blank",
    rel: "noopener noreferrer",
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/asad-ur-rahman-20608a272",
    target: "_blank",
    rel: "noopener noreferrer",
  },
] as const;

export async function expectContactLinks(container: Locator) {
  for (const contactLink of contactLinks) {
    const link = container.getByRole("link", { name: contactLink.name });
    await expect(link).toHaveAttribute("href", contactLink.href);

    if ("target" in contactLink) {
      await expect(link).toHaveAttribute("target", contactLink.target);
      await expect(link).toHaveAttribute("rel", contactLink.rel);
    }
  }
}
