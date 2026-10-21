import { SectionHeading } from "#/components/section-heading";
import { SectionReveal } from "#/components/section-reveal";
import { SectionState } from "#/components/section-state";
import { Skeleton } from "#/components/ui/skeleton";
import { useExperience } from "#/data/experience-view";
import { useIntro, useYearsOfExperience } from "#/data/intro-view";
import { useSkillsSection } from "#/data/skills-view";

export function IntroSection() {
  const intro = useIntro();

  return (
    <SectionReveal className="py-20 sm:py-28" data-section="about">
      <SectionState skeleton={<IntroSkeleton />} state={intro}>
        {(text) => (
          <section
            aria-labelledby="about"
            className="grid gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
          >
            <div className="space-y-10">
              <SectionHeading id="about" index="01">
                About
              </SectionHeading>
              <AboutStats />
            </div>
            <div className="space-y-6 text-xl leading-relaxed text-pretty text-foreground/85 sm:text-2xl sm:leading-relaxed lg:pt-10">
              {text.split(/\n\s*\n/).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        )}
      </SectionState>
    </SectionReveal>
  );
}

/**
 * Headline numbers drawn from the other sections. Each one is simply left out
 * until its data loads, so a failure here never adds another Retry button.
 */
function AboutStats() {
  const years = useYearsOfExperience();
  const experience = useExperience();
  const skills = useSkillsSection();

  const stats = [
    ...(years !== undefined
      ? [{ label: "Years of experience", value: `${years}+` }]
      : []),
    ...(experience.status === "ready"
      ? [
          {
            label: "Projects",
            value: String(
              experience.data.reduce(
                (total, engagement) => total + engagement.projects.length,
                0,
              ),
            ),
          },
        ]
      : []),
    ...(skills.status === "ready"
      ? [
          {
            label: "Skills",
            value: String(
              skills.data.reduce(
                (total, category) => total + category.skills.length,
                0,
              ),
            ),
          },
        ]
      : []),
  ];

  if (stats.length === 0) return null;

  return (
    <dl className="grid max-w-md grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-card/50">
      {stats.map((stat) => (
        <div className="flex flex-col-reverse gap-1 px-5 py-4" key={stat.label}>
          <dt className="text-xs leading-snug text-muted-foreground">
            {stat.label}
          </dt>
          <dd className="bg-linear-to-br from-foreground to-foreground/60 bg-clip-text text-3xl font-semibold tracking-tight text-transparent tabular-nums">
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function IntroSkeleton() {
  return (
    <section
      aria-label="Loading Intro"
      aria-busy="true"
      className="grid gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
    >
      <div className="space-y-4">
        <Skeleton aria-hidden="true" className="h-3 w-16 rounded-full" />
        <Skeleton aria-hidden="true" className="h-12 w-40 rounded-full" />
      </div>
      <div className="space-y-4 lg:pt-10">
        <Skeleton aria-hidden="true" className="h-6 w-full rounded-full" />
        <Skeleton aria-hidden="true" className="h-6 w-[92%] rounded-full" />
        <Skeleton aria-hidden="true" className="h-6 w-[84%] rounded-full" />
        <Skeleton aria-hidden="true" className="h-6 w-[60%] rounded-full" />
      </div>
      <span className="sr-only">Loading Intro</span>
    </section>
  );
}
