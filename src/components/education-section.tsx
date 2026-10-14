import { useEducation } from "../data/education-view";
import { SectionState } from "./section-state";
import { Skeleton } from "./ui/skeleton";

export function EducationSection() {
  const education = useEducation();

  return (
    <section
      aria-label="Education"
      className="scroll-mt-16 py-16"
      data-section="education"
    >
      <SectionState skeleton={<EducationSkeleton />} state={education}>
        {(record) => (
          <div className="space-y-6">
            <h2
              className="scroll-mt-16 text-3xl font-semibold tracking-tight sm:text-4xl"
              id="education"
            >
              Education
            </h2>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold tracking-tight">
                {record.degree}
              </h3>
              <p className="leading-relaxed">{record.field}</p>
              <p className="leading-relaxed">{record.institution}</p>
              <p className="text-sm text-muted-foreground">
                {record.location}
                {record.dateRange ? ` · ${record.dateRange}` : ""}
              </p>
            </div>
          </div>
        )}
      </SectionState>
    </section>
  );
}

function EducationSkeleton() {
  return (
    <section
      aria-label="Loading Education"
      aria-busy="true"
      className="space-y-6"
    >
      <Skeleton aria-hidden="true" className="h-9 w-52 rounded-full" />
      <div className="space-y-3">
        <Skeleton aria-hidden="true" className="h-6 w-72 rounded-full" />
        <Skeleton
          aria-hidden="true"
          className="h-4 w-[min(36rem,90%)] rounded-full"
        />
        <Skeleton aria-hidden="true" className="h-4 w-44 rounded-full" />
      </div>
      <span className="sr-only">Loading Education</span>
    </section>
  );
}
