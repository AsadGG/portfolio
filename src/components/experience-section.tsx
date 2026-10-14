import { useExperience } from "../data/experience-view";
import { SectionState } from "./section-state";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

export function ExperienceSection() {
  const experience = useExperience();

  return (
    <div className="py-16" id="experience">
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
                        <li key={project.id}>
                          <Card className="h-full">
                            <CardHeader>
                              <h4 className="text-base font-semibold tracking-tight">
                                {project.name}
                              </h4>
                              {project.clientName ? (
                                <p className="text-muted-foreground">
                                  Client: {project.clientName}
                                </p>
                              ) : null}
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <p className="leading-relaxed text-muted-foreground">
                                {project.summary}
                              </p>
                              <ul
                                aria-label={`Skills used in ${project.name}`}
                                className="flex flex-wrap gap-2"
                              >
                                {project.skills.map((skill) => (
                                  <li key={skill}>
                                    <Badge variant="secondary">{skill}</Badge>
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
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
    </div>
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
