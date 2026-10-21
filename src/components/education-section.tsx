import { GraduationCapIcon } from "lucide-react";

import { SectionHeading } from "#/components/section-heading";
import { SectionReveal } from "#/components/section-reveal";
import { SectionState } from "#/components/section-state";
import { SpotlightCard } from "#/components/spotlight-card";
import { Skeleton } from "#/components/ui/skeleton";
import { useEducation } from "#/data/education-view";

const layoutClassName =
  "grid gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-center";

export function EducationSection() {
  const education = useEducation();

  return (
    <SectionReveal data-section="education">
      <section aria-label="Education" className="py-20 sm:py-28">
        <SectionState skeleton={<EducationSkeleton />} state={education}>
          {(record) => (
            <div className={layoutClassName}>
              <SectionHeading id="education" index="05">
                Education
              </SectionHeading>
              <SpotlightCard className="flex-row items-start gap-5 p-7 sm:p-8">
                <span
                  aria-hidden="true"
                  className="grid size-12 shrink-0 place-items-center rounded-xl bg-linear-to-br from-primary/25 to-violet/25 text-primary ring-1 ring-white/10"
                >
                  <GraduationCapIcon className="size-5" />
                </span>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold tracking-tight">
                    {record.degree}
                  </h3>
                  <p className="text-lg text-foreground/85">{record.field}</p>
                  <p className="leading-relaxed text-muted-foreground">
                    {record.institution}
                  </p>
                  <p className="pt-1 font-mono text-xs text-muted-foreground">
                    <span>{record.location}</span>
                    {record.dateRange ? (
                      <span> · {record.dateRange}</span>
                    ) : null}
                  </p>
                </div>
              </SpotlightCard>
            </div>
          )}
        </SectionState>
      </section>
    </SectionReveal>
  );
}

function EducationSkeleton() {
  return (
    <section
      aria-label="Loading Education"
      aria-busy="true"
      className={layoutClassName}
    >
      <div className="space-y-4">
        <Skeleton aria-hidden="true" className="h-3 w-16 rounded-full" />
        <Skeleton aria-hidden="true" className="h-12 w-52 rounded-full" />
      </div>
      <div className="flex gap-5 rounded-2xl bg-card/70 p-8 ring-1 ring-white/8">
        <Skeleton aria-hidden="true" className="size-12 rounded-xl" />
        <div className="flex-1 space-y-3">
          <Skeleton aria-hidden="true" className="h-6 w-64 rounded-full" />
          <Skeleton aria-hidden="true" className="h-5 w-56 rounded-full" />
          <Skeleton
            aria-hidden="true"
            className="h-4 w-[min(30rem,90%)] rounded-full"
          />
        </div>
      </div>
      <span className="sr-only">Loading Education</span>
    </section>
  );
}
