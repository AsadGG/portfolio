import { MenuIcon } from "lucide-react";
import { useProfile } from "../data/profile-view";
import { SECTION_IDS } from "../sections";
import { useActiveSection } from "../use-active-section";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

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

export function StickyHeader() {
  const profile = useProfile();
  const activeSection = useActiveSection();
  const name = profile.status === "ready" ? profile.data.name : "Portfolio";

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-white/10 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex h-full w-[min(1080px,calc(100%-2rem))] items-center justify-between gap-4">
        <Button
          className="max-w-[45vw] truncate text-sm text-foreground"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: getScrollBehavior(),
            })
          }
          variant="ghost"
        >
          {name}
        </Button>
        <nav aria-label="Sections" className="hidden sm:block">
          <ul className="flex items-center gap-1">
            {sections.map((section) => (
              <li key={section}>
                <SectionButton
                  {...getSectionLinkProps(
                    section,
                    activeSection,
                    "text-foreground",
                  )}
                  label={sectionLabel(section)}
                  onClick={() => scrollToSection(section)}
                />
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Sections" className="sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Open section menu"
              className="inline-flex size-9 items-center justify-center rounded-md text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              <MenuIcon aria-hidden="true" className="size-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              {sections.map((section) => (
                <DropdownMenuItem
                  key={section}
                  {...getSectionLinkProps(section, activeSection, "text-sm")}
                  onClick={() => scrollToSection(section)}
                >
                  {sectionLabel(section)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
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
      className={className}
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
  inactiveClassName: string,
) {
  const active = activeSection === section;
  return {
    "aria-current": active ? ("true" as const) : undefined,
    className: active
      ? [inactiveClassName, "text-primary"].join(" ")
      : inactiveClassName,
  };
}
