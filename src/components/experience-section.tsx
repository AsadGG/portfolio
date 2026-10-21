import { cn } from "cn";
import { MapPinIcon } from "lucide-react";
import { type CSSProperties, useEffect } from "react";

import { ProjectCard } from "#/components/project-card";
import { SectionHeading } from "#/components/section-heading";
import { SectionReveal } from "#/components/section-reveal";
import { SectionState } from "#/components/section-state";
import { Skeleton } from "#/components/ui/skeleton";
import { useExperience } from "#/data/experience-view";
import { setGalleryItems } from "#/gallery-store";
import { revealClassName, revealOnView } from "#/reveal-on-view";

export function ExperienceSection({
  onProjectOpen,
}: {
  onProjectOpen?: (element: HTMLAnchorElement) => void;
}) {
  const experience = useExperience();

  useEffect(() => {
    if (experience.status !== "ready") return;
    setGalleryItems(
      experience.data.flatMap((engagement) =>
        engagement.projects.flatMap((project) =>
          project.thumbnail
            ? [
                {
                  id: project.id,
                  name: project.name,
                  src: project.thumbnail.cardSrc ?? project.thumbnail.src,
                },
              ]
            : [],
        ),
      ),
    );
  }, [experience]);

  useEffect(() => () => setGalleryItems([]), []);

  return (
    <SectionReveal
      className="py-20 sm:py-28"
      data-section="experience"
      id="experience"
    >
      <SectionState skeleton={<ExperienceSkeleton />} state={experience}>
        {(engagements) => (
          <section aria-labelledby="experience-heading" className="space-y-16">
            <SectionHeading
              id="experience-heading"
              index="04"
              lead="Selected work, grouped by where it happened. Open any Project for the full story and screens."
            >
              Experience
            </SectionHeading>
            <ol className="relative space-y-20 before:absolute before:top-3 before:bottom-0 before:left-1.75 before:w-px before:bg-linear-to-b before:from-primary/60 before:via-white/10 before:to-transparent">
              {engagements.map((engagement) => (
                <li
                  className="relative grid gap-x-8 gap-y-3 pl-9 sm:pl-12 lg:grid-cols-[minmax(0,1fr)_auto]"
                  key={engagement.id}
                >
                  <span
                    aria-hidden="true"
                    className="absolute top-2.5 left-0 size-3.75 rounded-full border-2 border-primary bg-background shadow-[0_0_0_6px_color-mix(in_oklab,var(--electric-cyan)_12%,transparent),0_0_24px_color-mix(in_oklab,var(--electric-cyan)_45%,transparent)]"
                  />
                  <h3 className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
                    {engagement.heading}
                  </h3>
                  <p className="w-fit rounded-full border border-white/10 bg-white/3 px-3 py-1 font-mono text-xs text-muted-foreground lg:col-start-2 lg:row-start-1 lg:self-center">
                    {engagement.dateRange}
                  </p>
                  {engagement.location ? (
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground lg:col-span-2">
                      <MapPinIcon aria-hidden="true" className="size-3.5" />
                      {engagement.location}
                    </p>
                  ) : null}
                  {engagement.summary ? (
                    <p className="max-w-3xl leading-relaxed text-pretty text-muted-foreground lg:col-span-2">
                      {engagement.summary}
                    </p>
                  ) : null}
                  {engagement.projects.length > 0 ? (
                    <ul className="grid gap-5 pt-5 sm:grid-cols-2 lg:col-span-2 xl:grid-cols-3">
                      {engagement.projects.map((project, index) => (
                        <li
                          className={cn("flex h-full", revealClassName)}
                          key={project.id}
                          ref={revealOnView}
                          style={
                            { "--reveal-index": index % 3 } as CSSProperties
                          }
                        >
                          <ProjectCard
                            onOpen={onProjectOpen}
                            project={project}
                          />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ol>
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
      className="space-y-16"
    >
      <div className="space-y-4">
        <Skeleton aria-hidden="true" className="h-3 w-16 rounded-full" />
        <Skeleton aria-hidden="true" className="h-12 w-56 rounded-full" />
      </div>
      <ul className="space-y-16">
        {["urapp", "2cimple", "freelance"].map((engagement) => (
          <li className="space-y-4 pl-9 sm:pl-12" key={engagement}>
            <Skeleton aria-hidden="true" className="h-8 w-56 rounded-full" />
            <Skeleton aria-hidden="true" className="h-4 w-44 rounded-full" />
            <Skeleton
              aria-hidden="true"
              className="h-4 w-[min(36rem,90%)] rounded-full"
            />
            <div className="grid gap-5 pt-5 sm:grid-cols-2 xl:grid-cols-3">
              {["one", "two", "three"].map((card) => (
                <Skeleton
                  aria-hidden="true"
                  className="aspect-4/3 rounded-2xl"
                  key={card}
                />
              ))}
            </div>
          </li>
        ))}
      </ul>
      <span className="sr-only">Loading Experience</span>
    </section>
  );
}
