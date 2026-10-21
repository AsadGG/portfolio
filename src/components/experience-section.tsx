import { Link } from "@tanstack/react-router";

import { SectionReveal } from "#/components/section-reveal";
import { SectionState } from "#/components/section-state";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import { useExperience } from "#/data/experience-view";

export function ExperienceSection({
  onProjectOpen,
}: {
  onProjectOpen?: (element: HTMLAnchorElement) => void;
}) {
  const experience = useExperience();

  return (
    <SectionReveal
      className="scroll-mt-16 py-16"
      data-section="experience"
      id="experience"
    >
      <SectionState skeleton={<ExperienceSkeleton />} state={experience}>
        {(engagements) => (
          <section aria-labelledby="experience-heading" className="space-y-8">
            <h2
              className="text-3xl font-semibold tracking-tight sm:text-4xl"
              id="experience-heading"
            >
              Experience
            </h2>
            <ul className="space-y-8">
              {engagements.map((engagement) => (
                <li className="space-y-2" key={engagement.id}>
                  <h3 className="text-xl font-semibold tracking-tight">
                    {engagement.heading}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {engagement.dateRange}
                    {engagement.location ? ` · ${engagement.location}` : ""}
                  </p>
                  {engagement.summary ? (
                    <p className="max-w-3xl leading-relaxed text-muted-foreground">
                      {engagement.summary}
                    </p>
                  ) : null}
                  {engagement.projects.length > 0 ? (
                    <ul className="grid gap-4 pt-2 sm:grid-cols-2 xl:grid-cols-3">
                      {engagement.projects.map((project) => (
                        <li className="flex h-full" key={project.id}>
                          <Link
                            aria-label={`Open ${project.name}`}
                            className="flex h-full w-full rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                            onClick={(event) =>
                              onProjectOpen?.(event.currentTarget)
                            }
                            resetScroll={false}
                            search={(previous) => ({
                              ...previous,
                              project: project.id,
                              part: undefined,
                            })}
                            to="/"
                          >
                            <Card className="h-full w-full">
                              {project.thumbnail ? (
                                <img
                                  alt={project.thumbnail.alt}
                                  className="aspect-[16/10] w-full object-cover"
                                  loading="lazy"
                                  src={project.thumbnail.src}
                                />
                              ) : (
                                <div
                                  aria-label={`Placeholder image for ${project.name}`}
                                  className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 bg-accent/20 px-4 text-center text-accent-foreground"
                                  role="img"
                                >
                                  <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                                    Placeholder
                                  </span>
                                  <span className="text-sm font-medium">
                                    {project.name}
                                  </span>
                                </div>
                              )}
                              <CardHeader className="min-h-20">
                                <h4 className="text-base font-semibold tracking-tight">
                                  {project.name}
                                </h4>
                                {project.clientName ? (
                                  <p className="text-muted-foreground">
                                    Client: {project.clientName}
                                  </p>
                                ) : null}
                              </CardHeader>
                              <CardContent className="flex flex-1 flex-col gap-4">
                                <p className="line-clamp-4 min-h-24 leading-relaxed text-muted-foreground">
                                  {project.summary}
                                </p>
                                <ul
                                  aria-label={`Skills used in ${project.name}`}
                                  className="mt-auto flex flex-wrap gap-2 pt-2"
                                >
                                  {project.skills.map((skill) => (
                                    <li key={skill}>
                                      <Badge variant="secondary">{skill}</Badge>
                                    </li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        )}
      </SectionState>
    </SectionReveal>
  );
}

function ExperienceSkeleton() {
  return (
    <section
      aria-label="Loading Experience"
      aria-busy="true"
      className="space-y-8"
    >
      <Skeleton aria-hidden="true" className="h-9 w-52 rounded-full" />
      <ul className="space-y-8">
        {["urapp", "2cimple", "freelance"].map((engagement) => (
          <li className="space-y-3" key={engagement}>
            <Skeleton aria-hidden="true" className="h-6 w-56 rounded-full" />
            <Skeleton aria-hidden="true" className="h-4 w-44 rounded-full" />
            <Skeleton
              aria-hidden="true"
              className="h-4 w-[min(36rem,90%)] rounded-full"
            />
          </li>
        ))}
      </ul>
      <span className="sr-only">Loading Experience</span>
    </section>
  );
}
