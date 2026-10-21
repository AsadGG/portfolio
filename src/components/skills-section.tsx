import { cn } from "cn";
import type { CSSProperties } from "react";

import { SectionHeading } from "#/components/section-heading";
import { SectionReveal } from "#/components/section-reveal";
import { SectionState } from "#/components/section-state";
import { SpotlightCard } from "#/components/spotlight-card";
import { Badge } from "#/components/ui/badge";
import { Skeleton } from "#/components/ui/skeleton";
import { useSkillsSection } from "#/data/skills-view";
import { revealClassName, revealOnView } from "#/reveal-on-view";

export function SkillsSection() {
  const skills = useSkillsSection();

  return (
    <SectionReveal data-section="skills">
      <section aria-label="Skills" className="py-20 sm:py-28">
        <SectionState skeleton={<SkillsSkeleton />} state={skills}>
          {(categories) => (
            <div className="space-y-12">
              <SectionHeading
                id="skills"
                index="03"
                lead="Languages, frameworks and tools across the stack, from interface to database."
              >
                Skills
              </SectionHeading>
              <div className="columns-1 gap-4 md:columns-2 xl:columns-3">
                {categories.map((category, index) => (
                  <SpotlightCard
                    className={cn(
                      "mb-4 break-inside-avoid gap-5",
                      revealClassName,
                    )}
                    key={category.id}
                    ref={revealOnView}
                    style={{ "--reveal-index": index % 3 } as CSSProperties}
                  >
                    <section
                      aria-labelledby={`skill-category-${category.id}`}
                      className="space-y-5"
                    >
                      <div className="flex items-baseline justify-between gap-4">
                        <h3
                          className="text-base font-semibold tracking-tight"
                          id={`skill-category-${category.id}`}
                        >
                          {category.name}
                        </h3>
                        <span
                          aria-hidden="true"
                          className="font-mono text-xs text-muted-foreground tabular-nums"
                        >
                          {String(category.skills.length).padStart(2, "0")}
                        </span>
                      </div>
                      <ul
                        aria-label={`${category.name} Skills`}
                        className="flex flex-wrap gap-2"
                      >
                        {category.skills.map((skill) => (
                          <li key={skill.id}>
                            <Badge
                              className="h-auto min-h-7 rounded-full border-white/10 bg-white/3 px-3 py-1 text-xs text-foreground/85 transition-colors duration-200 hover:border-primary/40 hover:bg-primary/10 hover:text-foreground"
                              variant="outline"
                            >
                              {skill.name}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    </section>
                  </SpotlightCard>
                ))}
              </div>
            </div>
          )}
        </SectionState>
      </section>
    </SectionReveal>
  );
}

function SkillsSkeleton() {
  return (
    <section
      aria-label="Loading Skills"
      aria-busy="true"
      className="space-y-12"
    >
      <div className="space-y-4">
        <Skeleton aria-hidden="true" className="h-3 w-16 rounded-full" />
        <Skeleton aria-hidden="true" className="h-12 w-40 rounded-full" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {["languages", "frontend", "testing"].map((category) => (
          <div
            className="space-y-5 rounded-2xl bg-card/70 p-6 ring-1 ring-white/8"
            key={category}
          >
            <Skeleton aria-hidden="true" className="h-5 w-40 rounded-full" />
            <div className="flex flex-wrap gap-2">
              {["one", "two", "three", "four", "five"].map((skill) => (
                <Skeleton
                  aria-hidden="true"
                  className="h-7 w-20 rounded-full"
                  key={skill}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading Skills</span>
    </section>
  );
}
