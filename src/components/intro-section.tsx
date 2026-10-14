import { useIntro } from "../data/intro-view";
import { SectionState } from "./section-state";
import { Skeleton } from "./ui/skeleton";

export function IntroSection() {
  const intro = useIntro();

  return (
    <div className="scroll-mt-16 py-16" data-section="about">
      <SectionState skeleton={<IntroSkeleton />} state={intro}>
        {(text) => (
          <section aria-labelledby="about" className="space-y-6">
            <h2
              id="about"
              className="scroll-mt-16 text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              About
            </h2>
            <div className="max-w-3xl space-y-4 text-lg leading-relaxed text-muted-foreground">
              {text.split(/\n\s*\n/).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        )}
      </SectionState>
    </div>
  );
}

function IntroSkeleton() {
  return (
    <section aria-label="Loading Intro" aria-busy="true" className="space-y-6">
      <Skeleton aria-hidden="true" className="h-9 w-40 rounded-full" />
      <div className="max-w-3xl space-y-3">
        <Skeleton aria-hidden="true" className="h-5 w-full rounded-full" />
        <Skeleton aria-hidden="true" className="h-5 w-[92%] rounded-full" />
        <Skeleton aria-hidden="true" className="h-5 w-[84%] rounded-full" />
      </div>
      <span className="sr-only">Loading Intro</span>
    </section>
  );
}
