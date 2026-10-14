import { useSkillsSection } from "../data/skills-view";
import { SectionReveal } from "./section-reveal";
import { SectionState } from "./section-state";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";

export function SkillsSection() {
  const skills = useSkillsSection();

  return (
    <SectionReveal data-section="skills">
      <section aria-label="Skills" className="scroll-mt-16 py-16">
        <SectionState skeleton={<SkillsSkeleton />} state={skills}>
          {(categories) => (
            <div className="space-y-8">
              <h2
                className="scroll-mt-16 text-3xl font-semibold tracking-tight sm:text-4xl"
                id="skills"
              >
                Skills
              </h2>
              <div className="space-y-7">
                {categories.map((category) => (
                  <section
                    aria-labelledby={`skill-category-${category.id}`}
                    className="space-y-3"
                    key={category.id}
                  >
                    <h3
                      className="text-lg font-medium text-muted-foreground"
                      id={`skill-category-${category.id}`}
                    >
                      {category.name}
                    </h3>
                    <ul
                      aria-label={`${category.name} Skills`}
                      className="flex flex-wrap gap-2"
                    >
                      {category.skills.map((skill) => (
                        <li key={skill.id}>
                          <Badge
                            className="h-auto min-h-7 px-3 py-1 text-xs"
                            variant="secondary"
                          >
                            {skill.name}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </section>
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
    <section aria-label="Loading Skills" aria-busy="true" className="space-y-8">
      <Skeleton aria-hidden="true" className="h-9 w-40 rounded-full" />
      {["languages", "frontend", "testing"].map((category) => (
        <div className="space-y-3" key={category}>
          <Skeleton aria-hidden="true" className="h-5 w-48 rounded-full" />
          <div className="flex flex-wrap gap-2">
            {["one", "two", "three", "four", "five"].map((skill) => (
              <Skeleton
                aria-hidden="true"
                className="h-7 w-24 rounded-full"
                key={skill}
              />
            ))}
          </div>
        </div>
      ))}
      <span className="sr-only">Loading Skills</span>
    </section>
  );
}
