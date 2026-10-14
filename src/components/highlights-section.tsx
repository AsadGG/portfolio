import { useHighlights } from "#/data/highlights-view";
import { SectionReveal } from "#/components/section-reveal";
import { SectionState } from "#/components/section-state";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";

export function HighlightsSection() {
  const highlights = useHighlights();

  return (
    <SectionReveal
      className="scroll-mt-16 py-16"
      data-section="highlights"
      id="highlights"
    >
      <SectionState skeleton={<HighlightsSkeleton />} state={highlights}>
        {(data) => (
          <section aria-labelledby="highlights-heading" className="space-y-8">
            <h2
              className="text-3xl font-semibold tracking-tight sm:text-4xl"
              id="highlights-heading"
            >
              Highlights
            </h2>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((highlight) => (
                <li key={highlight.id}>
                  <Card className="h-full border-l-2 border-l-primary/70">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold text-primary">
                        <h3>{highlight.title}</h3>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {highlight.text}
                      </p>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        )}
      </SectionState>
    </SectionReveal>
  );
}

function HighlightsSkeleton() {
  return (
    <section
      aria-label="Loading Highlights"
      aria-busy="true"
      className="space-y-8"
    >
      <Skeleton aria-hidden="true" className="h-9 w-48 rounded-full" />
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {["one", "two", "three", "four", "five"].map((key) => (
          <li key={key}>
            <Card className="h-full">
              <CardHeader>
                <Skeleton
                  aria-hidden="true"
                  className="h-5 w-3/4 rounded-full"
                />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton
                  aria-hidden="true"
                  className="h-4 w-full rounded-full"
                />
                <Skeleton
                  aria-hidden="true"
                  className="h-4 w-4/5 rounded-full"
                />
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
      <span className="sr-only">Loading Highlights</span>
    </section>
  );
}
