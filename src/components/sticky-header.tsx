import { cn } from "cn";
import { MailIcon, MenuIcon } from "lucide-react";

import { Button, buttonVariants } from "#/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { useProfile } from "#/data/profile-view";
import { SECTION_IDS } from "#/sections";
import { useActiveSection } from "#/use-active-section";

const sections = SECTION_IDS.filter((id) => id !== "hero");

function scrollToSection(id: string) {
  const section = document.getElementById(id);
  if (!section) return;

  section.scrollIntoView({
    behavior: getScrollBehavior(),
    block: "start",
  });
}

function getScrollBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "instant"
    : "smooth";
}

function initials(name: string) {
  const words = name.split(/\s+/).filter(Boolean);
  const ends = words.length > 1 ? [words[0], words[words.length - 1]] : words;
  return ends.map((word) => word[0].toUpperCase()).join("");
}

export function StickyHeader() {
  const profile = useProfile();
  const activeSection = useActiveSection();
  const name = profile.status === "ready" ? profile.data.name : "Portfolio";

  return (
    <header className="sticky top-0 z-50 h-16 bg-linear-to-b from-background/90 via-background/50 to-transparent">
      <div className="mx-auto flex h-full w-[min(1200px,calc(100%-1.5rem))] items-center">
        <div className="flex h-12 w-full items-center justify-between gap-3 rounded-full border border-white/8 bg-background/65 pr-1.5 pl-1.5 shadow-[0_10px_40px_-12px_rgb(0_0_0/0.6)] backdrop-blur-xl">
          <Button
            className="h-9 max-w-[60vw] gap-2.5 rounded-full pr-3.5 pl-1 text-sm font-medium text-foreground hover:bg-white/6"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: getScrollBehavior(),
              })
            }
            variant="ghost"
          >
            <span
              aria-hidden="true"
              className="grid size-7 shrink-0 place-items-center rounded-full bg-linear-to-br from-primary to-violet text-[11px] font-semibold tracking-tight text-primary-foreground"
            >
              {initials(name)}
            </span>
            <span className="truncate">{name}</span>
          </Button>
          <nav aria-label="Sections" className="hidden md:block">
            <ul className="flex items-center gap-0.5">
              {sections.map((section) => (
                <li key={section}>
                  <SectionButton
                    {...getSectionLinkProps(section, activeSection)}
                    label={sectionLabel(section)}
                    onClick={() => scrollToSection(section)}
                  />
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-1">
            {profile.status === "ready" ? (
              <a
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "hidden h-9 gap-2 rounded-full bg-foreground px-4 text-sm text-background hover:bg-foreground/85 hover:text-background lg:inline-flex",
                )}
                href={`mailto:${profile.data.email}`}
              >
                <MailIcon aria-hidden="true" />
                Let’s talk
              </a>
            ) : null}
            <nav aria-label="Sections" className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Open section menu"
                  className="inline-flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-white/8 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <MenuIcon aria-hidden="true" className="size-5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="min-w-52 rounded-2xl border border-white/10 bg-popover/95 p-1.5 backdrop-blur-xl"
                >
                  {sections.map((section) => (
                    <DropdownMenuItem
                      key={section}
                      {...getSectionLinkProps(section, activeSection)}
                      onClick={() => scrollToSection(section)}
                    >
                      {sectionLabel(section)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-0.5 origin-left animate-scroll-progress bg-linear-to-r from-primary via-sky-300 to-violet"
      />
    </header>
  );
}

function SectionButton({
  className,
  label,
  onClick,
  "aria-current": ariaCurrent,
}: {
  className: string;
  label: string;
  onClick: () => void;
  "aria-current": "true" | undefined;
}) {
  return (
    <Button
      aria-current={ariaCurrent}
      className={cn(
        "h-9 rounded-full px-3.5 text-[0.8125rem] font-medium text-muted-foreground transition-colors hover:bg-white/6 hover:text-foreground",
        className,
      )}
      onClick={onClick}
      variant="ghost"
    >
      {label}
    </Button>
  );
}

function sectionLabel(section: (typeof sections)[number]) {
  return section[0].toUpperCase() + section.slice(1);
}

function getSectionLinkProps(
  section: (typeof sections)[number],
  activeSection: (typeof SECTION_IDS)[number],
) {
  const active = activeSection === section;
  return {
    "aria-current": active ? ("true" as const) : undefined,
    className: active
      ? "bg-white/10 text-foreground hover:bg-white/10"
      : "text-sm md:text-[0.8125rem]",
  };
}
