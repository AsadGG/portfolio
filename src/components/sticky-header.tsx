import { MenuIcon } from "lucide-react";
import { useProfile } from "../data/profile-view";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const sections = [
  { id: "about", label: "About" },
  { id: "highlights", label: "Highlights" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
  { id: "education", label: "Education" },
];

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
              <li key={section.id}>
                <SectionButton
                  label={section.label}
                  onClick={() => scrollToSection(section.id)}
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
                  key={section.id}
                  className="text-sm"
                  onClick={() => scrollToSection(section.id)}
                >
                  {section.label}
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
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <Button className="text-foreground" onClick={onClick} variant="ghost">
      {label}
    </Button>
  );
}
