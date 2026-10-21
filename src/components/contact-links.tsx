import { cn } from "cn";
import { ArrowUpRightIcon, MailIcon, PhoneIcon } from "lucide-react";

import { GitHubIcon, LinkedInIcon } from "#/components/brand-icons";
import { buttonVariants } from "#/components/ui/button";
import type { Profile } from "#/data/data-module";

const pillClassName =
  "group/contact h-11 gap-2 rounded-full px-5 text-sm [&_svg:not([class*='size-'])]:size-4";

const secondaryPillClassName = cn(
  buttonVariants({ variant: "outline", size: "lg" }),
  pillClassName,
  "border-white/12 bg-white/3 text-foreground backdrop-blur-sm hover:border-white/25 hover:bg-white/8",
);

const compactLinkClassName =
  "inline-flex items-center gap-2 rounded-full text-sm text-muted-foreground transition-colors hover:text-foreground [&_svg]:size-4";

export function ContactLinks({
  profile,
  variant = "hero",
  className,
}: {
  profile: Pick<Profile, "email" | "phone" | "github" | "linkedin">;
  variant?: "hero" | "compact";
  className?: string;
}) {
  const links = [
    {
      label: "Email",
      href: `mailto:${profile.email}`,
      icon: <MailIcon aria-hidden="true" />,
    },
    {
      label: profile.phone,
      href: `tel:${profile.phone.replace(/[^\d+]/g, "")}`,
      icon: <PhoneIcon aria-hidden="true" />,
    },
    {
      label: "GitHub",
      href: profile.github,
      icon: <GitHubIcon />,
      external: true,
    },
    {
      label: "LinkedIn",
      href: profile.linkedin,
      icon: <LinkedInIcon />,
      external: true,
    },
  ];

  return (
    <nav aria-label="Contact links" className={className}>
      <ul
        className={cn(
          "flex flex-wrap items-center",
          variant === "hero" ? "gap-3" : "gap-x-6 gap-y-3",
        )}
      >
        {links.map((link, index) => (
          <li key={link.href}>
            <a
              className={
                variant === "compact"
                  ? compactLinkClassName
                  : index === 0
                    ? cn(
                        buttonVariants({ size: "lg" }),
                        pillClassName,
                        "bg-linear-to-r from-primary to-violet text-primary-foreground shadow-[0_8px_30px_-8px_color-mix(in_oklab,var(--electric-cyan)_55%,transparent)] hover:bg-transparent hover:text-primary-foreground hover:shadow-[0_12px_40px_-8px_color-mix(in_oklab,var(--electric-violet)_70%,transparent)]",
                      )
                    : secondaryPillClassName
              }
              href={link.href}
              {...(link.external
                ? { rel: "noopener noreferrer", target: "_blank" }
                : {})}
            >
              {link.icon}
              {link.label}
              {variant === "hero" && index === 0 ? (
                <ArrowUpRightIcon
                  aria-hidden="true"
                  className="-mr-1 transition-transform duration-300 group-hover/contact:translate-x-0.5 group-hover/contact:-translate-y-0.5"
                />
              ) : null}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
